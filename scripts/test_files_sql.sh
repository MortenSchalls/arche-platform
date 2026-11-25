#!/bin/sh
# Runs supabase/migrations/0028_files_private.sql (twice) and supabase/tests/files_private.sql on a throwaway local Postgres
# with a stand-in for Supabase's storage and auth (example data only).
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); BIN=${PGBIN:-/usr/lib/postgresql/16/bin}; D=$(mktemp -d); PORT=${PGPORT_TEST2:-55434}
chmod 777 "$D"; RUN() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else sh -c "$*"; fi; }
RUN "$BIN/initdb -D $D/db -U postgres -A trust >/dev/null"
RUN "$BIN/pg_ctl -D $D/db -o '-p $PORT -k $D' -l $D/log start >/dev/null"
trap 'RUN "$BIN/pg_ctl -D $D/db stop -m fast >/dev/null"; rm -rf "$D"' EXIT
P="psql -h $D -p $PORT -U postgres -q -v ON_ERROR_STOP=1"
RUN "$P -f $ROOT/supabase/tests/files_private_setup.sql" >/dev/null
RUN "$P -f $ROOT/supabase/migrations/0028_files_private.sql" >/dev/null
RUN "$P -f $ROOT/supabase/migrations/0028_files_private.sql" >/dev/null   # safe to run twice
RUN "$P -f $ROOT/supabase/tests/files_private.sql"
