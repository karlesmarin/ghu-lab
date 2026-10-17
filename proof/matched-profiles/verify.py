"""Independent Sage verification of post-matching continuum enclosures.
# encaje: independent interface-aware verifier; no production-module imports.
"""
import hashlib,json,sys
from pathlib import Path
from sage.all import QQ,PolynomialRing,RealIntervalField
from sage.env import SAGE_VERSION
source=Path(sys.argv[1]); data=json.loads(source.read_text())
P=PolynomialRing(QQ,names=("x","y")); x,y=P.gens()
S=PolynomialRing(QQ,"s"); s=S.gen(); RIF=RealIntervalField(256)
checks=[]
def check(name,condition):
    if not bool(condition): raise AssertionError(name)
    checks.append(name)
def poly(terms): return sum((QQ(c)*x**i*y**j for i,j,c in terms),P.zero())
def integ(p,var,lo=0,hi=1):
    q=P(p).integral(var)
    return q.subs({var:hi})-q.subs({var:lo})
def mul(a,b): return tuple(u*v for u,v in zip(a,b))
def dx(a): return tuple(u.derivative(x) for u in a)
def dy(a): return tuple(u.derivative(y) for u in a)
def L(a): return tuple(u.subs({x:0}) for u in a)
def T(a): return a[1].subs({y:1})
for row in data["anchors"]+data["rows"]:
    name=row["profile"]+":"+str(row["degree"])+":t="+str(row["inputs"]["t"])
    c,kl,kt,a,e=[QQ(row["coefficients"][k]) for k in ("c","kL","kT","alpha","width")]
    check(name+":fixed model", (c,kl,kt,a,e)==(38,2,8,QQ(1)/20,QQ(1)/8) and row["degree"]==3)
    cut=1-e; intervals=((0,cut),(cut,1))
    p=tuple(poly(v) for v in row["trial_p"])
    z=tuple(poly(v) for v in row["reconstruction_z"])
    lam=QQ(row["lambda"]); t=QQ(row["inputs"]["t"])
    def line(a): return sum((QQ(integ(u,y,lo,hi)) for u,(lo,hi) in zip(a,intervals)),QQ(0))
    def bulk(a): return line(tuple(integ(u,x) for u in a))
    def B(a,b): return bulk(mul(a,b))/c+line(mul(L(a),L(b)))/kl+QQ(integ(T(a)*T(b),x))/kt
    f=1/e if row["profile"]=="uniform" else 2*(1-(1-y)/e)/e
    def weighted(a): return kl*line(a)+QQ(integ(a[1]*f,y,cut,1))*a_coef
    a_coef=a
    check(name+":interface metadata",QQ(row["interface"])==cut)
    check(name+":p continuity",(p[0]-p[1]).subs({y:cut})==0)
    check(name+":z continuity",(z[0]-z[1]).subs({y:cut})==0)
    check(name+":stream normal continuity",(dx(z)[0]-dx(z)[1]).subs({y:cut})==0)
    check(name+":admissible",all(u.subs({x:1})==0 for u in p) and p[0].subs({y:0})==0 and T(p).subs({x:0})==1)
    hx=tuple(-integ(u,x,0,x)/c for u in p)
    h0=-integ(L(p)[0],y,0,y)/kl
    h1=h0.subs({y:cut})-integ(L(p)[1],y,cut,y)/kl
    hL=(h0,h1); hT=-integ(T(p),x,0,x)/kt
    check(name+":wall primitive continuity",(h0-h1).subs({y:cut})==0)
    for qv in (0,1):
        v0=(1-x)*y*(y-1+qv)
        v=(v0,v0+x*(1-x)*(y-cut))
        lift=bulk(mul(hx,dx(v)))+line(mul(hL,L(dy(v))))+QQ(integ(hT*T(dx(v)),x))
        check(name+":mass lifting:q"+str(qv),lift-B(p,v)==h1.subs({y:1})*qv)
        def stream(w):
            return (bulk(tuple(u-vv for u,vv in zip(mul(dy(w),dx(v)),mul(dx(w),dy(v)))))+
                    line(mul(tuple(lam-u for u in L(w)),L(dy(v))))-
                    QQ(integ(T(w)*T(dx(v)),x)))
        check(name+":stream identity:q"+str(qv),stream(z)==lam*qv)
        # A discontinuous z adds an interface term: it must not silently pass.
        check(name+":jump negative control:q"+str(qv),stream((z[0],z[1]+x))!=lam*qv)
    mass=B(p,p)
    check(name+":mass",mass==QQ(row["inputs"]["b_trial"]))
    py=L(dy(p)); trace=py[1]**2
    h=S([QQ(trace.monomial_coefficient(y**i)) for i in range(trace.degree(y)+1)])
    hp=h.integral(); outside=QQ(integ(py[0]**2,y,0,cut))/kl
    if row["profile"]=="uniform":
        contact_q=outside+(hp(1)-hp(cut))/(kl+a/e)
        contact=RIF(contact_q)
    else:
        den=kl+2*a/e*(1-(1-s)/e)
        quotient,remainder=h.quo_rem(den); qp=quotient.integral()
        contact=RIF(outside+qp(1)-qp(cut))+RIF(remainder[0]/den[1])*RIF(den(1)/den(cut)).log()
    base=bulk(tuple(u*u+v*v for u,v in zip(dx(p),dy(p))))/c+QQ(integ(T(dx(p))**2,x))/kt-t*mass
    hl,hu=[QQ(row["inputs"][k]) for k in ("h_lower","h_upper")]
    if row["profile"]=="uniform":
        check(name+":H exact",base+contact_q==hl==hu)
    else:
        H=RIF(base)+contact
        check(name+":H outward",RIF(hl).upper()<=H.lower() and H.upper()<=RIF(hu).lower())
    ddx=tuple(px/c-t*hh-zy for px,hh,zy in zip(dx(p),hx,dy(z)))
    ddy=tuple(py_/c+zx for py_,zx in zip(dy(p),dx(z)))
    ell=tuple(-t*hh-lam+zz for hh,zz in zip(hL,L(z)))
    ft=T(dx(p))/kt-t*hT+T(z)
    bulk_energy=c*bulk(tuple(u*u+v*v for u,v in zip(ddx,ddy)))
    top_energy=kt*QQ(integ(ft*ft,x))
    outside_energy=kl*QQ(integ((py[0]/kl+ell[0])**2,y,0,cut))
    left_poly=2*line(mul(py,ell))+weighted(mul(ell,ell))
    eta=QQ(row["inputs"]["residual_squared"])
    if row["profile"]=="uniform":
        check(name+":eta exact",contact_q+left_poly+bulk_energy+top_energy==eta)
    else:
        actual=contact+RIF(left_poly+bulk_energy+top_energy)
        check(name+":eta outward",actual.upper()<=RIF(eta).lower())
    components={k:QQ(v) for k,v in row["residual_components"].items()}
    check(name+":components",components["bulk"]==bulk_energy and components["top"]==top_energy and components["left_outside_layer"]==outside_energy and sum(components.values())==eta)
    check(name+":components nonnegative",all(v>=0 for v in components.values()))
    g=QQ(row["inputs"]["gap"]); theta=1-t/g
    check(name+":coercive query", 0<=t<g)
    factor=1 if row["profile"]=="uniform" else 2
    check(name+":gap",g==QQ(9)/2*kl/(kl+factor*a/e))
    bounds=row["bounds"]; dl,du=map(QQ,bounds["D"])
    check(name+":D certificate",dl==hl-eta/theta and du==hu and dl>0)
    err=eta/(g*theta*theta)
    check(name+":mass error",QQ(bounds["mass_error_upper"])==err)
    mu,ml=[-QQ(v) for v in bounds["D_prime"]]
    sqrt_b=RIF(mass).sqrt(); sqrt_err=RIF(err).sqrt()
    check(name+":mass triangle upper",RIF(mu).lower()>=((sqrt_b+sqrt_err)**2).upper())
    if sqrt_b.lower()>sqrt_err.upper():
        check(name+":mass triangle lower",RIF(ml).upper()<=((sqrt_b-sqrt_err)**2).lower())
    else: check(name+":mass triangle lower zero",ml==0)
    check(name+":F interval",list(map(QQ,bounds["F"]))==[t/du,t/dl])
    fpl,fpu=map(QQ,bounds["F_prime"])
    check(name+":F prime",fpl==1/du+t*ml/du**2 and fpu==1/dl+t*mu/dl**2)
    check(name+":residue",list(map(QQ,bounds["residue_zeta_zero"]))==[1/fpu,1/fpl])
    if "matching" in bounds:
        match=bounds["matching"]; target=QQ(match["target_residue"])
        check(name+":zeta",list(map(QQ,match["zeta"]))==[1/target-fpu,1/target-fpl])
        check(name+":kappa",list(map(QQ,match["kappa"]))==[t/target-t*t*mu/dl**2,t/target-t*t*ml/du**2])
        check(name+":positive matching",QQ(match["zeta"][0])>=0 and QQ(match["kappa"][0])>0)
    print("verified",name,flush=True,file=sys.stderr)

# All anchor witnesses were independently checked above.
A=PolynomialRing(QQ,names=("fs","fp","ft","s0","u","invR"))
fs,fp,ft,s0,u,invR=A.gens()
zeta=invR-fp; kappa=fs+s0*zeta
check("symbolic matched inverse identity",kappa-zeta*u-ft==(s0-u)*invR-(ft-fs-(u-s0)*fp))
for entry in data["matched"]:
    profile=entry["profile"]; r=entry["report"]
    anchor=next(a for a in data["anchors"] if a["profile"]==profile)
    probe=next(a for a in data["rows"] if a["profile"]==profile and QQ(a["inputs"]["t"])==QQ(r["probe_t"]))
    name="matched:"+profile+":"+str(r["probe_t"])
    s0,tt,rr=map(QQ,(r["anchor_t"],r["probe_t"],r["target_residue"]))
    check(name+":common metadata",probe["coefficients"]==anchor["coefficients"] and s0==QQ(anchor["inputs"]["t"]) and rr==QQ(anchor["bounds"]["matching"]["target_residue"]))
    # Enumerate corners of the input box via kappa-zeta*t-F(t), not the
    # production remainder arithmetic. Linearity makes these extrema exact.
    vals=[]
    for fs in map(QQ,anchor["bounds"]["F"]):
        for fp in map(QQ,anchor["bounds"]["F_prime"]):
            for ft in map(QQ,probe["bounds"]["F"]):
                zz=1/rr-fp; kk=fs+s0*zz
                vals.append(kk-zz*tt-ft)
    den=[min(vals),max(vals)]
    check(name+":inverse box",list(map(QQ,r["inverse_response"]))==den)
    check(name+":remainder",list(map(QQ,r["remainder"]))==[(s0-tt)/rr-den[1],(s0-tt)/rr-den[0]])
    check(name+":quadratic normalization",list(map(QQ,r["remainder_over_delta_squared"]))==[v/(tt-s0)**2 for v in map(QQ,r["remainder"])])
    check(name+":no pole at query",den[1]<0 or den[0]>0)
    check(name+":reciprocal",list(map(QQ,r["response"]))==[1/den[1],1/den[0]])
for comp in data["comparisons"]:
    tt=QQ(comp["probe_t"])
    ar,br=[v["report"] for v in data["matched"] if QQ(v["report"]["probe_t"])==tt]
    aa,bb=[list(map(QQ,r["response"])) for r in (ar,br)]
    diff=[aa[0]-bb[1],aa[1]-bb[0]]
    direction="a_above_b" if diff[0]>0 else "a_below_b" if diff[1]<0 else "overlap"
    check("comparison difference:"+str(tt),list(map(QQ,comp["difference_a_minus_b"]))==diff)
    check("comparison direction:"+str(tt),comp["direction"]==direction)
    check("comparison status:"+str(tt),comp["status"]==("inconclusive_overlap" if direction=="overlap" else "separated_conditional"))
# Check every displayed decimal enclosure against the independently verified witness.
display_path=source.with_name("reports.json")
display=json.loads(display_path.read_text())
from fractions import Fraction
def decimal_q(value): return QQ(str(Fraction(value)))
check("two certified displays", len(display)==2)
for report in display:
    tt=QQ(report["parameters"]["t"])
    check("display fixed inputs", report["parameters"]=={"width":"1/8","alpha":"1/20","t":str(tt),"degree":3})
    check("display declared model", report["model"]=={"id":"unit-square-wall-response-v1","c":"38","kL":"2","kT":"8","s":"1/100","R":"1/2","source":"common-corner-trace-q","mass_uses_layer_weight":False})
    for row in report["profiles"]:
        exact=next(v["report"] for v in data["matched"] if v["profile"]==row["profile"] and QQ(v["report"]["probe_t"])==tt)
        for key in ("response","inverse_response","remainder"):
            lo,hi=map(decimal_q,row["report"][key]); a,b=map(QQ,exact[key])
            check("display enclosure:"+row["profile"]+":"+str(tt)+":"+key,lo<=a<=b<=hi)
        anchor=next(v for v in data["anchors"] if v["profile"]==row["profile"])
        for key in ("kappa","zeta"):
            lo,hi=map(decimal_q,row["matching"][key]); a,b=map(QQ,anchor["bounds"]["matching"][key])
            check("display matching:"+row["profile"]+":"+str(tt)+":"+key,lo<=a<=b<=hi and (lo>0 if key=="kappa" else lo>=0))
    a,b=[list(map(decimal_q,r["report"]["response"])) for r in report["profiles"]]
    lo,hi=map(decimal_q,report["comparison"]["difference_a_minus_b"])
    check("display difference:"+str(tt),lo<=a[0]-b[1]<=a[1]-b[0]<=hi)
    check("display verdict:"+str(tt),lo>0 and report["comparison"]["direction"]=="a_above_b" and report["status"]==report["comparison"]["status"]=="separated_conditional")
print(json.dumps({"status":"passed","sage_version":SAGE_VERSION,"checks_passed":len(checks),"checks":checks,
                  "separated_query_points":[v["probe_t"] for v in data["comparisons"] if v["status"]=="separated_conditional"],
                  "receipt_sha256":hashlib.sha256(source.read_bytes()).hexdigest(),
                  "reports_sha256":hashlib.sha256(display_path.read_bytes()).hexdigest(),
                  "proof_sha256":hashlib.sha256(source.with_name("proof.txt").read_bytes()).hexdigest(),
                  "verifier_sha256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  "scope":"independent continuum-trial integrals and post-matching input-box extrema; written functional proof for the declared unit-square model"}))

