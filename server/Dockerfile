
# Use Node.js 22 lightweight image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy backend source code
COPY . .

# Backend port
EXPOSE 5000

# Start backend server
CMD ["npm", "start"]
