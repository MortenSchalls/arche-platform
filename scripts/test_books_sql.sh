#!/bin/sh
# Runs supabase/migrations/0023_books.sql, 0024_books_auto.sql and supabase/tests/books.sql on a throwaway local Postgres (example data only).
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd); BIN=${PGBIN:-/usr/lib/postgresql/16/bin}; D=$(mktemp -d); PORT=${PGPORT_TEST:-55432}
chmod 777 "$D"; RUN() { if [ "$(id -u)" = 0 ]; then su postgres -c "$*"; else sh -c "$*"; fi; }
RUN "$BIN/initdb -D $D/db -U postgres -A trust >/dev/null"
RUN "$BIN/pg_ctl -D $D/db -o '-p $PORT -k $D' -l $D/log start >/dev/null"
trap 'RUN "$BIN/pg_ctl -D $D/db stop -m fast >/dev/null"; rm -rf "$D"' EXIT
P="psql -h $D -p $PORT -U postgres -q -v ON_ERROR_STOP=1"
RUN "$P -c \"create role anon; create role authenticated; create schema auth; create table auth.users (id uuid primary key);
  create table public.trip_status (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));
  create table public.payouts (owner_id uuid not null references auth.users(id), id text not null, data jsonb not null, updated_at timestamptz default now(), primary key (owner_id, id));
  create schema storage; create table storage.buckets (id text primary key, name text, public boolean);
  grant usage on schema public to authenticated; grant select on all tables in schema public to authenticated;\""
RUN "$P -f $ROOT/supabase/migrations/0023_books.sql" >/dev/null
RUN "$P -f $ROOT/supabase/migrations/0023_books.sql" >/dev/null   # safe to run twice
RUN "$P -f $ROOT/supabase/migrations/0024_books_auto.sql" >/dev/null
RUN "$P -f $ROOT/supabase/migrations/0024_books_auto.sql" >/dev/null   # safe to run twice
RUN "$P -f $ROOT/supabase/tests/books.sql"
