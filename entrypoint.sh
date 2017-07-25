#!/bin/sh

service dbus start \
    && avahi-daemon --no-drop-root --daemonize \
    && exec node /dashkiosk/dist/server.js "$@"
