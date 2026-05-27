FROM node:20-alpine

WORKDIR /app

# Use a pinned pnpm version for reproducible workspace installs
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production

# show built files at build time so we catch missing artifacts early
RUN ls -la artifacts/api-server/dist || true

# use absolute path to the built server entry to avoid 'pid1' exec issues
CMD ["node", "/app/artifacts/api-server/dist/index.mjs"]
