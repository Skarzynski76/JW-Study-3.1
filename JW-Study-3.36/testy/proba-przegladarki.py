from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
root = Path(__file__).resolve().parent.parent
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/lib/') or self.path in ['/jszip.min.js','/sql-wasm.js','/sql-wasm.wasm']:
            self.send_error(404, 'Deliberately missing libraries'); return
        if self.path == '/test-browser.html':
            text = (root/'index.html').read_text()
            pos = text.rfind('</body>')
            data = (text[:pos] + (root/'testy/browser-scenario.html').read_text() + text[pos:]).encode()
            self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.end_headers(); self.wfile.write(data); return
        super().do_GET()
print('Otwórz http://127.0.0.1:8766/test-browser.html — TEST IMPORT')
ThreadingHTTPServer(('127.0.0.1',8766),partial(Handler,directory=str(root))).serve_forever()
