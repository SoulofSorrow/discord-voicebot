FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production
RUN mkdir -p /usr/src/app/data /usr/src/app/logs /usr/src/app/public

# Bundle app source
COPY . .

# Expose ports
EXPOSE 3000 9090

# Default command
CMD ["npm", "start"]
