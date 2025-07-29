# Use Node.js 18 LTS with specific version for security
FROM node:18.19.0-alpine3.18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies
WORKDIR /app/client
RUN npm ci --only=production

# Copy client source code
COPY client/ ./

# Build the React app
RUN npm run build

# Go back to app root
WORKDIR /app

# Copy server source code
COPY . .

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose port
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]
