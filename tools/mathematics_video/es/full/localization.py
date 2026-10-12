from pathlib import Path
import json
LABELS=json.loads((Path(__file__).parent/'labels.json').read_text(encoding='utf-8'))
ORDER=sorted(LABELS,key=len,reverse=True)
def translate(s):
    if s in LABELS:return LABELS[s]
    for key in ORDER:
        if key in s:s=s.replace(key,LABELS[key])
    return s
