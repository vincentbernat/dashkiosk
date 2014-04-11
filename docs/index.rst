Dashkiosk's documentation
=========================

.. image:: ../app/images/dashkiosk.svg
   :alt: Dashkiosk logo
   :width: 200px
   :align: right

*Dashkiosk* is a solution to manage dashboards on multiple screens. It
comes in three parts:

 1. A **server** will manage the screens by sending them which URL
    they should display in realtime. A web interface enables the
    administrator to configure groups of dashboards as well as their
    associations with available displays.
   
 2. A **receiver** runs in a browser attached to each screen. On
    start, it contacts the server and waits for it to tell which URL
    to display.

 3. An **Android application** provides a simple fullscreen webview to
    display the receiver.

The Android application is an optional component. Any device able to
display a fullscreen web page should work.

To contribute, use `GitHub`_.

.. _GitHub: https://github.com/vincentbernat/dashkiosk/

.. toctree::
   :maxdepth: 2

   install
   configuration
   usage
   api
   android
   license

Indices and tables
==================

* :ref:`genindex`
* :ref:`search`

