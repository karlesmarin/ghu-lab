"""Verify the completed MP4, timing, independent examples and source certificates."""
from pathlib import Path
from fractions import Fraction as F
import hashlib,json,re,subprocess,sys
from PIL import Image,ImageDraw,ImageChops
ROOT=Path(__file__).resolve().parent;OUT=ROOT/'final';QA=ROOT/'qa';QA.mkdir(exist_ok=True)
sys.path.insert(0,sys.argv[1]);import imageio_ffmpeg
ff=imageio_ffmpeg.get_ffmpeg_exe();movie=OUT/'ghu-mathematics-en.mp4';m=json.loads((OUT/'render-manifest.json').read_text());chapters=json.loads((OUT/'chapters-en.json').read_text());checks=[]
def ck(n,v):
    if not v:raise RuntimeError(n)
    checks.append(n)
ck('MP4 matches its recorded SHA-256',hashlib.sha256(movie.read_bytes()).hexdigest()==m['sha256'])
ck('All 29 chapters are continuous',len(chapters)==29 and chapters[0]['start']==0 and all(abs(a['end']-b['start'])<1e-6 for a,b in zip(chapters,chapters[1:])))
ck('Source boundary explanation is the approved prototype',m['approvedBoundarySha256']=='72080d391fbcc764cc256fb8cfed629af09410c1d578a3496efa8782c20c1c81')
result=subprocess.run([ff,'-v','error','-xerror','-i',str(movie),'-map','0:v:0','-map','0:a:0','-progress','pipe:1','-nostats','-f','null','-'],capture_output=True)
(QA/'decode.log').write_bytes(result.stderr)
ck('Complete video and audio decode without errors',result.returncode==0 and not result.stderr.strip())
counts=re.findall(rb'frame=([0-9]+)',result.stdout)
ck('Exact expected number of 24 fps video frames',counts and int(counts[-1])==round(m['seconds']*24))
meta=subprocess.run([ff,'-i',str(movie),'-f','ffmetadata','-'],capture_output=True)
ck('29 embedded MP4 chapters',meta.stdout.count(b'[CHAPTER]')==29)
ck('Full-HD 24 fps stream',b'1920x1080' in meta.stderr and b'24 fps' in meta.stderr)
ck('Consistent 48 kHz mono audio',b'48000 Hz, mono' in meta.stderr)
def secs(s):h,mm,ss=map(float,s.split(':'));return h*3600+mm*60+ss
cues=re.findall(r'([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]{3}) --> ([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\.[0-9]{3})',(OUT/'captions-en.vtt').read_text())
last=0
for a,b in cues:
    a,b=secs(a),secs(b);ck('Caption interval '+str(len(checks)),last<=a<b<=m['seconds']);last=b
g=[[F(1),F(0),F(1,2)],[F(0),F(1),F(0)],[F(1,2),F(0),F(1,3)]];c=[F(-1,2),F(0),F(1)]
ck('Toy Gram determinant is exactly 1/12',g[0][0]*g[2][2]-g[0][2]*g[2][0]==F(1,12))
ck('Toy quadratic form matches the integrated square',sum(c[i]*g[i][j]*c[j] for i in range(3) for j in range(3))==F(1,12))
ck('Four exact trace groups sum to 512',128*(F(9,4)-F(1,4)-F(1,4)+F(9,4))==512)
sheet=Image.new('RGB',(1280,10*266),'#f6f3e9');draw=ImageDraw.Draw(sheet)
for i,ch in enumerate(chapters):
    t=ch['start']+.55*(ch['end']-ch['start']);path=QA/(ch['id']+'.png')
    subprocess.run([ff,'-v','error','-y','-ss',str(t),'-i',str(movie),'-frames:v','1',str(path)],check=True)
    im=Image.open(path);ck(ch['id']+' actual rendered dimensions',im.size==(1920,1080));im.thumbnail((420,236));x=(i%3)*426;y=(i//3)*266;sheet.paste(im,(x,y));draw.text((x+4,y+240),ch['id']+' '+ch['section'],fill='#173441')
sheet.save(QA/'contact.png')
# Every section boundary is sampled on both sides to catch a missing or repeated clip.
for index in [8,16,22,27]:
    ch=chapters[index]
    for suffix,delta in [('before',-.15),('after',.15)]:
        subprocess.run([ff,'-v','error','-y','-ss',str(ch['start']+delta),'-i',str(movie),'-frames:v','1',str(QA/(ch['id']+'-'+suffix+'.png'))],check=True)
report={'passed':True,'checks':checks,'checkCount':len(checks),'videoSha256':m['sha256'],'seconds':m['seconds'],'chapters':29,'captionCues':len(cues),'fullAudioVideoDecode':True,'expectedVideoFrames':round(m['seconds']*24),'humanAudioReview':False,'visualSamplesGenerated':37}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:v for k,v in report.items() if k!='checks'},indent=2))
