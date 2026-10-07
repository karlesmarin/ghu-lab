"""Local-only bridge: accepts bounded numerical scenarios, never commands/paths."""
from http.server import HTTPServer,BaseHTTPRequestHandler
from pathlib import Path
import json,tempfile,traceback,os
from higgstools_run import run as higgs_run
from thermal_run import run as thermal_run
ALLOWED={'null','https://karlesmarin.github.io','http://127.0.0.1:8000','http://localhost:8000'}
class Handler(BaseHTTPRequestHandler):
    def origin(self):return self.headers.get('Origin','null')
    def json_headers(self,status):
        self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Access-Control-Allow-Origin',self.origin());self.send_header('Vary','Origin');self.send_header('Access-Control-Allow-Private-Network','true');self.end_headers()
    def do_OPTIONS(self):
        if self.origin() not in ALLOWED:self.send_error(403);return
        self.send_response(204);self.send_header('Access-Control-Allow-Origin',self.origin());self.send_header('Access-Control-Allow-Methods','POST, OPTIONS');self.send_header('Access-Control-Allow-Headers','Content-Type');self.send_header('Access-Control-Allow-Private-Network','true');self.end_headers()
    def do_POST(self):
        if self.origin() not in ALLOWED or self.path!='/calculate':self.send_error(403);return
        try:
            length=int(self.headers.get('Content-Length',0))
            if not 0<length<10000:raise ValueError('Request size outside allowed range')
            data=json.loads(self.rfile.read(length));p=data['parameters']
            if not isinstance(p,dict):raise ValueError('Numeric parameters required')
            with tempfile.TemporaryDirectory() as tmp:
                out=Path(tmp)/'result.json'
                if data['experiment']=='thermal':thermal_run(p,out)
                elif data['experiment']=='higgstools':higgs_run(p,out,os.environ.get('GHU_HB','/datasets/hb'),os.environ.get('GHU_HS','/datasets/hs'))
                else:raise ValueError('Unknown experiment')
                body=out.read_bytes()
            self.json_headers(200);self.wfile.write(body)
        except Exception as e:
            self.json_headers(400);self.wfile.write(json.dumps({'error':str(e)}).encode())
if __name__=='__main__':
    print('GHU scientific engine on port 8790',flush=True)
    HTTPServer(('0.0.0.0',8790),Handler).serve_forever()
