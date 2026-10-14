"""Scientific cover based on the Mathstodon composition; regenerate from the current Lab engine."""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
HERE=Path(__file__).resolve().parent
def generate(out,languages=('en','es')):
    out=Path(out)
    subprocess.run(['node',str(HERE/'poster_data.mjs'),str(out)],check=True)
    d=json.loads((out/'poster-data.json').read_text())
    # Sequential English/Spanish renders retain the other verified cover.
    posters={}
    previous=out/'poster-provenance.json'
    if previous.exists():
        old=json.loads(previous.read_text(encoding='utf-8'))
        if old.get('dataSha256')==hashlib.sha256((out/'poster-data.json').read_bytes()).hexdigest():
            for language,record in old.get('posters',{}).items():
                path=out/f'poster-{language}.png'
                if language in ('en','es') and path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==record['sha256']:
                    posters[language]=record
    for lang in languages:
        T=lambda en,es:es if lang=='es' else en
        report=json.loads((out/f'render-{lang}.json').read_text())
        plt.rcParams.update({'font.family':'DejaVu Sans','text.color':'#142b43','axes.labelcolor':'#142b43','xtick.color':'#31475d','ytick.color':'#31475d'})
        fig=plt.figure(figsize=(16,9),dpi=120,facecolor='#f3f6fa')
        fig.text(.055,.91,'GHU LAB',fontsize=26,weight='bold',color='#007f8a')
        fig.text(.945,.92,T('EXPLORE THE MODEL','EXPLORA EL MODELO'),ha='right',fontsize=14,weight='bold',color='#486078')
        fig.text(.055,.805,T('Same masses. Different responses.','Mismas masas. Distintas respuestas.'),fontsize=35,weight='bold')
        fig.text(.055,.748,T('Change one assumption. See what moves.','Cambia una hipótesis. Observa qué cambia.'),fontsize=20,color='#486078')

        ax=fig.add_axes([.01,.145,.64,.55],projection='3d',facecolor='#f3f6fa')
        TT,E=np.meshgrid(d['ts'],d['etas']); R=np.array(d['surface'])
        cmap=LinearSegmentedColormap.from_list('ghu',['#173f91','#007c9b','#13b4b0','#96db84','#ffd25a','#f57b32'])
        ax.plot_surface(TT,E,R,cmap=cmap,linewidth=.18,edgecolor=(1,1,1,.16),antialiased=True,rstride=2,cstride=2)
        ax.view_init(elev=29,azim=-132)
        ax.set_xlabel(T('Source position t','Posición de la fuente t'),labelpad=10,fontsize=13)
        ax.set_ylabel(T('Kinetic parameter η','Parámetro cinético η'),labelpad=10,fontsize=13)
        ax.set_zlabel(T('Normalized response','Respuesta normalizada'),labelpad=7,fontsize=12)
        ax.set_xticks([.1,.5,1]);ax.set_yticks([-.9,1,4]);ax.tick_params(labelsize=10)
        ax.set_box_aspect((1.15,1,.65))
        for axis in (ax.xaxis,ax.yaxis,ax.zaxis):
            axis.pane.fill=False
            axis._axinfo['grid']['color']=(.45,.55,.65,.18)
        fig.text(.095,.66,T('SOURCE RESPONSE CHANGES','CAMBIA LA RESPUESTA A LA FUENTE'),fontsize=14,weight='bold',color='#007f8a')

        ax2=fig.add_axes([.68,.265,.255,.33],facecolor='#f3f6fa')
        colors=['#007f8a','#6651b6','#e08128']
        for i,(mass,color) in enumerate(zip(d['masses'],colors),1):
            ax2.plot([-.9,4],[mass,mass],color=color,lw=5,solid_capstyle='round')
            ax2.text(4.05,mass,f'{mass:.2f}',va='center',fontsize=14,weight='bold',color=color)
        ax2.set_xlim(-1.1,5.3);ax2.set_ylim(2.5,12.5)
        ax2.set_xticks([-.9,0,2,4]);ax2.set_yticks([4,8,12])
        ax2.set_xlabel(T('Kinetic parameter η','Parámetro cinético η'),fontsize=13,labelpad=12)
        ax2.set_ylabel(T('Dimensionless mass mℓ','Masa adimensional mℓ'),fontsize=13,labelpad=10)
        ax2.spines[['top','right']].set_visible(False)
        ax2.spines[['left','bottom']].set_color('#bcc9d5')
        ax2.tick_params(labelsize=11)
        fig.text(.67,.66,T('PAIRED MASSES STAY FIXED','LAS MASAS EMPAREJADAS SE CONSERVAN'),fontsize=14,weight='bold',color='#6651b6')
        fig.text(.69,.14,'Tensor NN / vector DD  ·  p = 1.1  ·  a = 0.1',fontsize=12,color='#486078')
        fig.text(.055,.075,f"{report['chapters']} {T('CHAPTERS','CAPÍTULOS')}  /  {int(report['seconds'])//60}:{int(report['seconds'])%60:02}  /  {T('ENGLISH','CASTELLANO')}",fontsize=16,weight='bold',color='#007f8a')
        fig.text(.945,.075,T('Gravity–gauge example · calculated in the Lab','Ejemplo gravedad–gauge · calculado en el Lab'),ha='right',fontsize=12,color='#486078')
        fig.text(.055,.025,T('Response normalized by g₄²ℓ². Model calculation; not experimental data.','Respuesta normalizada por g₄²ℓ². Cálculo del modelo; no son datos experimentales.'),fontsize=10,color='#617488')
        path=out/f'poster-{lang}.png'
        fig.savefig(path,dpi=120,facecolor=fig.get_facecolor());plt.close(fig)
        posters[lang]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'dimensions':[1920,1080]}
    receipt={'source':d['source'],'sourceSha256':d['sourceSha256'],'referenceChecks':d['checks'],'dataSha256':hashlib.sha256((out/'poster-data.json').read_bytes()).hexdigest(),'scope':d['scope'],'posters':posters}
    (out/'poster-provenance.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__':
    import sys
    generate(Path(sys.argv[1]))
