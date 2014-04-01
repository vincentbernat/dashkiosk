# DashKiosk

DashKiosk is a solution to manage dashboards on multiple screens. It
come as three components:

 1. A _receiver_ runs in a browser attached to each screen and will
    display the requested dashboards. The receiver is quite dumb, it
    contacts the server and wait for it to tell which URL to display.

 2. A node.js _server_ which will manage the screens by sending them
    what they should display. An administration interface allows the
    user to manage those screens individually or in a group.
    
 3. An _Android app_ that will run the receiver. This is mainly a
    fullscreen webview.

The Android app is quite optional. Any device able to display a
fullscreen webview will do the trick. For example, it is possible to
use a Chromecast by leveraging [Chromecast dashboard][].

[Chromecast dashboard]: http://boombatower.github.io/chromecast-dashboard/sender/

## Receiver

The receiver is pretty simple. It connects to the node.js server using
the WebSocket protocol and waits for the server to tell which URL to
display. The URL is displayed in a fullscreen iframe. When a new URL
is requested, a new iframe is built but hidden offscreen. Only when
the site has been loaded (and optionnaly told the receiver that is
ready, see below), the iframe is shown and the previous iframe is
discarded.

### Ready protocol

The receiver waits for the load event of the iframe that has to be
displayed before displaying it. However, some dashboards are quite
dynamic and the `onload` event is triggered while the dashboard is not
really ready. Therefore, in the future, the receiver will also accept
to be notified through the [postMessage API][] by sending a ready
message:

    ::javascript
    window.parent.postMessage("ready", "*");

[postMessage API]: https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage

### Limitations

Because of the use of iframes, some website may refuse to render due
to the use of `X-Frame-Options` header. Fortunately, the receiver is
not intended to be a general purpose browser and dashboard-related
contents don't usually have this limitation. However, here are some
work-arounds:

 1. Find an embeddable version. Youtube, Google Maps and many other
    sites propose a version specifically designed to be embedded into
    an iframe.

 2. Use a web proxy that will strip out the offending header. A good
    base for such a proxy is [Node Unblocker][]. It should be easy to
    modify it to remove the `X-Frame-Options` header.

 3. Use a screenshot service. Instead of displaying the real website,
    just display a screenshot. There are many solutions to implement
    such a service with headless browsers like Phantom.JS. For example
    [this one][2].

[Node Unblocker]: http://nodeunblocker.com/proxy
[2]: https://github.com/fzaninotto/screenshot-as-a-service

## Server

The server provides two features:

 - a rendez-vous point for all screens to subscribe using a WebSocket
   protocol and get the URL to display, and
 - an administration page to manage all screens, group them, tell them
   which URL to display.

Building the server is done using the following steps:

    ::console
    $ npm install -g bower grunt-cli
    $ npm install
    $ bower install
    $ grunt

### Development

To run the server for development:

    ::console
    $ grunt serve
    
To run the server:

    ::console
    $ npm start

The server uses an internal bus. Currently, the following events are
emitted:

 - `display.NAME.connected` when a new display is connected
 - `display.NAME.disconnected` when a new display is disconnected
 - `display.NAME.dashboard` when a new dashboard should be displayed
   by the given display.
 - `display.NAME.reload` when a display should reload itself
 - `display.NAME.osd` when we need to display something on the OSD
 - `display.NAME.group` when a display should change to a new group
 - `group.ID.dashboard` when a whole group should switch to a new dashboard
 - `group.ID.dashboard.ID.added` when a new dashboard has been added
 - `group.ID.dashboard.ID.removed` when a dashboard has been removed
 - `group.ID.dashboard.ID.updated` when a dashboard has been updated

### Database

By default, it uses an SQLite database in the current directory. You
can use a PostgreSQL database instead or any
[dialect supported by Sequelize][]. Then, put this in a `config.json`
file:

    ::json
    {
        "db": {
            "username": "dashkiosk",
            "password": "dashkiosk",
            "database": "dashkiosk",
            "options": {
                "dialect": "postgres"
            }
        }
    }

Also install PostgreSQL bindings with `npm install pg`.

[dialect supported by Sequelize]: http://sequelizejs.com/docs/latest/usage#dialects

## Android application

This is a simple Android application whose purpose is to display
fullscreen non-interactive dashboards on Android devices. Its main use
is to be run from an Android stick plug on some TV to run the web
application to display dashboards.

It works best with Android 4.4 (Kit Kat) or later since the WebView
component shipped in those versions come from the Chromium project and
are pretty up-to-date. Older versions won't compile and any patch is
welcome to fix that.

The application is quite minimalist with the following features:

 - Fullscreen webview with no possible interaction.
 - Can be setup as an home screen to be run when the device starts.
 - Prevent the device to go to sleep.

The application is expected to be "dumb". Most of the work should be
done by the web application that is loaded.

### Compilation and installation

Once the Android SDK has been installed, you can use the `android`
command to "link" the project with the SDK. Then use `ant` to compile
and `adb` to install the APK file.

    android update project -p .
    ant debug
    adb install -r bin/DashKiosk-debug.apk
    adb shell am start -n com.deezer.android.dashkiosk/.DashboardActivity

You can get the final APK with `ant release`.

Once the application is running, you can see the logs with:

    adb logcat -s DashKiosk AndroidRuntime

### Customization

Most customization needs to be done at compile time. Some preferences
settings are available in `res/xml/preferences`. You can modify them
at compile time or at runtime. In the later case, you need to trigger
the activity manually. For example, with `adb`:

    adb shell am start -n \
       com.deezer.android.dashkiosk/com.deezer.android.dashkiosk.DashboardPreferences

#### Loading screen

If you want to change the loading screen, have a look at
`res/drawable-hdpi/dashkiosk.png`. This only concerns the loading
screen of the application until it contacts the webapp. After that,
the loading screen will never appear again. The spinning vinyl comes
from the webapp.

#### Dashboard webapp

By default, the URL to ping to get the webapp will be
`http://dashkiosk/`. This can be changed in the preferences.

#### Orientation

By default, the application is locked in landscape mode since most
dashboards (and TV) work this way. This can also be changed in
`res/xml/preferences.xml`.
