#!/bin/bash

service dbus start > dbus.log &&
avahi-daemon --no-drop-root --daemonize && 
exec "$@"
exit $?  # Make sure we really exit
