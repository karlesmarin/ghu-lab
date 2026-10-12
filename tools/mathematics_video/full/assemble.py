"""Combine the approved boundary explanation and all further animated chapters."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'final';OUT.mkdir(exist_ok=True);TMP=ROOT/'rendered'
sys.path.insert(0,sys.argv[1]);import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe();intro=ROOT.parent/'boundary/review'
def run(cmd,name):
    p=subprocess.run(cmd,capture_output=True);(OUT/(name+'.log')).write_bytes(p.stderr)
    if p.returncode:raise RuntimeError(p.stderr.decode('utf8','replace')[-2000:])
    return p
base=json.loads((intro/'chapters.json').read_text());more=json.loads((ROOT/'review/chapters-more.json').read_text());shift=base[-1]['end']
chapters=[{**c,'section':'Boundary spectra'} for c in base]+[{**c,'start':c['start']+shift,'end':c['end']+shift} for c in more]
# Normalize only the existing introduction's audio format; preserve its video stream.
normalized=TMP/'boundary-approved.mp4'
run([ff,'-y','-i',str(intro/'boundary-whiteboard-en.mp4'),'-map','0:v:0','-map','0:a:0','-c:v','copy','-c:a','aac','-ar','48000','-ac','1','-b:a','96k',str(normalized)],'intro-audio')
entries=[(normalized,shift)]+[(TMP/(c['id']+'.mp4'),c['end']-c['start']) for c in more]
concat=TMP/'full-concat.txt';concat.write_text(''.join("file '"+p.as_posix()+"'\nduration "+f'{d:.9f}'+'\n' for p,d in entries),encoding='utf-8')
metadata=TMP/'chapters.ffmeta';lines=[';FFMETADATA1','title=Between physics and mathematics','artist=GHU Lab','comment=English animated explanations; synthetic narration; explicit mathematical scope.']
for c in chapters:lines+=['[CHAPTER]','TIMEBASE=1/1000','START='+str(round(c['start']*1000)),'END='+str(round(c['end']*1000)),'title='+c['section']+': '+c['title']]
metadata.write_text('\n'.join(lines)+'\n',encoding='utf-8')
movie=OUT/'ghu-mathematics-en.mp4'
# The concatenation duration entries keep all captions and chapter times on the video grid.
run([ff,'-y','-f','concat','-safe','0','-i',str(concat),'-i',str(metadata),'-map','0:v:0','-map','0:a:0','-map_metadata','1','-map_chapters','1','-c:v','copy','-c:a','aac','-ar','48000','-ac','1','-b:a','96k','-af','aresample=async=1:first_pts=0','-movflags','+faststart',str(movie)],'assemble')
def secs(s):h,m,s=map(float,s.split(':'));return h*3600+m*60+s
def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
vtt=(intro/'captions-en.vtt').read_text(encoding='utf-8').rstrip()+'\n\n'
extra=(ROOT/'review/captions-more.vtt').read_text(encoding='utf-8').split('WEBVTT',1)[1].strip()
extra=re.sub(r'([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]{3}) --> ([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]{3})',lambda m:stamp(secs(m[1])+shift)+' --> '+stamp(secs(m[2])+shift),extra)
(OUT/'captions-en.vtt').write_text(vtt+extra+'\n',encoding='utf-8')
(OUT/'chapters-en.json').write_text(json.dumps(chapters,indent=2)+'\n')
(OUT/'transcript-en.txt').write_text('\n\n'.join(stamp(c['start'])+' — '+c['section']+' / '+c['title']+'\n'+c['text'] for c in chapters)+'\n',encoding='utf-8')
plan=json.loads((ROOT/'storyboard.json').read_text());manifest={'title':'Between physics and mathematics','language':'en','seconds':chapters[-1]['end'],'chapters':len(chapters),'sections':list(dict.fromkeys(c['section'] for c in chapters)),'width':1920,'height':1080,'fps':24,'syntheticNarration':True,'voice':'Microsoft Zira Desktop','captionsBurnedIn':True,'sourceCommit':plan['sourceCommit'],'sourceModuleUnchanged':True,'bytes':movie.stat().st_size,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'approvedBoundarySha256':hashlib.sha256((intro/'boundary-whiteboard-en.mp4').read_bytes()).hexdigest(),'sources':plan['sources']}
(OUT/'render-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({k:v for k,v in manifest.items() if k!='sources'},indent=2))
