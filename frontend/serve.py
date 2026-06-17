"""
Server sederhana untuk frontend JogjaCourt.
Jalankan: python serve.py
Akses: http://localhost:3000
"""
import http.server
import socketserver
import os

PORT = 3000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"[Frontend] {self.address_string()} - {format % args}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"✅ Frontend server berjalan di http://localhost:{PORT}")
    print(f"📁 Melayani direktori: {DIRECTORY}")
    print(f"🚀 Buka browser ke: http://localhost:{PORT}/index.html")
    print(f"\nTekan Ctrl+C untuk berhenti.\n")
    httpd.serve_forever()
