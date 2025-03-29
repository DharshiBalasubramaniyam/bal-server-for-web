# Use an official Node.js runtime as the base image
FROM node:18-alpine as build

# Set environment variables
ENV NODE_ENV=production

# Create a non-root user with UID 10014 (required by Checkov)
RUN addgroup -S appgroup && adduser -S -u 10014 appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy package files and install ALL dependencies (including dev dependencies)
COPY package.json package-lock.json ./
RUN npm ci  # Installs both production & dev dependencies

# Copy the rest of the application files
COPY . .

# Build the TypeScript code
RUN npm run compile

# Remove dev dependencies to keep the final image small
RUN npm prune --production

# Use a minimal runtime image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy the built files and production dependencies from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json .

# Set non-root user (UID 10014)
USER 10014

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
