"""GHU local scientific engine. Requires Python 3, Git and Docker Desktop.
Commands: python tools/backend.py setup | serve | stop
Only listens on localhost; setup downloads pinned official repositories.
"""
from pathlib import Path
import subprocess,json,shutil,argparse
ROOT=Path(__file__).resolve().parents[1];TOOLS=ROOT/'tools';LOCAL=ROOT/'.local/scientific-backend'
TAG='ghu-lab-scientific:20261006';NAME='ghu-lab-engine'
def call(args,**kwargs):subprocess.run(args,check=True,**kwargs)
def setup():
    LOCAL.mkdir(parents=True,exist_ok=True)
    versions=json.loads((TOOLS/'backend_versions.json').read_text())
    for name,v in versions.items():
        target=LOCAL/name
        if not (target/'.git').exists():
            call(['git','init',str(target)]);call(['git','remote','add','origin',v['repository']],cwd=target)
            call(['git','fetch','--depth','1','origin',v['commit']],cwd=target);call(['git','checkout','--detach','FETCH_HEAD'],cwd=target)
        actual=subprocess.check_output(['git','rev-parse','HEAD'],cwd=target,text=True).strip()
        if actual!=v['commit']:raise RuntimeError('Wrong pinned checkout: '+name)
        if name in ['hbdataset','hsdataset']:(target/'.ghu-commit').write_text(actual)
    shutil.copytree(TOOLS,LOCAL/'tools',dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__','thermal_bounce'))
    shutil.copyfile(TOOLS/'backend.Dockerfile',LOCAL/'Dockerfile')
    (LOCAL/'.dockerignore').write_text('**/.git\n**/__pycache__\n')
    call(['docker','build','-t',TAG,str(LOCAL)])
def main():
    p=argparse.ArgumentParser();p.add_argument('command',choices=['setup','serve','stop']);a=p.parse_args()
    if a.command=='setup':setup()
    elif a.command=='serve':call(['docker','run','--rm','--name',NAME,'-p','127.0.0.1:8793:8790',TAG])
    else:call(['docker','stop',NAME])
if __name__=='__main__':main()
