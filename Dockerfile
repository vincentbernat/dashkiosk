FROM node:10-stretch AS builder

RUN npm install -g bower grunt-cli
RUN apt-get -qq update && apt-get install -qqy libavahi-compat-libdnssd-dev

WORKDIR /dashkiosk
COPY package.json /dashkiosk/
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install
COPY . /dashkiosk/
RUN grunt
RUN cd dist && \
    npm install --production

FROM node:10-stretch-slim

RUN apt-get -qq update && apt-get install -qqy libavahi-compat-libdnssd1

WORKDIR /dashkiosk
COPY --from=builder /dashkiosk/entrypoint.sh /dashkiosk/
COPY --from=builder /dashkiosk/dist/ /dashkiosk/dist/
RUN chmod +x /dashkiosk/entrypoint.sh

# We use SQLite by default. If you want to keep the database between
# runs, don't forget to provide a volume for /database.
VOLUME /database

ENV NODE_ENV production
ENV port 8080
ENV db__options__storage /database/dashkiosk.sqlite

ENTRYPOINT [ "/dashkiosk/entrypoint.sh" ]
EXPOSE 8080
