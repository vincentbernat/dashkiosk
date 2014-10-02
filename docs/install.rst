Installation
============

The server is a `Node.js`_ application providing a rendez-vous point
for all displays to subscribe using a Websocket protocol as well as an
administration page to manage all displays, group them and tell them
which URL to display.

Server and receiver
-------------------

To install it, you need to execute the following step:

  1. Grab the latest `tarball for Dashkiosk`_ from GitHub.

  2. Install `Node.js`_ and optionally `npm`_. Currently, *Dashkiosk*
     only works with *Node.js* 0.10.x which is the current stable
     version. If the version available in your distribution is not
     up-to-date, have a look at `how to install Node.js via the
     package manager`_ before trying to build from the sources.

  3. Install *bower* and *grunt*, two package managers for Javascript
     with the following command::

         $ npm install -g bower grunt-cli

  4. Unpack *Dashkiosk* in the directory of your choice and go into
     that directory.

  5. Install the appropriate dependencies with the following commands::

         $ npm install

  6. Build the final version of *Dashkiosk* with the following command::

         $ grunt

  7. Upon success, you will get a `dist` directory that you can put on
     some server. It includes both the receiver and the server
     part. Then, go to `dist`::

         $ npm install --production

  8. If you want to use the Android application, you still need
     to build it and install it. See :doc:`android`.

If you get an error while compiling mDNS extension on Linux, ensure
you have the appropriate development package for Avahi. Specifically,
on Debian, you need ``libavahi-compat-libdnssd-dev``.

Branding
--------

You can brand a bit *Dashkiosk*. To do this, run ``grunt`` with
``--branding=BRAND``.  For example, the ``deezer`` branding provides
the following perks:

  - The spinning vinyl is located in
    ``app/images/loading-deezer.svg``. You should be able to use
    anything that will give a cool effect while spinning.

  - The *Deezer* logo appearing both in the administration interface
    and in the default dashboard is located in
    ``app/images/stamp-deezer.svg``.

You can create alternate version of those images and drop them at the
same place with a different suffix. Currently, the available brandings
are:

 - ``default``
 - ``deezer``
 - ``dailymotion``
 - ``exoscale``

Database
--------

*Dashkiosk* stores its data inside some database. By default, it uses
SQLite. If you prefer to use another database, this is quite easy. We
will use `PostgreSQL`_ but this should be easy to transpose to another
database supported by `Sequelize.js`_, the ORM used in
*Dashkiosk*. The databases currently supported are:

 - MySQL,
 - MariaDB,
 - SQLite, and
 - PostgreSQL.

Here are the steps:

  1. Create a dedicated user inside your RDBMS. For *PostgreSQL*, this
     is done as the ``postgres`` user with the following command::

           $ createuser -P dashkiosk
           Enter password for new role: 
           Enter it again: 
           Shall the new role be a superuser? (y/n) n
           Shall the new role be allowed to create databases? (y/n) n
           Shall the new role be allowed to create more new roles? (y/n) n

  2. Create an empty database. For *PostgreSQL*, this is also done as
     the ``postgres`` user::

           $ createuser -O dashkiosk dashkiosk

The database will be populated automatically when running *Dashkiosk*
for the first time.

.. _unassigned:

Unassigned dashboard
--------------------

By default, displays are put in a group with a dashboard with cycling
images. You can add more images in ``app/images/unassigned`` if you
want. Then, rebuild with ``grunt``.

.. _Node.js: http://nodejs.org/
.. _npm: https://www.npmjs.org
.. _how to install Node.js via the package manager: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager
.. _tarball for Dashkiosk: https://github.com/vincentbernat/dashkiosk/releases
.. _Deezer: http://www.deezer.com
.. _PostgreSQL: http://www.postgresql.org
.. _Sequelize.js: http://sequelizejs.com

Upgrade
=======

To upgrade, you can use the exact same instructions that you used for
installation. You can choose to do an in-place upgrade if you want
to::

    $ npm install
    $ grunt

If you kept the default SQLite database, be sure to save it (it's in
``dist/db/``) before upgrading and restore it after upgrade. The
``dist/`` directory where *Dashkiosk* is built is wiped out on
upgrade.
