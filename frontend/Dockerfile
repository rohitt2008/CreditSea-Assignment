# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json tsconfig.json postcss.config.mjs eslint.config.mjs next.config.ts ./
RUN npm ci

COPY public ./public
COPY src ./src

# Set production API URL during build time
ENV NEXT_PUBLIC_API_URL=http://localhost:5001/api

RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/.next ./.next

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["npm", "start"]
