# DashKiosk

DashKiosk is a solution to manage dashboards on multiple screens. It
come as three components:

 1. A web application that run in a browser attached to each screen
    and will display the requested dashboards. The web application is
    quite dumb, it contacts the server and wait for it to tell which
    URL to display.

 2. A node.js server which will manage the screens by sending them
    what they should display. An administration interface allows the
    user to manage those screens individually or in a group.
    
 3. An Android app that will run the web application. This is mainly a
    fullscreen webview.

## Web application

The web application is pretty simple. It connects to the node.js
server using the WebSocket protocol and waits for the server to tell
which URL to display. The URL is displayed in a fullscreen seamless
iframe. When a new URL is requested, a new iframe is built but hidden
offscreen. Only when the site has been loaded (and optionnaly told the
web app that is ready, see below), the iframe is shown and the
previous iframe is discarded.

### Ready protocol

The web application watches for the load event of the iframe that has
to be displayed before displaying it. However, some dashboards are
quite dynamic and the `onload` event is triggered while the dashboard
is not really ready. Therefore, the webapp also accepts to be notified
through the [postMessage API][] by sending a ready message:

    ::javascript
    window.parent.postMessage("ready", "*");

[postMessage API]: https://developer.mozilla.org/en-US/docs/Web/API/Window.postMessage

## Server

The server provides two features:

 - a rendez-vous point for all screens to subscribe using a WebSocket
   protocol and get the URL to display, and
 - an administration page to manage all screens, group them, tell them
   which URL to display.

Building the server is done using the following steps:

    ::console
    $ npm install -g bower grunt coffee
    $ npm install
    $ bower install
    $ grunt

To run the server for development:

    ::console
    $ grunt serve

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
`assets/html/loading.html` as well as the linked files
`assets/stylesheets/loading.css` and `assets/images/loading.svg`.

#### Dashboard webapp

By default, the URL to ping will be `http://dashkiosk/`. This can be
changed in the preferences.

#### Orientation

By default, the application is locked in landscape mode since most
dashboards (and TV) work this way. This can also be changed in
`res/xml/preferences.xml`.
