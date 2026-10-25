"""
Simple static file server for the RADIX frontend.
Serves files from the frontend/ directory on 127.0.0.1,
and routes /data/ requests to the project data/ directory.
Usage:
    uv run python serve_frontend.py
    uv run python serve_frontend.py --port 3000
"""
import argparse
import http.server
import os
import socketserver
import sys

DEFAULT_PORT = 5173
HOST = "127.0.0.1"
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
DATA_DIR = os.path.join(PROJECT_ROOT, "data")


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        clean_path = self.path.split('?', 1)[0].split('#', 1)[0]
        # Self-heal stale browser caches that still have Vite's index.html requesting /src/main.jsx
        if clean_path in ('/src/main.jsx', '/src/main.tsx', '/src/App.jsx'):
            content = (
                b'console.warn("Stale Vite cache detected - auto-reloading fresh RADIX dashboard...");'
                b'window.location.href = window.location.origin + "/index.html?v=" + Date.now();'
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return
        super().do_GET()

    def translate_path(self, path):
        # Clean query parameters / fragments
        clean_path = path.split('?', 1)[0].split('#', 1)[0]
        if clean_path.startswith('/data/'):
            rel = os.path.relpath(clean_path, '/data')
            return os.path.join(DATA_DIR, rel)
        return os.path.join(FRONTEND_DIR, clean_path.lstrip('/'))

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):  # noqa: A002
        try:
            print(f"  {self.address_string()} {format % args}", flush=True)
        except Exception:
            pass


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def start_server(preferred_port: int):
    ports_to_try = [preferred_port, 5174, 5175, 3000, 8080, 8088]
    seen = set()
    ports_to_try = [p for p in ports_to_try if not (p in seen or seen.add(p))]

    server = None
    active_port = None

    for port in ports_to_try:
        try:
            server = ReusableTCPServer((HOST, port), Handler)
            active_port = port
            break
        except (OSError, PermissionError) as err:
            print(f"  [Notice] Port {port} not available ({err}). Trying next port...", flush=True)

    if server is None or active_port is None:
        print("\n  [Error] Could not bind to any test port (5173, 5174, 3000, 8080).", flush=True)
        print("  You can open 'frontend/index.html' directly in your browser.", flush=True)
        return

    print("\n==========================================", flush=True)
    print("  RADIX Frontend Dashboard is running!", flush=True)
    print(f"  Open in browser: http://{HOST}:{active_port}", flush=True)
    print(f"  Serving files from: {FRONTEND_DIR}", flush=True)
    print("==========================================\n", flush=True)
    print("  Press Ctrl+C to stop.\n", flush=True)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Serve RADIX frontend")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to listen on (default: 5173)")
    args = parser.parse_args()

    start_server(args.port)
