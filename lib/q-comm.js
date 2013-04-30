// vim:ts=4:sts=4:sw=4:
// This module can be loaded as a RequireJS module, a CommonJS module, or
// a browser script.  As a script, it creates a "Q_COMM" global name space
// and requires "Q" and "UUID" to already exist.  As a RequireJS module,
// it requires the "Q" package to be installed in the parent directory.
(function (definition) {
    var global = this;

    // RequireJS
    if (typeof define === "function") {
        define(["../q/q", "./uuid"], function (Q, UUID) {
            var exports = {};
            var imports = {"q": Q, "./uuid": UUID};
            definition(
                function (id) {
                    return imports[id];
                },
                exports
            );
            return exports;
        });

    // CommonJS
    } else if (typeof exports === "object") {
        definition(require, exports);

    // <script>
    } else {
        var imports = {"q": Q, "./uuid": UUID};
        definition(
            function (id) {
                return imports[id];
            },
            Q_COMM = {}
        );
    }

})(function (require, exports) {

var Q = require("q");
var UUID = require("./uuid");

function debug() {
    //typeof console !== "undefined" && console.log.apply(console, arguments);
}

var rootId = "";

var has = Object.prototype.hasOwnProperty;

/**
 * @param connection
 * @param local
 */
exports.Connection = Connection;
function Connection(connection, local, options) {
    options = options || {};
    var makeId = options.makeId || function () {
        return UUID.generate();
    };
    var locals = Lru(options.max || Infinity);
    connection = adapt(connection, options.origin);

    var debugKey = Math.random().toString(16).slice(2, 4).toUpperCase() + ":";
    function _debug() {
        debug.apply(null, [debugKey].concat(Array.prototype.slice.call(arguments)));
    }

    // message reciever loop
    Q.when(connection.get(), get).end();
    function get(message) {
        _debug("receive:", message);
        Q.when(connection.get(), get).end();
        receive(message);
    }

    // message receiver
    function receive(message) {
        message = JSON.parse(message);
        if (!receivers[message.type])
            return; // ignore bad message types
        if (!locals.has(message.to))
            return; // ignore messages to non-existant or forgotten promises
        receivers[message.type](message);
    }

    // message receiver handlers by message type
    var receivers = {
        "resolve": function (message) {
            if (locals.has(message.to)) {
                resolveLocal(message.to, decode(message.resolution));
            }
        },
        // a "send" message forwards messages from a remote
        // promise to a local promise.
        "send": function (message) {

            // forward the message to the local promise,
            // which will return a response promise
            var local = locals.get(message.to).promise;
            var response = Q.send.apply(
                void 0,
                [local, message.op].concat(decode(message.args))
            );

            // connect the local response promise with the
            // remote response promise:

            // if the value is ever resolved, send the
            // fulfilled value across the wire
            Q.when(response, function (resolution) {
                var envelope;
                try {
                    envelope = JSON.stringify({
                        "type": "resolve",
                        "to": message.from,
                        "resolution": encode(resolution)
                    });
                } catch (exception) {
                    envelope = JSON.stringify({
                        "type": "resolve",
                        "to": message.from,
                        "resolution": null
                    });
                }
                connection.put(envelope);
            }, function (reason) {
                var envelope;
                try {
                    envelope = JSON.stringify({
                        "type": "resolve",
                        "to": message.from,
                        "resolution": {"!": encode(reason)}
                    });
                } catch (exception) {
                    envelope = JSON.stringify({
                        "type": "resolve",
                        "to": message.from,
                        "resolution": {"!": null}
                    });
                }
                connection.put(envelope);
            })
            .end();

        }
    }

    // construct a local promise, such that it can
    // be resolved later by a remote message
    function makeLocal(id) {
        if (locals.has(id)) {
            return locals.get(id).promise;
        } else {
            var deferred = Q.defer();
            locals.set(id, deferred);
            return deferred.promise;
        }
    }

    // a utility for resolving the local promise
    // for a given identifier.
    function resolveLocal(id, value) {
        _debug('resolve:', "L" + JSON.stringify(id), JSON.stringify(value));
        locals.get(id).resolve(value);
    }

    // makes a promise that will send all of its events to a
    // remote object.
    function makeRemote(id) {
        return Q.makePromise({
        }, function (op) {
            var localId = makeId();
            var response = makeLocal(localId);
            var args = Array.prototype.slice.call(arguments, 1);
            _debug('sending:', "R" + JSON.stringify(id), JSON.stringify(op), JSON.stringify(args));
            connection.put(JSON.stringify({
                "type": "send",
                "to": id,
                "from": localId,
                "op": op,
                "args": encode(args)
            }));
            return response;
        });
    }

    // serializes an object tree, encoding promises such
    // that JSON.stringify on the result will produce
    // "QSON": serialized promise objects.
    function encode(object) {
        if (Q.isPromise(object)) {
            var id = makeId();
            makeLocal(id);
            resolveLocal(id, object);
            return {"@": id};
        } else if (Array.isArray(object)) {
            return object.map(encode);
        } else if (typeof object === "object") {
            var result = {};
            for (var key in object) {
                if (has.call(object, key)) {
                    var newKey = key;
                    if (/^[!@]$/.exec(key))
                        newKey = key + key;
                    result[newKey] = encode(object[key]);
                }
            }
            return result;
        } else {
            return object;
        }
    }

    // decodes QSON
    function decode(object) {
        if (!object) {
            return object;
        } else if (object['!']) {
            return Q.reject(object['!']);
        } else if (object['@']) {
            return makeRemote(object['@']);
        } else if (Array.isArray(object)) {
            return object.map(decode);
        } else if (typeof object === 'object') {
            var newObject = {};
            for (var key in object) {
                if (has.call(object, key)) {
                    var newKey = key;
                    if (/^[!@]+$/.exec(key))
                        newKey = key.substring(1);
                    newObject[newKey] = decode(object[key]);
                }
            }
            return newObject;
        } else {
            return object;
        }
    }

    // a peer-to-peer promise connection is symmetric: both
    // the local and remote side have a "root" promise
    // object. On each side, the respective remote object is
    // returned, and the object passed as an argument to
    // Connection is used as the local object.  The identifier of
    // the root object is an empty-string by convention.
    // All other identifiers are numbers.
    makeLocal(rootId);
    resolveLocal(rootId, local);
    return makeRemote(rootId);

}

// Coerces a Worker to a Connection
// Idempotent: Passes Connections through unaltered
function adapt(port, origin) {
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
        port.addEventListener("open", function () {
            deferred.resolve(port.send);
        });
        port.addEventListener("close", function () {
            queue.close();
            deferred.reject("Connection closed.");
        });
    } else if (port.get && port.put) {
        return port;
    } else {
        throw new Error("An adaptable message port required");
    }
    // Message ports have a start method; call it to make sure
    // that messages get sent.
    port.start && port.start();
    // onmessage is one thing common between WebSocket and
    // WebWorker message ports.
    var queue = Queue();
    if (port.addEventListener) {
        port.addEventListener("message", function (event) {
            queue.put(event.data);
        }, false);
    } else {
        port.onmessage = function (event) {
            queue.put(event.data);
        };
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

exports.Queue = Queue;
function Queue() {
    var ends = Q.defer();
    var closed = Q.defer();
    return {
        "put": function (value) {
            var next = Q.defer();
            ends.resolve({
                "head": value,
                "tail": next.promise
            });
            ends.resolve = next.resolve;
        },
        "get": function () {
            var result = ends.promise.get("head");
            ends.promise = ends.promise.get("tail");
            return result.fail(function (reason) {
                closed.resolve();
                return Q.reject(reason);
            });
        },
        "closed": closed.promise,
        "close": function (reason) {
            var end = {"head": Q.reject(reason)};
            end.tail = end;
            ends.resolve(end);
            return closed.promise;
        }
    };
}

// Least recently used. Caches up to maximum number of key: value pairs.
// Has a similar API to WeakMap, but avoids leaking by dropping, which
// will lead to broken promises on the remote side
var hasOwn = Object.prototype.hasOwnProperty;
function Lru(maxLength) {
    if (!maxLength)
        throw new Error("LRU cache must be constructed with a maximum length.");
    var map = {};
    var length = 0;

    var head = {};
    head.next = head;
    head.prev = head;
    function remove(node) {
        delete map[node.key];
        node.prev.next = node.next;
        node.next.prev = node.prev;
        length--;
    }
    function insert(node) {
        map[node.key] = node;
        var prev = head.prev;
        head.prev = node;
        node.prev = prev;
        prev.next = node;
        node.next = head;
        length++;
        if (length > maxLength)
            remove(head.next);
    }

    function get(key) {
        if (!hasOwn.call(map, key))
            throw new ValueError("LRU cache does not contain that key.");
        var node = map[key];
        remove(node);
        insert(node);
        return node.value;
    }
    function set(key, value) {
        var node;
        if (map[key]) {
            node = map[key];
            node.value = value;
            remove(node);
        } else {
            node = {};
            node.key = key;
            node.value = value;
        }
        insert(node);
    }
    function del(key) {
        var node = map[key];
        delete map[key];
        remove(node);
    }
    function has(key) {
        return hasOwn.call(map, key);
    }

    function toSource() {
        return '[LRU ' + length + ' ' +
            Object.keys(map).map(function (key) {
                var node = map[key];
                return (
                    (node.prev.key || '@') +
                    '<-' + key + ':' + node.value + '->' +
                    (node.next.key || '@')
                );
            }).join(' ') + ']';
    }

    return {
        "get": get,
        "set": set,
        "delete": del,
        "has": has,
        "toSource": toSource,
        "toString": toString
    }
}

});
