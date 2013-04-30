[![Build Status](https://secure.travis-ci.org/kriskowal/q-comm.png)](http://travis-ci.org/kriskowal/q-comm)

Asynchronous Remote Objects
---------------------------

This library makes it possible for objects to communicate
asynchronously between memory-isolated JavaScript contexts,
including pipelining interactions with results.  Promises
serve as proxies for remote objects.

Q-Comm works in Node and other CommonJS module loaders like
[Browserify][], [Mr][], and [Montage][].

[Q]: https://github.com/kriskowal/q
[Browserify]: https://github.com/substack/node-browserify
[Mr]: https://github.com/kriskowal/mr
[Montage]: https://github.com/montagejs/montage

This is how it looks:

```javascript
var Q = require("q");
var Connection = require("q-comm");
var remote = Connection(port, local);
```

The ``remote`` object is a promise for the ``local`` object
on the other side of the connection.  Likewise, the other
side of the connection will get a promise for your ``local``
object.  You are not obliged to provide a local object,
depending on which end of the connection is providing a
service.

If the ``remote`` or ``local`` object is not serializable,
like functions or objects with methods, the other side will
receive a promise but you will have to “send messages” to
the promise instead of interacting directly with the remote
object.  When you invoke a method on a remote object, you
get a promise for the result and you can immediately
pipeline a method call on the result.  This is the secret
sauce.

The ``port`` is any W3C message port, web worker, or web
socket.  In the W3C’s infinite wisdom, these do not have a
unified API, but Q-Comm will normalize them internally.

```javascript
// To communicate with objects in a worker
var worker = new Worker("worker.js");
var child = Connection(worker, local);
```

```javascript
// Inside a worker, to communicate with the parent
var parent = Connection(this);
```

```javascript
// To communicate with a remote object on the other side of
// a web socket
var socket = new WebSocket("ws://example.com");
var remote = Connection(socket, local);
```

```javascript
// To communicate with a single frame on the same origin
// (multiple frames will require some handshaking event sources)
var iframe = document.frames[0];
var child = Connection(iframe.contentWindow, local, {
    origin: window.location.origin
})
```

```javascript
// To communicate with a parent frame on the same origin
var child = Connection(window, local, {
    origin: window.location.origin
})
```

```javascript
// With a message port
var port = new MessagePort();
var near = Connection(port[0]);
var far = Connection(port[1]);
```

Your ``local`` value can be any JavaScript value, but it is
most handy for it to be an object that supports an API and
cannot be serialized with JSON.

```javascript
var Q = require("q");
var counter = 0;
var local = {
    "next": function () {
        return counter++;
    }
};
```

In this case, the local object has a "next" function that
returns incremental values.  Since the function closes on
local state (the ``counter``), it can't be sent to another
process.

On the other side of the connection, we can asynchronously
call the remote method and receive a promise for the result.

```javascript
remote.invoke("next")
.then(function (id) {
    console.log("counter at", i);
});
```

The connection is bi-directional.  Although you do not need
to provide and use both ``local`` and ``remote`` values on
both sides of a connection, they are available.

You can asynchronously interact with any value using the Q
API.  This chart shows the analogous operations for
interacting with objects synchronously and asynchronously.

```
synchronous                asynchronous
------------------         -------------------------------
value.foo                  promise.get("foo")
value.foo = value          promise.put("foo", value)
delete value.foo           promise.del("foo")
value.foo(...args)         promise.post("foo", [args])
value.foo(...args)         promise.invoke("foo", ...args)
value(...args)             promise.fapply([args])
value(...args)             promise.fcall(...args)
```

All of the asynchronous functions return promises for the
eventual result.  For the asynchronous functions, the value
may be any value including local values, local promises, and
remote promises.

The benefit to using the asynchronous API when interacting
with remote objects is that you can send chains of messages
to the promises that the connection makes.  That is, you can
call the method of a promise that has not yet been resolved,
so that message can be immediately sent over the wire to the
remote object.  This reduces the latency of interaction with
remote objects by removing network round-trips.

A chain of dependent operations can be contracted from:

```
<-client     server->
a..
   ''--..
         ''--..
               ''--..
             ..--''
       ..--''
 ..--''
b..
   ''--..
         ''--..
               ''--..
             ..--''
       ..--''
 ..--''
c..
   ''--..
         ''--..
               ''--..
             ..--''
       ..--''
 ..--''
```

Down to:

```
<-client     server->
a..
b..''--..
c..''--..''--..
   ''--..''--..''--..
         ''--..--''..
       ..--''..--''..
 ..--''..--''..--''
 ..--''..--''
 ..--''
```

Where the dotted lines represent messages traveling through
the network horizontally, and through time vertically.


Ports
-----

Q-Comm handles a variety of message ports or channel types.  They are
all internally converted into a Q Channel.  If you are using a message
channel that provides a different API than this or a WebWorker,
WebSocket, or MessagePort, you can adapt it to any of these interfaces
and Q-Comm will handle it.

This is probably the simplest way to create a channel duck-type,
assuming that you’ve got a connection instance of the Node variety.

```javascript
var port = {
    postMessage: function (message) {
        connection.send(message);
    },
    onmessage: null // gets filled in by Q-Comm
};
connection.on("message", function (data) {
    port.onmessage({data: ""})
});
var remote = Connection(port, local);
```

## Q Channels

-   ``get()`` returns a promise for the next message from the other
    side of the connection.  ``get`` may be called any number of times
    independent of when messages are actually received and each call
    will get a promise for the next message in sequence.
-   ``put(message)`` sends a message to the remote side of the
    connection.
-   ``close(reason_opt)`` indicates that no further messages will be
    sent.
-   ``closed`` a promise that is fulfilled with the reason for closing.

Q-Comm exports an indefinite ``Queue`` that supports this API which
greatly simplifies the implementation of adapters.

-   ``get()`` returns a promise for the next value in order that is
    put on the queue.  ``get`` may be called any number of times,
    regardless of whether the corresponding value is put on the queue
    before or after the ``get`` call.
-   ``put(value)`` puts a message on the queue.  Any number of
    messages can be put on the queue, indepent of whether and when the
    corresponding ``get`` is called.
-   ``close(reason_opt)`` indicates that no further messages will be
    put on the queue and that any promises for such messages must be
    rejected with the given reason.
-   ``closed`` a promise that is fulfilled when and if the queue has
    been closed.

## Web Workers and Message Ports

Q-Comm detects ports by their ``postMessage`` function.

-   ``postMessage(message)``
-   ``onmessage(handler(message))``

## Web Sockets

Q-Comm detects Web Sockets by their ``send`` function.  It takes the
liberty to start the socket and listens for when it opens.

-   ``send(message)``
-   ``addEventListener(event, handler(event))``
-   ``start()``
-   ``open`` event
-   ``close`` event

Memory
------

Q-Comm uses an LRU cache of specified size.  The default size is
infinite, which is horribly leaky.  Promises between peers will stick
around indefinitely.  This can be trimmed to something reasonable with
the ``max`` option.

```javascript
var remote = Connection(port, local, {max: 1024});
```

The least frequently used promises will be collected.  If the remote
attempts to communicate with a collected promise, the request will be
rejected.  This is fine if you have code in place to recover from
rejections that will revive the working set of promises.  The minimum
working set will vary depending on the load on your service.

