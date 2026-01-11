FROM redis:7.4.0-alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Create log directory and set permissions
RUN mkdir -p /var/log/redis && \
    chown redis:redis /var/log/redis

# Copy configuration template and entrypoint
COPY redis.conf.template /usr/local/etc/redis/redis.conf.template
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Initial ownership for the config directory
RUN chown -R redis:redis /usr/local/etc/redis

# Use the redis user
USER redis

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]
