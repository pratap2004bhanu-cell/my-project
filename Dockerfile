# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
RUN npm ci
COPY . .
RUN VITE_DISABLE_GOOGLE=true npm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
RUN npm --prefix server ci --omit=dev && mkdir -p server/uploads
COPY --from=build /app/dist ./dist
COPY server ./server
EXPOSE 8080
CMD ["node", "server/index.js"]