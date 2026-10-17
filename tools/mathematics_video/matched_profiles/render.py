"""Same 24 fps / word-timed whiteboard pipeline as the original mathematical film."""
from scenes import *
import argparse,os
ap=argparse.ArgumentParser();ap.add_argument('vendor');ap.add_argument('--preview',action='store_true');args=ap.parse_args()
ROOT=HERE.parents[2];TMP=ROOT/'.tmp/mathematics-20261017';FF=os.environ.get('GHU_FFMPEG',FF)
def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
codehash=hashlib.sha256((HERE/'scenes.py').read_bytes()+(HERE/'render.py').read_bytes()+(HERE/'inputs.json').read_bytes()+(HERE.parent/'full/whiteboard_core.py').read_bytes()).hexdigest()
for lang in ['en','es']:
    out=TMP/lang;out.mkdir(parents=True,exist_ok=True);plan=json.loads((HERE/lang/'storyboard.json').read_text(encoding='utf-8'))
    chapters=[];vtt=['WEBVTT',''];offset=0
    for si,scene in enumerate(plan['scenes']):
        wav=HERE/lang/'audio'/(scene['id']+'.wav')
        with wave.open(str(wav),'rb') as w:
            assert w.getframerate()==16000 and w.getnchannels()==1 and w.getsampwidth()==2
            samples=w.readframes(w.getnframes());seconds=w.getnframes()/16000
        frames=math.ceil((seconds+1.25)*FPS);duration=frames/FPS
        ww=json.loads(wav.with_suffix('.wav.json').read_text(encoding='utf-8-sig'))['words'];caps=[];i=0
        while i<len(ww):
            j=i+1
            while j<len(ww):
                s=scene['text'][ww[i]['start']:ww[j]['start']]
                if len(s)>85 or ww[j]['seconds']-ww[i]['seconds']>5 or (len(s)>30 and s.rstrip().endswith('.')):break
                j+=1
            endpos=ww[j]['start'] if j<len(ww) else len(scene['text'])
            caps.append((.35+ww[i]['seconds'],.35+(ww[j]['seconds'] if j<len(ww) else seconds),scene['text'][ww[i]['start']:endpos].strip()));i=j
        chapters.append({**scene,'start':offset,'end':offset+duration})
        for a,b,s in caps:vtt.extend([stamp(offset+a)+' --> '+stamp(offset+b),s,''])
        offset+=duration
        for label,fraction in [('early',.12),('middle',.5),('late',.88)]:
            elapsed=duration*fraction;frame(scene,si,lang,max(0,min(1,(elapsed-.35)/(duration-1.25))),elapsed,caps).save(out/(scene['id']+'-'+label+'.png'))
        if args.preview:continue
        movie=out/(scene['id']+'.mp4');receipt=out/(scene['id']+'.json')
        sha=hashlib.sha256((codehash+json.dumps(scene)+str(duration)).encode()+wav.read_bytes()).hexdigest()
        if movie.exists() and receipt.exists() and json.loads(receipt.read_text()).get('inputsSha256')==sha:
            print('Reused '+lang+'/'+scene['id'],flush=True);continue
        audio=out/(scene['id']+'-padded.wav')
        with wave.open(str(audio),'wb') as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(b'\0'*int(.35*16000)*2+samples+b'\0'*(round(duration*16000)-int(.35*16000)-len(samples)//2)*2)
        with (out/(scene['id']+'.log')).open('wb') as log:
            proc=subprocess.Popen([FF,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(audio),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000','-movflags','+faststart',str(movie)],stdin=subprocess.PIPE,stdout=log,stderr=log)
            try:
                for f in range(frames):
                    elapsed=f/FPS;p=max(0,min(1,(elapsed-.35)/(duration-1.25)))
                    proc.stdin.write(frame(scene,si,lang,p,elapsed,caps).tobytes())
                proc.stdin.close()
                if proc.wait():raise RuntimeError('Render failed: '+lang+'/'+scene['id'])
            finally:
                if proc.poll() is None:proc.kill()
        receipt.write_text(json.dumps(dict(inputsSha256=sha,frames=frames,seconds=duration,sha256=hashlib.sha256(movie.read_bytes()).hexdigest()),indent=2)+'\n')
        print('Rendered '+lang+'/'+scene['id'],flush=True)
    (out/'chapters-more.json').write_text(json.dumps(chapters,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (out/'captions-more.vtt').write_text('\n'.join(vtt),encoding='utf-8')
    sheet=Image.new('RGB',(1280,math.ceil(len(chapters)/3)*265),BG);d=ImageDraw.Draw(sheet)
    for i,c in enumerate(chapters):
        pic=Image.open(out/(c['id']+'-late.png'));pic.thumbnail((420,236));x=(i%3)*426;y=(i//3)*265;sheet.paste(pic,(x,y));text(d,(x+5,y+239),c['id']+' '+c['section'],17,MUTED)
    sheet.save(out/'contact.png');print(json.dumps(dict(language=lang,scenes=len(chapters),seconds=offset,preview=args.preview)),flush=True)
