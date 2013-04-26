var Helios;
(function (Helios) {
    var GraphDatabase = (function () {
        function GraphDatabase(options) {
            this.worker = new Worker('./libs/heliosDB.js');
            this.db = Q_COMM.Connection(this.worker, null, {
                max: 1024
            });
            this.db.invoke("init", options).then(function (message) {
                console.log(message);
            }).end();
        }
        GraphDatabase.prototype.setConfiguration = function (options) {
            this.worker.postMessage({
                async: false,
                message: [
                    {
                        method: 'setConfiguration',
                        parameters: [
                            options
                        ]
                    }
                ]
            });
        };
        GraphDatabase.prototype.setPathEnabled = function (turnOn) {
            this.worker.postMessage({
                async: false,
                message: [
                    {
                        method: 'setPathEnabled',
                        parameters: [
                            turnOn
                        ]
                    }
                ]
            });
        };
        GraphDatabase.prototype.createVIndex = function (idxName) {
            this.worker.postMessage({
                async: false,
                message: [
                    {
                        method: 'createVIndex',
                        parameters: [
                            idxName
                        ]
                    }
                ]
            });
        };
        GraphDatabase.prototype.createEIndex = function (idxName) {
            this.worker.postMessage({
                async: false,
                message: [
                    {
                        method: 'createEIndex',
                        parameters: [
                            idxName
                        ]
                    }
                ]
            });
        };
        GraphDatabase.prototype.deleteVIndex = function (idxName) {
            this.worker.postMessage({
                async: false,
                message: [
                    {
                        method: 'deleteVIndex',
                        parameters: [
                            idxName
                        ]
                    }
                ]
            });
        };
        GraphDatabase.prototype.deleteEIndex = function (idxName) {
            this.worker.postMessage({
                async: false,
                message: [
                    {
                        method: 'deleteEIndex',
                        parameters: [
                            idxName
                        ]
                    }
                ]
            });
        };
        GraphDatabase.prototype.loadGraphSON = function (jsonData) {
            this.db.invoke("run", [
                {
                    method: 'loadGraphSON',
                    parameters: [
                        jsonData
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.loadGraphML = function (xmlData) {
            this.db.invoke("run", [
                {
                    method: 'loadGraphML',
                    parameters: [
                        xmlData
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.v = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('v', args, this);
        };
        GraphDatabase.prototype.e = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('e', args, this);
        };
        return GraphDatabase;
    })();
    Helios.GraphDatabase = GraphDatabase;    
    var Pipeline = (function () {
        function Pipeline(method, args, helios) {
            this.helios = helios;
            this.messages = [
                {
                    method: method,
                    parameters: args
                }
            ];
            this.db = helios.db;
            this.out = this.add('out', true);
            this.in = this.add('in', true);
            this.both = this.add('both', true);
            this.bothE = this.add('bothE', true);
            this.bothV = this.add('bothV', true);
            this.inE = this.add('inE', true);
            this.inV = this.add('inV', true);
            this.outE = this.add('outE', true);
            this.outV = this.add('outV', true);
            this.id = this.add('id', false);
            this.label = this.add('label', false);
            this.property = this.add('property');
            this.count = this.add('count', false);
            this.stringify = this.add('stringify', false);
            this.map = this.add('map', false);
            this.hash = this.add('hash', false);
            this.where = this.add('where', true);
            this.index = this.add('index', true);
            this.range = this.add('range', true);
            this.dedup = this.add('dedup', true);
            this.transform = this.add('transform', false);
            this.as = this.add('as', true);
            this.back = this.add('back', true);
            this.optional = this.add('optional', true);
            this.except = this.add('except', true);
            this.retain = this.add('retain', true);
            this.path = this.add('path', false);
        }
        Pipeline.prototype.add = function (func, callEmit) {
            if (typeof callEmit === "undefined") { callEmit = true; }
            return function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                if(func == 'back' || func == 'path') {
                    this.db.invoke("pathTrace", true).fail(function (err) {
                        console.log(err.message);
                    }).end();
                }
                if(func == 'optional') {
                    this.db.invoke("optionalTrace", true).fail(function (err) {
                        console.log(err.message);
                    }).end();
                }
                this.messages.push({
                    method: func,
                    parameters: args,
                    emit: callEmit
                });
                return this;
            };
        };
        Pipeline.prototype.then = function (success, error) {
            this.db.invoke("run", this.messages).then(success, error).end();
        };
        return Pipeline;
    })();
    Helios.Pipeline = Pipeline;    
})(Helios || (Helios = {}));
//@ sourceMappingURL=helios.js.map
