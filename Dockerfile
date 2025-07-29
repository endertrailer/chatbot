# Use Node.js 18 LTS with specific version for security
FROM node:18.19.0-alpine3.18

# Set working directory
WORKDIR /app

# Copy all package files first
COPY package*.json ./
COPY client/package*.json ./client/

# Install root dependencies
RUN npm ci --only=production

# Copy all source code
COPY . .

# Install client dependencies and build
WORKDIR /app/client
RUN npm ci
RUN npm run build

# Go back to app root
WORKDIR /app

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose port (Railway sets this dynamically)
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
