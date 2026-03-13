# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/devcontainers/javascript-node:22-bookworm

# ── Shared cache paths (readable by both root and the node user) ──────────────
ENV NPM_CONFIG_CACHE=/opt/npm-cache \
    PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers

# ── 1. Playwright system-level browser dependencies ───────────────────────────
# This is the heavy apt-get step (~30 packages).  Baking it into the image
# layer means it never runs during "building codespace…" again.
RUN apt-get update -qq \
 && npx --yes playwright install-deps chromium \
 && apt-get clean \
 && rm -rf /var/lib/apt/lists/*

# ── 2. Pre-warm the npm cache ─────────────────────────────────────────────────
# Copy only the lock-files so this layer only rebuilds when deps change.
# postCreateCommand will run `npm ci --prefer-offline` which reads from this
# cache instead of the network → near-instant install in the Codespace.
WORKDIR /tmp/npm-prebuild
COPY package*.json ./
RUN npm ci --ignore-scripts

# ── 3. Playwright Chromium browser binary ─────────────────────────────────────
RUN npx playwright install chromium

# ── 4. Permissions ────────────────────────────────────────────────────────────
RUN chmod -R 755 /opt/npm-cache /opt/playwright-browsers

USER node
