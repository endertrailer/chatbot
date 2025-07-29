# Use Node.js 18 LTS with specific version for security
FROM node:18.19.0-alpine3.18

# Set working directory
WORKDIR /app

# Copy all package files first
COPY package*.json ./
COPY client/package*.json ./client/

# Install root dependencies
RUN npm ci --only=production

# Install client dependencies
WORKDIR /app/client
RUN npm ci

# Copy all source code
WORKDIR /app
COPY . .

# Build the client application
RUN npm run build

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose port (Railway sets this dynamically)
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
