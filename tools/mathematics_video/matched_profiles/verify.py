"""Check pinned scientific inputs, shipped media identity and frame-aligned chapter/caption maps."""
from pathlib import Path
import hashlib,json,re
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[2]
MEDIA=ROOT/'media/video/2026-10-17-mathematics-profiles'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((MEDIA/'render-manifest.json').read_text(encoding='utf-8'))
data=json.loads((MEDIA/'inputs.json').read_text());source=ROOT/data['source']
assert sha(source)==data['sourceSha256']
limits=json.loads(source.read_text(encoding='utf-8').split('export const XS_LIMITS=',1)[1].strip().removesuffix(';'))
assert data['atlas']==limits['atlas_tt'] and data['cms']==limits['cms_dijet']
assert len(data['atlas']['mass_TeV'])==len(data['atlas']['observed_pb'])==10
assert len(data['cms']['mass_GeV'])==len(data['cms']['observed_narrow_pb'])==70
for name,digest in manifest['sources'].items():assert sha(ROOT/name)==digest,name
def sec(s):h,m,s=map(float,s.split(':'));return h*3600+m*60+s
for report in manifest['reports']:
    lang=report['language'];chapters=json.loads((MEDIA/f'chapters-{lang}.json').read_text(encoding='utf-8'))
    assert sha(MEDIA/f'ghu-mathematics-{lang}.mp4')==report['sha256']
    assert sha(ROOT/f'media/video/2026-10-14-mathematics-hypotheses/ghu-mathematics-{lang}.mp4')==report['originalVideoSha256']
    assert len(chapters)==len({c['id'] for c in chapters})==46
    assert chapters[0]['start']==0 and chapters[-1]['end']==report['seconds']
    assert all(c['end']>c['start'] and abs(round(c['end']*24)-c['end']*24)<1e-8 for c in chapters)
    assert all(a['end']==b['start'] for a,b in zip(chapters,chapters[1:]))
    assert report['frames']==round(report['seconds']*24)
    vtt=(MEDIA/f'captions-{lang}.vtt').read_text(encoding='utf-8')
    cues=[(sec(a),sec(b)) for a,b in re.findall(r'(\d\d:\d\d:\d\d\.\d{3}) --> (\d\d:\d\d:\d\d\.\d{3})',vtt)]
    assert len(cues)==report['captionCues'] and all(0<=a<b<=report['seconds']+.001 for a,b in cues)
    assert all(a[1]<=b[0]+.001 for a,b in zip(cues,cues[1:])),lang
    assert all(any(c['start']<=a<c['end'] for a,b in cues) for c in chapters)
assert data['hypothesis']==json.loads((ROOT/'data/hypothesis_comparison/visual_data.json').read_text())
assert data['ttbar']==json.loads((ROOT/'src/modules/tt_cms_reference.mjs').read_text().split('export const TT_CMS=',1)[1].strip().removesuffix(';'))['abs']
print('Verified: two 46-chapter films; all source/media hashes; continuous frame clock; caption bounds; all 80 plotted ATLAS/CMS limits match the maintained data exactly.')

for name,digest in data['matchedSourceHashes'].items():assert sha(ROOT/name)==digest,name
ref=json.loads((ROOT/'src/modules/matched_profiles_reference.mjs').read_text(encoding='utf-8').split('=',1)[1].strip().removesuffix(';'))
assert data['matchedProfiles']==ref
assert len(ref)==2 and all(float(r['comparison']['difference_a_minus_b'][0])>0 for r in ref)
for lang in ['en','es']:
    old=json.loads((ROOT/f'media/video/2026-10-14-mathematics-hypotheses/chapters-{lang}.json').read_text(encoding='utf-8'))
    new=json.loads((MEDIA/f'chapters-{lang}.json').read_text(encoding='utf-8'))
    assert new[:43]==old
    assert [c['id'] for c in new[43:]]==['m1','m2','m3']
print('Matched-profile inputs equal the admitted certificates; both previous 43-chapter sequences retained.')
