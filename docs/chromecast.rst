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

Troubleshooting
-----------------

Let me explain how the whole thing works.

 1. *Dashkiosk* detects the Chromecast device using multicast DNS. If
    it doesn't see yours, you need to check that multicast is
    correctly working on your network.

 2. If the Chromecast is in a group with dashboards, *Dashkiosk* then
    asks to load the custom receiver using its application ID
    (``5E7A2C2C``). The Chromecast will then ask Google which URL it
    should load for this application ID. Google will send back the
    `GitHub URL`_ hosting the custom receiver. The Chromecast will
    load it. You should get a screen "*This, Jen, is the Internet*".

 3. *Dashkiosk* will send the receiver URL, as you configured it in
    the :ref:`options` (or with ``--chromecast.receiver``). Once the
    custom receiver gets this URL, it displays it in the lower left
    part of the screen. If it isn't displayed, it is likely to be a
    bug in *Dashkiosk*. Have a look in the logs and open an `issue`_.

 4. The custom receiver will then load the regular receiver. If you
    don't get to this step and are stuck on the "*This, Jen, is the
    Internet*" screen, it means that your Chromecast is not able to
    retrieve the receiver you provided. It could be a firewall issue
    or a DNS issue. Try to connect your laptop on the same network as
    the Chromecast and load the receiver URL yourself to see what is
    happening.

Troubleshooting is quite complex. Due to a recent change, users are
only allowed to debug their own application. You need to `register
your Chromecast`_ and register and host a copy of the Chromecast
receiver. You'll get an ID for the Chromecast application and should
use ``--chromecast.app`` to specify it.

Once the application is running, you can connect to your Chromecast
device using its IP on port 9222. The Chromecast needs to be running
the custom receiver. With recent versions of Chrome, you are likely to
get mixed content restrictions. Click on the shield in the URL bar to
lift this restriction.

Either way, due to the closedness of the Chromecast platform, its
support in Dashkiosk may break from time to time. As soon as it
doesn't work anymore, feel free to signal it in an `issue`_. If
needed, it is possible to help debugging by registering a Chromecast
device on the same account hosting the custom receiver.

.. rubric:: Footnotes

.. [#routing] The mDNS packets are usually using a TTL of 1 and
              therefore cannot be routed even if you try to setup
              multicast routing on your network. The correct solution
              is to configure a `DNS-SD name server`_.

.. _DNS-SD name server: http://www.dns-sd.org/ServerSetup.html
.. _GitHub URL: https://vincentbernat.github.io/dashkiosk/chromecast.html
.. _register your Chromecast: https://cast.google.com/publish/#/overview
.. _issue: https://github.com/vincentbernat/dashkiosk/issues/new
