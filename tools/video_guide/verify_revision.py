"""Verify edited narration, media, captions and capture provenance before delivery."""
import argparse, hashlib, json, re, subprocess, sys, wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def spoken(text,lang):
    text=re.sub(r'SU\((\d+)\)',r'S U \1',text)
    for a,b in [(r'\bGHU\b','G H U'),(r'\bCMS\b','C M S'),(r'\bKK\b','Kaluza Klein')]:text=re.sub(a,b,text)
    if lang=='en':
        for a,b in [(r'\bGeV\b','giga electron volts'),(r'\bTeV\b','tera electron volts'),('Δ','delta '),('θ','theta '),('η','eta '),('α','alpha '),('μ','mu '),('χ','chi '),('²',' squared '),('³',' cubed '),('≠',' not equal to '),('→',' to '),('≤',' less than or equal to '),('≥',' greater than or equal to '),('×',' times ')]:text=re.sub(a,b,text)
    return text
def seconds(s):
    h,m,t=map(float,s.split(':'));return 3600*h+60*m+t
def main():
    ap=argparse.ArgumentParser();ap.add_argument('recording',type=Path);ap.add_argument('--vendor',type=Path);a=ap.parse_args()
    if a.vendor:sys.path.insert(0,str(a.vendor.resolve()))
    import imageio_ffmpeg
    rec=a.recording.resolve();plan=read(ROOT/'tools/video_guide/storyboard.json');capture=read(rec/'capture.json')
    scene_count=sum(len(ch['steps']) for ch in plan['chapters'])
    chapter_count=len(plan['chapters'])
    checks=[]
    def check(ok,label):
        if not ok:raise AssertionError(label)
        checks.append(label)
    check(sha(ROOT/'app/index.html')==capture['sourceAppSha256'],'captures refer to the delivered application')
    check(set(capture['scenes'])=={s['id'] for ch in plan['chapters'] for s in ch['steps']},f'all {scene_count} scenes recorded')
    check(all(not r['errors'] for r in capture['runs']),'capture runs have no browser exceptions')
    inventory={}
    for ch in plan['chapters']:
        for scene in ch['steps']:
            folder=rec/'frames'/scene['id'];record=read(folder/'record.json')
            check(record['chapter']==ch['id'] and record['state']['section']==ch['host'],scene['id']+' matching section')
            check([x['action'] for x in record['actions']]==[{**x,**({'kind':'click','selector':'#demoRun','pauseDemo':True} if x['kind']=='demoStart' else {})} for x in scene['actions']],scene['id']+' recorded controls match storyboard')
            digest=hashlib.sha256((folder/'record.json').read_bytes())
            for f in record['frames']:digest.update((folder/f['file']).read_bytes())
            inventory[scene['id']]=digest.hexdigest()
            for lang in ['en','es']:
                aud=rec/'audio'/lang/(scene['id']+'.wav');meta=read(Path(str(aud)+'.json'))
                expected=spoken(scene['textES' if lang=='es' else 'text'],lang)
                check(meta['text']==expected,lang+' '+scene['id']+' audio text matches final script')
                with wave.open(str(aud)) as w:duration=w.getnframes()/w.getframerate()
                times=[x['seconds'] for x in meta['words']]
                check(times==sorted(times) and 0<=times[0]<times[-1]<duration,lang+' '+scene['id']+' word timing within audio')
    versions={}
    for lang in ['en','es']:
        output=rec/'published';r=read(output/f'render-{lang}.json');timeline=read(output/f'chapters-{lang}.json')
        check(len(timeline)==chapter_count and len(r['scenes'])==scene_count,lang+' complete timeline')
        for c,ch in zip(timeline,plan['chapters']):
            check(c['id']==ch['id'] and c['text']=='\n\n'.join(s['textES' if lang=='es' else 'text'] for s in ch['steps']),lang+' '+ch['id']+' transcript matches final script')
        check(all(abs(timeline[i]['end']-timeline[i+1]['start'])<.002 for i in range(chapter_count-1)) and abs(timeline[-1]['end']-r['seconds'])<.002,lang+' chapter boundaries synchronized')
        blocks=(output/f'ghu-lab-{lang}.vtt').read_text(encoding='utf-8').strip().split('\n\n');last=0
        check(blocks[0]=='WEBVTT' and len(blocks)-1==r['subtitles'],lang+' subtitle count')
        for block in blocks[1:]:
            t,*lines=block.splitlines();begin,end=map(seconds,t.split(' --> '))
            check(bool(lines) and last<=begin<end<=r['seconds']+.01,lang+' synchronized cue '+t);last=end
        movie=output/f'ghu-lab-{lang}.mp4';check(sha(movie)==r['sha256'],lang+' final movie hash')
        ff=imageio_ffmpeg.get_ffmpeg_exe()
        p=subprocess.run([ff,'-v','error','-xerror','-i',str(movie),'-map','0:v:0','-map','0:a:0','-f','null','-'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        (rec/f'decode-{lang}.log').write_bytes(p.stderr)
        check(p.returncode==0 and not p.stderr.strip(),lang+' full audio/video decode has no errors')
        versions[lang]={k:r[k] for k in ['seconds','bytes','sha256','chapters','subtitles']}
    report={'passed':True,'checks':len(checks),'sourceAppSha256':capture['sourceAppSha256'],'storyboardSha256':sha(ROOT/'tools/video_guide/storyboard.json'),'captureHashes':inventory,'versions':versions}
    (rec/'verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'passed':True,'checks':len(checks),'versions':versions},indent=2))
if __name__=='__main__':main()
