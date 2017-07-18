#!/bin/bash

service dbus start > dbus.log &&
avahi-daemon --no-drop-root --daemonize && 
exec node /dashkiosk/dist/server.js "$@"
exit $?  # Make sure we really exit
