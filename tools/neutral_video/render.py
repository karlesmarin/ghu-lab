"""Full-HD narrated supplement with real captures, speech-timed captions and replayable assets."""
from pathlib import Path
import hashlib,html,json,math,subprocess,sys,textwrap,wave,os,shutil
from PIL import Image,ImageDraw,ImageFont
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
OUT=ROOT/'media/video/2026-10-28-neutral';OUT.mkdir(parents=True,exist_ok=True)
try:
 import imageio_ffmpeg
 FF=imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
 FF=os.environ.get('GHU_FFMPEG') or shutil.which('ffmpeg')
 if not FF:raise SystemExit('Install imageio-ffmpeg or set GHU_FFMPEG to an existing FFmpeg executable')
FONTS=Path(os.environ.get('GHU_VIDEO_FONT_DIR',str(Path(os.environ['WINDIR'])/'Fonts')))
FONT=ImageFont.truetype(str(FONTS/'segoeui.ttf'),34)
TITLE=ImageFont.truetype(str(FONTS/'segoeuib.ttf'),45)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):subprocess.run(args,check=True,capture_output=True)
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
def ass(t):
 cs=round(t*100);h,cs=divmod(cs,360000);m,cs=divmod(cs,6000);s,cs=divmod(cs,100);return f'{h}:{m:02}:{s:02}.{cs:02}'
reports=[]
for lang in ['en','es']:
 plan=json.loads((HERE/lang/'storyboard.json').read_text(encoding='utf-8'))
 clips=[];chapters=[];cues=[];offset=0
 for idx,scene in enumerate(plan['scenes']):
  audio=HERE/lang/'audio'/(scene['id']+'.wav')
  with wave.open(str(audio)) as w:duration=w.getnframes()/w.getframerate()
  duration=math.ceil((duration+1.4)*24)/24
  shot=Image.open(HERE/'captures'/(lang+'-'+scene['id']+'-card.png')).convert('RGB')
  frame=Image.new('RGB',(1920,1080),'#f4f7f9');d=ImageDraw.Draw(frame)
  title=f'{idx+1:02}  '+scene['title'];assert d.textlength(title,font=TITLE)<1800,title
  d.text((60,25),title,font=TITLE,fill='#203745')
  # Preserve the real table aspect ratio and make text readable; no recomputed or painted values.
  shot.thumbnail((1780,780),Image.Resampling.LANCZOS)
  factor=min(1780/shot.width,780/shot.height)
  shot=shot.resize((round(shot.width*factor),round(shot.height*factor)),Image.Resampling.LANCZOS)
  frame.paste(shot,((1920-shot.width)//2,100+(780-shot.height)//2))
  d.rectangle((0,900,1920,1080),fill='#172e3c')
  d.text((60,1040),'GHU Lab · 2026-10-28 · '+('Voz sintética: Helena' if lang=='es' else 'Synthetic voice: Zira'),font=ImageFont.truetype(str(FONTS/'segoeui.ttf'),21),fill='#b8ccd7')
  png=HERE/lang/(scene['id']+'.png');frame.save(png)
  meta=json.loads((Path(str(audio)+'.json')).read_text(encoding='utf-8-sig'));words=meta['words']
  if isinstance(words,dict):words=[words]
  chunks=[];start=0
  for part in textwrap.wrap(scene['text'],width=108,break_long_words=False):
   pos=scene['text'].find(part,start);assert pos>=0
   matched=next((w for w in words if w['start']>=pos),words[-1]);chunks.append((float(matched['seconds'])+.4,part));start=pos+len(part)
  subtitle='[Script Info]\nScriptType: v4.00+\nPlayResX: 1920\nPlayResY: 1080\n[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\nStyle: Default,Segoe UI,38,&H00FFFFFF,&H00FFFFFF,&H00172E3C,&H00172E3C,0,0,0,0,100,100,0,0,1,1,0,2,65,65,75,1\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n'
  for j,(begin,text) in enumerate(chunks):
   end=chunks[j+1][0] if j+1<len(chunks) else duration-.25
   assert 0<=begin<end<=duration
   subtitle+=f'Dialogue: 0,{ass(begin)},{ass(end)},Default,,0,0,0,,{text}\n';cues.append(dict(start=offset+begin,end=offset+end,text=text))
  sub=HERE/lang/(scene['id']+'.ass');sub.write_text(subtitle,encoding='utf-8')
  clip=HERE/lang/(scene['id']+'.mp4');rel=sub.relative_to(ROOT).as_posix()
  args=[FF,'-y','-loglevel','error','-loop','1','-framerate','24','-i',str(png),'-i',str(audio),'-vf',f"ass={rel}",'-af','adelay=400,apad','-t',str(duration),'-c:v','libx264','-preset','veryfast','-crf','22','-pix_fmt','yuv420p','-r','24','-c:a','aac','-ar','48000','-ac','1',str(clip)]
  subprocess.run(args,cwd=ROOT,check=True,capture_output=True)
  clips.append(clip);chapters.append(dict(id=scene['id'],title=scene['title'],start=offset,end=offset+duration,text=scene['text']));offset+=duration
  print(lang,scene['id'],round(duration,2),flush=True)
 concat=HERE/lang/'concat.txt';concat.write_text(''.join("file '"+p.name+"'\n" for p in clips),encoding='utf-8')
 metadata=HERE/lang/'chapters.ffmeta';metadata.write_text(';FFMETADATA1\n'+''.join(f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(c['start']*1000)}\nEND={round(c['end']*1000)}\ntitle={c['title']}\n" for c in chapters),encoding='utf-8')
 movie=OUT/('ghu-neutral-'+lang+'.mp4')
 run([FF,'-y','-loglevel','error','-f','concat','-safe','0','-i',str(concat),'-i',str(metadata),'-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart',str(movie)])
 decoded=subprocess.run([FF,'-v','error','-i',str(movie),'-progress','pipe:1','-f','null','-'],check=True,capture_output=True,text=True)
 decoded_frames=int([x.split('=')[1] for x in decoded.stdout.splitlines() if x.startswith('frame=')][-1]);assert decoded_frames==round(offset*24),(decoded_frames,offset)
 vtt='WEBVTT\n\n'+''.join(f"{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n\n" for c in cues)
 (OUT/(lang+'.vtt')).write_text(vtt,encoding='utf-8')
 (OUT/('chapters-'+lang+'.json')).write_text(json.dumps(chapters,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 frame=Image.open(HERE/lang/'central.png');frame.save(OUT/('poster-'+lang+'.png'))
 transcript='\n\n'.join(c['title']+'\n'+c['text'] for c in chapters)
 (OUT/('transcript-'+lang+'.txt')).write_text(transcript,encoding='utf-8')
 title='Sector neutro y aislamiento certificado' if lang=='es' else 'Neutral sector and certified isolation'
 other='index.html' if lang=='es' else 'index-es.html';filename='index-es.html' if lang=='es' else 'index.html'
 page=f'''<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Finite neutral quotient and continuous spectral isolation with explicit assumptions, written proof and exact replay."><title>{title} — GHU Lab</title><link rel="canonical" href="https://karlesmarin.github.io/ghu-explorer/video/neutral/{filename}"><link rel="alternate" hreflang="{'en' if lang=='es' else 'es'}" href="https://karlesmarin.github.io/ghu-explorer/video/neutral/{other}"><style>body{{font:18px/1.6 system-ui;color:#243642;background:#f6f8fa;max-width:1150px;margin:32px auto;padding:0 20px}}a{{color:#196080}}video{{width:100%;background:#172e3c}}button{{font:inherit;background:white;color:#204c67;border:1px solid #bacbd4;padding:10px;cursor:pointer;text-align:left}}nav{{display:flex;gap:10px;flex-wrap:wrap}}.chapters{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:8px;margin:20px 0}}.note{{background:white;border-left:4px solid #a57832;padding:16px}}</style></head><body><nav><a href="../../index.html">GHU Lab</a><a href="{other}">{'English' if lang=='es' else 'Castellano'}</a><a href="../../app/index.html#s=anomalies&demo=boundaryresearch&lang={lang}">Demo</a><a href="../../proof/index.html">{'Certificados' if lang=='es' else 'Certificates'}</a></nav><h1>{title}</h1><p>{'Edición complementaria' if lang=='es' else 'Supplementary edition'} · 28 October 2026 · {len(chapters)} {'capítulos' if lang=='es' else 'chapters'} · {int(offset//60)}:{round(offset%60):02} · {'Voz sintética Helena' if lang=='es' else 'Synthetic voice Zira'}.</p><p class="note">{'Capturas reales y prueba continua escrita con álgebra exacta verificable. Modelo condicionado: no certifica derivada Wilson, RZW ni predicción física. Complementa los vídeos del 17 de octubre.' if lang=='es' else 'Real captures and a written continuous proof with exact algebraic replay. Conditional model: no Wilson derivative, RZW or physical prediction certified. Supplements the October 17 films.'}</p><video id="film" controls preload="metadata" poster="poster-{lang}.png"><source src="{movie.name}" type="video/mp4"><track kind="captions" src="{lang}.vtt" srclang="{lang}" label="{lang}" default></video><!-- edition-allow: Requested narrated video uses only adjacent versioned media. --><p><a href="{movie.name}">MP4</a> · <a href="{lang}.vtt">VTT</a> · <a href="transcript-{lang}.txt">{'Transcripción' if lang=='es' else 'Transcript'}</a> · <a href="manifest.json">SHA-256</a></p><div class="chapters">'''
 page+=''.join(f'<button data-start="{c["start"]}">{i+1:02} · {html.escape(c["title"])}</button>' for i,c in enumerate(chapters))+'</div>'
 page+=''.join(f'<section id="{c["id"]}"><h2>{i+1} · {html.escape(c["title"])}</h2><p>{html.escape(c["text"])}</p></section>' for i,c in enumerate(chapters))
 page+='''<script>const film=document.getElementById('film');document.querySelectorAll('[data-start]').forEach(b=>b.onclick=()=>{film.currentTime=Number(b.dataset.start);film.play().catch(()=>{});film.scrollIntoView({block:'center'});});</script></body></html>'''
 (OUT/filename).write_text(page,encoding='utf-8')
 reports.append(dict(language=lang,chapters=len(chapters),caption_cues=len(cues),duration_seconds=offset,frames=round(offset*24),video_sha256=sha(movie),full_decode_passed=True,decoded_frames=decoded_frames,captures='Actual verified laboratory controls; see tools/neutral_video/captures/provenance.json',human_listening_review=False))
manifest=dict(schema='ghu-neutral-video-v1',reports=reports,files=[dict(path=p.name,sha256=sha(p),bytes=p.stat().st_size) for p in sorted(OUT.iterdir()) if p.name!='manifest.json'])
manifest['sources']=[dict(path=p.relative_to(ROOT).as_posix(),sha256=sha(p)) for p in sorted(HERE.rglob('*')) if p.is_file() and p.suffix in {'.py','.ps1','.json','.wav','.png','.html'}]
manifest['certificate_sha256']=sha(ROOT/'proof/z-isolation/certificate.json')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(json.dumps(reports))
