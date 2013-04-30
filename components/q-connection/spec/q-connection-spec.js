
require("./lib/jasmine-promise");
var Q = require("q");
var Queue = require("q/queue");
var Connection = require("../q-connection");

function makeChannel() {
    var sending = Queue();
    var receiving = Queue();
    return {
        l2r: {
            get: sending.get,
            put: receiving.put
        },
        r2l: {
            get: receiving.get,
            put: sending.put
        }
    };
}

function makePeers(local, remote) {
    var channel = makeChannel();
    return {
        local: Connection(channel.l2r, local),
        remote: Connection(channel.r2l, remote)
    }
}

describe("channel", function () {
    it("should send messages", function () {
        var channel = makeChannel();
        channel.l2r.put(10);
        channel.r2l.put(20);
        var a = channel.l2r.get().then(function (value) {
            expect(value).toBe(20);
        });
        var b = channel.r2l.get().then(function (value) {
            expect(value).toBe(10);
        });
        return Q.all([a, b]);
    })
});

describe("get", function () {
    it("should get the value of a remote property", function () {
        var peers = makePeers({
            a: 10
        });
        return peers.remote.get("a")
        .then(function (a) {
            expect(a).toBe(10);
        });
    });
});

describe("set", function () {
    it("should set the value for a remote property", function () {
        var local = {a: 10};
        var peers = makePeers(local);
        return peers.remote.set("a", 20)
        .then(function (result) {
            expect(result).toBe(undefined);
            expect(local.a).toBe(20);
        });
    });
});

describe("delete", function () {
    it("should delete a remote property", function () {
        var local = {a: 10};
        var peers = makePeers(local);
        return peers.remote.delete("a")
        .then(function (result) {
            expect(result).toBe(undefined);
            expect(local.a).toBe(undefined);
        });
    });
});

describe("keys", function () {
    it("should get the keys of a remote object", function () {
        var peers = makePeers({
            a: 10,
            b: 20
        });
        return peers.remote.keys()
        .then(function (keys) {
            expect(keys).toEqual(["a", "b"]);
        });
    });
});

describe("invoke", function () {
    it("should invoke a remote method", function () {
        var local = {
            add: function (a, b) {
                return a + b;
            }
        };
        var peers = makePeers(local);
        return peers.remote.invoke("add", 2, 3)
        .then(function (sum) {
            expect(sum).toBe(5);
        });
    });
});

describe("post", function () {
    it("should invoke a remote method", function () {
        var local = {
            add: function (a, b) {
                return a + b;
            }
        };
        var peers = makePeers(local);
        return peers.remote.post("add", [2, 3])
        .then(function (sum) {
            expect(sum).toBe(5);
        });
    });
});

describe("fcall", function () {
    it("should call a remote function", function () {
        var add = function (a, b) {
            return a + b;
        }
        var peers = makePeers(add);
        return peers.remote.fcall(2, 3)
        .then(function (sum) {
            expect(sum).toBe(5);
        });
    });
});

describe("fapply", function () {
    it("should call a remote function", function () {
        var add = function (a, b) {
            return a + b;
        }
        var peers = makePeers(add);
        return peers.remote.fapply([2, 3])
        .then(function (sum) {
            expect(sum).toBe(5);
        });
    });
});

describe("bidirectional communication", function () {
    it("should pass local promises to the remote", function () {
        var local = {
            bar: function (a, b) {
                expect(a).toBe("a");
                expect(b).toBe("b");
                return 10;
            }
        };
        var remote = {
            foo: function (local) {
                expect(Q.isPromise(local)).toBe(true);
                return local.invoke("bar", "a", "b");
            }
        };
        var peers = makePeers(remote, local);
        return peers.remote.invoke("foo", peers.local)
        .then(function (value) {
            expect(value).toBe(10);
        });
    });
});

describe("remote promises that fulfill to functions", function () {
    it("should become local functions", function () {
        var peers = makePeers({
            respond: function (callback) {
                return callback("World");
            }
        });
        return peers.remote.invoke('respond', function (who) {
            return "Hello, " + who + "!";
        })
        .then(function (message) {
            expect(message).toBe("Hello, World!");
        })
    });
});

describe("rejection", function () {
    it("should become local functions", function () {
        var peers = makePeers({
            respond: function () {
                throw new Error("No!");
            }
        });
        return peers.remote.invoke("respond")
        .then(function () {
            expect(true).toBe(false); // should not get here
        })
        .catch(function (error) {
            expect(error.message).toBe("No!");
        })
    });
});

