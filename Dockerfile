FROM node:16-alpine
RUN mkdir -p /usr/app/www
WORKDIR /usr/app/www
ADD /build/ /usr/app/www
RUN npm install
EXPOSE 8000
CMD [ "node", "index.js" ]