Cloud install
=============

You can run *Dashkiosk* on a PaaS like `Heroku`_. The Chromecast
support is unlikely to work in this case but the remaining
functionalities should work without any problem. The following
documentation is done using `exoscale PaaS`_ (a Swiss cloud
provider). The process should be quite similar with another provider.

We assume that you already have an account registered on
`exoscale`_. It comes with a free trial which should be sufficient to
test *Dashkiosk*.

Deployment tool installation
------------------------------

The first step is to install the deployment tool. For *exoscale*, this
is done with ``pip``::

    $ sudo easy_install pip
    $ sudo pip install -U cctrl

You should get an ``exoapp`` command. You need to add your SSH key with ``exouser key.add``.

Create the application
----------------------

The next step is to create the *Dashkiosk* application. For that
purpose, a modified buildpack needs to be used as *Dashkiosk* is using
``grunt`` to be built::

    $ git clone https://github.com/vincentbernat/dashkiosk.git
    $ cd dashkiosk
    $ exoapp dashkiosk4mycompany create \
             --buildpack https://github.com/mbuchetics/heroku-buildpack-nodejs-grunt.git \
             custom

You'll have to replace ``dashkiosk4mycompany`` by another name. You
can then build the application with the ``push`` command::

    $ exoapp dashkiosk4mycompany push

If you want a custom branding, you have to modify ``Gruntfile.js`` to
change the default branding at the top of the file.

Configure a database
---------------------

By default, *Dashkiosk* will use an SQLite database. However, with a
PaaS, this means that the database will be lost at each deployment. It
is therefore more convenient to use a MySQL database::

    $ exoapp dashkiosk4mycompany addon.add mysqls.free
    $ exoapp dashkiosk4mycompany addon mysqls.free
    Addon                    : mysqls.free
    
     Settings
       MYSQLS_DATABASE          : aepfx9trwgz
       MYSQLS_HOSTNAME          : mysql.app.exo.io
       MYSQLS_PORT              : 3306
       MYSQLS_PASSWORD          : CfWYSgV841jS
       MYSQLS_USERNAME          : aepfx9trwgz

All those settings are available through environment variables of the
same name. Unfortunately, *Dashkiosk* won't use them. It is also
possible to put them into a credential file but *Dashkiosk* won't know
how to use them either.

The easiest way is to arrange for those settings to be available as
environment variables under the right name::

    $ exoapp dashkiosk4mycompany config.add \
             db__database=aepfx9trwgz \
             db__username=aepfx9trwgz \
             db__password=CfWYSgV841jS \
             db__options__dialect=mysql \
             db__options__host=mysql.app.exo.io
    $ exoapp dashkiosk4mycompany config.add SET_ENV_VARS=true

The last command ensures that the configuration variables are
available in the program environment. *Dashkiosk* will take them from
here.

Deploy the application
-------------------------

The application can now be deployed::

    $ exoapp dashkiosk4mycompany deploy

If you get a problem, use the log subcommand::

    $ exoapp dashkiosk4mycompany log error
    $ exoapp dashkiosk4mycompany log access

Upgrading
---------

Upgrading is just a matter of pulling new changes, pushing them to the
PaaS and deploy the result::

    $ git pull
    $ exoapp dashkiosk4mycompany push
    $ exoapp dashkiosk4mycompany deploy

The result should be visible at http://dashkiosk4mycompany.app.exo.io.

.. _Heroku: https://www.heroku.com/
.. _exoscale PaaS: https://www.exoscale.ch/add-on/paas/
.. _exoscale: https://www.exoscale.ch/
