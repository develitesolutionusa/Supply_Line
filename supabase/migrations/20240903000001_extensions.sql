-- Enable search and UUID helpers required by the catalog and identity tables.
create extension if not exists "pg_trgm";
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
