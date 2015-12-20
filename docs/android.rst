Android application
===================

This is a simple Android application whose purpose is to display
fullscreen non-interactive dashboards on Android devices. Its main use
is to be run from an Android stick plug on some TV to run the web
application to display dashboards.

Supported devices
-----------------

Currently, the minimal version of Android is 4.0 (Icecream Sandwich)
but to be able to get rid of the status bar, you need at least 4.1
(Jelly Bean). *Dashkiosk* is using the `Crosswalk project`_ to provide
an up-to-date webview with support of recent technologies.

There are a lot of Android devices that you can choose to run
Dashkiosk on. When choosing one, prefer the ones which can be upgraded
to Android 4.2.

Many cheap devices are using a Rockchip SoC limited to a 720p
resolution. This can be circumvented with some non official
experimental firmwares but usually, this is a sufficient resolution to
display dashboards.

The following devices [#devices]_ are known to work reasonably well:

 - `MK809III Mini PC (RK3188 SoC) <http://www.amazon.com/MK809III-Android-Mali-400-OpenGLES2-0-OpenVG1-1/dp/B00CZ7RBIU>`_

.. _issue: https://github.com/vincentbernat/dashkiosk/issues/new

Features
--------

 - It registers as a possible home screen. It is therefore to run the
   application on boot.

 - It provides a really fullscreen webview. Absolutely no space lost
   in bars.

 - No possible interactions. If run on a tablet, the user is mostly
   locked out. However, there are still some way to interact with the
   device while the application is running by invoking the settings
   and changing the home application from here.

 - Prevent the device going to sleep.

Compilation
-----------

If you don't want to compile the Android app yourself, you can
download a `pre-compiled version from GitHub`_.

.. _pre-compiled version from GitHub: https://github.com/vincentbernat/dashkiosk/releases/

Building from source is just a matter of following those two simple
steps:

  1. Clone the `git repository`_.

  2. Build the application with the following command::

        ./gradlew assemble

At the end of the compilation, you get
``build/outputs/apk/dashkiosk-android-debug.apk`` that should be
installed on the Android device.

Installation
------------

You need the ``adb`` tool. On Debian and Ubuntu, you can install the
``android-tools-adb`` package to get it. Otherwise, it is available in
the ``platform-tools`` of the Android SDK. If you didn't install the
SDK yourself, it should be in ``~/.android-sdk``. If ``adb`` is not
present in the ``platform-tools`` directory, you can install it with::

    tools/android update sdk --no-ui --all --filter platform-tool

You can then install the APK on a device attached through USB on your
computer with the following command::

    adb install -r build/outputs/apk/dashkiosk-android-debug.apk

Alternatively, you can just point a browser to the APK and you will
get proposed to install it. You need to ensure that you allowed the
installation of APK from unknown sources.

The next step is to run the configuration panel. This panel can be
accessed by using the back button while the loading screen is
running. It can be accessed later by clicking on the pen icon in the
action bar.

Configuration
-------------

The **orientation** is configured to *landscape* by default. You can
choose either *auto* or *portrait*.

If you want to lock a bit the application, you can **lock settings**
to prevent any further modifications. You can still revert the changes
by invoking the preferences activity with ``adb``::

    adb shell am start -n \
       com.deezer.android.dashkiosk/com.deezer.android.dashkiosk.DashboardPreferences

The important part is to input the **receiver URL**. You can check
that this is the correct URL with any browser. You should see a
dashboard with some nice images cycling.

The **timeout** is not really important. Until the application is able
to make contact with the receiver, it will try to reload the receiver
if the timeout is reached.

Alternatively, the configuration can be done at compile-time by
modifying ``res/xml/preferences.xml``.

Certificates
------------

Server certificates
~~~~~~~~~~~~~~~~~~~

Another interesting setting is the ability to **ignore SSL
errors**. This can be useful if you need to access a lot of
self-signed pages. However, if you have an internal root certificate,
it is better to add it to the Android system. This can be done in the
preferences: *Security* → *Credential Storage* → *Install from
storage*. Unfortunately, this enforces the use of a lock screen which
is usually not wanted for a kiosk.

The other solution is to modify the system store. You need to be root
on the device for such a manipulation. First, get the hash of your
certificate::

    $ echo $(openssl x509 -inform PEM -subject_hash_old -in ca-cert.pem | head -1).0
    a199d90b.0

Then, copy the certificate as this name in ``/system/etc/security/cacerts/``::

    $ adb push ca-cert.pem /sdcard/a199d90b.0
    $  adb shell su -c "cp /sdcard/a199d90b.0 /system/etc/security/cacerts/"

Then, reboot your device.

Client certificates
~~~~~~~~~~~~~~~~~~~

It is also possible to use client certificates. The support is still
quite new and may be troublesome to implement. Be sure to use ``adb
logcat -s DashKiosk AndroidRuntime`` while running to spot any error.

Creating a keystore
+++++++++++++++++++

Currently, you can only provide one client certificate and it will be
used with any site requesting a client certificate. The certificate
needs to be provided as a BKS (BouncyCastle KeyStore). You can either
use ``keytool`` or `Portecle`_, a graphical tool to manage such a
store. You can find a `cheatsheet`_ to use ``keytool``. If you already
have your client certificate as a PKCS#12 file, you only need to use
``keytool -importkeystore``::

    keytool -importkeystore \
            -destkeystore clientstore.bks \
            -deststoretype BKS \
            -provider org.bouncycastle.jce.provider.BouncyCastleProvider \
            -providerpath /usr/share/java/bcprov.jar \
            -srckeystore client.p12 \
            -srcstoretype PKCS12

You will be prompted the password to protect the newly created
keystore and the password protecting the PKCS#12 file. Ensure you use
the same password for both: ``keytool`` seems to protect the private
key with the password from the PKCS#12 file while *Dashkiosk* will use
the same password for the private key and for the keystore.

On Debian, ``bcprov.jar`` is from the ``libbcprov-java`` package. Be
sure to only put one keypair in the store. *Dashkiosk* wil always use
the first one.

Providing the keystore to the application
+++++++++++++++++++++++++++++++++++++++++

There are two ways to provide a client certificate to the
application. The first one is to put the certificate on the
filesystem. For example, in ``/sdcard/dashkiosk.bks``. Then, in the
preferences, ensure to untick *Embedded keystore* and tick *External
keystore*, then specify the path to the keystore in *Keystore
path*. The second one is to embed the client certificate directly into
the application. Replace the file ``res/raw/clientstore.bks`` by your
own and recompile the application. In the preferences, ensure you tick
*Embedded keystore*. In both cases, you also need to provide the
password protecting the keystore.

Usage
-----

Once configured, just run the application as usual. You can also click
on the home button and choose the application from here to make it
starts on boot.

Troubleshooting
---------------

Still with ``adb``, you can see the log generated by the application
with the following command::

    adb logcat -s DashKiosk AndroidRuntime

The log also includes Javascript errors that can be generated by the
dashboards. Javascript errors from the receiver are prefixed with
``[Dashkiosk]``.

.. _Android SDK: http://developer.android.com/sdk/index.htm
.. _Gradle: http://www.gradle.org/
.. _git repository: https://github.com/vincentbernat/dashkiosk-android
.. _Crosswalk project: https://crosswalk-project.org/
.. _Portecle: http://portecle.sourceforge.net/
.. _cheatsheet: https://github.com/vincentbernat/dashkiosk-android/blob/master/certificates/generate

.. rubric:: Footnotes

.. [#devices] Please, open an `issue`_ if you want to contribute to this list.
