# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY plugin-hedera-dex/package*.json ./plugin-hedera-dex/

# Install dependencies for both main project and plugin
RUN npm ci
RUN cd plugin-hedera-dex && npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 10000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000

# Start the application
CMD ["npm", "start"]
