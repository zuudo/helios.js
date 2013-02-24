var Helios;
(function (Helios) {
    var Graph = (function () {
        function Graph() {
            this.worker = new MessagePromise();
            this.worker.postMessage({
                method: 'init'
            }).then(function (val) {
                console.log(val);
            });
        }
        Graph.prototype.setConfiguration = function (options) {
            this.worker.postMessage([
                {
                    method: 'setConfiguration',
                    parameters: [
                        options
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
        };
        Graph.prototype.createVIndex = function (idxName) {
            this.worker.postMessage([
                {
                    method: 'createVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
        };
        Graph.prototype.createEIndex = function (idxName) {
            this.worker.postMessage([
                {
                    method: 'createEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
        };
        Graph.prototype.deleteVIndex = function (idxName) {
            this.worker.postMessage([
                {
                    method: 'deleteVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
        };
        Graph.prototype.deleteEIndex = function (idxName) {
            this.worker.postMessage([
                {
                    method: 'deleteEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
        };
        Graph.prototype.loadGraphSON = function (jsonData) {
            this.worker.postMessage([
                {
                    method: 'loadGraphSON',
                    parameters: [
                        jsonData
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
            return this;
        };
        Graph.prototype.loadGraphML = function (xmlData) {
            this.worker.postMessage([
                {
                    method: 'loadGraphML',
                    parameters: [
                        xmlData
                    ]
                }
            ]).then(function (val) {
                console.log(val);
            });
            return this;
        };
        Graph.prototype.v = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('v', args, this.worker);
        };
        Graph.prototype.e = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            return new Pipeline('e', args, this.worker);
        };
        return Graph;
    })();
    Helios.Graph = Graph;    
    var MessagePromise = (function () {
        function MessagePromise() {
            this.worker = new Worker('heliosWorker.js');
        }
        MessagePromise.prototype.postMessage = function (message) {
            var deferred = Q.defer();
            this.worker.postMessage(message);
            this.worker.onmessage = function (e) {
                deferred.resolve(e.data);
            };
            this.worker.onerror = function (e) {
                deferred.reject([
                    'ERROR: Line ', 
                    e.lineno, 
                    ' in ', 
                    e.filename, 
                    ': ', 
                    e.message
                ].join(''));
            };
            return deferred.promise;
        };
        return MessagePromise;
    })();    
    var Pipeline = (function () {
        function Pipeline(method, args, worker) {
            this.worker = worker;
            this.messages = [
                {
                    method: method,
                    parameters: args
                }
            ];
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
            this.messages.push({
                method: 'emit',
                paramaters: []
            });
            return this.worker.postMessage(this.messages);
        };
        return Pipeline;
    })();
    Helios.Pipeline = Pipeline;    
})(Helios || (Helios = {}));
//@ sourceMappingURL=helios.js.map
