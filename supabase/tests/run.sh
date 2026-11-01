#!/usr/bin/env bash
# Applies every migration to a throw-away database and runs platform.test.sql.
#
#   PGHOST=127.0.0.1 PGUSER=postgres PGPASSWORD=postgres supabase/tests/run.sh
#
# Needs a superuser connection (standard PG* env vars). The database
# $TEST_DB (default boltfy_test) is dropped and recreated.
set -euo pipefail
DB="${TEST_DB:-boltfy_test}"
HERE="$(cd "$(dirname "$0")" && pwd)"
psql() { command psql -X -v ON_ERROR_STOP=1 -q "$@"; }

psql -d postgres -c "DROP DATABASE IF EXISTS ${DB}" -c "CREATE DATABASE ${DB}"
psql -d "$DB" -f "$HERE/00_supabase_stub.sql"
for f in $(ls "$HERE"/../migrations/*.sql | sort); do
  echo ">> migration $(basename "$f")"
  psql -d "$DB" -f "$f" 2>&1 | grep -v '^NOTICE' || true
  [ "${PIPESTATUS[0]}" -eq 0 ] || { echo "migration failed: $f"; exit 1; }
done
echo ">> running platform.test.sql"
psql -d "$DB" -f "$HERE/platform.test.sql" 2>&1 | grep -E '^(psql:|ERROR|FAIL|.*NOTICE:  (ok|FAIL))' | sed 's/^psql:[^ ]* //; s/NOTICE:  //'
test "${PIPESTATUS[0]}" -eq 0
echo "== all database tests passed =="
