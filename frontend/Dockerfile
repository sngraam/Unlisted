FROM node:18-alpine

WORKDIR /app

# Copy package dependencies
COPY package.json ./

# Install npm dependencies
RUN npm install

# Copy application files
COPY . .

# Environment variable for Next.js API endpoint
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Build Next.js application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
