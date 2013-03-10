var Helios;
(function (Helios) {
    var GraphDatabase = (function () {
        function GraphDatabase(options) {
            var msg = {
                method: 'init'
            };
            if(!!options) {
                msg.parameters = [
                    options
                ];
            }
            this.db = new Worker('heliosDB.js');
            this.mc = new MessageChannel();
            this.db.postMessage(msg, [
                this.mc.port2
            ]);
            this.mc.port1.onmessage = function (e) {
                console.log(e.data);
            };
        }
        GraphDatabase.prototype.setConfiguration = function (options) {
            return new Promise([
                {
                    method: 'setConfiguration',
                    parameters: [
                        options
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.setPathEnabled = function (turnOn) {
            return new Promise([
                {
                    method: 'setPathEnabled',
                    parameters: [
                        turnOn
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.createVIndex = function (idxName) {
            return new Promise([
                {
                    method: 'createVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.createEIndex = function (idxName) {
            return new Promise([
                {
                    method: 'createEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.deleteVIndex = function (idxName) {
            return new Promise([
                {
                    method: 'deleteVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.deleteEIndex = function (idxName) {
            return new Promise([
                {
                    method: 'deleteEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.loadGraphSON = function (jsonData) {
            return new Promise([
                {
                    method: 'loadGraphSON',
                    parameters: [
                        jsonData
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.loadGraphML = function (xmlData) {
            return new Promise([
                {
                    method: 'loadGraphML',
                    parameters: [
                        xmlData
                    ]
                }
            ], this.db);
        };
        GraphDatabase.prototype.v = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('v', args, this.db);
        };
        GraphDatabase.prototype.e = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('e', args, this.db);
        };
        return GraphDatabase;
    })();
    Helios.GraphDatabase = GraphDatabase;    
    var Promise = (function () {
        function Promise(messages, dbWorker) {
            this.dbWorker = dbWorker;
            var mc = new MessageChannel(), deferred = Q.defer();
            this.dbWorker.postMessage({
            }, [
                mc.port2
            ]);
function handler(event) {
                deferred.resolve(event.data.result);
                mc.port1.removeEventListener('message', handler, false);
                mc.port1.close();
            }
            mc.port1.addEventListener('message', handler, false);
            mc.port1.start();
            mc.port1.postMessage({
                message: messages
            });
            return deferred.promise;
        }
        return Promise;
    })();    
    var Pipeline = (function () {
        function Pipeline(method, args, dbWorker) {
            this.dbWorker = dbWorker;
            this.messages = [
                {
                    method: method,
                    parameters: args
                }
            ];
            this.out = this.add('out');
            this.in = this.add('in');
            this.both = this.add('both');
            this.bothE = this.add('bothE');
            this.bothV = this.add('bothV');
            this.inE = this.add('inE');
            this.inV = this.add('inV');
            this.outE = this.add('outE');
            this.outV = this.add('outV');
            this.id = this.add('id', true);
            this.label = this.add('label', true);
            this.getProperty = this.add('getProperty', true);
            this.count = this.add('count', true);
            this.stringify = this.add('stringify', true);
            this.hash = this.add('hash', true);
            this.emit = this.add('emit', true);
            this.path = this.add('path', true);
            this.step = this.add('step');
        }
        Pipeline.prototype.add = function (func, isFinal) {
            if (typeof isFinal === "undefined") { isFinal = false; }
            return function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                this.messages.push({
                    method: func,
                    parameters: args
                });
                return isFinal ? new Promise(this.messages, this.dbWorker) : this;
            };
        };
        return Pipeline;
    })();
    Helios.Pipeline = Pipeline;    
})(Helios || (Helios = {}));
//@ sourceMappingURL=helios.js.map
