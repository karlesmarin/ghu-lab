from pathlib import Path
import json,math
from PIL import Image
root=Path(__file__).resolve().parent/'lab'
for row in json.loads((root/'crops.json').read_text()):
    r=row['box'];s=row['scale'];im=Image.open(root/(row['name']+'-viewport.png'))
    box=(math.floor(r['x']*s),math.floor(r['y']*s),math.ceil((r['x']+r['width'])*s),math.ceil((r['y']+r['height'])*s))
    assert 0<=box[0]<box[2]<=im.width and 0<=box[1]<box[3]<=im.height,(row['name'],box,im.size)
    im.crop(box).save(root/(row['name']+'.png'))
print('Cropped 60 actual viewport captures with checked bounds.')
