# DashKiosk

This is a simple Android application whose purpose is to display
fullscreen non-interactive dashboards on Android devices. Its main use
is to be run from an Android stick plug on some TV to display a
dashboard (hence the name).

## Features

 - Fullscreen webview with no possible interaction.
 - Can be setup as an home screen to be run when the device starts.
 - Prevent the device to go to sleep.
 - Configuration is loaded from some remote server.

Here is a [demonstration video][1].

[1]: http://www.dailymotion.com/video/x18z6hs_dash-kiosk-demo_tech

## Compilation and installation

Once the Android SDK has been installed, you can use the `android`
command to "link" the project with the SDK. Then use `ant` to compile
and `adb` to install the APK file.

    android update project -p .
    ant debug
    adb install -r bin/DashKios-debug.apk
    adb shell am start -n com.deezer.android.dashkiosk/.DashboardActivity

You can get the final APK with `ant release`.

Once the application is running, you can see the logs with:

    adb logcat -s DashKiosk

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

By default, the URL to ping will be
`http://dashkiosk/dashboards.json`. This can be changed in the
preferences.

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
 - `delay`: the delay in seconds this URL should be displayed. This
   cannot be 0.
 - `scroll`: when set to `true`, the page will be scrolled.

An example of such a list is provided in `examples/dashboards.json`.
