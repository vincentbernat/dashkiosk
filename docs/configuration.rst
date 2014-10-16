Configuration
=============

Before running the server, there are some options you may want to
tune. Those options can be specified either on the command-line or in
a configuration file (that should be specified on the command-line).

.. _options:

Available options
-----------------

Here are the three more important options:

 ``configuration``
     This option allows to specify a configuration file in JSON format.

 ``environment``
     This option sets the environment to use. By default, the
     ``development`` environment is used. Unless you want to debug
     *Dashkiosk*, this is not what you want. You can use any other
     keyword. Use ``production`` if you don't know.

 ``port``
     The port to listen to. Quite important.

If you want to be able to use Chromecast devices, you also need to set:

  ``chromecast.enabled``
     Enable Chromecast support. Disabled by default.

  ``chromecast.receiver``
     The URL to the receiver. This is used to tell Chromecast devices
     where to find the receiver. The default value is unlikely to
     work. You should put the URL to access Dashkiosk and ends it with
     ``/receiver``. For example, put something like
     ``http://dashkiosk.example.com/receiver``.

The Chromecast custom receiver is hosted on `GitHub`_. If you want to
modify it or to host it yourself, you need to register a new
application in the `Google Cast SDK Developer Console`_ and report the
provided application ID as ``chromecast.app``.

.. _GitHub: https://vincentbernat.github.io/dashkiosk/chromecast.html
.. _Google Cast SDK Developer Console: https://cast.google.com/publish/#/overview

The remaining options can usually be left untouched unless you decided
to not use the integrated SQLite database.

 ``path.static``
     Path where the static files to be served for the receiver and the
     integrated dashboards are located. Unless you moved them to some
     other location, there is no need to change this.

 ``db.database``
     Database name. This is not needed if you kept the default SQLite database.

 ``db.username``
     Username to access the database. This is not needed if you kept
     the default SQLite database.

 ``db.password``
     Password to authenticate with the above username. This is not needed if
     you kept the default SQLite database.

 ``db.options.dialect``
     Dialect to use for the database. This can be ``sqlite``,
     ``mysql``, ``mariadb`` or ``postgres``.

 ``db.options.storage``
     Location of the SQLite database. Not used for other databases.

 ``db.options.host``
     Hostname (or IP) where the database is located. This is not needed for SQLite.

 ``log.level``
     Log level to use for logging messages. Use either ``info`` or ``debug``.

 ``log.file``
     Location of a log file where to write logs in JSON format. By
     default, no such file is generated.

Command-line or configuration file
----------------------------------

On the command-line, the options are specified using the classic GNU
long option style by prepending them with ``--``. For example::

     --port 8087 --environment production

Environment variables
------------------------

You can also specify options using environment variables. In this
case, substitute `.` by `__` to get valid values::

    $ export port=8088
    $ export db__database=dashkiosk4

JSON configuration file
-----------------------

Alternatively, you can specify a JSON configuration file with
``--configuration``. In this case, the options with a dot should be
understood as being a sub-object. For example, to configure a
PostgreSQL database::

    {
        "environment": "production",
        "db": {
            "username": "dashkiosk",
            "password": "dashkiosk",
            "database": "dashkiosk",
            "options": {
                "host": "172.17.42.1",
                "dialect": "postgres"
            }
        },
        "log": {
            "file": "/var/log/dashkiosk.log"
        }
    }

Reverse proxy
-------------

You may want to put a reverse proxy in front of *Dashkiosk*. You
should know that it uses `Socket.IO`_ whose preferred backend is
WebSocket. Some reverse proxy may not like it.

Here is a configuration for nginx::

    upstream dashkiosk {
            server localhost:9450;
            server localhost:9451;
    }
    
    server {
       listen 80;
       listen [::]:80;
       server_name dashkiosk.example.com;
    
       location / {
         proxy_pass http://dashkiosk;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
         proxy_set_header X-Forwarded-For $remote_addr;
       }
    }

Setting ``X-Forwarded-For`` header allows *Dashkiosk* to display the
IP address of each display in case you want to log on it to debug it.

.. _Socket.IO: http://socket.io/
