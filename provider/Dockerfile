FROM mhart/alpine-node:6 

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . .

RUN npm install --production

EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
