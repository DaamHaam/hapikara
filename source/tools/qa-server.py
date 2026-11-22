"""Local-only capture sink; run from the repository root. Not part of index.html."""
import base64
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path


class Handler(SimpleHTTPRequestHandler):
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
