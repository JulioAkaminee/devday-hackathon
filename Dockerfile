FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist dist
COPY src src
EXPOSE 3000
VOLUME /data
CMD ["npx", "tsx", "src/server/index.ts"]
