"""Animated scientific whiteboard with real lab captures, English voice and captions."""
from pathlib import Path
import os
from localization import translate
from functools import lru_cache
from io import BytesIO
import hashlib,json,math,subprocess,sys,textwrap,wave
import numpy as np
from scipy.optimize import brentq
from PIL import Image,ImageDraw,ImageFont,ImageColor
import matplotlib
matplotlib.use('Agg')
from matplotlib.mathtext import math_to_image
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,sys.argv[1]);import imageio_ffmpeg
FF=imageio_ffmpeg.get_ffmpeg_exe();OUT=ROOT/'review';OUT.mkdir(exist_ok=True)
plan=json.loads((ROOT/'storyboard.json').read_text(encoding='utf-8'));W,H,FPS=1920,1080,24
INK='#173441';TEAL='#007f82';ORANGE='#ca681a';RED='#c3374d';MUTED='#58727a';BG='#f6f3e9';BLUE='#176daf'
@lru_cache(None)
def font(size,bold=False):return ImageFont.truetype(str(Path(os.environ.get('GHU_VIDEO_FONT_DIR',str(Path(os.environ.get('WINDIR','.'))/'Fonts')))/('segoeuib.ttf' if bold else 'segoeui.ttf')),size)
@lru_cache(None)
def equation(s,size=30,color=INK):
    b=BytesIO();math_to_image('$'+s+'$',b,dpi=100,format='png',color=color,prop=matplotlib.font_manager.FontProperties(size=size));b.seek(0)
    arr=np.array(Image.open(b).convert('RGBA'));rgb=ImageColor.getrgb(color)
    alpha=np.clip((255-arr[:,:,:3].min(axis=2).astype(float))/(255-min(rgb)),0,1)
    arr[:,:,:3]=rgb;arr[:,:,3]=(255*alpha).astype('uint8')
    return Image.fromarray(arr)
def ease(p):p=max(0,min(1,p));return p*p*(3-2*p)
def root(a):return 0 if a==0 else brentq(lambda x:x*np.sin(x)-a*np.cos(x),0,np.pi/2,xtol=5e-15)
root1=root(1);us=np.linspace(0,1,241)
base=Image.new('RGB',(W,H),BG);db=ImageDraw.Draw(base)
for x in range(0,W,48):db.line((x,0,x,930),fill='#ebe9e1',width=1)
for y in range(0,930,48):db.line((0,y,W,y),fill='#ebe9e1',width=1)
db.rectangle((0,0,W,135),fill=BG);db.rectangle((0,935,W,H),fill=INK)
curve_cache={i:Image.open(ROOT/'lab'/f'curve-{i:03}.png').convert('RGB') for i in range(41)}
control_cache={i:Image.open(ROOT/'lab'/f'control-{i:03}.png').convert('RGB') for i in range(41)}
def text(draw,pos,s,size=30,color=INK,bold=False):
    s=translate(s)
    limit=1830-pos[0] if pos[0]>=1200 else (1135-pos[0] if pos[1]>160 and pos[1]<935 else 1810-pos[0])
    if pos[0]<400 and (pos[1]>775 or pos[1]<140):limit=1810-pos[0]
    while size>18 and draw.textlength(s,font=font(size,bold))>limit:size-=1
    draw.text(pos,s,font=font(size,bold),fill=color)

def eq(im,pos,s,size=30,color=INK,reveal=1):
    m=equation(s,size,color)
    limit=1800-pos[0] if pos[0]>=1200 else 1200-pos[0]
    if m.width>limit:m=m.resize((limit,round(m.height*limit/m.width)),Image.Resampling.LANCZOS)
    if reveal<1:m=m.crop((0,0,max(1,int(m.width*max(0,reveal))),m.height))
    im.paste(m,pos,m)
def arrow(d,a,b,color=ORANGE,width=5):
    d.line([a,b],fill=color,width=width);v=np.array(a,dtype=float)-b;v=v/(np.linalg.norm(v) or 1);n=np.array([-v[1],v[0]])
    d.polygon([b,tuple(np.array(b)+20*v+9*n),tuple(np.array(b)+20*v-9*n)],fill=color)
def dash(d,a,b,color=MUTED,width=2):
    a=np.array(a);b=np.array(b);L=np.linalg.norm(b-a)
    for t in np.arange(0,L,18):d.line([tuple(a+(b-a)*t/L),tuple(a+(b-a)*min(t+9,L)/L)],fill=color,width=width)
def axes(d):
    X=lambda u:140+940*u;Y=lambda f:790-390*f
    arrow(d,(140,790),(1140,790),INK,3);arrow(d,(140,790),(140,265),INK,3)
    for val in [0,.5,1]:
        d.line((X(val),783,X(val),798),fill=INK,width=2);text(d,(X(val)-12,805),f'{val:g}',25,MUTED)
        if val>0:dash(d,(145,Y(val)),(1080,Y(val)),'#d6dfdc',1);text(d,(80,Y(val)-17),f'{val:g}',25,MUTED)
    dash(d,(1080,790),(1080,310),'#c8bfaa',2)
    text(d,(175,278),'field amplitude  f(u)',27,MUTED);text(d,(510,850),'position in the extra dimension  u = y / L',27,MUTED)
    return X,Y
def fit(im,src,box):
    x,y,w,h=box;scale=min(w/src.width,h/src.height);pic=src.resize((round(src.width*scale),round(src.height*scale)),Image.Resampling.LANCZOS);im.paste(pic,(x+(w-pic.width)//2,y+(h-pic.height)//2))
def draw_frame(si,p,elapsed,meta,captions):
    im=base.copy();d=ImageDraw.Draw(im)
    text(d,(78,29),'GHU LAB  /  A VISUAL EXPLANATION',22,TEAL,True)
    text(d,(78,65),plan['scenes'][si]['title'],48,INK,True)
    for j in range(8):d.rounded_rectangle((1540+j*38,48,1564+j*38,59),radius=5,fill=TEAL if j<=si else '#d8dfd9')
    text(d,(1640,81),f'{si+1} / 8 · EN',22,MUTED)
    d.rounded_rectangle((1215,182,1835,889),radius=22,fill='#fffdf7',outline='#d4dcd5',width=2)
    if si!=6:
        X,Y=axes(d);a=1;x=root1
        if si==0:a=ease((p-.12)/.7);x=root(a)
        elif si==1:a=0;x=0
        elif si==2:a=ease((p-.22)/.35);x=0
        elif si==3:
            a=1;x=.35+.8*ease(p/.58) if p<.58 else 1.15+(root1-1.15)*ease((p-.58)/.26)
        elif si==5:a=4*ease((p-.08)/.82);x=root(a)
        elif si==7:a=1;x=root1
        f=np.cos(x*us);col=RED if si==2 and a>.01 else BLUE
        if si in (0,2,5,7):dash(d,(X(0),Y(1)),(X(1),Y(1)),'#b8c3c5',3)
        n=int(len(us)*ease(p/.25)) if si==1 else len(us)
        if n>1:d.line([(X(u),Y(v)) for u,v in zip(us[:n],f[:n])],fill=col,width=7)
        end=(X(1),Y(f[-1]));left=(X(0),Y(1))
        for pt in [left,end]:d.ellipse((pt[0]-10,pt[1]-10,pt[0]+10,pt[1]+10),fill=col,outline=BG,width=2)
        text(d,(175,184),'LEFT EDGE',24,MUTED,True);text(d,(888,184),'RIGHT EDGE',24,ORANGE,True)
        eq(im,(175,219),r"f'(0)=0",24,TEAL)
        if si>=2:eq(im,(854,219),r"f'(1)+af(1)=0",21,ORANGE)
        elif si==1:eq(im,(923,219),r"f'(1)=0",24,TEAL)
        if si in (0,3,5):
            text(d,(175,322),f'a = {a:.2f}    x = {x:.4f}',29,TEAL,True)
        if si in (1,4):
            # Tangents drawn in the graph's actual coordinate scale.
            reveal=ease((p-.20)/.25);slope=-x*np.sin(x)
            d.line((X(0),Y(1),X(.20*reveal),Y(1)),fill=TEAL,width=6)
            d.line((X(1-.20*reveal),Y(f[-1]-.20*reveal*slope),X(1+.10*reveal),Y(f[-1]+.10*reveal*slope)),fill=ORANGE,width=6)
        if si==0:
            text(d,(1260,225),'Change the edge.',37,INK,True);text(d,(1260,280),'Watch the whole profile.',32)
            eq(im,(1260,383),r'a: 0\longrightarrow 1',35,ORANGE)
            text(d,(1260,505),'Lowest normal mass',29,MUTED)
            eq(im,(1260,570),rf'kR={x/np.pi:.4f}',39,BLUE)
            text(d,(1260,747),'What forces this change?',30,TEAL,True)
            arrow(d,(1050,260),end,ORANGE)
        elif si==1:
            for threshold,y,label,formula in [(.06,224,'The simplest allowed profile',r'f(u)=1'),(.32,400,'No slope at either end',r"f'(u)=0"),(.60,581,'No curvature: zero eigenvalue',r"-f''=0\quad\Rightarrow\quad x^2=0")]:
                if p>threshold:
                    text(d,(1255,y),label,29,MUTED);eq(im,(1255,y+64),formula,29,TEAL,reveal=ease((p-threshold)/.12))
            if p>.80:text(d,(1255,788),'The constant mode is allowed.',27,BLUE,True)
        elif si==2:
            text(d,(1250,220),'Test the OLD profile',33,INK,True);eq(im,(1250,288),r'f(u)=1',31,BLUE)
            text(d,(1250,408),'Endpoint residual',28,MUTED)
            eq(im,(1250,473),rf'0+{a:.2f}\times1={a:.2f}',32,RED if a>0 else TEAL)
            if a>.05:
                arrow(d,(1125,335),end,RED);text(d,(1250,613),'Nonzero means: not allowed.',28,RED,True)
                text(d,(1250,693),'The field must find',29);text(d,(1250,737),'a different profile.',29)
        elif si==3:
            text(d,(1250,218),'Bulk equation',27,MUTED);eq(im,(1250,266),r"-f''=x^2f",34,INK)
            if p>.14:
                text(d,(1250,368),'Keep the left slope zero',27,MUTED);eq(im,(1250,420),r'f(u)=\cos(xu)',32,BLUE)
            if p>.25:
                residual=-x*np.sin(x)+np.cos(x)
                text(d,(1250,540),'Right-edge residual',27,MUTED);text(d,(1250,593),f'{residual:+.5f}',48,TEAL if abs(residual)<1e-4 else RED,True)
                text(d,(1250,706),'Vary x until this is zero.',29,ORANGE,True)
                d.ellipse((end[0]-22,end[1]-22,end[0]+22,end[1]+22),outline=ORANGE,width=4)
        elif si==4:
            slope=-x*np.sin(x);term=np.cos(x)
            text(d,(1250,220),'At a = 1',32,INK,True)
            eq(im,(1250,291),r"f'(1)=-x\sin x",29,ORANGE)
            if p>.18:eq(im,(1250,367),r'af(1)=a\cos x',29,TEAL)
            if p>.32:
                eq(im,(1250,456),r'-x\sin x+a\cos x=0',27,INK)
                height=91*ease((p-.32)/.16);d.line((1295,645,1755,645),fill=MUTED,width=2)
                d.rectangle((1330,645,1445,645+height),fill=ORANGE);d.rectangle((1580,645-height,1695,645),fill=TEAL)
                text(d,(1300,751),f'{slope:.4f}',29,ORANGE,True);text(d,(1560,751),f'+{term:.4f}',29,TEAL,True)
            if p>.71:eq(im,(1320,815),r'x\tan x=a',34,BLUE,reveal=ease((p-.71)/.12))
            text(d,(475,570),'negative slope',28,ORANGE,True);arrow(d,(685,612),(X(.98),Y(np.cos(x*.98))),ORANGE)
        elif si==5:
            text(d,(1250,220),'Same a. Same first root.',31,INK,True)
            xx=lambda v:1280+465*v/4;yy=lambda v:690-440*v
            arrow(d,(1280,690),(1785,690),INK,2);arrow(d,(1280,690),(1280,407),INK,2)
            dash(d,(1280,yy(.5)),(1750,yy(.5)),ORANGE,2)
            text(d,(1525,yy(.5)-41),'limit: 0.5',24,ORANGE)
            aa=np.linspace(0,a,100)
            if a>0:d.line([(xx(v),yy(root(v)/np.pi)) for v in aa],fill=TEAL,width=5)
            d.ellipse((xx(a)-9,yy(x/np.pi)-9,xx(a)+9,yy(x/np.pi)+9),fill=BLUE)
            text(d,(1280,706),'0',23,MUTED);text(d,(1737,706),'4',23,MUTED);text(d,(1450,747),'coupling a',25,MUTED)
            eq(im,(1250,309),rf'kR=x/\pi={x/np.pi:.4f}',29,BLUE)
            text(d,(1250,819),'Here L = pi R.',25,MUTED)
        elif si==7:
            for j,(label,sub) in enumerate([('1. Change the boundary','a becomes positive'),('2. Reject the constant','its endpoint residual is nonzero'),('3. Select an allowed mode','the lowest eigenvalue is positive')]):
                if p>j*.24:
                    y=240+j*184;text(d,(1250,y),label,30,TEAL if j==2 else INK,True);text(d,(1250,y+57),sub,25,MUTED)
                    if j<2:arrow(d,(1530,y+109),(1530,y+151),ORANGE,4)
            if p>.74:text(d,(1250,831),'A result for this interval problem.',24,MUTED)
    else:
        # These images are actual screenshots of the source application.
        v=ease((p-.14)/.7);idx=min(40,round(40*v));a=idx/10;x=root(a)
        d.rounded_rectangle((70,208,1190,889),radius=20,fill='white',outline='#d4dcd5',width=2)
        fit(im,curve_cache[idx],(90,265,1080,540))
        text(d,(108,224),'ACTUAL LABORATORY OUTPUT',23,TEAL,True)
        text(d,(108,833),'Boundary strength changes; Wilson angle is held at zero.',25,MUTED)
        text(d,(1250,220),'ACTUAL INPUT',24,TEAL,True)
        fit(im,control_cache[idx],(1250,275,540,180))
        d.rounded_rectangle((1241,266,1800,460),radius=14,outline=ORANGE,width=5)
        text(d,(1250,516),f'Boundary strength a = {a:.1f}',28,ORANGE,True)
        text(d,(1250,604),'Predicted intercept at theta = 0',26,MUTED)
        eq(im,(1250,662),rf'kR={x/np.pi:.4f}',40,BLUE)
        text(d,(1250,794),'The plot and the derivation agree.',25,TEAL,True)
    caption=next((s for start,end,s in captions if start<=elapsed<end),'')
    lines=textwrap.wrap(caption,88)
    for j,line in enumerate(lines[:2]):
        width=d.textlength(line,font=font(32));text(d,((W-width)/2,961+j*43),line,32,'#ffffff')
    return im

def frame(si,p,elapsed,caps):return draw_frame(si,p,elapsed,None,caps)
