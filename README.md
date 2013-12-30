# DashKiosk

This is a simple Android application whose purpose is to display
fullscreen non-interactive dashboards on Android devices. Its main use
is to be run from an Android stick plug on some TV to display a
dashboard (hence the name).

## Features

 - Fullscreen webview with no possible interaction.
 - Can be setup as an home screen to be run when the device starts.
 - Prevent the device to go to sleep.
 - Configuration is load from some remote server.

Here is a [demonstration video][1].

[1]: http://www.dailymotion.com/video/x18z6hs_dash-kiosk-demo_tech

## Customization

Most customization needs to be done at compile time. Some preferences
settings are available in `res/xml/preferences`. You can modify them
at compile time or at runtime. In the later case, you need to trigger
the activity manually. For example, with `adb`:

    adb shell am start -n \
       com.deezer.android.dashkiosk/com.deezer.android.dashkiosk.DashboardPreferences

### Loading screen

If you want to change the loading screen, have a look at
`assets/html/loading.html` as well as the linked files
`assets/stylesheets/loading.css` and `assets/images/loading.svg`.

### Ping URL

By default, the URL to ping will be discovered through network service
discovery. You can advertise the appropriate host with `avahi`:

    avahi-publish -s "dashkiosk" _http._tcp 8000 "Beautiful dashboards"

DashKiosk will detect this service because of the service name
(`dashkiosk`) and the service type (`_http._tcp`). The requested URL
will be the one built from the service name and `/dashboards.json`.

Once it is working, you can put an appropriate service file in
`/etc/avahi/services/` to let this service be advertised at boot. You
can also specify directly the URL to ping if you don't want to rely on
network discovery. Currently, it seems that network service discovery
is not the most stable component. I had to reboot my phone a few times
during tests. Feel free to disable it if you run into trouble.

### Orientation

By default, the application is locked in landscape mode since most
dashboards (and TV) work this way. This can also be changed in
`res/xml/preferences.xml`.

## Ping URL

The ping URL should return a list of URL in a specially crafted JSON
message. This list is an array of URL objects. An URL objects has one
mandatory field, `url` which is the URL to be loaded. The accepted
fields for an URL object are:

 - `url`: the URL to be loaded
 - `delay`: the delay in seconds this URL should be displayed, default
   to 0 which means display the URL forever.
 - `scroll`: when set to `true`, the page will be scrolled. The timing
   is a bit tricky since the time loading and rendering the page is
   not correctly accounted for. If the page is very large, it is
   possible that the bottom of the page will never be shown.

An example of such a list is provided in `examples/dashboards.json`.
