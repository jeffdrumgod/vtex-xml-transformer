FROM node:18-alpine
RUN mkdir -p /usr/app/www/tmp; 
RUN npm install -g pnpm@7.24.2
WORKDIR /usr/app/www
ADD /build/ /usr/app/www
COPY ./package.json /usr/app/www/
COPY ./pnpm-lock.yaml /usr/app/www/
RUN pnpm install --frozen-lockfile --production
EXPOSE 8000
CMD [ "node", "--experimental-specifier-resolution=node", "index.cjs" ]