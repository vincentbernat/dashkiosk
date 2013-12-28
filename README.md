DashKiosk
=========

This is a simple Android application whose purpose is to display
fullscreen non-interactive dashboards on Android devices. Its main use
is to be run from an Android stick plug on some TV to display a
dashboard (hence the name).

Features
--------

 - Fullscreen webview with no possible interaction.
 - Can be setup as an home screen to be run when the device starts.
 - Prevent the device to go to sleep.
 - Configuration is load from some remote server.

Customization
-------------

Any customization needs to be done at compile time. If you want to
change the loading screen, have a look at `assets/html/loading.html`
as well as the linked files `assets/stylesheets/loading.css` and
`assets/images/loading.svg`.
