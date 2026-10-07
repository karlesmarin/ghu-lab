"""Independent NumPy SVD reconstruction and complex-matrix current kernels."""
from pathlib import Path
import json,math
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
DEFAULT=dict(order=0,lightEV=.001,s12=.3088,s23=.470,s13=.02248,delta=212,alpha21=0,alpha31=0,dm21=7.537,dm3=2.511,d1=.0001,d2=.0001,d3=.0001)
RING=dict(fGeV=1000,t=1,q=.3,r=.4,muBkeV=500)
def reference_case(name,flavour=None,ring=None):
    p=DEFAULT|dict(flavour or {});r=RING|dict(ring or {});f=r['fGeV']
    c12,c23,c13=[math.sqrt(1-p[k]) for k in ['s12','s23','s13']]
    s12,s23,s13=[math.sqrt(p[k]) for k in ['s12','s23','s13']]
    phase=np.exp(1j*np.deg2rad(p['delta']))
    rot12=np.array([[c12,s12,0],[-s12,c12,0],[0,0,1]],complex)
    rot13=np.array([[c13,0,s13/phase],[0,1,0],[-s13*phase,0,c13]],complex)
    rot23=np.array([[1,0,0],[0,c23,s23],[0,-s23,c23]],complex)
    unitary=rot23@rot13@rot12@np.diag(np.exp(.5j*np.deg2rad([0,p['alpha21'],p['alpha31']])))
    m0=p['lightEV'];masses=np.array([m0,math.sqrt(m0*m0+p['dm21']*1e-5),math.sqrt(m0*m0+p['dm3']*1e-3)] if p['order']==0 else [math.sqrt(m0*m0+p['dm3']*1e-3-p['dm21']*1e-5),math.sqrt(m0*m0+p['dm3']*1e-3),m0])
    B=np.eye(5)*2
    for i in range(5):B[i,(i+1)%5]=r['t']*(1 if i==4 else -1)
    sterile=np.zeros((6,6));sterile[0,0]=.25;sterile[0,1]=r['r'];sterile[1,0]=r['q'];sterile[1:,1:]=B;sterile*=f
    tangent=np.linalg.solve(sterile.T,np.eye(6)[0]);copies=[];zero_amplitudes=[]
    for i in range(3):
        deficit=p['d'+str(i+1)];mD=math.sqrt(deficit/(1-deficit))/np.linalg.norm(tangent)
        D=np.vstack([np.eye(6)[0]*mD,sterile]);left,singular,right=np.linalg.svd(D,full_matrices=True)
        zero=left[:,-1];zero_amplitudes.append(abs(zero[0]));muA=masses[i]*1e-9/zero[4]**2
        pairs=[]
        for j in range(5,-1,-1):
            pairs.append(dict(centerGeV=float(singular[j]),activeWeight=float(left[0,j]**2),
                splitEV=float((muA*left[4,j]**2+r['muBkeV']*1e-6*right[j,3]**2)*1e9)))
        copies.append(dict(mDGeV=float(mD),muAkeV=float(muA*1e6),deficit=float(1-zero[0]**2),pairs=pairs))
    N=unitary@np.diag(zero_amplitudes);gram=N@N.conj().T
    samples=[]
    for anti in [False,True]:
        matrix=N.conj() if anti else N
        for le in [0,17,500,1000,1777]:
            phases=np.diag(np.exp(-2j*1.266932679*(masses**2-masses[0]**2)*le))
            response=np.abs(matrix@phases@matrix.conj().T)**2
            for source,target in [(1,0),(1,1),(0,2),(2,1)]:
                samples.append(dict(LoverE=le,fromFlavour=source,toFlavour=target,antineutrino=anti,
                    ccKernel=float(response[target,source]),nearNormalized=float(response[target,source]/gram[source,source].real**2)))
    return dict(name=name,flavour=p,ring=r,copies=copies,samples=samples,
                lightMixing=[[[float(z.real),float(z.imag)] for z in row] for row in N])
def build():
    cases=[reference_case('default'),reference_case('muB zero',ring={'muBkeV':0}),
      reference_case('muB maximum',ring={'muBkeV':5000}),reference_case('heavy scale',ring={'fGeV':2500}),
      reference_case('geometry',ring={'t':.6,'q':.2,'r':.45}),
      reference_case('common suppression',{'d1':.001,'d2':.001,'d3':.001}),
      reference_case('unequal deficits and Majorana phases',{'d1':1e-6,'d2':.0002,'d3':.001,'alpha21':123,'alpha31':271}),
      reference_case('inverted rank two',{'order':1,'lightEV':0,'dm3':2.483,'s23':.550,'delta':274}),
      reference_case('CP conserving',{'delta':0})]
    output=dict(method='NumPy full SVD of each 7x6 conserving matrix; null vector fixes reconstruction; independent rotation matrices and complex matrix products for all CC samples',numpy=np.__version__,cases=cases)
    (ROOT/'data/neutrino_research_reference.json').write_text(json.dumps(output,indent=2)+'\n',encoding='utf-8',newline='\n')
    print(len(cases),'independent SVD cases;',sum(len(c['samples']) for c in cases),'current-kernel samples')
if __name__=='__main__':build()
