#!/bin/sh

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Start the Next.js server
echo "Starting server..."
exec node server.js
