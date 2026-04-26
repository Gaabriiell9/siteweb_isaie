#!/bin/bash
# ============================================================
#  Initialisation des mots de passe des rôles Supabase
#  Exécuté automatiquement au premier démarrage (données vides)
#  via /docker-entrypoint-initdb.d/
#
#  L'image supabase/postgres crée ces rôles sans mot de passe.
#  Ce script les aligne sur POSTGRES_PASSWORD.
# ============================================================
set -e

export PGPASSWORD="$POSTGRES_PASSWORD"

psql -v ON_ERROR_STOP=1 -U "supabase_admin" -d "postgres" <<-EOSQL
    ALTER USER supabase_auth_admin        WITH PASSWORD '$POSTGRES_PASSWORD';
    ALTER USER supabase_storage_admin     WITH PASSWORD '$POSTGRES_PASSWORD';
    ALTER USER authenticator              WITH PASSWORD '$POSTGRES_PASSWORD';
    ALTER USER supabase_replication_admin WITH PASSWORD '$POSTGRES_PASSWORD';
    ALTER USER supabase_read_only_user    WITH PASSWORD '$POSTGRES_PASSWORD';
EOSQL

echo "✓ Mots de passe des rôles Supabase initialisés."

# Schéma requis par le service Realtime
psql -v ON_ERROR_STOP=1 -U "supabase_admin" -d "postgres" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS _realtime;
    GRANT ALL ON SCHEMA _realtime TO supabase_admin;
    GRANT ALL ON SCHEMA _realtime TO postgres;
EOSQL

echo "✓ Schéma _realtime créé."
