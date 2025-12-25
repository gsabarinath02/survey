#!/bin/sh

# Set DATABASE_URL if not set
export DATABASE_URL="${DATABASE_URL:-file:/app/data/survey.db}"

# Run database migrations/sync
echo "Running database setup..."
npx prisma db push --skip-generate

# Start the Next.js server
echo "Starting server..."
exec node server.js
