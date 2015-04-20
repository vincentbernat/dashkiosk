FROM node:0.10-onbuild

RUN npm install -g bower grunt-cli
RUN apt-get -qq update && apt-get install -qq gifsicle libjpeg-progs optipng

COPY . /dashkiosk
RUN cd /dashkiosk ; npm install
RUN cd /dashkiosk ; grunt --branding=exoscale
RUN cd /dashkiosk/dist ; npm install --production

# We use SQLite by default. If you want to keep the database between
# runs, don't forget to provide a volume for /database.
VOLUME /database

ENV NODE_ENV production
ENV port 8080
ENV db__options__storage /database/dashkiosk.sqlite

ENTRYPOINT [ "node", "/dashkiosk/dist/server.js" ]
EXPOSE 8080
