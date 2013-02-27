var Helios;
(function (Helios) {
    var Graph = (function () {
        function Graph() {
            this.worker = new SharedWorker('heliosWorker.js');
            this.worker.port.onmessage = function (e) {
                alert(e.data);
            };
            this.worker.port.postMessage({
                method: 'init'
            });
        }
        Graph.prototype.setConfiguration = function (options) {
            this.worker.port.postMessage([
                {
                    method: 'setConfiguration',
                    parameters: [
                        options
                    ]
                }
            ]);
        };
        Graph.prototype.createVIndex = function (idxName) {
            this.worker.port.postMessage([
                {
                    method: 'createVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        Graph.prototype.createEIndex = function (idxName) {
            this.worker.port.postMessage([
                {
                    method: 'createEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        Graph.prototype.deleteVIndex = function (idxName) {
            this.worker.port.postMessage([
                {
                    method: 'deleteVIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        Graph.prototype.deleteEIndex = function (idxName) {
            this.worker.port.postMessage([
                {
                    method: 'deleteEIndex',
                    parameters: [
                        idxName
                    ]
                }
            ]);
        };
        Graph.prototype.loadGraphSON = function (jsonData) {
            this.worker.port.postMessage([
                {
                    method: 'loadGraphSON',
                    parameters: [
                        jsonData
                    ]
                }
            ]);
            return this;
        };
        Graph.prototype.loadGraphML = function (xmlData) {
            this.worker.port.postMessage({
                message: [
                    {
                        method: 'loadGraphML',
                        parameters: [
                            xmlData
                        ]
                    }
                ]
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
    var MessageWorker = (function () {
        function MessageWorker() {
            this.worker = new Worker('heliosWorker.js');
            this.queue = [];
        }
        MessageWorker.prototype.postMessage = function (message) {
            var deferred = Q.defer();
            this.worker.onmessage = function (e) {
                deferred.resolve(e.data.result);
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
            message.id = UUID();
            this.worker.postMessage(message);
            return deferred.promise;
        };
        return MessageWorker;
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
            var w = new SharedWorker('heliosWorker.js');
            this.messages.push({
                method: 'emit',
                paramaters: []
            });
            w.port.addEventListener('message', function (e) {
                console.log(e.data);
                w.port.close();
            }, false);
            w.port.start();
            w.port.postMessage({
                id: UUID(),
                message: this.messages
            });
            return this;
        };
        return Pipeline;
    })();
    Helios.Pipeline = Pipeline;    
})(Helios || (Helios = {}));
//@ sourceMappingURL=helios.js.map
