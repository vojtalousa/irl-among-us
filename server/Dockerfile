FROM node:18

WORKDIR /usr/app

COPY ./package.json ./

RUN npm install

COPY ./ ./

CMD ["npm", "run", "start"]