FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY scripts/server.mjs ./scripts/server.mjs
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "scripts/server.mjs"]
