FROM node:0.10

RUN npm install -g bower grunt-cli
RUN apt-get -qq update && apt-get install -qq gifsicle libjpeg-progs optipng

WORKDIR /dashkiosk
COPY . /dashkiosk/
RUN npm install && \
    grunt --branding=exoscale && \
    cd dist && \
    npm install --production && \
    rm -rf ../node_modules ../build

# We use SQLite by default. If you want to keep the database between
# runs, don't forget to provide a volume for /database.
VOLUME /database

ENV NODE_ENV production
ENV port 8080
ENV db__options__storage /database/dashkiosk.sqlite

ENTRYPOINT [ "node", "/dashkiosk/dist/server.js" ]
EXPOSE 8080
