var Helios;
(function (Helios) {
    var GraphDatabase = (function () {
        function GraphDatabase(options) {
            this.worker = new Worker('./libs/heliosDB.js');
            this.db = Q_COMM.Connection(this.worker, null, {
                max: 1024
            });
            this.V = this.v;
            this.E = this.e;
            this.db.invoke("init", options).then(function (message) {
                console.log(message);
            }).end();
        }
        GraphDatabase.prototype.setConfiguration = function (options) {
            this.db.invoke("dbCommand", [
                {
                    method: 'setConfiguration',
                    parameters: [
                        options
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.createVIndex = function (idxName) {
            this.db.invoke("dbCommand", [
                {
                    method: 'createVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.createEIndex = function (idxName) {
            this.db.invoke("dbCommand", [
                {
                    method: 'createEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.deleteVIndex = function (idxName) {
            this.db.invoke("dbCommand", [
                {
                    method: 'deleteVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.deleteEIndex = function (idxName) {
            this.db.invoke("dbCommand", [
                {
                    method: 'deleteEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (message) {
                console.log(message);
            }).end();
        };
        GraphDatabase.prototype.loadGraphSON = function (jsonData) {
            this.db.invoke("dbCommand", [
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
            this.db.invoke("dbCommand", [
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
            this.out = this.add('out');
            this.in = this.add('in');
            this.both = this.add('both');
            this.bothE = this.add('bothE');
            this.bothV = this.add('bothV');
            this.inE = this.add('inE');
            this.inV = this.add('inV');
            this.outE = this.add('outE');
            this.outV = this.add('outV');
            this.id = this.add('id');
            this.label = this.add('label');
            this.property = this.add('property');
            this.count = this.add('count');
            this.stringify = this.add('stringify');
            this.map = this.add('map');
            this.hash = this.add('hash');
            this.where = this.add('where');
            this.index = this.add('index');
            this.range = this.add('range');
            this.dedup = this.add('dedup');
            this.transform = this.add('transform');
            this.filter = this.add('filter');
            this.as = this.add('as');
            this.back = this.add('back');
            this.optional = this.add('optional');
            this.loop = this.add('loop');
            this.except = this.add('except');
            this.retain = this.add('retain');
            this.path = this.add('path');
        }
        Pipeline.prototype.add = function (func) {
            return function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                if(func == 'back' || func == 'path' || func == 'optional') {
                    this.db.invoke("startTrace", true).fail(function (err) {
                        console.log(err.message);
                    }).end();
                }
                this.messages.push({
                    method: func,
                    parameters: args
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
