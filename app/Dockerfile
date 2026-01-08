FROM node:trixie AS build
WORKDIR /app
COPY . /app
COPY conf/env.production /app/.env.production
RUN npm install && npm run build

FROM nginx:trixie
COPY --from=build /app/dist /srv/http
RUN rm /etc/nginx/conf.d/default.conf
COPY conf/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
