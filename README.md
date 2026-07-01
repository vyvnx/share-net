# share-net

a minimal, dark, terminal-styled file vault for your lan. log in, then browse,
search, preview (pdf and images), download, and upload the files in a shared
folder from any device on the network. safe by default: there is no delete
anywhere, and uploads never overwrite (a name clash becomes "name (1).ext").

stack: a node + express server that exposes a json api and also serves a react
(vite) single-page app. it ships as one docker image, fronted by caddy for tls.

## dev

needs node 20+ and pnpm.

```
pnpm install
cp .env.example .env     # set the login + a session secret (see below)
pnpm dev                 # api on :8000, vite on :5173 (proxies /api)
```

then open http://localhost:5173.

one-port production-style run, plus checks:

```
pnpm start               # builds the web app, serves everything on :8000
pnpm test                # server + web tests
pnpm typecheck
```

set SHARE_USER, SHARE_PASS and SESSION_SECRET in .env (generate the secret with
"openssl rand -hex 32"). these names are case-sensitive.

## deploy (docker + caddy, e.g. proxmox)

on a host with docker installed:

```
cp .env.example .env
# set SHARE_USER, SHARE_PASS, SESSION_SECRET, and
# DATA_DIR=/path/to/files   (folder to expose, must be writable by uid 1000)
docker compose up -d --build
```

caddy fronts the app and terminates tls; the app is not exposed to the host
directly. then browse https://<host-ip>/.

- lan by ip (default): caddy uses its own internal ca, so https works right
  away. browsers warn until you trust caddy's root ca, which you can copy out:

```
docker compose cp caddy:/data/caddy/pki/authorities/local/root.crt ./caddy-root.crt
```

- public domain: set SITE_ADDRESS=vault.example.com and TLS_EMAIL=you@example.com
  in .env for an automatic let's encrypt certificate.

see .env.example for all options.

## ship + maintain (from your dev machine)

same flow as luna: build the image, ship it over ssh, load and run it, keep the
last few versions for rollback. secrets are never shipped - put .env on the
server once. set REMOTE and REMOTE_DIR (see scripts/ headers) to point at your
host.

```
pnpm release             # build, ship, run on the server, prune old versions
pnpm rollback            # list shipped versions on the server
pnpm rollback <sha>      # revert to a previous version (data is untouched)
pnpm backup              # pull caddy ca + certs to ./backups
BACKUP_DATA=1 pnpm backup  # also pull the vault files (can be large)
```

storage: the vault files live in your DATA_DIR host folder, so back them up
where that folder lives (e.g. zfs snapshots). docker-owned state is two named
volumes: caddy_data (tls ca + certs), which `pnpm backup` captures, and
share_state — a small sqlite db (under STATE_DIR, default /state) holding the
book reader's last-read page per file. it's the only app-owned mutable state;
back up the share_state volume to keep resume positions across rebuilds.

