Cloud install
=============

You can run *Dashkiosk* on a PaaS like `Heroku`_ or `Dokku`_. The
Chromecast support is unlikely to work in this case but the remaining
functionalities should work without any problem. The following
documentation is done using `Heroku`_. The process should be quite
similar with another provider.

We assume that you already have an account registered on
`Heroku`_. It comes with a free tier which should be sufficient to
test *Dashkiosk*.

Deployment tool installation
------------------------------

The first step is to install the deployment tool. For *Heroku*, follow
the `install documentation`_.

Create the application
----------------------

The next step is to create the *Dashkiosk* application. For that
purpose, a modified buildpack needs to be used as *Dashkiosk* is using
``grunt`` to be built::

    $ git clone https://github.com/vincentbernat/dashkiosk.git
    $ cd dashkiosk
    $ heroku create
    $ heroku config:set NPM_CONFIG_PRODUCTION=false

You can then push the application::

    $ git push heroku master

If you want a custom branding, you have to use the following command::

    $ heroku config:set branding=exoscale

Configure a database
---------------------

By default, *Dashkiosk* will use an SQLite database. However, with a
PaaS, this means that the database will be lost at each deployment. It
is therefore more convenient to use a MySQL database::

    $ heroku addons:create heroku-postgresql:hobby-dev
    $ heroku pg:wait
    $ heroku config -s | grep HEROKU_POSTGRESQL
    HEROKU_POSTGRESQL_RED_URL=postgres://user3123:passkja83kd8@ec2-117-21-174-214.compute-1.amazonaws.com:6212/db982398

The settings are available through environment
variables. Unfortunately, *Dashkiosk* won't use them. It is also
possible to put them into a credential file but *Dashkiosk* won't know
how to use them either.

The easiest way is to arrange for those settings to be available as
environment variables under the right name::

    $ heroku config:set db__options__dialect=postgres
    $ heroku config:set db__options__host=ec2-117-21-174-214.compute-1.amazonaws.com
    $ heroku config:set db__options__port=6212
    $ heroku config:set db__database=db982398
    $ heroku config:set db__username=user3123
    $ heroku config:set db__password=passkja83kd8

Deploy the application
-------------------------

The application can now be deployed::

    $ git push heroku master

If you get a problem, use the log subcommand::

    $ heroku logs --tail

Upgrading
---------

Upgrading is just a matter of pulling new changes and pushing them to the
PaaS::

    $ git pull
    $ git push heroku master

.. _Heroku: https://www.heroku.com/
.. _Dokku: https://github.com/progrium/dokku
.. _install documentation: https://devcenter.heroku.com/articles/heroku-command-line#download-and-install
