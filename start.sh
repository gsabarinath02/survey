#!/bin/sh

# Run Prisma db push to create tables if they don't exist
echo "Running database migrations..."
npx prisma db push --accept-data-loss

# Start the Next.js server
echo "Starting server..."
exec node server.js
