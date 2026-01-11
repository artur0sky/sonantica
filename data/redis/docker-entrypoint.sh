#!/bin/sh
set -e

# Set defaults if not provided
export REDIS_PORT=${REDIS_PORT:-6379}
export REDIS_PASSWORD=${REDIS_PASSWORD:-sonantica}
export REDIS_MAX_MEMORY=${REDIS_MAX_MEMORY:-512mb}
export REDIS_MAX_MEMORY_POLICY=${REDIS_MAX_MEMORY_POLICY:-volatile-lru}

# Generate the real config file from the template
echo "Generating Redis configuration from template..."
envsubst < /usr/local/etc/redis/redis.conf.template > /usr/local/etc/redis/redis.conf

# Execute the original command
exec "$@"
