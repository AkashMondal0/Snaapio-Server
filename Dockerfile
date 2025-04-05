# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install -f
COPY . .
RUN npm run build

# Stage 2: Create a minimal production image
FROM node:18-alpine

WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
# Install only production dependencies in the final stage
RUN npm ci --production --legacy-peer-deps

EXPOSE 5000
CMD [ "npm", "start" ]