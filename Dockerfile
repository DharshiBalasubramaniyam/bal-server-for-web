# Use official Node.js image as base
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (for efficient caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Compile TypeScript
RUN npm run compile

# Expose the port the app runs on
EXPOSE 3000

# Command to run the server
CMD ["node", "dist/index.js"]
