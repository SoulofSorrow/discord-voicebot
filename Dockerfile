FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production
RUN mkdir -p /app/data

# Bundle app source
COPY . .

# Default command
CMD ["npm", "start"]
