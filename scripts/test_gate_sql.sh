#!/bin/sh
# Runs supabase/migrations/0027_launch_gate.sql (twice) and supabase/tests/launch_gate.sql on a throwaway local Postgres (example data only).
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); BIN=${PGBIN:-/usr/lib/postgresql/16/bin}; D=$(mktemp -d); PORT=${PGPORT_TEST:-55433}
chmod 777 "$D"; RUN() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else sh -c "$*"; fi; }
RUN "$BIN/initdb -D $D/db -U postgres -A trust >/dev/null"
RUN "$BIN/pg_ctl -D $D/db -o '-p $PORT -k $D' -l $D/log start >/dev/null"
trap 'RUN "$BIN/pg_ctl -D $D/db stop -m fast >/dev/null"; rm -rf "$D"' EXIT
P="psql -h $D -p $PORT -U postgres -q -v ON_ERROR_STOP=1"
RUN "$P -c \"create role anon; create role authenticated; create schema auth; create table auth.users (id uuid primary key);
  create table public.config (key text primary key, value jsonb not null default '{}'::jsonb, updated_at timestamptz default now());
  create table public.trips (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));
  create table public.trip_status (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));\""
RUN "$P -f $ROOT/supabase/migrations/0027_launch_gate.sql" >/dev/null
RUN "$P -f $ROOT/supabase/migrations/0027_launch_gate.sql" >/dev/null   # safe to run twice
RUN "$P -f $ROOT/supabase/tests/launch_gate.sql"
