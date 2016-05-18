FROM mhart/alpine-node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . .

RUN npm install

EXPOSE 3000
CMD ["npm", "start"]
