# Sonántica - Multi-stage Dockerfile
# Philosophy: "Intentional minimalism" - optimized for production

# Stage 1: Build all packages
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc tsconfig.base.json tsconfig.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/player-core/package.json ./packages/player-core/
COPY packages/dsp/package.json ./packages/dsp/
COPY packages/audio-analyzer/package.json ./packages/audio-analyzer/
COPY packages/media-library/package.json ./packages/media-library/
COPY packages/metadata/package.json ./packages/metadata/
COPY packages/lyrics/package.json ./packages/lyrics/
COPY packages/ui/package.json ./packages/ui/
COPY packages/recommendations/package.json ./packages/recommendations/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/player-core ./packages/player-core
COPY packages/dsp ./packages/dsp
COPY packages/audio-analyzer ./packages/audio-analyzer
COPY packages/media-library ./packages/media-library
COPY packages/metadata ./packages/metadata
COPY packages/lyrics ./packages/lyrics
COPY packages/ui ./packages/ui
COPY packages/recommendations ./packages/recommendations
COPY apps/web ./apps/web

# Build packages (in dependency order)
RUN pnpm --filter @sonantica/shared build
RUN pnpm --filter @sonantica/lyrics build
RUN pnpm --filter @sonantica/metadata build
RUN pnpm --filter @sonantica/player-core build
RUN pnpm --filter @sonantica/dsp build
RUN pnpm --filter @sonantica/audio-analyzer build
RUN pnpm --filter @sonantica/media-library build
RUN pnpm --filter @sonantica/recommendations build
RUN pnpm --filter @sonantica/ui build
RUN pnpm --filter @sonantica/web build

# Stage 2: Production image
FROM nginx:alpine AS production

# Install Node.js for potential server-side features
RUN apk add --no-cache nodejs npm

# Copy built web app
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for volumes
RUN mkdir -p /media /buckets /config

# Set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html /media /buckets /config

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Labels following Sonántica identity
LABEL org.opencontainers.image.title="Sonántica"
LABEL org.opencontainers.image.description="Audio-first multimedia player"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.vendor="Sonántica Team"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
