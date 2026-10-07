"""Assemble real browser takes, two narrations and word-timed captions. No network services."""
from pathlib import Path
import argparse,hashlib,json,math,os,subprocess,sys,textwrap,wave
from PIL import Image,ImageDraw,ImageFont

HERE=Path(__file__).resolve().parent
def save(p,x):p.write_text(json.dumps(x,indent=2,ensure_ascii=False)+'\n',encoding='utf-8',newline='\n')
def stamp(t):
    m=round(t*1000);h,m=divmod(m,3600000);mi,m=divmod(m,60000);s,ms=divmod(m,1000)
    return f'{h:02d}:{mi:02d}:{s:02d}.{ms:03d}'
def run(args,log):
    p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    log.write_bytes(p.stdout)
    if p.returncode:raise RuntimeError(p.stdout.decode('utf-8','replace')[-5000:])
def font(size,bold=False):
    base=Path(os.environ['WINDIR'])/'Fonts'
    return ImageFont.truetype(str(base/('arialbd.ttf' if bold else 'arial.ttf')),size)
def card(dest,chapter,lang,total):
    im=Image.new('RGB',(1920,1080),'#12242e');d=ImageDraw.Draw(im)
    for i in range(9):
        y=130+i*105;d.line((1320,y,1850,y-60),fill='#26444d',width=2)
        for j in range(6):
            x=1340+j*92;yy=y-int(35*math.sin(j*.8+i*.5));d.ellipse((x-5,yy-5,x+5,yy+5),fill='#377582')
    d.rectangle((112,130,200,138),fill='#7ed6df')
    d.text((112,170),'GHU LAB',font=font(29,True),fill='#7ed6df')
    label='GUÍA DEL LABORATORIO' if lang=='es' else 'LABORATORY WALKTHROUGH'
    d.text((112,223),label,font=font(21),fill='#abc1c9')
    title=chapter['titleES'] if lang=='es' else chapter['title']
    lines=textwrap.wrap(title,31)
    yy=355
    for line in lines:d.text((112,yy),line,font=font(64,True),fill='#f2f7f9');yy+=85
    d.text((112,790),'Pregunta  ·  Control  ·  Resultado' if lang=='es' else 'Question  ·  Control  ·  Result',font=font(27),fill='#bbd7df')
    d.text((112,934),f"{chapter['number']:02d} / {total:02d}    ·    {'ESPAÑOL' if lang=='es' else 'ENGLISH'}",font=font(23),fill='#7ed6df')
    d.text((1470,934),'07 OCT 2026',font=font(21),fill='#abc1c9')
    im.save(dest)
def captions(meta,duration):
    words=meta['words'];text=meta['text'];result=[];i=0
    assert words and 0 <= words[0]['seconds'] < words[-1]['seconds'] < duration,(words[-1]['seconds'],duration)
    while i<len(words):
        j=i+1
        while j<len(words):
            chunk=text[words[i]['start']:words[j]['start']]
            if len(chunk)>72 or words[j]['seconds']-words[i]['seconds']>4.5 or (len(chunk)>26 and chunk.rstrip().endswith(('.', '?', '!'))):break
            j+=1
        endpos=words[j]['start'] if j<len(words) else len(text)
        chunk=text[words[i]['start']:endpos].strip().replace('`','')
        end=words[j]['seconds'] if j<len(words) else duration-.1
        begin=words[i]['seconds']+.45;finish=min(duration+.4,end+.45)
        assert finish>begin
        result.append((begin,finish,'\n'.join(textwrap.wrap(chunk,43))))
        i=j
    return result
def main():
    ap=argparse.ArgumentParser();ap.add_argument('recording',type=Path);ap.add_argument('--vendor',type=Path);ap.add_argument('--pilot',action='store_true');ap.add_argument('--language',choices=['en','es']);a=ap.parse_args()
    if a.vendor:sys.path.insert(0,str(a.vendor.resolve()))
    import imageio_ffmpeg
    ff=imageio_ffmpeg.get_ffmpeg_exe();rec=a.recording.resolve();plan=json.loads((HERE/'storyboard.json').read_text(encoding='utf-8'))
    chapters=plan['chapters'][:2] if a.pilot else plan['chapters']
    output=rec/('pilot' if a.pilot else 'published');output.mkdir(exist_ok=True)
    langs=[a.language] if a.language else ['en','es']
    for lang in langs:
        tmp=rec/'render-v2'/lang;tmp.mkdir(parents=True,exist_ok=True);parts=[];timeline=[];cues=[];clock=0.;report=[]
        for ch in chapters:
            start=clock;chapter_cues=[];chapter_parts=[]
            cardpng=tmp/(ch['id']+'-title.png');card(cardpng,ch,lang,len(plan['chapters']))
            cardmp4=tmp/(ch['id']+'-title.mp4')
            if not cardmp4.exists():run([ff,'-y','-loglevel','error','-loop','1','-framerate','15','-i',str(cardpng),'-f','lavfi','-i','anullsrc=r=48000:cl=mono','-t','1.8','-vf','fade=t=in:st=0:d=0.3,fps=15','-fps_mode','cfr','-video_track_timescale','90000','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-threads','4','-c:a','aac','-b:a','64k',str(cardmp4)],tmp/(ch['id']+'-title.log'))
            parts.append(cardmp4);chapter_parts.append(cardmp4);clock+=1.8
            for si,scene in enumerate(ch['steps']):
                name=scene['id'];framepath=rec/'frames'/name;record=json.loads((framepath/'record.json').read_text(encoding='utf-8'))
                aud=rec/'audio'/lang/(name+'.wav');meta=json.loads(Path(str(aud)+'.json').read_text(encoding='utf-8-sig'))
                with wave.open(str(aud)) as w:duration=w.getnframes()/w.getframerate()
                frames=record['frames'];total=math.ceil((duration+1.1)*15)/15
                # Give the demonstration room to breathe; preserve the narrated reading time.
                raw=sum(f['duration'] for f in frames[:-1]);factor=min(1.7,max(1,(duration*.35)/max(raw,1)))
                spans=[f['duration']*factor for f in frames[:-1]];spans.append(total-sum(spans))
                assert spans[-1]>1,(name,total,sum(spans))
                titlefile=tmp/(name+'-heading.txt');titlefile.write_text(ch['titleES'] if lang=='es' else ch['title'],encoding='utf-8')
                brandfile=tmp/'brand.txt';brandfile.write_text('GHU LAB  ·  GUÍA EN VÍDEO' if lang=='es' else 'GHU LAB  ·  VIDEO GUIDE',encoding='utf-8')
                countfile=tmp/(name+'-count.txt');countfile.write_text(f"{ch['number']:02d} / {len(plan['chapters'])}  ·  {lang.upper()}",encoding='utf-8')
                concat=tmp/(name+'.ffconcat');lines=['ffconcat version 1.0']
                for f,t in zip(frames,spans):
                    source=(framepath/f['file']).as_posix();assert "'" not in source
                    lines += [f"file '{source}'",f'duration {t:.6f}']
                lines.append(f"file '{(framepath/frames[-1]['file']).as_posix()}'");concat.write_text('\n'.join(lines)+'\n',encoding='utf-8')
                dest=tmp/(name+'.mp4')
                def esc(p):return str(p).replace('\\','/').replace(':','\\:')
                vf="setpts=PTS-STARTPTS,fps=15,scale=1920:1080:flags=lanczos,drawbox=x=0:y=0:w=iw:h=78:color=0x12242e:t=fill"
                for p,x,size,color in [(brandfile,35,21,'0x7ed6df'),(titlefile,350,24,'white'),(countfile,1720,19,'0xabc1c9')]:
                    vf+=f",drawtext=fontfile='{esc(Path(os.environ['WINDIR'])/'Fonts/arial.ttf')}':textfile='{esc(p)}':x={x}:y=25:fontsize={size}:fontcolor={color}"
                signature=hashlib.sha256(aud.read_bytes()+concat.read_bytes()+vf.encode()).hexdigest()
                marker=dest.with_suffix('.sha256')
                if not dest.exists() or not marker.exists() or marker.read_text()!=signature:
                    run([ff,'-y','-loglevel','error','-safe','0','-f','concat','-i',str(concat),'-i',str(aud),'-vf',vf,'-af','loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,adelay=450,apad','-t',f'{total:.6f}','-r','15','-fps_mode','cfr','-video_track_timescale','90000','-c:v','libx264','-preset','veryfast','-tune','stillimage','-crf','23','-pix_fmt','yuv420p','-threads','4','-c:a','aac','-b:a','64k','-movflags','+faststart',str(dest)],tmp/(name+'.log'))
                    marker.write_text(signature)
                for begin,end,txt in captions(meta,duration):cues.append((clock+begin,clock+end,txt));chapter_cues.append((clock-start+begin,clock-start+end,txt))
                report.append(dict(id=name,seconds=total,frames=len(frames),actions=len(record['actions']),audioSeconds=duration))
                parts.append(dest);chapter_parts.append(dest);clock+=total
            title=ch['titleES'] if lang=='es' else ch['title'];timeline.append(dict(id=ch['id'],host=ch['host'],number=ch['number'],title=title,start=round(start,3),end=round(clock,3),text='\n\n'.join(s['textES'] if lang=='es' else s['text'] for s in ch['steps'])))
            print(f'{lang}: rendered chapter {ch["number"]:02d} {ch["id"]}; {clock/60:.1f} min',flush=True)
        lst=tmp/('pilot-concat.txt' if a.pilot else 'full-concat.txt');lst.write_text('\n'.join(f"file '{p.as_posix()}'" for p in parts)+'\n',encoding='utf-8')
        metadata=tmp/'chapters.ffmeta';ml=[';FFMETADATA1','title=GHU Lab — '+('Guía del laboratorio' if lang=='es' else 'Laboratory walkthrough'),'artist=Carles Marín','comment=Real-interface demonstrations; synthetic narration; recorded 2026-10-07']
        for c in timeline:ml+=['[CHAPTER]','TIMEBASE=1/1000',f'START={round(c["start"]*1000)}',f'END={round(c["end"]*1000)}','title='+c['title'].replace('=','\\=')]
        metadata.write_text('\n'.join(ml)+'\n',encoding='utf-8')
        vtt=output/f'ghu-lab-{lang}.vtt';vtt.write_text('WEBVTT\n\n'+'\n\n'.join(f'{stamp(b)} --> {stamp(e)}\n{t}' for b,e,t in cues)+'\n',encoding='utf-8')
        dest=output/f'ghu-lab-{lang}.mp4'
        # WebVTT is the sole caption track: avoid native in-band captions competing with it.
        run([ff,'-y','-loglevel','error','-safe','0','-f','concat','-i',str(lst),'-i',str(metadata),'-map','0:v:0','-map','0:a:0','-map_metadata','1','-map_chapters','1','-c','copy','-metadata:s:a:0','language='+('spa' if lang=='es' else 'eng'),'-movflags','+faststart',str(dest)],tmp/'assemble.log')
        save(output/f'chapters-{lang}.json',timeline)
        save(output/f'render-{lang}.json',dict(language=lang,seconds=clock,width=1920,height=1080,fps=15,voice=plan['voices'][lang],syntheticNarration=True,chapters=len(timeline),scenes=report,subtitles=len(cues),bytes=dest.stat().st_size,sha256=hashlib.sha256(dest.read_bytes()).hexdigest()))
        (output/f'transcript-{lang}.txt').write_text('\n\n'.join(f'{stamp(c["start"])}  {c["number"]:02d}. {c["title"]}\n\n{c["text"]}' for c in timeline)+'\n',encoding='utf-8')
        poster=output/f'poster-{lang}.png';card(poster,chapters[0],lang,len(plan['chapters']))
        print(f'READY {dest} {clock/60:.1f} minutes {dest.stat().st_size/1e6:.1f} MB',flush=True)
if __name__=='__main__':main()
