var Helios;
(function (Helios) {
    var GraphDatabase = (function () {
        function GraphDatabase(args) {
            if(typeof args === 'string') {
                this.dbName = args;
                args = {
                    db: {
                        name: this.dbName
                    }
                };
            } else {
                this.dbName = args.db.name;
            }
            this.db = new Worker('heliosDB.js');
            this.mc = new MessageChannel();
            this.db.postMessage({
                method: 'init',
                parameters: [
                    args
                ]
            }, [
                this.mc.port2
            ]);
            this.mc.port1.onmessage = function (e) {
                console.log(e.data);
            };
        }
        GraphDatabase.prototype.setConfiguration = function (options) {
            this.mc.port1.postMessage([
                {
                    method: 'setConfiguration',
                    parameters: [
                        options
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.createVIndex = function (idxName) {
            this.mc.port1.postMessage([
                {
                    method: 'createVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.createEIndex = function (idxName) {
            this.mc.port1.postMessage([
                {
                    method: 'createEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.deleteVIndex = function (idxName) {
            this.mc.port1.postMessage([
                {
                    method: 'deleteVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.deleteEIndex = function (idxName) {
            this.mc.port1.postMessage([
                {
                    method: 'deleteEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.loadGraphSON = function (jsonData) {
            this.mc.port1.postMessage([
                {
                    method: 'loadGraphSON',
                    parameters: [
                        jsonData
                    ]
                }
            ]);
            return this;
        };
        GraphDatabase.prototype.loadGraphML = function (xmlData) {
            this.mc.port1.postMessage({
                message: [
                    {
                        method: 'loadGraphML',
                        parameters: [
                            xmlData
                        ]
                    }
                ]
            });
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
    var Pipeline = (function () {
        function Pipeline(method, args, dbWorker) {
            this.dbWorker = dbWorker;
            this.messages = [
                {
                    method: method,
                    parameters: args
                }
            ];
            this.deferreds = [];
            this.id = this.add('id');
            this.label = this.add('label');
            this.property = this.add('property');
            this.out = this.add('out');
            this.in = this.add('in');
            this.both = this.add('both');
            this.bothE = this.add('bothE');
            this.bothV = this.add('bothV');
            this.inE = this.add('inE');
            this.inV = this.add('inV');
            this.outE = this.add('outE');
            this.outV = this.add('outV');
        }
        Pipeline.prototype.add = function (func) {
            return function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                this.messages.push({
                    method: func,
                    parameters: args
                });
                return this;
            };
        };
        Pipeline.prototype.emit = function () {
            var mc = new MessageChannel(), deferred = Q.defer();
            this.dbWorker.postMessage({
                method: 'new'
            }, [
                mc.port2
            ]);
            this.messages.push({
                method: 'emit',
                paramaters: []
            });
            function handler(event) {
                deferred.resolve(event.data.result);
                mc.port1.removeEventListener('message', handler, false);
                mc.port1.close();
            }
            mc.port1.addEventListener('message', handler, false);
            mc.port1.start();
            mc.port1.postMessage({
                message: this.messages
            });
            return deferred.promise;
        };
        return Pipeline;
    })();
    Helios.Pipeline = Pipeline;    
})(Helios || (Helios = {}));
//@ sourceMappingURL=helios.js.map
