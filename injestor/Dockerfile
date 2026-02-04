FROM oven/bun:1 AS deps
WORKDIR /app

COPY package.json tsconfig.json ./
RUN bun install --production --no-progress

FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV TRADE_HISTORY_DB=file:/data/trade-history.db

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
COPY injestor ./injestor

VOLUME ["/data"]

CMD ["bun", "run", "injestor/new.ts"]
