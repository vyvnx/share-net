#!/usr/bin/env python3
"""Share a folder read-only over the local network.

Usage:
    python3 share.py                 # serve ./ on port 8000
    python3 share.py -p 9000         # custom port
    python3 share.py -d ./books      # serve a specific folder

Browse/download only — no uploads, no deletes (uses the stdlib's
read-only GET/HEAD handler). Stop with Ctrl+C.
"""
import argparse
import base64
import http.server
import os
import socket

# credentials. change the password before sharing.
# you can also override at runtime: SHARE_USER=... SHARE_PASS=... python3 share.py
USERNAME = os.environ.get("SHARE_USER", "yvnx")
PASSWORD = os.environ.get("SHARE_PASS", "vini2")  # <-- placeholder, replace this


class AuthHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Read-only file handler gated behind HTTP Basic Auth."""

    _expected = "Basic " + base64.b64encode(f"{USERNAME}:{PASSWORD}".encode()).decode()

    def _authenticated(self):
        if self.headers.get("Authorization") == self._expected:
            return True
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="share-net"')
        self.send_header("Content-Length", "0")
        self.end_headers()
        return False

    def do_GET(self):
        if self._authenticated():
            super().do_GET()

    def do_HEAD(self):
        if self._authenticated():
            super().do_HEAD()


def local_ips():
    """Best-effort list of this machine's LAN IPv4 addresses."""
    ips = set()
    try:
        # the address used to reach the internet — usually the real lan ip.
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except socket.gaierror:
        pass
    return sorted(ip for ip in ips if not ip.startswith("127."))


def main():
    parser = argparse.ArgumentParser(description="Share a folder read-only over the LAN.")
    parser.add_argument("-d", "--dir", default=".", help="Folder to share (default: current dir)")
    parser.add_argument("-p", "--port", type=int, default=8000, help="Port (default: 8000)")
    parser.add_argument("-b", "--bind", default="0.0.0.0",
                        help="Address to bind (default: 0.0.0.0 = all interfaces)")
    args = parser.parse_args()

    directory = os.path.abspath(args.dir)
    if not os.path.isdir(directory):
        parser.error(f"Not a directory: {directory}")

    handler = lambda *a, **k: AuthHTTPRequestHandler(*a, directory=directory, **k)
    httpd = http.server.ThreadingHTTPServer((args.bind, args.port), handler)

    print(f"Sharing: {directory}")
    print(f"Login:   user '{USERNAME}'" +
          ("  [WARNING: password is still the placeholder — change it!]"
           if PASSWORD == "CHANGE_ME" else ""))
    print("Open one of these on another device on the same wifi:")
    for ip in local_ips() or ["<this-machine-ip>"]:
        print(f"    http://{ip}:{args.port}")
    print("\n(If you're on WSL2 with NAT, use the Windows host IP instead — e.g. http://192.168.15.5:%d)" % args.port)
    print("Press Ctrl+C to stop.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
