
var Q = require("q");
var Queue = require("q/queue");

// Coerces a Worker to a Connection
// Idempotent: Passes Connections through unaltered
module.exports = adapt;
function adapt(port, origin) {
    var send;
    // Adapt the sender side
    // ---------------------
    if (port.postMessage) {
        // MessagePorts
        send = function (message) {
            // some message ports require an "origin"
            port.postMessage(message, origin);
        };
    } else if (port.send) {
        // WebSockets have a "send" method, indicating
        // that we cannot send until the connection has
        // opened.  We change the send method into a
        // promise for the send method, resolved after
        // the connection opens, rejected if it closes
        // before it opens.
        var deferred = Q.defer();
        send = deferred.promise;
        if (port.on) {
            deferred.resolve(port.send);
        } else if (port.addEventListener) {
            port.addEventListener("open", function () {
                deferred.resolve(port.send);
            });
            port.addEventListener("close", function () {
                queue.close();
                deferred.reject("Connection closed.");
            });
        }
    } else if (port.get && port.put) {
        return port;
    } else {
        throw new Error("An adaptable message port required");
    }

    // Adapt the receiver side
    // -----------------------
    // onmessage is one thing common between WebSocket and
    // WebWorker message ports.
    var queue = Queue();
    if (port.on) {
        port.on("message", function (data) {
            queue.put(data);
        }, false);
    } else if (port.addEventListener) {
        port.addEventListener("message", function (event) {
            queue.put(event.data);
        }, false);
    } else {
        port.onmessage = function (event) {
            queue.put(event.data);
        };
    }

    // Message ports have a start method; call it to make sure
    // that messages get sent.
    if (port.start) {
        port.start();
    }

    var close = function () {
        port.close && port.close();
        return queue.close();
    };

    return {
        "get": queue.get,
        "put": function (message) {
            return Q.invoke(send, "call", port, message);
        },
        "close": close,
        "closed": queue.closed
    };
}

