# Development Dockerfile for Next.js
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install dependencies with platform-specific handling
RUN \
  if [ -f package-lock.json ]; then rm package-lock.json && npm install; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  elif [ -f yarn.lock ]; then yarn install; \
  else npm install; \
  fi

# Copy source code
COPY . .

EXPOSE 4400

# Default command (can be overridden in compose)
CMD ["npm", "run", "dev"]