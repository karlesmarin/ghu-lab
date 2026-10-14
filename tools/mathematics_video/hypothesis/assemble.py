"""Keep the first 28 whiteboard chapters and replace/extend their closing argument."""
from pathlib import Path
import hashlib,json,os,re,subprocess
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
OLD=ROOT/'media/video/2026-10-12-mathematics';OUT=ROOT/'media/video/2026-10-14-mathematics-hypotheses';OUT.mkdir(exist_ok=True)
TMP=ROOT/'.tmp/mathematics-20261014';FF=os.environ['GHU_FFMPEG']
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(command,log):
    p=subprocess.run(command,capture_output=True);log.write_bytes(p.stderr)
    if p.returncode:raise RuntimeError(p.stderr.decode('utf-8','replace')[-4000:])
    return p.stderr.decode('utf-8','replace')
def seconds(s):h,m,s=map(float,s.split(':'));return h*3600+m*60+s
def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
reports=[]
for lang in ['en','es']:
    work=TMP/lang;oldmovie=OLD/f'ghu-mathematics-{lang}.mp4';old=json.loads((OLD/f'chapters-{lang}.json').read_text(encoding='utf-8'));extra=json.loads((work/'chapters-more.json').read_text(encoding='utf-8'))
    shift=round(old[28]['start']*24)/24;assert abs(shift-old[28]['start'])<1e-8
    prefix=work/'original-first28.mp4'
    run([FF,'-y','-i',str(oldmovie),'-t',str(shift),'-map','0:v:0','-map','0:a:0','-map_chapters','-1','-vf','setpts=PTS-STARTPTS','-af','asetpts=PTS-STARTPTS','-r','24','-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','1','-b:a','96k',str(prefix)],work/'prefix.log')
    chapters=[{**c,'start':round(c['start']*24)/24,'end':round(c['end']*24)/24} for c in old[:28]]+[{**c,'start':round((c['start']+shift)*24)/24,'end':round((c['end']+shift)*24)/24} for c in extra]
    assert len(chapters)==43 and len({c['id'] for c in chapters})==43
    assert all(abs(a['end']-b['start'])<1e-8 for a,b in zip(chapters,chapters[1:]))
    entries=[(prefix,shift)]+[(work/(c['id']+'.mp4'),c['end']-c['start']) for c in extra]
    concat=work/'concat.txt';concat.write_text(''.join("file '"+p.as_posix()+"'\nduration "+f'{d:.9f}'+'\n' for p,d in entries),encoding='utf-8')
    metadata=work/'chapters.ffmeta';lines=[';FFMETADATA1','title='+('Entre física y matemáticas' if lang=='es' else 'Between physics and mathematics'),'artist=GHU Lab','comment=43 chapters; revised 14 October 2026; synthetic narration; explicit mathematical and physical scope.']
    for c in chapters:lines+=['[CHAPTER]','TIMEBASE=1/1000','START='+str(round(c['start']*1000)),'END='+str(round(c['end']*1000)),'title='+c['section']+': '+c['title']]
    metadata.write_text('\n'.join(lines)+'\n',encoding='utf-8');movie=OUT/f'ghu-mathematics-{lang}.mp4'
    run([FF,'-y','-f','concat','-safe','0','-i',str(concat),'-i',str(metadata),'-map','0:v:0','-map','0:a:0','-map_metadata','1','-map_chapters','1','-c:v','copy','-c:a','aac','-ar','48000','-ac','1','-b:a','96k','-af','aresample=async=1:first_pts=0','-t',str(chapters[-1]['end']),'-movflags','+faststart',str(movie)],work/'assemble.log')
    vtt=['WEBVTT',''];cues=[]
    for path,offset,limit in [(OLD/f'captions-{lang}.vtt',0,shift),(work/'captions-more.vtt',shift,float('inf'))]:
        for block in path.read_text(encoding='utf-8-sig').strip().split('\n\n'):
            m=re.search(r'(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})\n(.+)',block,re.S)
            if not m:continue
            a,b=seconds(m[1]),seconds(m[2])
            if a>=limit:continue
            a+=offset;b=min(b,limit)+offset
            assert 0<=a<b<=chapters[-1]['end']+.002
            cues.append((a,b,m[3]));vtt.extend([stamp(a)+' --> '+stamp(b),m[3],''])
    (OUT/f'captions-{lang}.vtt').write_text('\n'.join(vtt),encoding='utf-8')
    (OUT/f'chapters-{lang}.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/f'transcript-{lang}.txt').write_text('\n\n'.join(stamp(c['start'])+' — '+c['section']+' / '+c['title']+'\n'+c['text'] for c in chapters)+'\n',encoding='utf-8')
    # A full decode checks every frame and both streams, not just container metadata.
    log=run([FF,'-hide_banner','-i',str(movie),'-map','0:v:0','-map','0:a:0','-f','null','-'],work/'full-decode.log')
    counts=re.findall(r'frame=\s*(\d+)',log);frames=int(counts[-1]);expected=round(chapters[-1]['end']*24)
    assert frames==expected,(lang,frames,expected)
    assert movie.stat().st_size<100*1024*1024
    reports.append(dict(language=lang,chapters=43,seconds=chapters[-1]['end'],frames=frames,width=1920,height=1080,fps=24,bytes=movie.stat().st_size,sha256=sha(movie),captionCues=len(cues),syntheticNarration=True,voice='Microsoft Helena Desktop' if lang=='es' else 'Microsoft Zira Desktop',captionsBurnedIn=True,humanListeningReview=False,fullDecodePassed=True,retainedChapters=28,retainedPrefixSeconds=shift,originalVideoSha256=sha(oldmovie),newScenes=[dict(id=c['id'],**json.loads((work/(c['id']+'.json')).read_text())) for c in extra]))
    run([FF,'-y','-loglevel','error','-ss',str(chapters[-7]['start']+15),'-i',str(movie),'-frames:v','1',str(OUT/('poster-es.png' if lang=='es' else 'poster.png'))],work/'poster.log')
    print(lang,frames,'frames;',chapters[-1]['end'],'seconds;',movie.stat().st_size,'bytes',flush=True)
sources=[HERE/'scenes.py',HERE/'render.py',HERE/'assemble.py',HERE/'prepare.py',HERE/'inputs.json',HERE.parent/'full/whiteboard_core.py',ROOT/'src/modules/xs_limits_reference.mjs',ROOT/'data/hypothesis_comparison/visual_data.json',ROOT/'src/modules/tt_cms_reference.mjs',ROOT/'proof/hypothesis/certificates.json']
sources += [HERE/'pages.py',HERE/'en/storyboard.json',HERE/'es/storyboard.json']
manifest=dict(schema='ghu-mathematics-hypotheses-video-v1',revision='2026-10-14',reports=reports,sources={p.relative_to(ROOT).as_posix():sha(p) for p in sources},scope='Scoped ordinary proofs, exact checks and 59 Lean theorem declarations. No full physical-model certificate or new experimental signal. Charts distinguish published resonance upper limits, the measured CMS top-pair spectrum and nine recalibrated GHU potentials. No observed fit of these hypotheses.')
(OUT/'render-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
from pages import build_pages
build_pages(OUT,OLD,reports)
