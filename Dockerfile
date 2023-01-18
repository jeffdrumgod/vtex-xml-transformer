FROM node:16-alpine
RUN mkdir -p /usr/app/www/tmp; 
WORKDIR /usr/app/www
ADD /build/ /usr/app/www
COPY ./package.json /usr/app/www/
COPY ./package-lock.json /usr/app/www/
RUN npm install --legacy-peer-deps
EXPOSE 8000
CMD [ "node", "index.js" ]