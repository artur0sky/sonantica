#!/bin/bash
# Analytics Migration Script
# Automatically runs database migrations on service startup

set -e

echo "🔍 Checking database connection..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$PSQL_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c '\q' 2>/dev/null; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ Database connection established"

# Run analytics schema migration
echo "📊 Running analytics schema migration..."

PGPASSWORD=$PSQL_PASSWORD psql -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -f /app/analytics/migrations/001_initial_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Analytics schema migration completed successfully"
else
    echo "❌ Analytics schema migration failed"
    exit 1
fi

echo "🎵 Starting Sonántica Analytics Service..."
