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

 - `display.NAME.connected` when a new display is connected
 - `display.NAME.disconnected` when a new display is disconnected
 - `display.NAME.group` when a display should change to a new group
 - `display.NAME.deleted` when a display is deleted
 - `display.NAME.updated` when another change happens on a display
 - `display.NAME.dashboard` when a new dashboard should be displayed
   by the given display.
 - `display.NAME.reload` when a display should reload itself
 - `display.NAME.osd` when we need to display something on the OSD
 - `display.NAME.viewport` when the display viewport should be updated
 - `group.ID.created` when a new group is created
 - `group.ID.updated` when a group is updated (but not something dashboard related)
 - `group.ID.deleted` when a group is deleted
 - `group.ID.dashboard` when a whole group should switch to a new dashboard
 - `group.ID.dashboard.ID.added` when a new dashboard has been added
 - `group.ID.dashboard.ID.removed` when a dashboard has been removed
 - `group.ID.dashboard.ID.updated` when a dashboard has been updated
