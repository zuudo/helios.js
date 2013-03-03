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
            this.db = new SharedWorker('heliosDB.js', this.dbName);
            this.db.port.onmessage = function (e) {
                console.log(e.data);
            };
            this.db.port.postMessage({
                method: 'init',
                parameters: [
                    args
                ]
            });
        }
        GraphDatabase.prototype.setConfiguration = function (options) {
            this.db.port.postMessage([
                {
                    method: 'setConfiguration',
                    parameters: [
                        options
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.createVIndex = function (idxName) {
            this.db.port.postMessage([
                {
                    method: 'createVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.createEIndex = function (idxName) {
            this.db.port.postMessage([
                {
                    method: 'createEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.deleteVIndex = function (idxName) {
            this.db.port.postMessage([
                {
                    method: 'deleteVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.deleteEIndex = function (idxName) {
            this.db.port.postMessage([
                {
                    method: 'deleteEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        GraphDatabase.prototype.loadGraphSON = function (jsonData) {
            this.db.port.postMessage([
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
            this.db.port.postMessage({
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
            return new Pipeline('v', args, this.dbName);
        };
        GraphDatabase.prototype.e = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('e', args, this.dbName);
        };
        return GraphDatabase;
    })();
    Helios.GraphDatabase = GraphDatabase;    
    var Pipeline = (function () {
        function Pipeline(method, args, dbName) {
            this.dbName = dbName;
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
            var db = new SharedWorker('heliosDB.js', this.dbName), deferred = Q.defer();
            this.messages.push({
                method: 'emit',
                paramaters: []
            });
            function handler(event) {
                deferred.resolve(event.data.result);
                db.port.removeEventListener('message', handler, false);
                db.port.close();
            }
            db.port.addEventListener('message', handler, false);
            db.port.start();
            db.port.postMessage({
                message: this.messages
            });
            return deferred.promise;
        };
        return Pipeline;
    })();
    Helios.Pipeline = Pipeline;    
})(Helios || (Helios = {}));
//@ sourceMappingURL=helios.js.map
