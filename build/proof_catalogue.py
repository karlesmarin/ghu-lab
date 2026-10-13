"""Publish the complete maintained proof tree and associated data with a checked download."""
from pathlib import Path
import hashlib,html,json,re,shutil,zipfile

def build(root,out):
 root=Path(root);out=Path(out)
 # These are already public source directories. Never scan private research roots.
 files=sorted(p for directory in ('proof','data') for p in (root/directory).rglob('*')
              if p.is_file() and '__pycache__' not in p.parts
              and p not in {root/'proof/manifest.json',root/'proof/replay.json'})
 files += [root/'src/kernel/charges.mjs']
 for p in sorted((root/'src/modules').glob('*.mjs')):files.append(p)
 for p in [root/'_test_quantization.mjs',root/'lean-toolchain',root/'proof/replay.json']:
  if p.exists():files.append(p)
 files=sorted(set(files))
 rows=[dict(path=p.relative_to(root).as_posix(),bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest()) for p in files]
 lean=[dict(path=r['path'],theorems=len(re.findall(r'^theorem\s+', (root/r['path']).read_text(encoding='utf-8'),re.M))) for r in rows if r['path'].endswith('.lean')]
 assert len(lean)==4 and sum(x['theorems'] for x in lean)==49,lean
 manifest=dict(schema='ghu-proof-bundle-v1',date='2026-10-13',scope='Integrity and scoped verification; no full-model consistency or novelty claim',lean=lean,files=rows)
 manifest_path=root/'proof/manifest.json';manifest_path.write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
 paths=files+[manifest_path]
 for p in paths:
  target=out/p.relative_to(root);target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)
 archive=out/'proof/certificates.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for p in paths:
   info=zipfile.ZipInfo(p.relative_to(root).as_posix(),(2026,10,13,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,p.read_bytes())
 digest=hashlib.sha256(archive.read_bytes()).hexdigest()
 (out/'proof/certificates.zip.sha256').write_text(digest+'  certificates.zip\n')
 with zipfile.ZipFile(archive) as z:
  assert z.testzip() is None
  for row in rows:assert hashlib.sha256(z.read(row['path'])).hexdigest()==row['sha256']
 body='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Exact quantization criteria, four Lean formalizations, replayable certificates and clearly stated physical assumptions in GHU Lab."><title>Certificates and Lean sources — GHU Lab</title><link rel="canonical" href="https://karlesmarin.github.io/ghu-explorer/proof/index.html"><style>body{font:17px/1.6 system-ui;color:#203340;background:#f7f9fa;max-width:1120px;margin:40px auto;padding:0 20px}a{color:#176586}table{border-collapse:collapse;width:100%}td,th{padding:8px;border-bottom:1px solid #ccd5da;text-align:left;overflow-wrap:anywhere}code{overflow-wrap:anywhere}pre{overflow:auto;background:white;padding:18px}.note{border-left:4px solid #bd873c;padding:14px;background:#fff}details{margin:20px 0}</style></head><body><a href="../index.html">GHU Lab</a> · <a href="../app/index.html#s=quantization">Quantization tool / Cuantización</a><h1>Certificates and Lean sources</h1><p>Four Lean files, 49 theorem declarations. Formal arithmetic, numerical checks and physical assumptions have separate scopes.</p><p lang="es">Cuatro archivos Lean, 49 declaraciones de teoremas. La aritmética formal, las comprobaciones numéricas y las hipótesis físicas tienen alcances distintos.</p><p class="note">Full anomaly cancellation and admissible orbifold backgrounds remain open. The lift audit is exact computation, not Lean. Passing a file-integrity check does not replay its mathematical proof.</p><p><a href="certificates.zip">Download complete evidence bundle / Descargar evidencia</a> · <a href="manifest.json">SHA-256 manifest</a> · <a href="certificates.zip.sha256">Archive hash</a> · <a href="replay.json">Verification receipt</a></p>'''
 body+='''<h2>What measured data can establish / Qué aportan los datos medidos</h2><p>Measurements can support a physical model that meets a theorem's assumptions and predicts observables. This quantization module supplies no prediction of masses or production rates, so experimental agreement is not checked here. The existing <a href="../guide/kkgluon/index.html">ATLAS/CMS comparison</a> uses published resonance limits; being below a limit does not establish a new-particle signal. A physical map from these quantized coefficients to those observables remains to be established.</p><p lang="es">Las medidas pueden respaldar un modelo físico que cumpla las hipótesis de un teorema y prediga observables. Este módulo de cuantización no predice masas ni tasas de producción: aquí no se ha comprobado acuerdo experimental. La <a href="../guide/es/kkgluon/index.html">comparación existente con ATLAS/CMS</a> usa límites publicados de resonancias; estar por debajo de un límite no establece una señal de nuevas partículas. Sigue pendiente conectar físicamente estos coeficientes cuantizados con esos observables.</p>'''
 body+='''<p><a href="../video/mathematics/bridge.html">How certificates, the module and physics fit together</a> · <a href="../video/mathematics/bridge-es.html" lang="es">Cómo encajan certificados, módulo y física</a>. <a href="../video/mathematics/index.html#q8">Watch the animated explanation</a> · <a href="../video/mathematics/index-es.html#q8" lang="es">Ver la explicación animada</a>.</p>'''
 body+='<p>Archive SHA-256: <code>'+digest+'</code></p><table><tr><th>Lean source</th><th>Theorems</th></tr>'
 body+=''.join('<tr><td><a href="../'+r['path']+'">'+r['path']+'</a></td><td>'+str(r['theorems'])+'</td></tr>' for r in lean)+'</table>'
 body+='''<h2>Reproduce</h2><p>Use Lean 4.27.0 and Python 3. For the numerical audits install their documented dependencies; Sage 10.9 is used by the Sage scripts. Run from the extracted bundle root:</p><pre>python proof/verify_bundle.py
lean proof/su7/SU7Certificates.lean
python proof/quantization/verify_lean.py --check
python proof/quantization/verify_spin.py --check
python proof/u2/verify_lean.py --check
node proof/quantization/test_lab.mjs --check
node proof/quantization/test_spin.mjs --check
python proof/lifts/background_lift_checks.py --check
python proof/boundary-research/certify.py --check</pre><p>The universal theorems assume the characteristic-class dictionary externally. Closed spin-four periods use Wu parity externally. U(2) integrality does not construct a supergravity spectrum. The 26 SU(7) theorems certify finite weight/seed algebra; the infinite Fourier interval calculation is a separate certificate.</p><p><a href="quantization/README.md">Quantization scope and Sage replay</a> · <a href="u2/README.md">U(2) scope</a> · <a href="lifts/README.md">Clifford audit</a> · <a href="boundary-research/README.md">Boundary certificates</a></p><details><summary>All included files and SHA-256 digests</summary><table><tr><th>File</th><th>SHA-256</th></tr>'''
 body+=''.join('<tr><td><a href="../'+html.escape(r['path'])+'">'+html.escape(r['path'])+'</a></td><td><code>'+r['sha256']+'</code></td></tr>' for r in rows)
 body+='</table></details></body></html>'
 (out/'proof/index.html').write_text(body,encoding='utf-8')
 return [p.relative_to(root).as_posix() for p in paths]+['proof/index.html','proof/certificates.zip','proof/certificates.zip.sha256']
