"""Build the bilingual tutorial from the same verified media and chapter records it ships."""
import base64,hashlib,html,json,pathlib,shutil

def render(root,out,archive=False):
    base=root/'media/video'
    revision=json.loads((base/'current.json').read_text(encoding='utf-8'))['directory']
    if pathlib.PurePosixPath(revision).name!=revision or revision in ('.','..'):raise ValueError('Invalid video revision')
    # Original media remain at their original paths. New assets have a dated directory.
    for folder in ([''] if archive else ['',revision]):
        source=base/folder;manifest=json.loads((source/'manifest.json').read_text(encoding='utf-8'))
        dest=out/'video/media'/folder;dest.mkdir(parents=True,exist_ok=True)
        for name,expected in manifest['files'].items():
            src=source/name
            if pathlib.PurePosixPath(name).name!=name:raise ValueError('Video asset must be a basename')
            if hashlib.sha256(src.read_bytes()).hexdigest()!=expected:raise ValueError('Video asset changed: '+name)
            shutil.copyfile(src,dest/name)
    data={}
    for lang in ['en','es']:
        chapters=json.loads((source/f'chapters-{lang}.json').read_text(encoding='utf-8'))
        cues=[]
        def seconds(t):
            h,m,s=map(float,t.split(':'));return h*3600+m*60+s
        for block in (source/f'ghu-lab-{lang}.vtt').read_text(encoding='utf-8').strip().split('\n\n')[1:]:
            timing,*lines=block.splitlines();a,b=timing.split(' --> ');cues.append([seconds(a),seconds(b),'\n'.join(lines)])
        data[lang]={'chapters':chapters,'cues':cues,'poster':'data:image/png;base64,'+base64.b64encode((source/f'poster-{lang}.png').read_bytes()).decode(),'seconds':manifest['versions'][lang]['seconds']}
    template='video-2026-10-07.html' if archive else 'video.html'
    body=(root/'src/site'/template).read_text(encoding='utf-8')
    body=body.replace('__VIDEO_DATA__',json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/'))
    body=body.replace('__VIDEO_POSTER__',data['en']['poster'])
    body=body.replace('__VIDEO_PREFIX__','media/'+revision+'/')
    return body
