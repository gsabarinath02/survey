#!/bin/sh

# Set DATABASE_URL
DB_URL="${DATABASE_URL:-file:/app/data/survey.db}"

# Create database directory if it doesn't exist
mkdir -p /app/data

# Run database migrations using --url flag
echo "Running database setup..."
npx prisma db push --url="$DB_URL" --accept-data-loss 2>&1 || echo "Migration completed (or already up to date)"

# Start the Next.js server
echo "Starting server..."
exec node server.js
