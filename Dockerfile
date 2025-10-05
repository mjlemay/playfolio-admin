# Development Dockerfile for Next.js
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies (including dev dependencies for development)
# Fresh install ensures Linux-compatible binaries
RUN npm install

# Copy source code
COPY . .

EXPOSE 4400

# Default command (can be overridden in compose)
CMD ["npm", "run", "dev"]