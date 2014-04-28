API
===

There are three API available in Dashkiosk:

 - a REST API to manipulate groups, dashboards and displays,
 - the change API which is a Socket.IO based API which broadcasts
   changes to subscriber,
 - the display API which is a Socket.IO based API which tells displays
   which URL they should display.

There is also an internal bus API.

REST API
--------

The REST API is available on the ``/api`` endpoint. Only JSON is
currently supported. On error, the HTTP error code is important and
the error message is also encapsulated into a JSON object::

    {
        "error": {
            "httpCode": 404,
            "message": "No display named \"CNDS0KD\".",
            "name": "NotFoundError",
            "stack": [
                "NotFoundError: No display named \"CNDS0KD\".",
                "    at dashkiosk/lib/models/display.js:154:15",
                "    at process._tickDomainCallback (node.js:459:13)",
                "    at process._tickFromSpinner (node.js:390:15)",
                "From previous event:",
                "    at new Promise (dashkiosk/node_modules/sequelize/node_modules/bluebird/js/main/promise.js:88:37)",
                "    at module.exports.CustomEventEmitter.then (dashkiosk/node_modules/sequelize/lib/emitters/custom-event-emitter.js:144:12)",
                "    at Function.Display.get (dashkiosk/lib/models/display.js:152:6)",
                "    at dashkiosk/lib/api/rest/displays.js:21:20",
                "    at callbacks (dashkiosk/node_modules/express/lib/router/index.js:164:37)",
                "    at param (dashkiosk/node_modules/express/lib/router/index.js:138:11)"
            ]
        },
        "message": "No display named \"CNDS0KD\".",
        "token": "1397254337651-5YHK0SFJRC"
    }

The ``error`` attribute is only present in development mode. It can
also be found in the logs thanks to the ``token`` attribute.

Displays
++++++++

.. http:get:: /api/display

   The list of all known displays.

   **Example request**:

   .. sourcecode:: http

      GET /api/display HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "3VZG6Y": {
            "connected": false,
            "description": null,
            "group": 1,
            "id": 2,
            "ip": null,
            "name": "3VZG6Y",
            "viewport": null
        },
        "51VRJ7": {
            "connected": false,
            "description": "Chromium",
            "group": 2,
            "id": 7,
            "ip": "127.0.0.1",
            "name": "51VRJ7",
            "viewport": null
        }
      }

   :statuscode 200: no error

.. http:put:: /api/display/(name)

   Modify the attributes of the display `name`.

   **Example request**:

   .. sourcecode:: http

      PUT /api/display/CNDS0K HTTP/1.1
      Accept: application/json

      { "viewport": "1920x1080" }

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "connected": true, 
        "description": "Nexus 5 (localhost:9400)", 
        "group": 2, 
        "id": 5, 
        "ip": null, 
        "name": "CNDS0K", 
        "viewport": "1920x1080"
      }

   :param name: name of the display
   :jsonparam description: new description for the display
   :jsonparam viewport: new viewport for the display
   :statuscode 200: no error
   :statuscode 404: display not found

.. http:put:: /api/display/(name)/group/(int:id)

   Attach the display `name` to the group `id`.

   **Example request**:

   .. sourcecode:: http

      PUT /api/display/CNDS0K/group/10 HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "connected": false, 
        "description": "Nexus 5 (localhost:9400)", 
        "group": 10, 
        "id": 5, 
        "ip": null, 
        "name": "CNDS0K", 
        "viewport": "1920x1080"
      }

   :param name: name of the display
   :param id: ID of the group
   :statuscode 200: no error
   :statuscode 404: display or group not found

.. http:post:: /api/display/(name)/action

   Request an action on a display. Only if connected.

   **Example request**:

   .. sourcecode:: http

      POST /api/display/CNDS0K/action HTTP/1.1
      Accept: application/json

      { "action": "reload" }

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "connected": true,
        "description": "Nexus 5 (localhost:9400)", 
        "group": 10, 
        "id": 5, 
        "ip": null, 
        "name": "CNDS0K", 
        "viewport": "1920x1080"
      }

   :param name: name of the display
   :jsonparam action: requested action, either ``reload`` or ``osd``
   :jsonparam text: for OSD only, text to display or ``null`` to remove the OSD
   :statuscode 200: no error
   :statuscode 400: unknown action
   :statuscode 404: display not found or offline

.. http:delete:: /api/display/(name)

   Delete the display `name`. Only possible if the display is not
   connected anymore.

   **Example request**:

   .. sourcecode:: http

      DELETE /api/display/CNDS0K HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 204 OK
      Content-Type: application/json

   :param name: name of the display
   :statuscode 204: no error
   :statuscode 404: display not found
   :statuscode 409: display still connected

Groups
++++++

.. http:get:: /api/group

   The list of all known groups.

   **Example request**:

   .. sourcecode:: http

      GET /api/group HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "1": {
            "description": "Default group for unassigned displays", 
            "id": 1, 
            "name": "Unassigned"
        }, 
        "2": {
            "description": "Dashboards with Game of Thrones stuff", 
            "id": 2, 
            "name": "Game of Thrones"
        }
      }

   :statuscode 200: no error

.. http:post:: /api/group

   Create a new group

   **Example request**:

   .. sourcecode:: http

      POST /api/group HTTP/1.1
      Accept: application/json

      {
        "name": "New group"
      }

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "id": 9,
        "name": "New group"
      }

   :jsonparam name: name of the group
   :jsonparam description: description of the group
   :statuscode 200: no error
   :statuscode 400: a group should have a name
   :statuscode 409: a group with the same name already exists

.. http:put:: /api/group/(int:id)

   Modify a group attributes.

   **Example request**:

   .. sourcecode:: http

      PUT /api/group/15 HTTP/1.1
      Accept: application/json

      {
        "name": "Another name",
        "description": "Fancy"
      }

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
        "id": 9,
        "name": "Another name",
        "description": "Fancy"
      }

   :jsonparam name: name of the group
   :jsonparam description: description of the group
   :statuscode 200: no error
   :statuscode 409: a group with the same name already exists

.. http:delete:: /api/group/(int:id)

   Delete the group. Only possible if no display are attached.

   **Example request**:

   .. sourcecode:: http

      DELETE /api/group/15 HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 204 OK
      Content-Type: application/json

   :param id: ID of the group
   :statuscode 204: no error
   :statuscode 404: group not found
   :statuscode 409: group with displays

.. _getdashboard:

Dashboards
++++++++++

.. http:get:: /api/group/(int:id)/dashboard

   The list of all dashboards in a group

   **Example request**:

   .. sourcecode:: http

      GET /api/group/15/dashboard HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      [
        {
            "active": false,
            "description": "House Stark",
            "group": 15,
            "id": 2,
            "timeout": 30,
            "url": "http://www.gameofthronescountdown.com/#stark",
            "viewport": null
        },
        {
            "active": true,
            "description": "House Tully",
            "group": 15,
            "id": 3,
            "timeout": 30,
            "url": "http://www.gameofthronescountdown.com/#tully",
            "viewport": null
        }
      ]

   :param id: group ID
   :statuscode 200: no error
   :statuscode 404: the group doesn't exist

.. http:post:: /api/group/(int:id)/dashboard

   Create a new dashboard

   **Example request**:

   .. sourcecode:: http

      POST /api/group/15/dashboard HTTP/1.1
      Accept: application/json

      {
        "url": "http://www.example.com",
        "timeout": 30
      }

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
            "active": false,
            "group": 15,
            "id": 6,
            "timeout": 30,
            "url": "http://www.example.com"
      }

   :param id: group ID
   :jsonparam url: URL of the dashboard
   :jsonparam description: description of the dashboard
   :jsonparam timeout: timer for this dashboard
   :jsonparam viewport: viewport for this dashboard
   :statuscode 200: no error
   :statuscode 404: group not found
   :statuscode 409: the URL is mandatory

.. http:put:: /api/group/(int:id)/dashboard/(int:dashid)

   Modify an existing dashboard. The special attribute `rank` can be
   used to modify the position of the dashboard in the group. The
   dashboards are numbered from 0 and the rank is the target position
   we want.

   **Example request**:

   .. sourcecode:: http

      POST /api/group/15/dashboard/6 HTTP/1.1
      Accept: application/json

      {
        "timeout": 40
      }

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 200 OK
      Content-Type: application/json

      {
            "active": false,
            "group": 15,
            "id": 6,
            "timeout": 40,
            "url": "http://www.example.com"
      }

   :param id: group ID
   :param dashid: dashboard ID
   :jsonparam url: URL of the dashboard
   :jsonparam description: description of the dashboard
   :jsonparam timeout: timer for this dashboard
   :jsonparam viewport: viewport for this dashboard
   :jsonparam rank: New position for the dashboard
   :statuscode 200: no error
   :statuscode 404: dashboard or group not found

.. http:delete:: /api/group/(int:id)/dashboard(int:dashid)

   Delete the dashboard.

   **Example request**:

   .. sourcecode:: http

      DELETE /api/group/15/dashboard/6 HTTP/1.1
      Accept: application/json

   **Example response**:

   .. sourcecode:: http

      HTTP/1.1 204 OK
      Content-Type: application/json

   :param id: ID of the group
   :param dashid: ID of the dashboard
   :statuscode 204: no error
   :statuscode 404: group or dashboard not found

Changes API
-----------

The socket.IO endpoint for this API is ``changes``. Upon connection, a
client will get all the current groups. Each group has a collection of
displays in the ``displays`` attribute and an array of dashboards in
the ``dashboards`` attribute. Here is an example::

      {
        "1": {
            "description": "Default group for unassigned displays", 
            "id": 1, 
            "name": "Unassigned",
            "displays": {},
            "dashboards": []
        }, 
        "2": {
            "description": "Dashboards with Game of Thrones stuff", 
            "id": 2, 
            "name": "Game of Thrones"
            "displays": {
               "CNDS0K": {
                  "connected": true,
                  "description": "Nexus 5 (localhost:9400)", 
                  "group": 10, 
                  "id": 5, 
                  "ip": null, 
                  "name": "CNDS0K", 
                  "viewport": "1920x1080"
               }
             }
            "dashboards": [
                  {
                    "active": false,
                    "description": "House Stark",
                    "group": 2,
                    "id": 2,
                    "timeout": 30,
                    "url": "http://www.gameofthronescountdown.com/#stark",
                    "viewport": null
                  },
                  {
                    "active": true,
                    "description": "House Tully",
                    "group": 2,
                    "id": 3,
                    "timeout": 30,
                    "url": "http://www.gameofthronescountdown.com/#tully",
                    "viewport": null
                  }
            ]
        }
      }

This message will be labeled ``snapshot``.

On changes, only the group or the display affected by the change will
be sent. The label of the message will be one of:

 - ``group.deleted``
 - ``group.updated``
 - ``group.created``

And for displays:

 - ``display.deleted``
 - ``display.updated`` (also for new displays)

If a change affects a dashboard, the whole group will be sent nonetheless.

Display API
-----------

This API is used by the display to know what they should do. The
socket.IO endpoint to use for it is ``displays``.

The server attributes to each new display a serial number. The display
is expected to remember it and transmit it back on the next
connection. It is encrypted by the server to avoid the display to
steal another display identity.

Upon connection, a display is expected to send a ``register`` message
with an object containing the ``blob`` attribute with the encrypted
identity it previously received (if any).

If the server accepts the identity as is, it answers to this message
with the same blob that should be stored by the client. If not, it
will generate a new blob and sends it back to the client. In both
cases, the client just has to store the received blob.

After this handshake, the display can receive the following messages:

 ``dashboard``
      The dashboard that should be displayed right now. It is an
      object containing the same attributes as we would have got when
      requesting this particular dashboard with the REST API. See
      :ref:`getdashboard`.
 ``reload``
      The display should reload itself.
 ``osd``
      The OSD should be shown or hidden. If the message comes with a
      text, the OSD is displayed with the provided text. Otherwise, it
      is hidden.
 ``viewport``
      Modify the current viewport of the display with the provided value.

Internal bus message
--------------------

To avoid strong coupling between components, *Dashkiosk* uses
`postal.js`_ as an internal bus message. The messages that are emitted
are listed below:

 - ``display.NAME.connected`` when a new display is connected
 - ``display.NAME.disconnected`` when a new display is disconnected
 - ``display.NAME.group`` when a display should change to a new group
 - ``display.NAME.deleted`` when a display is deleted
 - ``display.NAME.updated`` when another change happens on a display
 - ``display.NAME.dashboard`` when a new dashboard should be displayed by the given display.
 - ``display.NAME.reload`` when a display should reload itself
 - ``display.NAME.osd`` when we need to display something on the OSD
 - ``display.NAME.viewport`` when the display viewport should be updated
 - ``group.ID.created`` when a new group is created
 - ``group.ID.updated`` when a group is updated (but not something dashboard related)
 - ``group.ID.deleted`` when a group is deleted
 - ``group.ID.dashboard`` when a whole group should switch to a new dashboard
 - ``group.ID.dashboard.ID.added`` when a new dashboard has been added
 - ``group.ID.dashboard.ID.removed`` when a dashboard has been removed
 - ``group.ID.dashboard.ID.updated`` when a dashboard has been updated

Each message comes with the group, the dashboard and/or the display
specified in the message (when this is relevant).

.. _postal.js: https://github.com/postaljs/postal.js/
