# Use an official Node.js runtime as the base image
FROM node:18-alpine as build

# Set environment variables
ENV NODE_ENV=production

# Create a non-root user with UID 10014 (within required range)
RUN addgroup -S appgroup && adduser -S -u 10014 appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN npm run build

# Use a minimal runtime image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy the built files from the previous stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json .

# Set non-root user (UID 10014)
USER 10014

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
