-- =============================================================================
-- Nexus API Manager — PostgreSQL init script
-- Runs automatically on first container start (empty data volume).
-- At this point the database and owner user are already created by the
-- POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB env vars.
-- =============================================================================

-- Usuario dedicado para Keycloak
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'apiportal_user') THEN
    CREATE ROLE apiportal_user
      LOGIN
      PASSWORD 'welcome1'   -- sobreescribe con KC_DB_PASSWORD en producción
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE;
  END IF;
END
$$;

-- Base de datos propia de Keycloak
CREATE DATABASE apiportal
  OWNER       apiportal_user
  ENCODING    'UTF8'
  LC_COLLATE  'en_US.utf8'
  LC_CTYPE    'en_US.utf8'
  TEMPLATE    template0;

COMMENT ON DATABASE apiportal IS 'Base de datos exclusiva de API Portal (Identity Provider)';


\connect apiportal;

-- Enable pgcrypto (provides gen_random_uuid() on PG < 13 and crypt helpers)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure the owner has full rights on the public schema
-- (Postgres 15+ revokes PUBLIC grants by default, so we re-grant explicitly)
GRANT ALL ON SCHEMA public TO apiportal_user;
ALTER DEFAULT PRIVILEGES FOR ROLE apiportal_user IN SCHEMA public
  GRANT ALL ON TABLES TO apiportal_user;
ALTER DEFAULT PRIVILEGES FOR ROLE apiportal_user IN SCHEMA public
  GRANT ALL ON SEQUENCES TO apiportal_user;
ALTER USER apiportal_user WITH CREATEDB;