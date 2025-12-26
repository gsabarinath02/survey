#!/bin/sh

# Run Prisma migrations/db push (creates tables if not exist)
echo "Running database migrations..."
npx prisma db push --skip-generate

# Start the Next.js server
echo "Starting server..."
exec node server.js
