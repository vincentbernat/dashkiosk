# Dashkiosk

Dashkiosk is a solution to manage dashboards on multiple screens. It
comes as three components:

 1. A _receiver_ runs in a browser attached to each screen and will
    display the requested dashboards. The receiver is quite dumb, it
    contacts the server and wait for it to tell which URL to display.

 2. A _server_ which will manage the screens by sending them what they
    should display. An administration interface allows the user to
    manage those screens individually or in a group.
    
 3. An _Android app_ that will run the receiver. This is mainly a
    fullscreen webview.

The full documentation is available on [ReadTheDocs][].

[ReadTheDocs]: http://dashkiosk.readthedocs.org

# Development

To run the server for development:

    $ grunt serve
    
The server uses an internal bus. Currently, the following events are
emitted:

