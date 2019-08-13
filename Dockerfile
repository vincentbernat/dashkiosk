FROM node:10

RUN npm install -g bower grunt-cli
RUN apt-get -qq update && apt-get install -qq gifsicle libjpeg-progs optipng libavahi-compat-libdnssd-dev

WORKDIR /dashkiosk
COPY . /dashkiosk/
ENV NPM_CONFIG_LOGLEVEL warn
RUN rm -rf node_modules build && \
    npm install && \
    grunt && \
    cd dist && \
    npm install --production && \
    rm -rf ../node_modules ../build && \
    npm cache clean --force

RUN chmod +x /dashkiosk/entrypoint.sh

# We use SQLite by default. If you want to keep the database between
# runs, don't forget to provide a volume for /database.
VOLUME /database

ENV NODE_ENV production
ENV port 8080
ENV db__options__storage /database/dashkiosk.sqlite

ENTRYPOINT [ "/dashkiosk/entrypoint.sh" ]
EXPOSE 8080
