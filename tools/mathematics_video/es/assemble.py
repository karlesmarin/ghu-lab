from pathlib import Path
import hashlib,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'final';OUT.mkdir(exist_ok=True)
sys.path.insert(0,sys.argv[1]);import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe()
def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
def secs(s):h,m,s=map(float,s.split(':'));return h*3600+m*60+s
chapters=[];entries=[];vtt='WEBVTT\n\n';offset=0
for group in ['boundary','full']:
    root=ROOT/group
    groupchap=json.loads((root/'review/chapters-more.json').read_text(encoding='utf-8'))
    for c in groupchap:
        chapters.append({**c,'start':c['start']+offset,'end':c['end']+offset})
        clip=root/'rendered'/(c['id']+'.mp4');assert clip.exists()
        receipt=json.loads(clip.with_suffix('.json').read_text())
        assert receipt['sha256']==hashlib.sha256(clip.read_bytes()).hexdigest()
        entries.append((clip,c['end']-c['start']))
    extra=(root/'review/captions-more.vtt').read_text(encoding='utf-8').split('WEBVTT',1)[1].strip()
    extra=re.sub(r'([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}) --> ([0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3})',lambda m:stamp(secs(m[1])+offset)+' --> '+stamp(secs(m[2])+offset),extra)
    vtt+=extra+'\n\n';offset=chapters[-1]['end']
concat=OUT/'concat.txt';concat.write_text(''.join("file '"+p.as_posix()+"'\nduration "+f'{d:.9f}'+'\n' for p,d in entries),encoding='utf-8')
meta=OUT/'chapters.ffmeta';lines=[';FFMETADATA1','title=Entre física y matemáticas','artist=GHU Lab','comment=Edición castellana; narración sintética; alcance matemático explícito.']
for c in chapters:lines+=['[CHAPTER]','TIMEBASE=1/1000','START='+str(round(c['start']*1000)),'END='+str(round(c['end']*1000)),'title='+c['section']+': '+c['title']]
meta.write_text('\n'.join(lines)+'\n',encoding='utf-8')
movie=OUT/'ghu-mathematics-es.mp4'
r=subprocess.run([ff,'-y','-f','concat','-safe','0','-i',str(concat),'-i',str(meta),'-map','0:v:0','-map','0:a:0','-map_metadata','1','-map_chapters','1','-metadata:s:a:0','language=spa','-c:v','copy','-c:a','aac','-ar','48000','-ac','1','-b:a','96k','-af','aresample=async=1:first_pts=0','-movflags','+faststart',str(movie)],capture_output=True)
(OUT/'assemble.log').write_bytes(r.stderr);assert r.returncode==0,r.stderr[-2000:]
(OUT/'captions-es.vtt').write_text(vtt.rstrip()+'\n',encoding='utf-8')
(OUT/'chapters-es.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'transcript-es.txt').write_text('\n\n'.join(stamp(c['start'])+' — '+c['section']+' / '+c['title']+'\n'+c['text'] for c in chapters)+'\n',encoding='utf-8')
plan=json.loads((ROOT/'full/storyboard.json').read_text(encoding='utf-8'))
manifest={'title':'Entre física y matemáticas','language':'es','seconds':offset,'chapters':29,'sections':list(dict.fromkeys(c['section'] for c in chapters)),'width':1920,'height':1080,'fps':24,'syntheticNarration':True,'voice':'Microsoft Helena Desktop','captionsBurnedIn':True,'sourceCommit':plan['sourceCommit'],'sourceModuleUnchanged':True,'bytes':movie.stat().st_size,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'englishVideoSha256':'f2200a434b2a8ae0244a91f7d1dff1006fd74c52922cfccf894fb9bc3da526a1','sources':plan['sources']}
(OUT/'render-manifest-es.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in manifest.items() if k!='sources'},ensure_ascii=False,indent=2))
