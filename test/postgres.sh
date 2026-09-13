#!/usr/bin/env bash
# Start/stop this project's isolated PostgreSQL cluster. Requires the unpacked Ubuntu packages.
# Database files and generated connection credentials stay in ignored .local/postgres/.
set -euo pipefail
project_root="$(cd "$(dirname "$0")/.." && pwd)"
pg_root="$project_root/.local/postgres"
pg_bin="$pg_root/runtime/usr/lib/postgresql/16/bin"
export LD_LIBRARY_PATH="$pg_root/runtime/usr/lib/x86_64-linux-gnu${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
if [ ! -x "$pg_bin/postgres" ]; then
  echo 'Install the project-local PostgreSQL packages using test/README.md first.' >&2
  exit 1
fi
case "${1:-start}" in
  start)
    if [ ! -f "$pg_root/data/PG_VERSION" ]; then
      umask 077
      python3 - "$pg_root" <<'PY'
import secrets,sys
from pathlib import Path
p=Path(sys.argv[1]); (p/'password').write_text(secrets.token_hex(24))
PY
      "$pg_bin/initdb" -D "$pg_root/data" -U listing_local --pwfile="$pg_root/password" --auth=scram-sha-256 --locale=C.UTF-8
      cat >> "$pg_root/data/postgresql.conf" <<EOF
listen_addresses = '127.0.0.1'
port = 5433
unix_socket_directories = '$pg_root'
jit = off
EOF
    fi
    if ! "$pg_bin/pg_ctl" -D "$pg_root/data" status >/dev/null 2>&1; then
      "$pg_bin/pg_ctl" -D "$pg_root/data" -l "$pg_root/server.log" start
    fi
    export PGPASSWORD="$(cat "$pg_root/password")"
    if ! "$pg_bin/psql" -h 127.0.0.1 -p 5433 -U listing_local -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='listing_agent_local'" | grep -q 1; then
      "$pg_bin/createdb" -h 127.0.0.1 -p 5433 -U listing_local listing_agent_local
    fi
    python3 - "$project_root" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); password=(p/'.local/postgres/password').read_text().strip()
env=p/'frontend/.env.local'; text=env.read_text() if env.exists() else ''
values={'DATABASE_URL': f'postgresql://listing_local:{password}@127.0.0.1:5433/listing_agent_local', 'APP_ORIGIN':'http://localhost:3000'}
lines=[line for line in text.splitlines() if line.partition('=')[0] not in values]
env.write_text('\n'.join(lines+[f'{k}={v}' for k,v in values.items()])+'\n'); env.chmod(0o600)
print('Local PostgreSQL ready at 127.0.0.1:5433; private frontend/.env.local configured.')
PY
    ;;
  stop) "$pg_bin/pg_ctl" -D "$pg_root/data" stop -m fast ;;
  status) "$pg_bin/pg_ctl" -D "$pg_root/data" status ;;
  *) echo 'Usage: bash test/postgres.sh start|stop|status'; exit 1 ;;
esac
