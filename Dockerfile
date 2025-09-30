FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

RUN rm -rf src tsconfig.json

RUN addgroup -g 1001 mcpserver && \
    adduser -D -u 1001 -G mcpserver mcpserver && \
    chown -R mcpserver:mcpserver /app

USER mcpserver

ENV NODE_ENV=production

ENTRYPOINT ["node", "build/index.js"]