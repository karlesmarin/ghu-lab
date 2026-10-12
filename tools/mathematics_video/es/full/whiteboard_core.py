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
W,H,FPS=1920,1080,24
INK='#173441';TEAL='#007f82';ORANGE='#ca681a';RED='#c3374d';MUTED='#58727a';BG='#f6f3e9';BLUE='#176daf'
@lru_cache(None)
def font(size,bold=False):return ImageFont.truetype(str(Path(os.environ.get('GHU_VIDEO_FONT_DIR',str(Path(os.environ.get('WINDIR','.'))/'Fonts')))/('segoeuib.ttf' if bold else 'segoeui.ttf')),size)
@lru_cache(None)
def equation(s,size=30,color=INK):
    for short,long in [('frac12','frac{1}{2}'),('frac13','frac{1}{3}'),('frac14','frac{1}{4}'),('frac1{12}','frac{1}{12}')]:
        s=s.replace(chr(92)+short,chr(92)+long)
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
