FROM node:16-alpine
RUN mkdir -p /usr/app/www/tmp; 
WORKDIR /usr/app/www
ADD /build/ /usr/app/www
COPY ./package* /usr/app/www
RUN npm ci
EXPOSE 8000
CMD [ "node", "index.js" ]