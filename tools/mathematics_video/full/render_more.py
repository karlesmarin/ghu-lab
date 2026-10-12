"""Render narrated whiteboard chapters, caching each complete scene by its inputs."""
from scenes import *
import argparse
ap=argparse.ArgumentParser();ap.add_argument('vendor');ap.add_argument('--preview',action='store_true');ap.add_argument('--only',nargs='*');args=ap.parse_args()
OUT=ROOT/'review';OUT.mkdir(exist_ok=True);TMP=ROOT/'rendered';TMP.mkdir(exist_ok=True)
def stamp(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02}.{ms:03}'
chapters=[];vtt=['WEBVTT',''];offset=0
codehash=hashlib.sha256((ROOT/'scenes.py').read_bytes()+(ROOT/'whiteboard_core.py').read_bytes()).hexdigest()
labhash=hashlib.sha256(b''.join(p.read_bytes() for p in sorted((ROOT/'lab').glob('*.png')))).hexdigest()
for si,scene in enumerate(plan['scenes']):
    wav=ROOT/'audio'/(scene['id']+'.wav')
    with wave.open(str(wav),'rb') as w:
        assert w.getframerate()==16000 and w.getnchannels()==1
        samples=w.readframes(w.getnframes());seconds=w.getnframes()/16000
    frames=math.ceil((seconds+1.25)*FPS);duration=frames/FPS
    meta=json.loads(wav.with_suffix('.wav.json').read_text(encoding='utf-8-sig'));ww=meta['words'];caps=[];i=0
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
        elapsed=duration*fraction;im=frame(si,max(0,min(1,(elapsed-.35)/(duration-1.25))),elapsed,caps);im.save(OUT/(scene['id']+'-'+label+'.png'))
    if args.preview or (args.only and scene['id'] not in args.only):continue
    output=TMP/(scene['id']+'.mp4');receipt=TMP/(scene['id']+'.json')
    sha=hashlib.sha256((codehash+labhash+json.dumps(scene)+str(duration)).encode()+wav.read_bytes()).hexdigest()
    if output.exists() and receipt.exists() and json.loads(receipt.read_text()).get('inputsSha256')==sha:
        print('Reused '+scene['id'],flush=True);continue
    audio=TMP/(scene['id']+'.wav')
    with wave.open(str(audio),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(b'\0'*int(.35*16000)*2+samples+b'\0'*(round(duration*16000)-int(.35*16000)-len(samples)//2)*2)
    log=(TMP/(scene['id']+'.log')).open('wb')
    proc=subprocess.Popen([FF,'-y','-f','rawvideo','-vcodec','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(audio),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','96k','-af','loudnorm=I=-16:TP=-1.5:LRA=9','-ar','48000','-movflags','+faststart',str(output)],stdin=subprocess.PIPE,stdout=log,stderr=log)
    try:
        for f in range(frames):
            elapsed=f/FPS;progress=max(0,min(1,(elapsed-.35)/(duration-1.25)))
            proc.stdin.write(frame(si,progress,elapsed,caps).tobytes())
        proc.stdin.close();rc=proc.wait()
        if rc:raise RuntimeError('Render failed: '+scene['id'])
    finally:
        if proc.poll() is None:proc.kill()
        log.close()
    receipt.write_text(json.dumps({'inputsSha256':sha,'frames':frames,'seconds':duration,'sha256':hashlib.sha256(output.read_bytes()).hexdigest()},indent=2)+'\n')
    print('Rendered '+scene['id'],flush=True)
(OUT/'chapters-more.json').write_text(json.dumps(chapters,indent=2)+'\n')
(OUT/'captions-more.vtt').write_text('\n'.join(vtt),encoding='utf-8')
sheet=Image.new('RGB',(1280,math.ceil(len(chapters)/3)*265),BG);d=ImageDraw.Draw(sheet)
for i,c in enumerate(chapters):
    im=Image.open(OUT/(c['id']+'-middle.png'));im.thumbnail((420,236));x=(i%3)*426;y=(i//3)*265;sheet.paste(im,(x,y));text(d,(x+5,y+239),c['id']+' '+c['section'],17,MUTED)
sheet.save(OUT/'contact.png');print(json.dumps({'scenes':len(chapters),'seconds':offset,'preview':args.preview}),flush=True)
