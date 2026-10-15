FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY scripts ./scripts
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
ENV DATA_DIR=/app/data
VOLUME ["/app/data"]
CMD ["node", "src/index.js"]
