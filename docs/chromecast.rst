.. _chromecast:

Chromecast devices
==================

*Dashkiosk* can optionnaly handle Chromecast devices. When the support
is enabled (see :ref:`options`), *Dashkiosk* will be able to discover
Chromecast devices on the network.

Setup
-----

To be able to handle Chromecast devies, you need to enable its support
(see :ref:`options`). You also need to ensure that mDNS is working
correctly on your setup.

For Linux, use the following command to check that you can see The
Chromecast devices::

    $ avahi-browse _googlecast._tcp
    + eth0.20 IPv4 Chromecast Here              _googlecast._tcp     local
    + eth0.20 IPv4 Chromecast Demo              _googlecast._tcp     local

If this first step doesn't work, check you have Avahi installed and
running. Usually, this can be done with ``apt-get install
avahi-daemon``. Then, check you don't have any firewall preventing
multicast traffic to port 5353.

Please note that you need to be on the same network as the Chromecast
devices [#routing]_.

Then, check that you can resolve the Chromecast names::

    $ getent hosts "Chromecast\032Here".local
    192.168.0.195    Chromecast\032Here.local

If this doesn't work, you need to configure your resolver to use
multicast DNS. This is usually done by putting the following line in
``/etc/nsswitch.conf``::

    hosts: files mdns4_minimal [NOTFOUND=return] dns mdns4

On OS X, you can check if you can see the Chromecast devices with
``dns-sd -B _googlecast._tcp``, then try to resolve with ``dns-sd -G
v4 "Chromecast\032Here".local``.

Usage
-----

Discovered Chromecast devices will be assigned to the special group
"Chromecast devices". This group has no dashboard on purpose: if a
Chromecast device is on a group with a dashboard, *Dashkiosk* will
wait for the Chromecast device to be on the home screen and starts a
custom receiver which will load the regular receiver and turn your
Chromecast device into a regular display.

You can either add dashboards to the "Chromecast devices" group to let
all Chromecast devices display a dashboard on inactivity or move the
selected Chromecast devices to another group.

Custom receiver
---------------

To display dashboards, a Chromecast device is requested to run a
custom receiver, which is just some HTML5 application. Unfortunately,
we cannot just provide an URL for that, we have to give an
application ID. The Chromecast device will ask Google which URL to use
and Google will provide the URL. By default, *Dashkiosk* will use an
application hosted on some `GitHub URL`_. This should work just fine.

If you want to use your own custom receiver (or modify the existing
one), you need to declare a new application (and pay US$ 5). That's a
bit unfortunate. Maybe we could do an application that will just
forward to another application.

.. rubric:: Footnotes

.. [#routing] The mDNS packets are usually using a TTL of 1 and
              therefore cannot be routed even if you try to setup
              multicast routing on your network. The correct solution
              is to configure a `DNS-SD name server`_.

.. _DNS-SD name server: http://www.dns-sd.org/ServerSetup.html
.. _GitHub URL: https://vincentbernat.github.io/dashkiosk/chromecast.html
