# Prisma 7 requires Node 20.19+, 22.12+, or 24+.
FROM node:22-alpine

WORKDIR /app

# Copy package dependencies
COPY package.json package-lock.json ./

# Install npm dependencies
RUN npm ci

# Copy application files
COPY . .

# Environment variable for Next.js API endpoint
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Build Next.js application
RUN npm run db:generate && npm run build

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
