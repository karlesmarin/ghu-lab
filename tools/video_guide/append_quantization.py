"""Append chapter 46 while explicitly recording reuse of the October 12 film.

Run after build/quantization.mjs --capture-video and quantization_video/render.py.
The old 45 chapters and source media remain untouched. Captions stay switchable:
the main-film chapter uses uncaptioned scene images and a separate VTT track.
"""
from pathlib import Path
import hashlib,json,math,os,re,shutil,subprocess
ROOT=Path(__file__).resolve().parents[2]
OLD=ROOT/'media/video/2026-10-12-boundary-research'
SUP=ROOT/'media/video/2026-10-13-quantization'
OUT=ROOT/'media/video/2026-10-13-quantization-main'
WORK=ROOT/'.tmp/append-quantization';WORK.mkdir(parents=True,exist_ok=True)
FF=os.environ.get('GHU_FFMPEG') or shutil.which('ffmpeg')
if not FF:raise SystemExit('Set GHU_FFMPEG or put FFmpeg on PATH')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):
 p=subprocess.run([FF,'-y','-v','error',*args],capture_output=True,text=True,encoding='utf-8',errors='replace')
 if p.returncode:raise RuntimeError(p.stderr[-3000:])
def dump(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def seconds(s):
 h,m,v=map(float,s.split(':'));return h*3600+m*60+v
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
old=json.loads((OLD/'manifest.json').read_text(encoding='utf-8'))
for name,digest in old['files'].items():assert sha(OLD/name)==digest,name
supp=json.loads((SUP/'manifest.json').read_text(encoding='utf-8'))
for row in supp['files']:assert sha(SUP/row['path'])==row['sha256'],row['path']
capture=json.loads((ROOT/'tools/quantization_video/captures/provenance.json').read_text(encoding='utf-8'))
assert capture['app_sha256']==sha(ROOT/'app/index.html'),'Capture does not match current app'
plan=json.loads((ROOT/'tools/video_guide/storyboard.json').read_text(encoding='utf-8'))
assert len(plan['chapters'])==46 and plan['chapters'][-1]['id']=='quantization'
new=plan['chapters'][-1];OUT.mkdir(parents=True,exist_ok=True)
versions={};checks=[]
for lang in ['en','es']:
 scenes=json.loads((SUP/f'chapters-{lang}.json').read_text(encoding='utf-8'))
 assert len(scenes)==11
 for scene,step in zip(scenes,new['steps']):assert scene['text']==step['textES' if lang=='es' else 'text']
 folder=WORK/lang;folder.mkdir(exist_ok=True)
 clips=[]
 for c in scenes:
  clip=folder/(c['id']+'.mp4');duration=c['end']-c['start']
  run(['-loop','1','-framerate','24','-i',str(ROOT/f'tools/quantization_video/{lang}/{c["id"]}.png'),'-i',str(ROOT/f'tools/quantization_video/{lang}/audio/{c["id"]}.wav'),'-af','adelay=400,apad','-t',str(duration),'-c:v','libx264','-threads','4','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-r','24','-c:a','aac','-ar','48000','-ac','1',str(clip)])
  clips.append(clip)
 concat=folder/'concat.txt';concat.write_text(''.join("file '"+p.name+"'\n" for p in clips),encoding='utf-8')
 segment=folder/'chapter.mp4';run(['-f','concat','-safe','0','-i',str(concat),'-c','copy',str(segment)])
 offset=old['versions'][lang]['seconds'];added=scenes[-1]['end'];total=math.ceil((offset+added)*15-1e-7)/15
 chapters=json.loads((OLD/f'chapters-{lang}.json').read_text(encoding='utf-8'));assert len(chapters)==45
 chapters.append(dict(id='quantization',host='quantization',number=46,title=new['titleES' if lang=='es' else 'title'],start=round(offset,3),end=round(total,3),text='\n\n'.join(c['text'] for c in scenes)))
 dump(OUT/f'chapters-{lang}.json',chapters)
 text=(OLD/f'ghu-lab-{lang}.vtt').read_text(encoding='utf-8').rstrip()+'\n\n'
 newcues=(SUP/f'{lang}.vtt').read_text(encoding='utf-8').strip().split('\n\n')[1:]
 for cue in newcues:
  timing,*lines=cue.splitlines();a,b=timing.split(' --> ')
  assert 0<=seconds(a)<seconds(b)<=added
  text+=stamp(offset+seconds(a))+' --> '+stamp(offset+seconds(b))+'\n'+'\n'.join(lines)+'\n\n'
 (OUT/f'ghu-lab-{lang}.vtt').write_text(text,encoding='utf-8')
 transcript=(OLD/f'transcript-{lang}.txt').read_text(encoding='utf-8').rstrip()+'\n\n46 · '+chapters[-1]['title']+'\n'+chapters[-1]['text']+'\n'
 (OUT/f'transcript-{lang}.txt').write_text(transcript,encoding='utf-8')
 shutil.copyfile(OLD/f'poster-{lang}.png',OUT/f'poster-{lang}.png')
 metadata=folder/'chapters.ffmeta';metadata.write_text(';FFMETADATA1\n'+''.join(f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={c['title']}\n" for c in chapters),encoding='utf-8')
 movie=OUT/f'ghu-lab-{lang}.mp4'
 # Re-encode the two inputs together to establish one continuous frame/time base.
 # Audio is explicitly padded to each video segment boundary before concatenation.
 filt=f'[0:v]fps=15,setpts=PTS-STARTPTS[v0];[1:v]fps=15,setpts=PTS-STARTPTS[v1];[0:a]aresample=48000,apad,atrim=duration={offset},asetpts=PTS-STARTPTS[a0];[1:a]aresample=48000,apad,atrim=duration={added},asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]'
 print('Encoding main film',lang,'46 chapters,',round(total,3),'seconds',flush=True)
 run(['-i',str(OLD/f'ghu-lab-{lang}.mp4'),'-i',str(segment),'-i',str(metadata),'-filter_complex',filt,'-map','[v]','-map','[a]','-map_metadata','2','-map_chapters','2','-c:v','libx264','-threads','4','-preset','veryfast','-crf','24','-pix_fmt','yuv420p','-r','15','-c:a','aac','-ar','48000','-ac','1','-t',str(total),'-movflags','+faststart',str(movie)])
 run(['-i',str(movie),'-f','null','-'])
 assert movie.stat().st_size<100_000_000,'Keep each published media file below the repository file limit'
 for i,c in enumerate(scenes):
  run(['-ss',str(offset+c['start']+4),'-i',str(movie),'-frames:v','1',str(folder/f'frame-{i+1:02}.png')])
 versions[lang]=dict(seconds=total,voice=old['versions'][lang]['voice'],syntheticNarration=True,chapters=46,scenes=165,width=1920,height=1080,fps=15,bytes=movie.stat().st_size,sha256=sha(movie))
 checks.append(dict(language=lang,fullDecodePassed=True,reusedChapters=45,appendedScenes=11,captionOffsetSeconds=offset,chapterMetadataCount=46,humanListeningReview=False))
 print('Verified main film',lang,movie.stat().st_size,'bytes',flush=True)
verification=dict(schema='ghu-video-append-verification-v1',date='2026-10-13',scope='Chapters 1–45 retain the October 12 recording; chapter 46 uses October 13 captures. All video is encoded onto a continuous timeline. No claim that earlier chapters were recaptured.',previousManifestSha256=sha(OLD/'manifest.json'),supplementManifestSha256=sha(SUP/'manifest.json'),storyboardSha256=sha(ROOT/'tools/video_guide/storyboard.json'),newChapterAppSha256=capture['app_sha256'],captureReceiptSha256=sha(ROOT/'tools/quantization_video/captures/provenance.json'),checks=checks)
dump(OUT/'verification.json',verification)
dump(OUT/'manifest.json',dict(schema='ghu-video-media-v1',date='2026-10-13',revision=OUT.name,revisionOf=OLD.name,versions=versions,files={p.name:sha(p) for p in sorted(OUT.iterdir()) if p.is_file() and p.name!='manifest.json'}))
dump(ROOT/'media/video/current.json',dict(directory=OUT.name))
print('Current video now points to the verified 46-chapter revision',flush=True)
