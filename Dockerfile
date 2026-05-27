FROM node:20-alpine

WORKDIR /app

# Use a pinned pnpm version for reproducible workspace installs
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production

CMD ["node", "artifacts/api-server/dist/index.mjs"]
