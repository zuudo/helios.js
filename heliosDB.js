"use strict";
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
if(!!self.importScripts) {
    importScripts('sax.js', 'moment.min.js');
    var g;
    self.onmessage = function (e) {
        var port = e.ports[0];
        function handler(e) {
            var msg = e.data.message;
            var t = g;
            for(var i = 0, l = msg.length; i < l; i++) {
                t = t[msg[i].method].apply(t, msg[i].parameters);
            }
            port.postMessage({
                result: t
            });
            port.removeEventListener('message', handler, false);
            port.close();
        }
        switch(e.data.method) {
            case 'init':
                g = !!e.data.parameters ? new Helios.GraphDatabase(e.data.parameters[0]) : new Helios.GraphDatabase();
                port.postMessage('done');
                break;
            default:
                break;
        }
        port.addEventListener("message", handler, false);
        port.start();
    };
}
;
var Helios;
(function (Helios) {
    var toString = Object.prototype.toString, ArrayProto = Array.prototype, push = ArrayProto.push, slice = ArrayProto.slice, indexOf = ArrayProto.indexOf;
    var Element = (function () {
        function Element(obj, graph) {
            this.obj = obj;
            this.graph = graph;
        }
        Element.prototype.addToIndex = function (idx, indexName) {
            var indexes, props, tempObj = {
            };
            indexes = !indexName ? Utils.keys(idx) : [
                indexName
            ];
            for(var i = 0, l = indexes.length; i < l; i++) {
                props = indexes[i].indexOf(".") > -1 ? indexes[i].split(".") : [
                    indexes[i]
                ];
                tempObj = this.obj;
                for(var i2 = 0, l2 = props.length; i2 < l2; i2++) {
                    if(tempObj.hasOwnProperty(props[i2])) {
                        if(Utils.isObject(tempObj[props[i2]])) {
                            tempObj = tempObj[props[i2]];
                        } else {
                            if(i2 < l2 - 1) {
                                break;
                            }
                            var iter = Utils.isArray(tempObj[props[i2]]) ? tempObj[props[i2]] : [
                                tempObj[props[i2]]
                            ];
                            for(var i3 = 0, l3 = iter.length; i3 < l3; i3++) {
                                if(!(idx[indexes[i]].hasOwnProperty(iter[i3]))) {
                                    idx[indexes[i]][iter[i3]] = {
                                    };
                                }
                                idx[indexes[i]][iter[i3]][this.obj[this.graph.meta.id]] = this;
                                push.call(this.indexKeys, indexes[i]);
                            }
                        }
                    }
                }
            }
        };
        return Element;
    })();
    Helios.Element = Element;    
    var Vertex = (function (_super) {
        __extends(Vertex, _super);
        function Vertex(obj, graph) {
                _super.call(this, obj, graph);
            this.outE = {
            };
            this.inE = {
            };
            this.Type = 'Vertex';
        }
        return Vertex;
    })(Element);
    Helios.Vertex = Vertex;    
    var Edge = (function (_super) {
        __extends(Edge, _super);
        function Edge(obj, graph) {
                _super.call(this, obj, graph);
            this.Type = 'Edge';
        }
        return Edge;
    })(Element);
    Helios.Edge = Edge;    
    var GraphDatabase = (function () {
        function GraphDatabase(options) {
            this.pathEnabled = true;
            this.date = {
                format: "DD/MM/YYYY"
            };
            this.currency = {
                symbol: '$',
                decimal: '.'
            };
            this.meta = {
                id: '_id',
                label: '_label',
                type: '_type',
                outEid: '_outE',
                inEid: '_inE',
                outVid: '_outV',
                inVid: '_inV',
                VOut: 'out',
                VIn: 'in'
            };
            this.db = {
                'baseUri': 'localhost',
                'port': 8182,
                'name': 'tinker',
                'type': 'orientdb',
                'ssl': false
            };
            if(!!options) {
                for(var k in options) {
                    if(options.hasOwnProperty(k)) {
                        this[k] = options[k];
                    }
                }
            } else {
                this.vertices = {
                };
                this.edges = {
                };
                this.v_idx = {
                };
                this.e_idx = {
                };
                if(!!options) {
                    this.setConfiguration(options);
                }
            }
            this._ = new Mogwai.Pipeline(this);
        }
        GraphDatabase.prototype.setPathEnabled = function (turnOn) {
            return this.pathEnabled = turnOn;
        };
        GraphDatabase.prototype.getPathEnabled = function () {
            return this.pathEnabled;
        };
        GraphDatabase.prototype.setConfiguration = function (options) {
            for(var k in options) {
                if(options.hasOwnProperty(k)) {
                    if(Utils.isObject(options[k])) {
                        var o = options[k];
                        for(var i in o) {
                            if(o.hasOwnProperty(i)) {
                                this[k][i] = o[i];
                            }
                        }
                        continue;
                    }
                    this[k] = options[k];
                }
            }
        };
        GraphDatabase.prototype.loadVertices = function (rows) {
            var i, l = rows.length, hasVIndex = !Utils.isEmpty(this.v_idx), vertex;
            for(i = 0; i < l; i++) {
                vertex = new Vertex(rows[i], this);
                this.vertices[rows[i][this.meta.id]] = vertex;
                if(hasVIndex) {
                    vertex.addToIndex(this.v_idx);
                }
            }
        };
        GraphDatabase.prototype.loadEdges = function (rows) {
            var i, l, edge, hasEIndex = !Utils.isEmpty(this.e_idx);
            for(i = 0 , l = rows.length; i < l; i += 1) {
                edge = new Edge(rows[i], this);
                this.edges[edge.obj[this.meta.id]] = edge;
                this.associateVertices(edge);
                if(hasEIndex) {
                    edge.addToIndex(this.e_idx);
                }
            }
        };
        GraphDatabase.prototype.createVIndex = function (idxName) {
            if(!(this.v_idx.hasOwnProperty(idxName))) {
                this.v_idx[idxName] = {
                };
                for(var k in this.vertices) {
                    if(this.vertices.hasOwnProperty(k)) {
                        this.vertices[k].addToIndex(this.v_idx, idxName);
                    }
                }
            }
        };
        GraphDatabase.prototype.createEIndex = function (idxName) {
            if(!(this.e_idx.hasOwnProperty(idxName))) {
                this.e_idx[idxName] = {
                };
                for(var k in this.edges) {
                    if(this.edges.hasOwnProperty(k)) {
                        this.edges[k].addToIndex(this.e_idx, idxName);
                    }
                }
            }
        };
        GraphDatabase.prototype.deleteVIndex = function (idxName) {
            delete this.v_idx[idxName];
        };
        GraphDatabase.prototype.deleteEIndex = function (idxName) {
            delete this.e_idx[idxName];
        };
        GraphDatabase.prototype.tracePath = function (enabled) {
            this.pathEnabled = enabled;
            return this.pathEnabled;
        };
        GraphDatabase.prototype.associateVertices = function (edge) {
            var vertex, outVobj = {
            }, inVobj = {
            };
            if(!edge.graph.vertices[edge.obj[edge.graph.meta.outVid]]) {
                outVobj[edge.graph.meta.id] = edge.obj[edge.graph.meta.outVid];
                edge.graph.vertices[edge.obj[edge.graph.meta.outVid]] = new Vertex(outVobj, edge.graph);
            }
            vertex = edge.graph.vertices[edge.obj[edge.graph.meta.outVid]];
            if(!vertex.outE[edge.obj[edge.graph.meta.label]]) {
                vertex.outE[edge.obj[edge.graph.meta.label]] = [];
            }
            edge.outV = vertex;
            edge.obj[edge.graph.meta.VOut] = edge.outV.obj;
            delete edge.obj[edge.graph.meta.outVid];
            push.call(vertex.outE[edge.obj[edge.graph.meta.label]], edge);
            if(!edge.graph.vertices[edge.obj[edge.graph.meta.inVid]]) {
                inVobj[edge.graph.meta.id] = edge.obj[edge.graph.meta.inVid];
                edge.graph.vertices[edge.obj[edge.graph.meta.inVid]] = new Vertex(inVobj, edge.graph);
            }
            vertex = edge.graph.vertices[edge.obj[edge.graph.meta.inVid]];
            if(!vertex.inE[edge.obj[edge.graph.meta.label]]) {
                vertex.inE[edge.obj[edge.graph.meta.label]] = [];
            }
            edge.inV = vertex;
            edge.obj[edge.graph.meta.VIn] = edge.inV.obj;
            delete edge.obj[edge.graph.meta.inVid];
            push.call(vertex.inE[edge.obj[edge.graph.meta.label]], edge);
        };
        GraphDatabase.prototype.loadGraphSON = function (jsonData) {
            var xmlhttp;
            var graph = this;
            if(Utils.isUndefined(jsonData)) {
                return null;
            }
            if(!!jsonData.vertices) {
                this.loadVertices(jsonData.vertices);
            }
            if(!!jsonData.edges) {
                this.loadEdges(jsonData.edges);
            }
            if(Utils.isString(jsonData)) {
                xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function () {
                    if(xmlhttp.readyState === 4) {
                        jsonData = JSON.parse(xmlhttp.responseText);
                        if(!!jsonData.vertices.length) {
                            graph.loadVertices(jsonData.vertices);
                        }
                        if(jsonData.edges) {
                            graph.loadEdges(jsonData.edges);
                        }
                    }
                };
                xmlhttp.open("GET", jsonData, true);
                xmlhttp.send(null);
            }
            return this;
        };
        GraphDatabase.prototype.loadGraphML = function (xmlData) {
            var _this = this;
            var i, j, l, propLen, xmlV = [], xmlE = [], vertex, edge, attr, vertex, edge, fileExt, xmlhttp, currProp, xmlDoc, properties, tempObj = {
            }, parser = sax.parser(true, {
                lowercase: true
            });
            var hasVIndex = !Utils.isEmpty(this.v_idx);
            var hasEIndex = !Utils.isEmpty(this.e_idx);
            parser.onerror = function (e) {
            };
            parser.ontext = function (t) {
                if(!!tempObj && (currProp in tempObj)) {
                    tempObj[currProp] = t;
                    currProp = undefined;
                }
            };
            parser.onopentag = function (node) {
                switch(node.name) {
                    case 'node':
                        attr = node.attributes;
                        for(var k in attr) {
                            if(attr.hasOwnProperty(k)) {
                                switch(k) {
                                    case 'id':
                                        if(!!_this.vertices[attr[k]]) {
                                            tempObj = _this.vertices[attr[k]].obj;
                                        } else {
                                            tempObj[_this.meta.id] = attr[k];
                                        }
                                        break;
                                    default:
                                }
                            }
                        }
                        break;
                    case 'edge':
                        attr = node.attributes;
                        for(var k in attr) {
                            if(attr.hasOwnProperty(k)) {
                                switch(k) {
                                    case 'id':
                                        tempObj[_this.meta.id] = attr[k];
                                        break;
                                    case 'label':
                                        tempObj[_this.meta.label] = attr[k];
                                        break;
                                    case 'source':
                                        tempObj[_this.meta.outVid] = attr[k];
                                        break;
                                    case 'target':
                                        tempObj[_this.meta.inVid] = attr[k];
                                        break;
                                    default:
                                }
                            }
                        }
                        break;
                    case 'data':
                        tempObj[node.attributes.key] = undefined;
                        currProp = node.attributes.key;
                        break;
                    default:
                }
                _this;
            };
            parser.onclosetag = function (node) {
                switch(node) {
                    case 'node':
                        vertex = new Vertex(tempObj, _this);
                        _this.vertices[tempObj[_this.meta.id]] = vertex;
                        if(hasVIndex) {
                            vertex.addToIndex(_this.v_idx);
                        }
                        tempObj = {
                        };
                        break;
                    case 'edge':
                        edge = new Edge(tempObj, _this);
                        _this.edges[tempObj[_this.meta.id]] = edge;
                        _this.associateVertices(edge);
                        if(hasEIndex) {
                            edge.addToIndex(_this.e_idx);
                        }
                        tempObj = {
                        };
                        break;
                    default:
                }
            };
            parser.onend = function () {
                tempObj = {
                };
                currProp = undefined;
            };
            if(Utils.isUndefined(xmlData)) {
                return null;
            }
            if(Utils.isString(xmlData)) {
                fileExt = xmlData.split('.').pop();
                if(fileExt.toLowerCase() === 'xml') {
                    xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function () {
                        if(xmlhttp.readyState === 4) {
                            parser.write(xmlhttp.responseText).close();
                        }
                    };
                    xmlhttp.open("GET", xmlData, true);
                    xmlhttp.send(null);
                } else {
                }
            }
            return this;
        };
        GraphDatabase.prototype.v = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            var pipe = [], l, temp, tempObj = {
            }, compObj = {
            }, outputObj = {
            }, subset = {
            }, tempObjArray = {
            }, preProcObj = {
            }, postProcObj = {
            }, tempObjArrLen = 0;
            if(!args.length) {
                return this._.startPipe(this.vertices);
            }
            args = Utils.flatten(args);
            l = args.length;
            if(Utils.isObject(args[0])) {
                for(var i = 0; i < l; i++) {
                    compObj = args[i];
                    preProcObj = {
                    };
                    postProcObj = {
                    };
                    for(var k in compObj) {
                        if(compObj.hasOwnProperty(k)) {
                            if(this.v_idx.hasOwnProperty(k)) {
                                preProcObj[k] = compObj[k];
                            } else {
                                postProcObj[k] = compObj[k];
                            }
                        }
                    }
                    var item;
                    for(var prop in preProcObj) {
                        if(preProcObj.hasOwnProperty(prop)) {
                            var items = this.v_idx[prop];
                            for(var m in items) {
                                if(items.hasOwnProperty(m)) {
                                    var funcObj = preProcObj[prop];
                                    for(var func in funcObj) {
                                        if(funcObj.hasOwnProperty(func)) {
                                            if(Utils.include([
                                                '$exact', 
                                                '$none', 
                                                '$all'
                                            ], func)) {
                                                item = items[m];
                                                for(var it in item) {
                                                    if(item.hasOwnProperty(it)) {
                                                        if(Mogwai.Compare[func].call(null, item[it].obj[prop], funcObj[func])) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            } else {
                                                if(Mogwai.Compare[func].call(null, m, funcObj[func])) {
                                                    item = items[m];
                                                    for(var it in item) {
                                                        if(item.hasOwnProperty(it)) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if(!Utils.isEmpty(tempObj)) {
                                push.call(tempObjArray, tempObj);
                            }
                        }
                    }
                    var pipeline;
                    var postIsEmpty = Utils.isEmpty(postProcObj);
                    tempObjArrLen = tempObjArray.length;
                    if(!!tempObjArrLen) {
                        if(tempObjArrLen == 1) {
                            if(postIsEmpty) {
                                outputObj = tempObjArray[0];
                            } else {
                                pipeline = this._.startPipe(tempObjArray[0]);
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        } else {
                            if(postIsEmpty) {
                                outputObj = Utils.intersectElement(tempObjArray);
                            } else {
                                pipeline = this._.startPipe(Utils.intersectElement(tempObjArray));
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        }
                    } else {
                        if(!postIsEmpty) {
                            pipeline = this._.startPipe(this.vertices);
                            tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                        }
                    }
                    if(!postIsEmpty) {
                        var id;
                        for(var ind = 0, len = tempObjArray.length; ind < len; ind++) {
                            id = tempObjArray[ind].obj[this.meta.id];
                            outputObj[id] = tempObjArray[ind];
                        }
                    }
                    tempObj = {
                    };
                    tempObjArray = [];
                }
                return this._.startPipe(outputObj);
            }
            for(var i = 0; i < l; i++) {
                temp = this.vertices[args[i]];
                if(typeof temp === "undefined") {
                    throw new ReferenceError('No vertex with id ' + args[i]);
                }
                push.call(pipe, temp);
            }
            return this._.startPipe(pipe);
        };
        GraphDatabase.prototype.e = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            var pipe = [], l, temp, tempObj = {
            }, compObj = {
            }, outputObj = {
            }, subset = {
            }, tempObjArray = [], preProcObj = {
            }, postProcObj = {
            }, tempObjArrLen = 0;
            if(!args.length) {
                return this._.startPipe(this.edges);
            }
            args = Utils.flatten(args);
            l = args.length;
            if(Utils.isObject(args[0])) {
                for(var i = 0; i < l; i++) {
                    compObj = args[i];
                    preProcObj = {
                    };
                    postProcObj = {
                    };
                    for(var k in compObj) {
                        if(compObj.hasOwnProperty(k)) {
                            if(this.e_idx.hasOwnProperty(k)) {
                                preProcObj[k] = compObj[k];
                            } else {
                                postProcObj[k] = compObj[k];
                            }
                        }
                    }
                    var item;
                    for(var prop in preProcObj) {
                        if(preProcObj.hasOwnProperty(prop)) {
                            var items = this.e_idx[prop];
                            for(var m in items) {
                                if(items.hasOwnProperty(m)) {
                                    var funcObj = preProcObj[prop];
                                    for(var func in funcObj) {
                                        if(funcObj.hasOwnProperty(func)) {
                                            if(Utils.include([
                                                '$exact', 
                                                '$none', 
                                                '$all'
                                            ], func)) {
                                                item = items[m];
                                                for(var it in item) {
                                                    if(item.hasOwnProperty(it)) {
                                                        if(Mogwai.Compare[func].call(null, item[it].obj[prop], funcObj[func])) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            } else {
                                                if(Mogwai.Compare[func].call(null, m, funcObj[func])) {
                                                    item = items[m];
                                                    for(var it in item) {
                                                        if(item.hasOwnProperty(it)) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if(!Utils.isEmpty(tempObj)) {
                                tempObjArray.push(tempObj);
                            }
                        }
                    }
                    var pipeline;
                    var postIsEmpty = Utils.isEmpty(postProcObj);
                    tempObjArrLen = tempObjArray.length;
                    if(!!tempObjArrLen) {
                        if(tempObjArrLen == 1) {
                            if(postIsEmpty) {
                                outputObj = tempObjArray[0];
                            } else {
                                pipeline = this._.startPipe(tempObjArray[0]);
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        } else {
                            if(postIsEmpty) {
                                outputObj = Utils.intersectElement(tempObjArray);
                            } else {
                                pipeline = this._.startPipe(Utils.intersectElement(tempObjArray));
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        }
                    } else {
                        if(!postIsEmpty) {
                            pipeline = this._.startPipe(this.edges);
                            tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                        }
                    }
                    if(!postIsEmpty) {
                        var id;
                        for(var ind = 0, len = tempObjArray.length; ind < len; ind++) {
                            id = tempObjArray[ind].obj[this.meta.id];
                            outputObj[id] = tempObjArray[ind];
                        }
                    }
                    tempObj = {
                    };
                    tempObjArray = [];
                }
                return this._.startPipe(outputObj);
            }
            for(var i = 0; i < l; i++) {
                temp = this.edges[args[i]];
                if(typeof temp === "undefined") {
                    throw new ReferenceError('No edge with id ' + args[i]);
                }
                push.call(pipe, temp);
            }
            return this._.startPipe(pipe);
        };
        return GraphDatabase;
    })();
    Helios.GraphDatabase = GraphDatabase;    
    (function (Mogwai) {
        function getEndPipe() {
            return this.endPipe;
        }
        Mogwai.getEndPipe = getEndPipe;
        var Pipeline = (function () {
            function Pipeline(graph, elements) {
                this.graph = graph;
                this.tracing = false;
                this.steps = {
                    currentStep: 1
                };
                if(!!elements) {
                    this.startPipe(elements);
                }
            }
            Pipeline.prototype.startPipe = function (elements) {
                var pipe;
                this.endPipe = [];
                this.pipeline = this.graph.pathEnabled ? [] : undefined;
                Utils.each(elements, function (element) {
                    if(this.graph.pathEnabled) {
                        pipe = [];
                        pipe.push(element);
                        this.pipeline.push(pipe);
                    }
                    this.endPipe.push(element);
                }, this);
                return this;
            };
            Pipeline.prototype.id = function () {
                return this.getProperty(this.graph.meta.id);
            };
            Pipeline.prototype.label = function () {
                return this.getProperty(this.graph.meta.label);
            };
            Pipeline.prototype.out = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'out',
                    args: labels
                };
                if(isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if(this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if(!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }
                    if(Utils.isEmpty(vertex.outE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.outE, labels)))) {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                        return;
                    }
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.inV);
                        if(isTracing) {
                            traceArray.push(edge.inV.obj[this.graph.meta.id]);
                        }
                        if(isTracingPath) {
                            pipe = [];
                            pipe.push.apply(next);
                            pipe.push(edge.inV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.inV);
                        }
                    }, this);
                    if(isTracing) {
                        Utils.setTrace(this.traceObj, vertex, traceArray);
                        traceArray = [];
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.in = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'in',
                    args: labels
                };
                if(isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if(this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if(!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }
                    if(Utils.isEmpty(vertex.inE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.inE, labels)))) {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                        return;
                    }
                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.outV);
                        if(isTracing) {
                            traceArray.push(edge.outV.obj[this.graph.meta.id]);
                        }
                        if(isTracingPath) {
                            pipe = [];
                            pipe.push.apply(next);
                            pipe.push(edge.outV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.outV);
                        }
                    }, this);
                    if(isTracing) {
                        Utils.setTrace(this.traceObj, vertex, traceArray);
                        traceArray = [];
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.outV = function () {
                var edge, iter, endPipeArray = [], isTracing = !!this.tracing, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                this.steps[++this.steps.currentStep] = {
                    func: 'outV'
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Step ' + this.steps.currentStep + ' only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.traversed = isTracing ? {
                } : undefined;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = isTracingPath ? slice.call(next, -1)[0] : next;
                    endPipeArray.push(edge.outV);
                    if(isTracing && !(this.traversed.hasOwnProperty(edge.obj[this.graph.meta.id]))) {
                        Utils.setTrace(this.traceObj, edge, [
                            edge.outV.obj[this.graph.meta.id]
                        ]);
                        this.traversed[edge.obj[this.graph.meta.id]] = true;
                    }
                    if(isTracingPath) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.outV);
                        pipes.push(pipe);
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                    this.traversed = undefined;
                }
                this.pipeline = isTracingPath ? pipes : undefined;
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.inV = function () {
                var edge, iter = [], endPipeArray = [], isTracing = !!this.tracing, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                ;
                this.steps[++this.steps.currentStep] = {
                    func: 'inV'
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Step ' + this.steps.currentStep + ' only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.traversed = isTracing ? {
                } : undefined;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = isTracingPath ? slice.call(next, -1)[0] : next;
                    endPipeArray.push(edge.inV);
                    if(isTracing && !(this.traversed.hasOwnProperty(edge.obj[this.graph.meta.id]))) {
                        Utils.setTrace(this.traceObj, edge, [
                            edge.inV.obj[this.graph.meta.id]
                        ]);
                        this.traversed[edge.obj[this.graph.meta.id]] = true;
                    }
                    if(isTracingPath) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.inV);
                        pipes.push(pipe);
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                    this.traversed = undefined;
                }
                this.pipeline = isTracingPath ? pipes : undefined;
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.outE = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'outE',
                    args: labels
                };
                if(isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if(this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if(!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }
                    if(Utils.isEmpty(vertex.outE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.outE, labels)))) {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                        return;
                    }
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(isTracing) {
                            traceArray.push(edge.obj[this.graph.meta.id]);
                        }
                        if(isTracingPath) {
                            pipe = [];
                            pipe.push.apply(next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                    if(isTracing) {
                        Utils.setTrace(this.traceObj, vertex, traceArray);
                        traceArray = [];
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.inE = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'inE',
                    args: labels
                };
                if(isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if(this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if(!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }
                    if(Utils.isEmpty(vertex.inE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.inE, labels)))) {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                        return;
                    }
                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(isTracing) {
                            traceArray.push(edge.obj[this.graph.meta.id]);
                        }
                        if(isTracingPath) {
                            pipe = [];
                            pipe.push.apply(next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                    if(isTracing) {
                        Utils.setTrace(this.traceObj, vertex, traceArray);
                        traceArray = [];
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.both = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                this.steps[++this.steps.currentStep] = {
                    func: 'both',
                    args: labels
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                if(isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if(this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if(!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }
                    if(Utils.isEmpty(vertex.outE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.outE, labels)))) {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                    } else {
                        value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                        Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                            endPipeArray.push(edge.inV);
                            if(isTracing) {
                                traceArray.push(edge.inV.obj[this.graph.meta.id]);
                            }
                            if(isTracingPath) {
                                pipe = [];
                                pipe.push.apply(pipe, next);
                                pipe.push(edge.inV);
                                pipes.push(pipe);
                            } else {
                                push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.inV);
                            }
                        }, this);
                    }
                    if(Utils.isEmpty(vertex.inE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.inE, labels)))) {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                    } else {
                        value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                        Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                            endPipeArray.push(edge.outV);
                            if(isTracing) {
                                traceArray.push(edge.outV.obj[this.graph.meta.id]);
                            }
                            if(isTracingPath) {
                                pipe = [];
                                pipe.push.apply(pipe, next);
                                pipe.push(edge.outV);
                                pipes.push(pipe);
                            } else {
                                push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.outV);
                            }
                        }, this);
                    }
                    if(isTracing) {
                        Utils.setTrace(this.traceObj, vertex, traceArray);
                        traceArray = [];
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.bothV = function () {
                var edge, iter = [], endPipeArray = [], isTracing = !!this.tracing, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                ;
                this.steps[++this.steps.currentStep] = {
                    func: 'bothV'
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.traversed = isTracing ? {
                } : undefined;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = isTracingPath ? slice.call(next, -1)[0] : next;
                    endPipeArray.push.apply(endPipeArray, [
                        edge.outV, 
                        edge.inV
                    ]);
                    if(isTracing && !(this.traversed.hasOwnProperty(edge.obj[this.graph.meta.id]))) {
                        Utils.setTrace(this.traceObj, edge, [
                            edge.outV.obj[this.graph.meta.id], 
                            edge.inV.obj[this.graph.meta.id]
                        ]);
                        this.traversed[edge.obj[this.graph.meta.id]] = true;
                    }
                    if(isTracingPath) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.outV);
                        pipes.push(pipe);
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.inV);
                        pipes.push(pipe);
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                    this.traversed = undefined;
                }
                this.pipeline = isTracingPath ? pipes : undefined;
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.bothE = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, pipe;
                this.steps[++this.steps.currentStep] = {
                    func: 'bothE',
                    args: labels
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                if(isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if(this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if(!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }
                    if(Utils.isEmpty(vertex.outE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.outE, labels)))) {
                        if(isTracing && (Utils.isEmpty(vertex.inE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.inE, labels))))) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                    } else {
                        value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                        Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                            endPipeArray.push(edge);
                            if(isTracing) {
                                traceArray.push(edge.obj[this.graph.meta.id]);
                            }
                            if(isTracingPath) {
                                pipe = [];
                                pipe.push.apply(pipe, next);
                                pipe.push(edge);
                                pipes.push(pipe);
                            } else {
                                push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                            }
                        }, this);
                    }
                    if(Utils.isEmpty(vertex.inE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.inE, labels)))) {
                        if(isTracing && (Utils.isEmpty(vertex.outE) || (hasArgs && Utils.isEmpty(Utils.pick(vertex.outE, labels))))) {
                            Utils.stopTrace(this.traceObj, vertex);
                        }
                    } else {
                        value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                        Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                            endPipeArray.push(edge);
                            if(isTracing) {
                                traceArray.push(edge.obj[this.graph.meta.id]);
                            }
                            if(isTracingPath) {
                                pipe = [];
                                pipe.push.apply(pipe, next);
                                pipe.push(edge);
                                pipes.push(pipe);
                            } else {
                                push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                            }
                        }, this);
                    }
                    if(isTracing) {
                        Utils.setTrace(this.traceObj, vertex, traceArray);
                        traceArray = [];
                    }
                }, this);
                if(isTracing) {
                    Utils.finalizeTrace(this.traceObj);
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.getProperty = function (prop) {
                var array = [], tempObj, tempProp, isEmbedded = prop.indexOf(".") > -1;
                tempProp = isEmbedded ? prop.split(".").slice(-1)[0] : prop;
                Utils.each(this.endPipe, function (element) {
                    tempObj = isEmbedded ? Utils.embeddedObject(element.obj, prop) : element.obj;
                    if(!Utils.isObject(tempObj[tempProp]) && tempObj.hasOwnProperty(tempProp)) {
                        array.push(tempObj[tempProp]);
                    }
                });
                this.endPipe = [];
                return array;
            };
            Pipeline.prototype.order = function (order) {
                var endPipeArray = [], isElement = !!this.endPipe.length && Utils.isElement(this.endPipe[0]), type;
                if(!!order && Utils.isFunction(order)) {
                    if(isElement) {
                        type = this.endPipe[0].Type;
                        endPipeArray = Utils.pluck(this.endPipe, this.graph.meta.id);
                        endPipeArray.sort(order);
                        this.endPipe = Utils.materializeElementArray(endPipeArray, this.graph, type);
                    } else {
                        this.endPipe.sort(order);
                    }
                } else {
                    if(isElement) {
                        type = this.endPipe[0].Type;
                        endPipeArray = Utils.pluck(this.endPipe, this.graph.meta.id);
                        if(!!parseInt(endPipeArray[0])) {
                            order == -1 ? endPipeArray.sort(function (a, b) {
                                return b - a;
                            }) : endPipeArray.sort(function (a, b) {
                                return a - b;
                            });
                        } else {
                            order == -1 ? endPipeArray.reverse() : endPipeArray.sort();
                        }
                        this.endPipe = Utils.materializeElementArray(endPipeArray, this.graph, type);
                    } else {
                        order == -1 ? this.endPipe.reverse() : this.endPipe.sort();
                    }
                }
                return this;
            };
            Pipeline.prototype.range = function (start, end) {
                this.endPipe = !!end ? this.endPipe.slice(start, end) : this.endPipe.slice(start);
                return this;
            };
            Pipeline.prototype.itemAt = function (indices) {
                var endPipeArray = [], idx = Utils.flatten(indices);
                for(var i = 0, l = idx.length; i < l; i++) {
                    if(idx[i] > -1 && idx[i] < this.endPipe.length) {
                        endPipeArray.push(this.endPipe[idx[i]]);
                    }
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.dedup = function () {
                this.endPipe = Utils.uniqueElement(this.endPipe);
                return this;
            };
            Pipeline.prototype.except = function (dataSet) {
                var exclIds = Utils.pluck(Utils.flatten(dataSet), this.graph.meta.id);
                var ids = Utils.pluck(this.endPipe, this.graph.meta.id);
                var endPipeIds = Utils.difference(ids, exclIds);
                this.endPipe = Utils.materializeElementArray(endPipeIds, this.graph, this.endPipe[0].Type);
                return this;
            };
            Pipeline.prototype.retain = function (dataSet) {
                var intersectIds = Utils.pluck(Utils.flatten(dataSet), this.graph.meta.id);
                var ids = Utils.pluck(this.endPipe, this.graph.meta.id);
                var endPipeIds = Utils.intersection(ids, intersectIds);
                this.endPipe = Utils.materializeElementArray(endPipeIds, this.graph, this.endPipe[0].Type);
                return this;
            };
            Pipeline.prototype.where = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                var element, iter = [], l, nextIter = [], comparables = [], endPipeArray = [], isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, funcObj, tempObj, compObj, tempProp, propVals = [], isIn;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                comparables = Utils.flatten(args);
                l = comparables.length;
                for(var i = 0; i < l; i++) {
                    compObj = comparables[i];
                    Utils.each(iter, function (next) {
                        element = isTracingPath ? slice.call(next, -1)[0] : next;
                        for(var prop in compObj) {
                            isIn = false;
                            if(compObj.hasOwnProperty(prop)) {
                                if(prop.charAt(0) === "$") {
                                    propVals = compObj[prop];
                                    if(!Compare[prop].call(null, element.obj, propVals)) {
                                        if(i < l) {
                                            nextIter.push(next);
                                        } else {
                                            Utils.stopTrace(this.traceObj, element);
                                        }
                                        return;
                                    }
                                } else {
                                    tempObj = element.obj;
                                    tempProp = prop;
                                    if(tempProp.indexOf(".") > -1) {
                                        tempObj = Utils.embeddedObject(tempObj, tempProp);
                                        tempProp = tempProp.split(".").slice(-1)[0];
                                    }
                                    if(Utils.isObject(tempObj[tempProp]) || !tempObj.hasOwnProperty(tempProp)) {
                                        if(i < l) {
                                            nextIter.push(next);
                                        } else {
                                            Utils.stopTrace(this.traceObj, element);
                                        }
                                        return;
                                    }
                                    funcObj = compObj[prop];
                                    for(var func in funcObj) {
                                        if(funcObj.hasOwnProperty(func)) {
                                            if(Compare[func].call(null, tempObj[tempProp], funcObj[func], this.graph)) {
                                                if(!isIn) {
                                                    isIn = true;
                                                }
                                            }
                                        }
                                    }
                                    if(!isIn) {
                                        if(i < l) {
                                            nextIter.push(next);
                                        } else {
                                            Utils.stopTrace(this.traceObj, element);
                                        }
                                        return;
                                    }
                                }
                            }
                        }
                        endPipeArray.push(element);
                        if(isTracingPath) {
                            pipes.push(next);
                        }
                    }, this);
                    iter = nextIter;
                    nextIter = [];
                }
                if(isTracingPath) {
                    this.pipeline = pipes;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.filter = function (func) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    args[_i] = arguments[_i + 1];
                }
                var element, iter = [], endPipeArray = [], isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    element = isTracingPath ? slice.call(next, -1)[0] : next;
                    if(func.apply(element.obj, args)) {
                        endPipeArray.push(element);
                        if(isTracingPath) {
                            pipes.push(next);
                        }
                    } else {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, element);
                        }
                    }
                }, this);
                if(isTracingPath) {
                    this.pipeline = pipes;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.min = function (arg) {
                var element, iter = [], endPipeArray = [], isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, comp, newComp, tempObj, tempProp, isEmbedded = arg.indexOf(".") > -1;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                tempProp = isEmbedded ? arg.split(".").slice(-1)[0] : arg;
                Utils.each(iter, function (next) {
                    element = isTracingPath ? slice.call(next, -1)[0] : next;
                    tempObj = isEmbedded ? Utils.embeddedObject(element.obj, arg) : element.obj;
                    if(tempObj.hasOwnProperty(tempProp) && !Utils.isArray(tempObj[tempProp])) {
                        if(!isNaN(Utils.parseNumber(tempObj[tempProp], this.graph))) {
                            newComp = Utils.parseNumber(tempObj[tempProp], this.graph);
                        } else {
                            if(isTracing) {
                                Utils.stopTrace(this.traceObj, element);
                            }
                            return;
                        }
                        if(!!comp) {
                            if(newComp < comp) {
                                endPipeArray = [
                                    element
                                ];
                                if(isTracingPath) {
                                    pipes = [];
                                    pipes.push(next);
                                }
                                comp = newComp;
                            } else if(newComp == comp) {
                                endPipeArray.push(element);
                                if(isTracingPath) {
                                    pipes.push(next);
                                }
                            } else {
                                if(isTracing) {
                                    Utils.stopTrace(this.traceObj, element);
                                }
                            }
                        } else {
                            comp = newComp;
                            endPipeArray.push(element);
                            if(isTracingPath) {
                                pipes.push(next);
                            }
                        }
                    } else {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, element);
                        }
                    }
                }, this);
                if(isTracingPath) {
                    this.pipeline = pipes;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.max = function (arg) {
                var element, iter = [], endPipeArray = [], isTracing = !!this.tracing, traceArray = isTracing ? [] : undefined, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, comp, newComp, tempObj, tempProp, isEmbedded = arg.indexOf(".") > -1;
                iter = isTracingPath ? this.pipeline : this.endPipe;
                tempProp = isEmbedded ? arg.split(".").slice(-1)[0] : arg;
                Utils.each(iter, function (next) {
                    element = isTracingPath ? slice.call(next, -1)[0] : next;
                    tempObj = isEmbedded ? Utils.embeddedObject(element.obj, arg) : element.obj;
                    if(tempObj.hasOwnProperty(tempProp) && !Utils.isArray(tempObj[tempProp])) {
                        if(!isNaN(Utils.parseNumber(tempObj[tempProp], this.graph))) {
                            newComp = Utils.parseNumber(tempObj[tempProp], this.graph);
                        } else {
                            if(isTracing) {
                                Utils.stopTrace(this.traceObj, element);
                            }
                            return;
                        }
                        if(!!comp) {
                            if(newComp > comp) {
                                endPipeArray = [
                                    element
                                ];
                                if(isTracingPath) {
                                    pipes = [];
                                    pipes.push(next);
                                }
                                comp = newComp;
                            } else if(newComp == comp) {
                                endPipeArray.push(element);
                                if(isTracingPath) {
                                    pipes.push(next);
                                }
                            } else {
                                if(isTracing) {
                                    Utils.stopTrace(this.traceObj, element);
                                }
                            }
                        } else {
                            comp = newComp;
                            endPipeArray.push(element);
                            if(isTracingPath) {
                                pipes.push(next);
                            }
                        }
                    } else {
                        if(isTracing) {
                            Utils.stopTrace(this.traceObj, element);
                        }
                    }
                }, this);
                if(isTracingPath) {
                    this.pipeline = pipes;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.as = function (name) {
                this.asHash = this.asHash || {
                };
                if(!this.asHash[name]) {
                    this.asHash[name] = {
                    };
                }
                this.asHash[name].step = this.steps.currentStep;
                return this;
            };
            Pipeline.prototype.traceOn = function () {
                this.tracing = true;
                this.traceObj = {
                };
                if(!!this.endPipe.length) {
                    Utils.each(this.endPipe, function (element) {
                        if(this.traceObj[element.obj[this.graph.meta.id]]) {
                            this.traceObj[element.obj[this.graph.meta.id]].count += 1;
                            return;
                        }
                        this.traceObj[element.obj[this.graph.meta.id]] = {
                            count: 1,
                            element: element,
                            tracing: [
                                element.obj[this.graph.meta.id]
                            ],
                            bin: []
                        };
                    }, this);
                }
                return this;
            };
            Pipeline.prototype.traceOff = function () {
                this.tracing = false;
                this.traceObj = undefined;
                return this;
            };
            Pipeline.prototype.back = function () {
                var o, k, array = [];
                if(!this.tracing) {
                    throw new Error('Trace is off');
                }
                for(k in this.traceObj) {
                    if(this.traceObj.hasOwnProperty(k)) {
                        while(!!this.traceObj[k].count) {
                            push.call(array, this.traceObj[k].element);
                            this.traceObj[k].count -= 1;
                        }
                    }
                }
                this.endPipe = array;
                this.traceOn();
                return this;
            };
            Pipeline.prototype.count = function () {
                return this.endPipe.length;
            };
            Pipeline.prototype.group = function (args) {
                var isTracingPath = !!this.graph.pathEnabled, props = [], tempObj, tempProp, groupObj = {
                }, o = {
                }, outputObj = {
                }, element;
                args = Utils.flatten(args);
                Utils.each(this.endPipe, function (next) {
                    element = isTracingPath ? slice.call(next, -1)[0].obj : next.obj;
                    o = {
                    };
                    o[element[this.graph.meta.id]] = element;
                    for(var j = args.length - 1, propsLen = 0; j >= propsLen; j--) {
                        tempObj = element;
                        tempProp = args[j];
                        if(tempProp.indexOf(".") > -1) {
                            tempObj = Utils.embeddedObject(tempObj, tempProp);
                            tempProp = tempProp.split(".").slice(-1)[0];
                        }
                        if(!(Utils.isObject(tempObj[tempProp])) && tempObj.hasOwnProperty(tempProp)) {
                            props = Utils.isArray(tempObj[tempProp]) ? tempObj[tempProp] : [
                                tempObj[tempProp]
                            ];
                            for(var f = 0, flen = props.length; f < flen; f++) {
                                groupObj[props[f]] = o;
                            }
                        } else {
                            groupObj['_no_' + args[j]] = o;
                        }
                        o = groupObj;
                        groupObj = {
                        };
                    }
                    outputObj = Utils.merge(o, outputObj);
                });
                this.endPipe = [];
                return outputObj;
            };
            Pipeline.prototype.sum = function (args) {
                var isTracingPath = !!this.graph.pathEnabled, props = [], tempObj, tempProp, outputObj, o = {
                }, isEmbedded = false;
                function createChildren(val) {
                    var properties = [];
                    for (var _i = 0; _i < (arguments.length - 1); _i++) {
                        properties[_i] = arguments[_i + 1];
                    }
                    var i = properties.length, retObj = {
                    }, groupObj = {
                        value: val
                    };
                    retObj = groupObj;
                    while(!!i) {
                        groupObj = {
                        };
                        groupObj[properties[--i]] = retObj;
                        retObj = groupObj;
                    }
                    return retObj;
                }
                args = Utils.flatten(args);
                for(var i = 0, propsLen = args.length; i < propsLen; i++) {
                    tempProp = args[i];
                    o[tempProp] = 0;
                    isEmbedded = false;
                    if(args[i].indexOf(".") > -1) {
                        tempProp = args[i].split(".").slice(-1)[0];
                        isEmbedded = true;
                    }
                    Utils.each(this.endPipe, function (next) {
                        tempObj = isTracingPath ? slice.call(next, -1)[0].obj : next.obj;
                        if(isEmbedded) {
                            tempObj = Utils.embeddedObject(tempObj, args[i]);
                        }
                        if(!(Utils.isObject(tempObj[tempProp])) && tempObj.hasOwnProperty(tempProp)) {
                            props = Utils.isArray(tempObj[tempProp]) ? tempObj[tempProp] : [
                                tempObj[tempProp]
                            ];
                            for(var j = 0, len = props.length; j < len; j++) {
                                o[args[i]] = o[args[i]] + Utils.parseNumber([
                                    props[j]
                                ], this.graph);
                            }
                        }
                    });
                }
                props = [];
                var o2, o3 = {
                };
                for(var k in o) {
                    if(o.hasOwnProperty(k)) {
                        if(k.indexOf(".") > -1) {
                            props.push(o[k]);
                            props.push.apply(props, k.split("."));
                            o2 = createChildren.apply(null, props);
                        } else {
                            o2 = {
                            };
                            o2[k] = {
                            };
                            o2[k].value = o[k];
                        }
                        o3 = Utils.merge(o2, o3);
                    }
                }
                outputObj.summed = o3;
                outputObj.results = this.endPipe;
                this.endPipe = [];
                return outputObj;
            };
            Pipeline.prototype.step = function (func) {
                var endPipeArray = [];
                var customFunc = new Function("var it = this;" + func);
                Utils.each(this.endPipe, function (element) {
                    endPipeArray.push(customFunc.call(element.obj));
                });
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.store = function (x, func) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 2); _i++) {
                    args[_i] = arguments[_i + 2];
                }
                if(!func) {
                    x.push.apply(x, Utils.toObjArray(this.endPipe));
                } else {
                    Utils.each(this.endPipe, function (element) {
                        x.push(func.apply(element.obj, args));
                    });
                }
                return this;
            };
            Pipeline.prototype.loop = function (loopFor, stepBack, func) {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 3); _i++) {
                    args[_i] = arguments[_i + 3];
                }
                var i, stepFrom = 0, stepTo = this.steps.currentStep, endPipeArray = [], element, iter = [], isTracing = !!this.tracing, isTracingPath = !!this.graph.pathEnabled, pipes = isTracingPath ? [] : undefined, hasFunction = !!func && typeof func == "function", callFunc = function () {
                    iter = isTracingPath ? this.pipeline : this.endPipe;
                    Utils.each(iter, function (next) {
                        element = isTracingPath ? slice.call(next, -1)[0] : next;
                        if(func.apply(element.obj, args)) {
                            endPipeArray.push(element);
                            if(isTracingPath) {
                                pipes.push(next);
                            }
                        } else if(isTracing) {
                            Utils.stopTrace(this.traceObj, element);
                        }
                    }, this);
                };
                if(!!loopFor && typeof loopFor == "function") {
                    hasFunction = true;
                    func = loopFor;
                    loopFor = 1;
                } else {
                    if(!!stepBack && typeof stepBack == "function") {
                        hasFunction = true;
                        func = stepBack;
                        stepBack = 0;
                    }
                }
                stepFrom = Utils.isString(stepBack) ? this.asHash[stepBack].step : this.steps.currentStep - stepBack;
                if(stepFrom < 2) {
                    throw Error('Cannot go loop back to step ' + stepFrom);
                }
                while(!!loopFor) {
                    for(i = stepFrom; i <= stepTo; i++) {
                        if(hasFunction) {
                            callFunc.call(this);
                        }
                        this[this.steps[i].func].apply(this, this.steps[i].args);
                    }
                    --loopFor;
                }
                if(hasFunction) {
                    callFunc.call(this);
                    if(isTracingPath) {
                        this.pipeline = pipes;
                    }
                    this.endPipe = endPipeArray;
                }
                return this;
            };
            Pipeline.prototype.emit = function () {
                this.steps = {
                    currentStep: 0
                };
                if(!!this.endPipe.length) {
                    if(!this.endPipe[0] || !Utils.isElement(this.endPipe[0])) {
                        return {
                            results: this.endPipe
                        };
                    }
                    return {
                        results: Utils.toObjArray(this.endPipe)
                    };
                }
                return {
                    results: []
                };
            };
            Pipeline.prototype.stringify = function () {
                return JSON.stringify(this.emit().results);
            };
            Pipeline.prototype.hash = function () {
                this.steps = {
                    currentStep: 0
                };
                return Utils.toHash(this.endPipe);
            };
            Pipeline.prototype.path = function () {
                if(!this.graph.pathEnabled) {
                    throw Error('Not tracing path');
                    return;
                }
                this.steps = {
                    currentStep: 0
                };
                var outputArray = [];
                var len = this.pipeline.length;
                for(var i = 0; i < len; i++) {
                    push.call(outputArray, Utils.toObjArray(this.pipeline[i]));
                }
                this.pipeline.length = 0;
                return outputArray;
            };
            return Pipeline;
        })();
        Mogwai.Pipeline = Pipeline;        
        var Compare = (function () {
            function Compare() { }
            Compare.$eq = function $eq(objVal, val, graph) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(((Utils.isDate(val, graph.date) && Utils.isDate(objVal[index], graph.date)) || (Utils.isMoney(val, graph.currency) && Utils.isMoney(objVal[index], graph.currency)) || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency)))) && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val, graph))) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$neq = function $neq(objVal, val, graph) {
                return !Compare.$eq(objVal, val, graph);
            };
            Compare.$lt = function $lt(objVal, val, graph) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(((Utils.isDate(val, graph.date) && Utils.isDate(objVal[index], graph.date)) || (Utils.isMoney(val, graph.currency) && Utils.isMoney(objVal[index], graph.currency)) || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency)))) && (Utils.parseNumber(objVal[index], graph) < Utils.parseNumber(val, graph))) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$lte = function $lte(objVal, val, graph) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(((Utils.isDate(val, graph.date) && Utils.isDate(objVal[index], graph.date)) || (Utils.isMoney(val, graph.currency) && Utils.isMoney(objVal[index], graph.currency)) || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency)))) && (Utils.parseNumber(objVal[index], graph) <= Utils.parseNumber(val, graph))) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$gt = function $gt(objVal, val, graph) {
                return !Compare.$lte(objVal, val, graph);
            };
            Compare.$gte = function $gte(objVal, val, graph) {
                return !Compare.$lt(objVal, val, graph);
            };
            Compare.$typeOf = function $typeOf(objVal, val, graph) {
                var objValIsArray = Utils.isArray(objVal), index, i = 0, valLen = val.length, comp;
                index = val.length;
                while(index) {
                    --index;
                    comp = val[index].toLowerCase();
                    if(comp == 'number' && !Utils.isDate(objVal, graph.date) && !Utils.isMoney(objVal, graph.currency) && Utils.isNumber(Utils.parseNumber(objVal, graph))) {
                        return true;
                    } else if(comp == 'money' && Utils.isMoney(objVal, graph.currency)) {
                        return true;
                    } else if(comp == 'string' && !Utils.isDate(objVal, graph.date) && !Utils.isMoney(objVal, graph.currency) && Utils.isString(Utils.parseNumber(objVal, graph))) {
                        return true;
                    } else if(comp == 'array' && Utils.isArray(objVal)) {
                        return true;
                    } else if(comp == 'date' && Utils.isDate(objVal, graph.date)) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$notTypeOf = function $notTypeOf(objVal, val, graph) {
                return !Compare.$typeOf(objVal, val, graph);
            };
            Compare.$in = function $in(objVal, val, graph) {
                var objValIsArray = Utils.isArray(objVal), index, i = 0, valLen = val.length;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    i = valLen;
                    while(!!i) {
                        --i;
                        if(((Utils.isDate(val[i], graph.date) && Utils.isDate(objVal[index], graph.date)) || (Utils.isMoney(val[i], graph.currency) && Utils.isMoney(objVal[index], graph.currency)) || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency)))) && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val[i], graph))) {
                            return true;
                        }
                    }
                }
                return false;
            };
            Compare.$nin = function $nin(objVal, val, graph) {
                return !Compare.$in(objVal, val, graph);
            };
            Compare.$match = function $match(objVal, val, graph) {
                var objValIsArray = Utils.isArray(objVal), index, i = 0, valLen = val.length;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    i = valLen;
                    while(!!i) {
                        --i;
                        if(Utils.isString(objVal[index]) && !(objVal[index].search(val[i]) === false)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            Compare.$all = function $all(objVal, val, graph) {
                var matches = 0, index = 0, i = 0, valLen = 0;
                val = Utils.unique(val);
                objVal = Utils.unique(objVal);
                valLen = val.length;
                index = objVal.length;
                if(valLen <= index) {
                    while(index) {
                        --index;
                        i = valLen;
                        while(!!i) {
                            --i;
                            if(((Utils.isDate(val[i], graph.date) && Utils.isDate(objVal[index], graph.date)) || (Utils.isMoney(val[i], graph.currency) && Utils.isMoney(objVal[index], graph.currency)) || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency)))) && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val[i], graph))) {
                                matches++;
                            }
                        }
                    }
                }
                return matches == valLen;
            };
            Compare.$none = function $none(objVal, val, graph) {
                return !Compare.$all(objVal, val, graph);
            };
            Compare.$exact = function $exact(objVal, val, graph) {
                var matches = 0, index = 0, i = 0, valLen = 0;
                val = Utils.unique(val);
                objVal = Utils.unique(objVal);
                valLen = val.length;
                index = objVal.length;
                if(valLen == index) {
                    while(index) {
                        --index;
                        i = valLen;
                        while(!!i) {
                            --i;
                            if(((Utils.isDate(val[i], graph.date) && Utils.isDate(objVal[index], graph.date)) || (Utils.isMoney(val[i], graph.currency) && Utils.isMoney(objVal[index], graph.currency)) || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency)))) && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val[i], graph))) {
                                matches++;
                            }
                        }
                    }
                }
                return matches == valLen;
            };
            Compare.$hasAny = function $hasAny(obj, val) {
                var i = val.length, tempObj, tempProp;
                while(!!i) {
                    --i;
                    tempObj = obj;
                    tempProp = val[i];
                    if(tempProp.indexOf(".") > -1) {
                        tempObj = Utils.embeddedObject(tempObj, tempProp);
                        tempProp = tempProp.split(".").slice(-1)[0];
                    }
                    if(tempObj.hasOwnProperty(tempProp)) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$hasAll = function $hasAll(obj, val) {
                var i = val.length, matches, tempObj, tempProp;
                while(!!i) {
                    --i;
                    tempObj = obj;
                    tempProp = val[i];
                    if(tempProp.indexOf(".") > -1) {
                        tempObj = Utils.embeddedObject(tempObj, tempProp);
                        tempProp = tempProp.split(".").slice(-1)[0];
                    }
                    if(tempObj.hasOwnProperty(tempProp)) {
                        matches++;
                    }
                }
                return matches == val.length;
            };
            Compare.$notAny = function $notAny(obj, val) {
                return !Compare.$hasAny(obj, val);
            };
            Compare.$notAll = function $notAll(obj, val) {
                return !Compare.$hasAll(obj, val);
            };
            return Compare;
        })();
        Mogwai.Compare = Compare;        
    })(Helios.Mogwai || (Helios.Mogwai = {}));
    var Mogwai = Helios.Mogwai;
    var Utils = (function () {
        function Utils() { }
        Utils.currencyRegex = {
            '.': /[^0-9-.]+/g,
            ',': /[^0-9-,]+/g
        };
        Utils.setTrace = function setTrace(trace, element) {
            var ids = [];
            for (var _i = 0; _i < (arguments.length - 2); _i++) {
                ids[_i] = arguments[_i + 2];
            }
            var o;
            var newIds = Utils.flatten(ids), id = element.obj[element.graph.meta.id];
            o = trace;
            for(var k in o) {
                if(o.hasOwnProperty(k) && !!o[k].tracing) {
                    var obj = o[k];
                    var ind = indexOf.call(obj.tracing, id);
                    if(!!newIds.length && ind > -1) {
                        push.apply(obj.bin, newIds);
                    }
                }
            }
        };
        Utils.stopTrace = function stopTrace(trace, element) {
            var o = trace, id = element.obj[element.graph.meta.id];
            for(var k in o) {
                if(o.hasOwnProperty(k) && ("tracing" in o[k])) {
                    var obj = o[k];
                    var ind = indexOf.call(obj.tracing, id);
                    while(ind > -1) {
                        obj.tracing.splice(ind, 1);
                        ind = indexOf.call(obj.tracing, id);
                    }
                    if(!obj.tracing.length) {
                        delete o[k];
                    }
                }
            }
        };
        Utils.finalizeTrace = function finalizeTrace(trace) {
            for(var k in trace) {
                if(trace.hasOwnProperty(k) && (trace[k].hasOwnProperty("tracing"))) {
                    var obj = trace[k];
                    if(!obj.bin.length) {
                        delete trace[k];
                    } else {
                        obj.tracing = Utils.unique(obj.bin);
                        obj.bin = [];
                    }
                }
            }
        };
        Utils.toArray = function toArray(o) {
            var k, r = [];
            for(k in o) {
                if(o.hasOwnProperty(k)) {
                    r.push(o[k]);
                }
            }
            return r;
        };
        Utils.each = function each(array, func, context) {
            var i, len, val;
            if(Utils.isArray(array)) {
                len = array.length;
                for(i = 0; i < len; i += 1) {
                    val = array[i];
                    func.call(context, val);
                }
            } else {
                for(i in array) {
                    if(array.hasOwnProperty(i)) {
                        val = array[i];
                        func.call(context, val);
                    }
                }
            }
        };
        Utils.intersection = function intersection(arr1, arr2) {
            var r = [], o = {
            }, i, comp;
            for(i = 0; i < arr2.length; i += 1) {
                o[arr2[i]] = true;
            }
            for(i = 0; i < arr1.length; i += 1) {
                comp = arr1[i];
                if(!!o[comp]) {
                    r.push(arr1[i]);
                }
            }
            return r;
        };
        Utils.intersectElement = function intersectElement(elements) {
            var o, outputObj = {
            }, compObj = elements[0];
            for(var i = 1, l = elements.length; i < l; i++) {
                o = {
                };
                for(var k in elements[i]) {
                    if(elements[i].hasOwnProperty(k)) {
                        o[k] = true;
                    }
                }
                for(var h in compObj) {
                    if(!!o[h]) {
                        outputObj[h] = compObj[h];
                    }
                }
                if(Utils.isEmpty(outputObj)) {
                    return {
                    };
                }
                compObj = outputObj;
            }
            return outputObj;
        };
        Utils.difference = function difference(arr1, arr2) {
            var r = [], o = {
            }, i, comp;
            for(i = 0; i < arr2.length; i += 1) {
                o[arr2[i]] = true;
            }
            for(i = 0; i < arr1.length; i += 1) {
                comp = arr1[i];
                if(!o[comp]) {
                    r.push(arr1[i]);
                }
            }
            return r;
        };
        Utils.diffElement = function diffElement(arr1, arr2) {
            var r = [], o = {
            }, i, comp;
            for(i = 0; i < arr2.length; i += 1) {
                o[arr2[i].obj[arr2[i].graph.meta.id]] = true;
            }
            for(i = 0; i < arr1.length; i += 1) {
                comp = arr1[i].obj[arr1[i].graph.meta.id];
                if(!o[comp]) {
                    r.push(arr1[i]);
                }
            }
            return r;
        };
        Utils.unique = function unique(array) {
            var o = {
            }, i, l = array.length, r = [];
            for(i = 0; i < l; i += 1) {
                o[array[i]] = array[i];
            }
            for(i in o) {
                if(o.hasOwnProperty(i)) {
                    r.push(o[i]);
                }
            }
            return r;
        };
        Utils.uniqueElement = function uniqueElement(array) {
            var o = {
            }, i, l = array.length, r = [];
            for(i = 0; i < l; i += 1) {
                o[array[i].obj[array[i].graph.meta.id]] = array[i];
            }
            for(i in o) {
                if(o.hasOwnProperty(i)) {
                    r.push(o[i]);
                }
            }
            return r;
        };
        Utils.include = function include(array, i) {
            return indexOf.call(array, i) === -1 ? false : true;
        };
        Utils.keys = function keys(o) {
            var k, r = [];
            for(k in o) {
                if(o.hasOwnProperty(k)) {
                    r.push(k);
                }
            }
            return r;
        };
        Utils.values = function values(o) {
            return Utils.toArray(o);
        };
        Utils.pick = function pick(o, props) {
            var props = Utils.flatten(props), i = props.length, result = {
            }, tempObj, tempProp;
            while(i) {
                i -= 1;
                tempProp = props[i];
                tempObj = o;
                if(tempProp.indexOf(".") > -1) {
                    tempObj = Utils.embeddedObject(o, tempProp);
                    tempProp = tempProp.split(".").slice(-1)[0];
                }
                if(tempObj.hasOwnProperty(tempProp)) {
                    result[tempProp] = tempObj[tempProp];
                }
            }
            return result;
        };
        Utils.pluck = function pluck(objs, prop) {
            var o, i = objs.length, tempObj, tempProp, result = [], isElement = false, isEmbedded = false;
            if(!!i) {
                isElement = !!objs[0].obj;
            }
            if(prop.indexOf(".") > -1) {
                isEmbedded = true;
                tempProp = prop.split(".").slice(-1)[0];
            }
            while(i) {
                i -= 1;
                o = isElement ? objs[i].obj : objs[i];
                tempObj = isEmbedded ? Utils.embeddedObject(o, prop) : o;
                if(tempObj.hasOwnProperty(tempProp)) {
                    push.call(result, tempObj[tempProp]);
                }
            }
            return result;
        };
        Utils.toHash = function toHash(array) {
            var id, i, len = array.length, result = {
            }, o = {
            };
            if(!!len) {
                id = array[0].graph.meta.id;
                for(i = 0; i < len; i += 1) {
                    o = array[i].obj;
                    result[o[id]] = o;
                }
            }
            return result;
        };
        Utils.toObjArray = function toObjArray(array) {
            var i, l = array.length, result = [];
            for(i = 0; i < l; i += 1) {
                result.push(array[i].obj);
            }
            return result;
        };
        Utils.materializeElementArray = function materializeElementArray(array, db, type) {
            var i, l = array.length, result = [], elements = type == "Vertex" ? db.vertices : db.edges, isObjArray = false;
            if(!!l) {
                isObjArray = Utils.isObject(array[0]);
            }
            for(i = 0; i < l; i += 1) {
                result.push(isObjArray ? elements[array[i][db.meta.id]] : elements[array[i]]);
            }
            return result;
        };
        Utils.flatten = function flatten(array, shallow) {
            if (typeof shallow === "undefined") { shallow = false; }
            var result = [], value, index = -1, length;
            if(!array) {
                return result;
            }
            length = array.length;
            while((index += 1) < length) {
                value = array[index];
                if(Utils.isArray(value)) {
                    push.apply(result, shallow ? value : Utils.flatten(value));
                } else {
                    result.push(value);
                }
            }
            return result;
        };
        Utils.embeddedObject = function embeddedObject(o, prop) {
            var props = prop.indexOf(".") > -1 ? prop.split(".") : [
                prop
            ], l = props.length, lastProp = props[l - 1], currentProp;
            for(var i = 0; i < l; i++) {
                if(o.hasOwnProperty(props[i])) {
                    currentProp = props[i];
                    if(!Utils.isObject(o[currentProp])) {
                        break;
                    }
                    o = o[currentProp];
                }
            }
            if(currentProp != lastProp) {
                o = {
                };
            }
            return o;
        };
        Utils.merge = function merge(obj1, obj2) {
            for(var p in obj2) {
                try  {
                    if(obj1.hasOwnProperty(p)) {
                        obj1[p] = Utils.merge(obj1[p], obj2[p]);
                    } else {
                        obj1[p] = obj2[p];
                    }
                } catch (e) {
                    obj1[p] = obj2[p];
                }
            }
            return obj1;
        };
        Utils.isArray = function isArray(o) {
            return toString.call(o) === '[object Array]';
        };
        Utils.isString = function isString(o) {
            return toString.call(o) === '[object String]';
        };
        Utils.isNumber = function isNumber(o) {
            return toString.call(o) === '[object Number]';
        };
        Utils.isObject = function isObject(o) {
            return toString.call(o) === '[object Object]';
        };
        Utils.isEmpty = function isEmpty(o) {
            var key;
            if(!o) {
                return true;
            }
            for(key in o) {
                if(o.hasOwnProperty(key)) {
                    return !o[key];
                }
            }
            return true;
        };
        Utils.isFunction = function isFunction(o) {
            return toString.call(o) === '[object ]';
        };
        Utils.isNull = function isNull(o) {
            return toString.call(o) === '[object Null]';
        };
        Utils.isUndefined = function isUndefined(o) {
            return toString.call(o) === '[object Undefined]';
        };
        Utils.isElement = function isElement(o) {
            return o.hasOwnProperty('obj');
        };
        Utils.isDate = function isDate(o, date) {
            return Utils.isString(o) ? moment(o, date.format).isValid() : false;
        };
        Utils.isMoney = function isMoney(val, curr) {
            var i, l = curr.symbol.length;
            if(Utils.isString(val)) {
                for(i = 0; i < l; i++) {
                    if(val.indexOf(curr.symbol[i]) > -1) {
                        return !isNaN(parseFloat(val.replace(Utils.currencyRegex[curr.decimal], '')));
                    }
                }
            }
            return false;
        };
        Utils.parseNumber = function parseNumber(val, graph) {
            if(Utils.isDate(val, graph.date.format)) {
                return moment(val, graph.date.format).valueOf();
            }
            if(Utils.isString(val)) {
                if(isNaN(parseFloat(val.replace(Utils.currencyRegex[graph.currency.decimal], '')))) {
                    return val;
                }
                return parseFloat(val.replace(Utils.currencyRegex[graph.currency.decimal], ''));
            }
            return val;
        };
        return Utils;
    })();    
})(Helios || (Helios = {}));
//@ sourceMappingURL=heliosDB.js.map
