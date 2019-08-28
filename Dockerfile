FROM node:10
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . /usr/src/app
EXPOSE 3000
CMD [ "node", "/usr/src/app/app.js" ]