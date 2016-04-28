# Dashkiosk

Dashkiosk is a solution to manage dashboards on multiple screens. It
comes as four components:

 1. A _receiver_ runs in a browser attached to each screen and will
    display the requested dashboards. The receiver is quite dumb, it
    contacts the server and wait for it to tell which URL to display.

 2. A _server_ which will manage the screens by sending them what they
    should display. An administration interface allows the user to
    manage those screens individually or in a group.
    
 3. An _Android app_ that will run the receiver. This is mainly a
    fullscreen webview. There is also a _Firefox app_ fulfilling the
    same purpose.

 4. A _Chromecast custom receiver_ which will run the regular receiver
    if you want to display dashboards using Google Chromecast devices.

The full documentation is available on [ReadTheDocs][].

[ReadTheDocs]: http://dashkiosk.readthedocs.io

A live installation, reset every hour, is publicly available:
 - [administration panel](http://dashkiosk.app.exo.io/admin)
 - [receiver](http://dashkiosk.app.exo.io/receiver)

Here is a demonstration video:

[![Dashkiosk demo](https://img.youtube.com/vi/Vb4BvEzoYOU/0.jpg)](https://www.youtube.com/watch?v=Vb4BvEzoYOU "Dashkiosk demo")

# Development

To run the server for development:

    $ grunt serve

# Android receiver

The Android receiver has moved to its
[own repository](https://github.com/vincentbernat/dashkiosk-android).

# Chromecast receiver

The "official" Chromecast receiver has app ID `5E7A2C2C` and is hosted
in the `gh-pages` branch of this repository. To update it:

    $ grunt dist
    $ git worktree add ~/src/dashkiosk-gh-pages gh-pages
    $ cd ~/src/dashkiosk-gh-pages
    $ git rm -r *
    $ rsync -rv --include '*chromecast*' --include '*/' --exclude '*' ~-dashkiosk/dist/public/* .
    $ git add *
    $ git commit -m "Update"

# Docker

There is a `Dockerfile` to run *Dashkiosk* inside Docker. In this
case, it is unlikely that Chromecast will work as expected. You can
run this container like this:

    $ docker run -d -p 8080:8080 \
                 -v /var/lib/dashkiosk/database:/database \
                 vincentbernat/dashkiosk:latest

Using `latest` can be broken from time to time. You may prefer a
stable tag, like `2.6.1`.
