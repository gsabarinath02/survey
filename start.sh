#!/bin/sh

# Set database path
DB_PATH="${DATABASE_URL:-file:/app/data/survey.db}"
DB_FILE=$(echo "$DB_PATH" | sed 's|file:||')

# Create database directory
mkdir -p /app/data

# Run SQL initialization
echo "Initializing database at $DB_FILE..."
sqlite3 "$DB_FILE" < /app/init.sql
echo "Database initialized successfully!"

# Start the Next.js server
echo "Starting server..."
exec node server.js
