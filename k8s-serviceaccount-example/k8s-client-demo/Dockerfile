FROM node:20-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN useradd --create-home nodeuser
USER nodeuser

CMD ["node", "index.js"]
