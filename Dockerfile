# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root configs
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install all dependencies (including dev for building)
RUN npm ci

# Copy the entire source code (filtered by .dockerignore)
COPY . .

# Build the workspaces
RUN npm run build

# Stage 2: Production environment
FROM node:22-alpine AS runner

WORKDIR /app

# Set node to production
ENV NODE_ENV=production

# Copy root package.json for workspace resolution
COPY --from=builder /app/package*.json ./

# Copy packages
COPY --from=builder /app/client/package*.json ./client/
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/shared/package*.json ./shared/

# Install only production dependencies and ignore lifecycle scripts
RUN npm ci --omit=dev --ignore-scripts

# Copy built artifacts
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/shared/dist ./shared/dist

# The server .env is read from the server's working directory
WORKDIR /app/server

EXPOSE 2567

# Start the application
CMD ["node", "dist/index.js"]
