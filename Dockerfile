FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expose port 5007
EXPOSE 5007

CMD ["node", "server.js"]
