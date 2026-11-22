"""Local-only capture sink; run from the repository root. Not part of index.html."""
import base64
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] == '/__palm-control.html':
            data = Path('/tmp/hapikara-qa/palm-control.html').read_bytes()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path != '/__qa':
            self.send_error(404)
            return
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        folder = Path('/tmp/hapikara-qa') / data['stage']
        if not data['stage'].replace('-', '').isalnum():
            self.send_error(400)
            return
        folder.mkdir(parents=True, exist_ok=True)
        name = Path(data['name']).name
        if 'image' in data:
            (folder / name).write_bytes(base64.b64decode(data['image'].split(',')[1]))
        else:
            (folder / name).write_text(json.dumps(data['report'], indent=2))
        self.send_response(204)
        self.end_headers()


HTTPServer(('127.0.0.1', 8137), Handler).serve_forever()
