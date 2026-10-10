"""Copy a verified video recording into media/video/<revision>/ with its hash manifest, and select it as current.
    python tools/video_guide/publish_revision.py <recording-dir>
Refuses unless <recording-dir>/verification.json passed for the storyboard and app now in the tree, and the movies
still match the hashes the verifier recorded. The previous revision stays where it is (the site keeps serving it as
a frozen page)."""
import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


rec = Path(sys.argv[1]).resolve()
plan = json.loads((ROOT / 'tools/video_guide/storyboard.json').read_text(encoding='utf-8'))
ver = json.loads((rec / 'verification.json').read_text(encoding='utf-8'))
if not ver.get('passed'):
    raise SystemExit('verification did not pass')
if ver['storyboardSha256'] != sha(ROOT / 'tools/video_guide/storyboard.json'):
    raise SystemExit('the storyboard changed after verification')
if ver['sourceAppSha256'] != sha(ROOT / 'app/index.html'):
    raise SystemExit('app/index.html changed after the capture')
revision = plan['revision']
dest = ROOT / 'media/video' / revision
if dest.exists():
    raise SystemExit(f'{dest} exists; a revision is never overwritten')
dest.mkdir(parents=True)
pub = rec / 'published'
files = {}
versions = {}
for lang in ('en', 'es'):
    r = json.loads((pub / f'render-{lang}.json').read_text(encoding='utf-8'))
    if sha(pub / f'ghu-lab-{lang}.mp4') != ver['versions'][lang]['sha256']:
        raise SystemExit(f'{lang} movie differs from the verified one')
    versions[lang] = {'seconds': r['seconds'], 'voice': r['voice'], 'syntheticNarration': r['syntheticNarration'],
                      'chapters': r['chapters'], 'width': r['width'], 'height': r['height'], 'fps': r['fps'],
                      'bytes': r['bytes'], 'sha256': r['sha256'], 'scenes': len(r['scenes'])}
    for name in (f'ghu-lab-{lang}.mp4', f'ghu-lab-{lang}.vtt', f'chapters-{lang}.json', f'transcript-{lang}.txt', f'poster-{lang}.png'):
        shutil.copyfile(pub / name, dest / name)
        files[name] = sha(dest / name)
shutil.copyfile(rec / 'verification.json', dest / 'verification.json')
files['verification.json'] = sha(dest / 'verification.json')
manifest = {'schema': 'ghu-video-media-v1', 'date': plan['date'], 'revision': revision, 'revisionOf': plan['revisionOf'],
            'versions': versions, 'files': files}
(dest / 'manifest.json').write_bytes((json.dumps(manifest, indent=2, ensure_ascii=False) + '\n').encode('utf-8'))
(ROOT / 'media/video/current.json').write_bytes((json.dumps({'directory': revision}, indent=2) + '\n').encode('utf-8'))
print('published', revision, {k: v['chapters'] for k, v in versions.items()}, len(files), 'files')
