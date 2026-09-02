#!/usr/bin/env python3
"""A static server for the bench that serves .mjs as JavaScript.

python -m http.server maps .mjs to text/plain, and a browser REFUSES to execute a module whose
MIME type is not a JavaScript one -- silently, as a fetch failure with no console error, which is
why the first look showed two blank canvases and an empty console.  The app itself never meets
this: it is bundled into one HTML at build time.  The bench does, so the bench needs this.
"""
import functools
import http.server
import socketserver
import sys

http.server.SimpleHTTPRequestHandler.extensions_map[".mjs"] = "application/javascript"
http.server.SimpleHTTPRequestHandler.extensions_map[".js"] = "application/javascript"

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8732
root = sys.argv[2] if len(sys.argv) > 2 else r"E:\proyectos\ghu-lab"
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=root)
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", port), handler) as httpd:
    print("serving %s on http://127.0.0.1:%d" % (root, port))
    httpd.serve_forever()
