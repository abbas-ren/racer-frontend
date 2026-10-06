FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN cp docker.env .env

CMD ["npm", "run", "preview"]