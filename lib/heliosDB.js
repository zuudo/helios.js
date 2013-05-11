"use strict";
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
if(!Date.prototype.toISOString) {
    ((function () {
        function pad(number) {
            var r = String(number);
            if(r.length === 1) {
                r = '0' + r;
            }
            return r;
        }
        Date.prototype.toISOString = function () {
            return this.getUTCFullYear() + '-' + pad(this.getUTCMonth() + 1) + '-' + pad(this.getUTCDate()) + 'T' + pad(this.getUTCHours()) + ':' + pad(this.getUTCMinutes()) + ':' + pad(this.getUTCSeconds()) + '.' + String((this.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + 'Z';
        };
    })());
}
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
            this.traceEnabled = false;
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
        GraphDatabase.prototype.close = function () {
            this.vertices = {
            };
            this.edges = {
            };
            this.v_idx = {
            };
            this.e_idx = {
            };
        };
        GraphDatabase.prototype.startTrace = function (turnOn) {
            return this.traceEnabled = turnOn;
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
            if(!!jsonData.graph) {
                jsonData = jsonData.graph;
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
                        if(!!jsonData.graph) {
                            jsonData = jsonData.graph;
                        }
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
            return "Data Loaded";
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
            }, tempObjArrLen = 0, isObject = false;
            if(!args.length) {
                return this._.startPipe(this.vertices);
            }
            args = Utils.flatten(args);
            l = args.length;
            isObject = Utils.isObject(args[0]);
            if(isObject && !((this.meta.id in args[0]) && (args[0][this.meta.id] in this.vertices) && (this.vertices[args[0][this.meta.id]].Type == 'Vertex'))) {
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
                                                '$match', 
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
                temp = isObject ? this.vertices[args[i][this.meta.id]] : this.vertices[args[i]];
                if(typeof temp === "undefined") {
                    throw new ReferenceError('No vertex with id ' + isObject ? args[i][this.meta.id] : args[i]);
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
            }, tempObjArrLen = 0, isObject = false;
            if(!args.length) {
                return this._.startPipe(this.edges);
            }
            args = Utils.flatten(args);
            l = args.length;
            isObject = Utils.isObject(args[0]);
            if(isObject && !((this.meta.id in args[0]) && (args[0][this.meta.id] in this.edges) && (this.edges[args[0][this.meta.id]].Type == 'Edge'))) {
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
                                                '$match', 
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
                temp = isObject ? this.edges[args[i][this.meta.id]] : this.edges[args[i]];
                if(typeof temp === "undefined") {
                    throw new ReferenceError('No edge with id ' + isObject ? args[i][this.meta.id] : args[i]);
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
                if(!!elements) {
                    this.startPipe(elements);
                }
            }
            Pipeline.prototype.startPipe = function (elements) {
                var pipe;
                this.steps = {
                    currentStep: 1
                };
                this.endPipe = [];
                this.pipeline = this.graph.traceEnabled ? [] : undefined;
                Utils.each(elements, function (element) {
                    if(this.graph.traceEnabled) {
                        pipe = [];
                        pipe.push(element);
                        this.pipeline.push(pipe);
                    }
                    this.endPipe.push(element);
                }, this);
                this.steps[this.steps.currentStep] = {
                    func: 'startPipe',
                    args: []
                };
                if(this.graph.traceEnabled) {
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                return this;
            };
            Pipeline.prototype.id = function () {
                return this.property(this.graph.meta.id);
            };
            Pipeline.prototype.label = function () {
                return this.property(this.graph.meta.label);
            };
            Pipeline.prototype.out = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, tracing = !!this.graph.traceEnabled, pipes, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'out',
                    args: labels
                };
                if(tracing) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(tracing) {
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
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.inV);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.inV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.inV);
                        }
                    }, this);
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
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
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, tracing = !!this.graph.traceEnabled, pipes, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'in',
                    args: labels
                };
                if(tracing) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(tracing) {
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
                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.outV);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.outV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.outV);
                        }
                    }, this);
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.outV = function () {
                var edge, iter, endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                this.steps[++this.steps.currentStep] = {
                    func: 'outV'
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Step ' + this.steps.currentStep + ' only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = tracing ? slice.call(next, -1)[0] : next;
                    endPipeArray.push(edge.outV);
                    if(tracing) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.outV);
                        pipes.push(pipe);
                    }
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.inV = function () {
                var edge, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                ;
                this.steps[++this.steps.currentStep] = {
                    func: 'inV'
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Step ' + this.steps.currentStep + ' only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = tracing ? slice.call(next, -1)[0] : next;
                    endPipeArray.push(edge.inV);
                    if(tracing) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.inV);
                        pipes.push(pipe);
                    }
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.outE = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'outE',
                    args: labels
                };
                if(tracing) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(tracing) {
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
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
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
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                this.steps[++this.steps.currentStep] = {
                    func: 'inE',
                    args: labels
                };
                if(tracing) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(tracing) {
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
                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
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
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                this.steps[++this.steps.currentStep] = {
                    func: 'both',
                    args: labels
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                if(tracing) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(tracing) {
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
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.inV);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.inV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.inV);
                        }
                    }, this);
                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.outV);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.outV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.outV);
                        }
                    }, this);
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.bothV = function () {
                var edge, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                ;
                this.steps[++this.steps.currentStep] = {
                    func: 'bothV'
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = tracing ? slice.call(next, -1)[0] : next;
                    endPipeArray.push.apply(endPipeArray, [
                        edge.outV, 
                        edge.inV
                    ]);
                    if(tracing) {
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
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.bothE = function () {
                var labels = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    labels[_i] = arguments[_i + 0];
                }
                var value, vertex, iter = [], endPipeArray = [], hasArgs = !!labels.length, tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe;
                this.steps[++this.steps.currentStep] = {
                    func: 'bothE',
                    args: labels
                };
                if(!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }
                if(tracing) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {
                    };
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if(tracing) {
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
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.property = function (prop) {
                var element, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe, array = [], tempObj, tempProp, isEmbedded = prop.indexOf(".") > -1;
                tempProp = isEmbedded ? prop.split(".").slice(-1)[0] : prop;
                this.steps[++this.steps.currentStep] = {
                    func: 'property',
                    args: prop
                };
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    element = tracing ? slice.call(next, -1)[0] : next;
                    tempObj = isEmbedded ? Utils.embeddedObject(element.obj, prop) : element.obj;
                    if(!Utils.isObject(tempObj[tempProp]) && tempObj.hasOwnProperty(tempProp)) {
                        array.push(tempObj[tempProp]);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(tempObj[tempProp]);
                            pipes.push(pipe);
                        }
                    }
                });
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                this.endPipe = array;
                return this;
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
                this.endPipe = !!end ? this.endPipe.slice(start, end + 1) : this.endPipe.slice(start);
                return this;
            };
            Pipeline.prototype.index = function () {
                var indices = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    indices[_i] = arguments[_i + 0];
                }
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
            Pipeline.prototype.except = function (any) {
                var exclIds, ids, endPipeIds;
                if(!!any.length) {
                    ids = Utils.pluck(this.endPipe, this.graph.meta.id);
                    exclIds = Utils.isObject(any[0]) ? Utils.pluck(Utils.flatten(any), this.graph.meta.id) : any;
                    endPipeIds = Utils.difference(ids, exclIds);
                    this.endPipe = Utils.materializeElementArray(endPipeIds, this.graph, this.endPipe[0].Type);
                } else {
                    this.endPipe = [];
                }
                return this;
            };
            Pipeline.prototype.retain = function (any) {
                var intersectIds, ids, endPipeIds;
                if(!!any.length) {
                    ids = Utils.pluck(this.endPipe, this.graph.meta.id);
                    intersectIds = Utils.isObject(any[0]) ? Utils.pluck(Utils.flatten(any), this.graph.meta.id) : any;
                    endPipeIds = Utils.intersection(ids, intersectIds);
                    this.endPipe = Utils.materializeElementArray(endPipeIds, this.graph, this.endPipe[0].Type);
                } else {
                    this.endPipe = [];
                }
                return this;
            };
            Pipeline.prototype.where = function () {
                var args = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    args[_i] = arguments[_i + 0];
                }
                var element, iter = [], l, nextIter = [], comparables = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, funcObj, tempObj, compObj, tempProp, propVals = [], isIn, norArray = [], origArray = [];
                this.steps[++this.steps.currentStep] = {
                    func: 'where',
                    args: args,
                    'exclFromPath': true
                };
                iter = tracing ? this.pipeline : this.endPipe;
                comparables = Utils.flatten(args);
                l = comparables.length;
                for(var i = 0; i < l; i++) {
                    compObj = comparables[i];
                    if('$nor' in compObj) {
                        norArray.push.apply(norArray, this.endPipe);
                        origArray.push.apply(origArray, this.endPipe);
                        for(var x = 0, xl = compObj['$nor'].length; x < xl; x++) {
                            this.where.call(this, compObj['$nor'][x]);
                            norArray.push.apply(norArray, this.endPipe);
                            this.endPipe = origArray;
                        }
                        endPipeArray = Utils.findInstances(norArray, 1);
                        continue;
                    }
                    Utils.each(iter, function (next) {
                        element = tracing ? slice.call(next, -1)[0] : next;
                        for(var prop in compObj) {
                            isIn = false;
                            if(compObj.hasOwnProperty(prop)) {
                                if(prop.charAt(0) === "$") {
                                    propVals = compObj[prop];
                                    if(!Compare[prop].call(null, element.obj, propVals)) {
                                        if(i < l) {
                                            nextIter.push(next);
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
                                        }
                                        return;
                                    }
                                    funcObj = compObj[prop];
                                    for(var func in funcObj) {
                                        if(funcObj.hasOwnProperty(func)) {
                                            if(Compare[func].call(null, tempObj[tempProp], funcObj[func])) {
                                                if(!isIn) {
                                                    isIn = true;
                                                }
                                            }
                                        }
                                    }
                                    if(!isIn) {
                                        if(i < l) {
                                            nextIter.push(next);
                                        }
                                        return;
                                    }
                                }
                            }
                        }
                        endPipeArray.push(element);
                        if(tracing) {
                            push.call(next, element);
                            pipes.push(next);
                        }
                    }, this);
                    iter = nextIter;
                    nextIter = [];
                }
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.filter = function (closure) {
                var element, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe, customClosure = new Function("it", Utils.funcBody(closure));
                this.steps[++this.steps.currentStep] = {
                    func: 'filter',
                    args: [],
                    'exclFromPath': true
                };
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    element = tracing ? slice.call(next, -1)[0] : next;
                    if(customClosure.call(element.obj, element.obj)) {
                        endPipeArray.push(element);
                        if(tracing) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(element);
                            pipes.push(pipe);
                        }
                    }
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.ifThenElse = function (ifClosure, thenClosure, elseClosure) {
                var element, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe, itObj, closureOut, ifC = new Function("it", Utils.funcBody(ifClosure)), thenC = new Function("it", Utils.funcBody(thenClosure)), elseC = new Function("it", Utils.funcBody(elseClosure));
                this.steps[++this.steps.currentStep] = {
                    func: 'ifThenElse',
                    args: []
                };
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    element = tracing ? slice.call(next, -1)[0] : next;
                    itObj = Utils.isElement(element) ? element.obj : element;
                    if(ifC.call(itObj, itObj)) {
                        closureOut = thenC.call(itObj, itObj);
                    } else {
                        closureOut = elseC.call(itObj, itObj);
                    }
                    endPipeArray.push(closureOut);
                    if(tracing) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(closureOut);
                        pipes.push(pipe);
                    }
                }, this);
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
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
            Pipeline.prototype.back = function (x) {
                var backTo, i = 0, l = 0, endPipeArray = [];
                if(!this.graph.traceEnabled) {
                    throw Error('Tracing is off');
                    return;
                }
                ;
                if(!x) {
                    throw Error('Paramater is required');
                    return;
                }
                if(Utils.isString(x)) {
                    if(x in this.asHash) {
                        backTo = this.asHash[x].step;
                    } else {
                        throw Error('Unknown named position');
                    }
                } else {
                    x = this.steps.looped ? x + this.steps.looped : x;
                    backTo = this.steps.currentStep - x;
                }
                this.pipeline = Utils.uniqueRow(this.pipeline, backTo);
                l = this.pipeline.length;
                for(i = 0; i < l; i++) {
                    push.call(endPipeArray, this.pipeline[i][backTo - 1]);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.optional = function (x) {
                var backTo, i = 0, l = 0, endPipeArray = [];
                if(!this.graph.traceEnabled) {
                    throw Error('Tracing is off');
                    return;
                }
                ;
                if(!x) {
                    throw Error('Paramater is required');
                    return;
                }
                if(Utils.isString(x)) {
                    if(x in this.asHash) {
                        backTo = this.asHash[x].step;
                    } else {
                        throw Error('Unknown named position');
                    }
                } else {
                    backTo = this.steps.currentStep - x;
                }
                this.pipeline = this.steps[backTo].elements;
                l = this.pipeline.length;
                for(i = 0; i < l; i++) {
                    push.call(endPipeArray, this.pipeline[i][backTo - 1]);
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.select = function (list) {
                var closure = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    closure[_i] = arguments[_i + 1];
                }
                var backTo, i, l = this.pipeline.length, k, endPipeHash = {
                }, tempEndPipeArray, endPipeArray = [], closureArray = [], closureOut, pos = 0;
                if(!this.graph.traceEnabled) {
                    throw Error('Tracing is off');
                    return;
                }
                ;
                if(!list) {
                    for(i = 0; i < l; i++) {
                        tempEndPipeArray = [];
                        for(k in this.asHash) {
                            if(this.asHash.hasOwnProperty(k)) {
                                endPipeHash = {
                                };
                                backTo = this.asHash[k].step;
                                endPipeHash[k] = this.pipeline[i][backTo - 1].obj;
                                push.call(tempEndPipeArray, endPipeHash);
                            }
                        }
                        push.call(endPipeArray, tempEndPipeArray);
                    }
                } else {
                    if(!Utils.isArray(list)) {
                        closure.unshift(list);
                        list = undefined;
                    }
                    for(var j = 0, funcsLen = closure.length; j < funcsLen; j++) {
                        closureArray.push(new Function("it", Utils.funcBody(closure[j])));
                    }
                    if(list && Utils.isArray(list)) {
                        for(i = 0; i < l; i++) {
                            tempEndPipeArray = [];
                            for(var x = 0, len = list.length; x < len; x++) {
                                endPipeHash = {
                                };
                                if(list[x] in this.asHash) {
                                    backTo = this.asHash[list[x]].step;
                                    if(!!closureArray.length) {
                                        endPipeHash[list[x]] = closureArray[pos % funcsLen].call(this.pipeline[i][backTo - 1].obj, this.pipeline[i][backTo - 1].obj);
                                        ++pos;
                                    } else {
                                        endPipeHash[list[x]] = this.pipeline[i][backTo - 1].obj;
                                    }
                                    push.call(tempEndPipeArray, endPipeHash);
                                } else {
                                    throw Error('Unknown named position');
                                }
                            }
                            push.call(endPipeArray, tempEndPipeArray);
                        }
                    } else {
                        for(i = 0; i < l; i++) {
                            tempEndPipeArray = [];
                            for(k in this.asHash) {
                                if(this.asHash.hasOwnProperty(k)) {
                                    endPipeHash = {
                                    };
                                    backTo = this.asHash[k].step;
                                    endPipeHash[k] = closureArray[pos % funcsLen].call(this.pipeline[i][backTo - 1].obj, this.pipeline[i][backTo - 1].obj);
                                    push.call(tempEndPipeArray, endPipeHash);
                                }
                                pos++;
                            }
                            push.call(endPipeArray, tempEndPipeArray);
                        }
                    }
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.path = function () {
                var props = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    props[_i] = arguments[_i + 0];
                }
                var tempObjArray = [], tempArr = [], tempObj = {
                }, outputArray = [], i = 0, len = 0, j = 0, l = 0, isClosure, closureArray = [], propsLen = props.length;
                if(!this.graph.traceEnabled) {
                    throw Error('Tracing is off');
                    return;
                }
                len = this.pipeline.length;
                if(!!propsLen) {
                    isClosure = /^\s*it(?=\.[A-Za-z_])/.exec(props[0]) ? true : false;
                    if(isClosure) {
                        for(var c = 0, funcsLen = propsLen; c < funcsLen; c++) {
                            closureArray.push(new Function("it", Utils.funcBody(props[c])));
                        }
                        for(i = 0; i < len; i++) {
                            tempObjArray = Utils.toPathArray(this.pipeline[i], this.steps);
                            l = tempObjArray.length;
                            for(j = 0; j < l; j++) {
                                push.call(tempArr, closureArray[j % propsLen].call(tempObjArray[j], tempObjArray[j]));
                            }
                            push.call(outputArray, tempArr);
                            tempObjArray = [];
                            tempArr = [];
                        }
                    } else {
                        for(i = 0; i < len; i++) {
                            tempObjArray = Utils.toPathArray(this.pipeline[i], this.steps);
                            l = tempObjArray.length;
                            for(j = 0; j < l; j++) {
                                push.call(tempArr, Utils.pick(tempObjArray[j], props));
                            }
                            push.call(outputArray, tempArr);
                            tempObjArray = [];
                            tempArr = [];
                        }
                    }
                } else {
                    for(i = 0; i < len; i++) {
                        push.call(outputArray, Utils.toPathArray(this.pipeline[i], this.steps));
                    }
                }
                this.endPipe = outputArray;
                return this;
            };
            Pipeline.prototype.count = function () {
                var cnt = this.endPipe.length;
                this.endPipe = cnt;
                return this;
            };
            Pipeline.prototype.group = function (args) {
                var tracing = !!this.graph.traceEnabled, props = [], tempObj, tempProp, groupObj = {
                }, o = {
                }, outputObj = {
                }, element;
                args = Utils.flatten(args);
                Utils.each(this.endPipe, function (next) {
                    element = tracing ? slice.call(next, -1)[0].obj : next.obj;
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
                var tracing = !!this.graph.traceEnabled, props = [], tempObj, tempProp, outputObj, o = {
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
                        tempObj = tracing ? slice.call(next, -1)[0].obj : next.obj;
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
                                ]);
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
            Pipeline.prototype.transform = function (closure) {
                var element, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe, itObj, customClosure = new Function("it", Utils.funcBody(closure)), closureOut;
                this.steps[++this.steps.currentStep] = {
                    func: 'transform',
                    args: closure
                };
                iter = tracing ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    element = tracing ? slice.call(next, -1)[0] : next;
                    itObj = Utils.isElement(element) ? element.obj : element;
                    closureOut = customClosure.call(itObj, itObj);
                    endPipeArray.push(closureOut);
                    if(tracing) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(closureOut);
                        pipes.push(pipe);
                    }
                });
                if(tracing) {
                    this.pipeline = pipes;
                    this.steps[this.steps.currentStep].elements = [];
                    push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                }
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
            Pipeline.prototype.loop = function (stepBack, iterations, closure) {
                var element, iter = [], endPipeArray = [], tracing = !!this.graph.traceEnabled, pipes = tracing ? [] : undefined, pipe, tempPipeline = [], backTo, currentStep = this.steps.currentStep, loopFor = iterations - 1, step, i, j, l, customClosure = closure ? new Function("it", Utils.funcBody(closure)) : undefined;
                this.steps.looped = this.steps.looped + (iterations - 1) || iterations - 1;
                if(Utils.isString(stepBack)) {
                    if(stepBack in this.asHash) {
                        backTo = this.asHash[stepBack].step;
                    } else {
                        throw Error('Unknown named position');
                    }
                } else {
                    backTo = this.steps.currentStep - (stepBack - 1);
                }
                if(closure) {
                    iter = tracing ? this.pipeline : this.endPipe;
                    Utils.each(iter, function (next) {
                        element = tracing ? slice.call(next, -1)[0] : next;
                        if(customClosure.call(element.obj, element.obj)) {
                            endPipeArray.push(element);
                            if(tracing) {
                                pipe = [];
                                pipe.push.apply(pipe, next);
                                pipes.push(pipe);
                            }
                        }
                    });
                }
                while(loopFor) {
                    --loopFor;
                    for(i = backTo; i < currentStep + 1; i++) {
                        step = this.steps[i];
                        this[step.func].apply(this, step.args);
                        if(closure) {
                            iter = tracing ? this.pipeline : this.endPipe;
                            Utils.each(iter, function (next) {
                                element = tracing ? slice.call(next, -1)[0] : next;
                                if(customClosure.call(element.obj, element.obj)) {
                                    endPipeArray.push(element);
                                    if(tracing) {
                                        pipe = [];
                                        pipe.push.apply(pipe, next);
                                        pipes.push(pipe);
                                    }
                                }
                            });
                            if(tracing) {
                                this.pipeline = pipes;
                                this.steps[this.steps.currentStep].elements = [];
                                push.apply(this.steps[this.steps.currentStep].elements, this.pipeline);
                            }
                        }
                    }
                }
                this.endPipe = endPipeArray;
                return this;
            };
            Pipeline.prototype.emit = function () {
                var result = undefined;
                if(!!this.endPipe.length) {
                    if(!this.endPipe[0] || !Utils.isElement(this.endPipe[0])) {
                        result = this.endPipe;
                    } else {
                        result = Utils.toObjArray(this.endPipe);
                    }
                } else {
                    result = this.endPipe;
                }
                this.traversed = undefined;
                this.asHash = undefined;
                this.endPipe = undefined;
                this.pipeline = undefined;
                this.steps = {
                    currentStep: 0
                };
                return result;
            };
            Pipeline.prototype.stringify = function () {
                this.endPipe = JSON.stringify(Utils.toObjArray(this.endPipe));
                return this;
            };
            Pipeline.prototype.hash = function () {
                this.endPipe = Utils.toHash(this.endPipe);
                return this;
            };
            Pipeline.prototype.map = function () {
                var props = [];
                for (var _i = 0; _i < (arguments.length - 0); _i++) {
                    props[_i] = arguments[_i + 0];
                }
                var tempObjArray = [], outputArray = [];
                if(!!props.length) {
                    tempObjArray = Utils.toObjArray(this.endPipe);
                    for(var j = 0, l = tempObjArray.length; j < l; j++) {
                        push.call(outputArray, Utils.pick(tempObjArray[j], props));
                    }
                    tempObjArray = [];
                } else {
                    outputArray = Utils.toObjArray(this.endPipe);
                }
                this.endPipe = outputArray;
                return this;
            };
            return Pipeline;
        })();
        Mogwai.Pipeline = Pipeline;        
        var Compare = (function () {
            function Compare() { }
            Compare.$eq = function $eq(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(((Utils.isDate(val) && Utils.isDate(objVal[index])) || (Utils.isBoolean(val) && Utils.isBoolean(objVal[index])) || (!(Utils.isDate(objVal[index]) || Utils.isBoolean(objVal[index])))) && (Utils.parseValue(objVal[index]) === Utils.parseValue(val))) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$neq = function $neq(objVal, val) {
                return !Compare.$eq(objVal, val);
            };
            Compare.$lt = function $lt(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(((Utils.isDate(val) && Utils.isDate(objVal[index])) || (Utils.isBoolean(val) && Utils.isBoolean(objVal[index])) || (!(Utils.isDate(objVal[index]) || Utils.isBoolean(objVal[index])))) && (Utils.parseValue(objVal[index]) < Utils.parseValue(val))) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$lte = function $lte(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(((Utils.isDate(val) && Utils.isDate(objVal[index])) || (Utils.isBoolean(val) && Utils.isBoolean(objVal[index])) || (!(Utils.isDate(objVal[index]) || Utils.isBoolean(objVal[index])))) && (Utils.parseValue(objVal[index]) <= Utils.parseValue(val))) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$gt = function $gt(objVal, val) {
                return !Compare.$lte(objVal, val);
            };
            Compare.$gte = function $gte(objVal, val) {
                return !Compare.$lt(objVal, val);
            };
            Compare.$btw = function $btw(objVal, val) {
                return Compare.$gte(objVal, val[0]) && Compare.$lte(objVal, val[1]);
            };
            Compare.$len = function $len(objVal, val) {
                var len = objVal.length;
                if(Utils.isNumber(Utils.parseNumber(val))) {
                    return len == val;
                }
                return eval(len + /^\s*(?:<|>)\=*\s*\d+|^\s*(?:!|=)\={1,2}\s*\d/.exec(val)[0]);
            };
            Compare.$in = function $in(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index, i = 0, valLen;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                val = Utils.flatten([
                    val
                ]);
                valLen = val.length;
                index = objVal.length;
                while(index) {
                    --index;
                    i = valLen;
                    while(!!i) {
                        --i;
                        if(((Utils.isDate(val[i]) && Utils.isDate(objVal[index])) || (Utils.isBoolean(val[i]) && Utils.isBoolean(objVal[index])) || (!(Utils.isDate(objVal[index]) || Utils.isBoolean(objVal[index])))) && (Utils.parseValue(objVal[index]) === Utils.parseValue(val[i]))) {
                            return true;
                        }
                    }
                }
                return false;
            };
            Compare.$ex = function $ex(objVal, val) {
                return !Compare.$in(objVal, val);
            };
            Compare.$like = function $like(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index, i = 0, valLen;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                val = Utils.flatten([
                    val
                ]);
                valLen = val.length;
                index = objVal.length;
                while(index) {
                    --index;
                    i = valLen;
                    while(!!i) {
                        --i;
                        if(Utils.isString(objVal[index]) && !(objVal[index].search(val[i]) === -1)) {
                            return true;
                        }
                    }
                }
                return false;
            };
            Compare.$startsWith = function $startsWith(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(Utils.isString(objVal[index]) && !(objVal[index].search('^' + val) === -1)) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$endsWith = function $endsWith(objVal, val) {
                var objValIsArray = Utils.isArray(objVal), index;
                objVal = objValIsArray ? Utils.unique(objVal) : [
                    objVal
                ];
                index = objVal.length;
                while(index) {
                    --index;
                    if(Utils.isString(objVal[index]) && !(objVal[index].search(val + '$') === -1)) {
                        return true;
                    }
                }
                return false;
            };
            Compare.$all = function $all(objVal, val) {
                var matchCnt = 0, index = 0, i = 0, valLen = 0;
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
                            if(((Utils.isDate(val[i]) && Utils.isDate(objVal[index])) || (Utils.isBoolean(val[i]) && Utils.isBoolean(objVal[index])) || (!(Utils.isDate(objVal[index]) || Utils.isBoolean(objVal[index])))) && (Utils.parseValue(objVal[index]) === Utils.parseValue(val[i]))) {
                                matchCnt++;
                            }
                        }
                    }
                }
                return matchCnt == valLen;
            };
            Compare.$match = function $match(objVal, val) {
                var matchCnt = 0, index = 0, i = 0, valLen = 0;
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
                            if(((Utils.isDate(val[i]) && Utils.isDate(objVal[index])) || (Utils.isBoolean(val[i]) && Utils.isBoolean(objVal[index])) || (!(Utils.isDate(objVal[index]) || Utils.isBoolean(objVal[index])))) && (Utils.parseValue(objVal[index]) === Utils.parseValue(val[i]))) {
                                matchCnt++;
                            }
                        }
                    }
                }
                return matchCnt == valLen;
            };
            Compare.$has = function $has(obj, val) {
                var i = 0, tempObj, tempProp;
                val = Utils.flatten([
                    val
                ]);
                i = val.length;
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
            Compare.$hasNot = function $hasNot(obj, val) {
                return !Compare.$has(obj, val);
            };
            return Compare;
        })();
        Mogwai.Compare = Compare;        
    })(Helios.Mogwai || (Helios.Mogwai = {}));
    var Mogwai = Helios.Mogwai;
    var Utils = (function () {
        function Utils() { }
        Utils.validNumeric = /^\$?\-?([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(?:\.\d{0,2})?|0(?:\.\d{0,2})?|(?:\.\d{1,2}))$|^\-?\$?(?:[1-9]{1}\d{0,2}(?:\,\d{3})*(?:\.\d{0,2})?|[1-9]{1}\d{0,}(?:\.\d{0,2})?|0(?:\.\d{0,2})?|(?:\.\d{1,2}))$|^\(\$?(?:[1-9]{1}\d{0,2}(?:\,\d{3})*(?:\.\d{0,2})?|[1-9]{1}\d{0,}(?:\.\d{0,2})?|0(?:\.\d{0,2})?|(?:\.\d{1,2}))\)$/;
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
            }, compObj;
            elements = Utils.flatten(elements);
            compObj = elements[0];
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
            }, i, k, l = array.length, r = [];
            for(i = 0; i < l; i += 1) {
                o[array[i]] = array[i];
            }
            for(k in o) {
                if(o.hasOwnProperty(k)) {
                    r.push(o[k]);
                }
            }
            return r;
        };
        Utils.uniqueRow = function uniqueRow(arrays, step) {
            var o = {
            }, i, j, k, l = arrays.length, r = [];
            var prop;
            for(i = 0; i < l; i++) {
                prop = "";
                for(j = 0; j < step; j++) {
                    prop += arrays[i][j].obj[arrays[i][j].graph.meta.id] + ",";
                }
                o[prop] = arrays[i].slice(0, step);
            }
            for(k in o) {
                if(o.hasOwnProperty(k)) {
                    r.push(o[k]);
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
        Utils.findInstances = function findInstances(array, instances) {
            var o = {
            }, id, i, l = array.length, r = [];
            for(i = 0; i < l; i += 1) {
                id = array[i].obj[array[i].graph.meta.id];
                o[id] = array[i];
                ('count' in o[id]) ? o[id].count++ : o[id].count = 1;
            }
            for(i in o) {
                if(o.hasOwnProperty(i)) {
                    if(o[i].count == instances) {
                        r.push(o[i]);
                    }
                    delete o[i].count;
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
        Utils.funcBody = function funcBody(closure) {
            return "it = " + closure + "; return it;";
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
            var o, i = objs.length, tempObj, tempProp = prop, result = [], isElement = false, isEmbedded = false;
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
        Utils.toPathArray = function toPathArray(array, steps) {
            var i, l = array.length, result = [];
            for(i = 0; i < l; i += 1) {
                if(!steps[i + 1].exclFromPath) {
                    result.push(Utils.isElement(array[i]) ? array[i].obj : array[i]);
                }
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
        Utils.isBoolean = function isBoolean(o) {
            return toString.call(Utils.parseBoolean(o)) === '[object Boolean]';
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
            return toString.call(o) === '[object Function]';
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
        Utils.isDate = function isDate(o) {
            return Utils.isString(o) && !(new Date(o).toString() === 'Invalid Date');
        };
        Utils.isMoney = function isMoney(val) {
            if(Utils.validNumeric.exec(val) != null) {
                return Utils.validNumeric.exec(val)[0].length === Utils.validNumeric.exec(val)[1].length;
            }
            return false;
        };
        Utils.parseNumber = function parseNumber(val) {
            var numResult = Utils.validNumeric.exec(val);
            if(numResult != null) {
                return parseFloat(numResult[1]);
            }
            return val;
        };
        Utils.parseBoolean = function parseBoolean(val) {
            if(Utils.isString(val)) {
                if(val.toLowerCase() === 'true') {
                    return true;
                }
                if(val.toLowerCase() === 'false') {
                    return false;
                }
            }
            return val;
        };
        Utils.parseValue = function parseValue(val) {
            var numResult = Utils.validNumeric.exec(val);
            if(numResult != null) {
                if(!!numResult[2]) {
                    return parseFloat(numResult[1].replace(numResult[2].charAt(0), ''));
                }
                return parseFloat(numResult[1]);
            }
            if(Utils.isBoolean(val)) {
                return Utils.parseBoolean(val);
            }
            if(Utils.isDate(val)) {
                return Date.parse(val);
            }
            return val;
        };
        return Utils;
    })();    
})(Helios || (Helios = {}));
try  {
    importScripts('sax.js', 'q.min.js', 'uuid.js', 'q-comm.js');
    var i, l, g, r;
    Q_COMM.Connection(this, {
        init: function (params) {
            g = !!params ? new Helios.GraphDatabase(params) : new Helios.GraphDatabase();
            return 'Database created';
        },
        dbCommand: function (params) {
            r = g;
            for(i = 0 , l = params.length; i < l; i++) {
                r = r[params[i].method].apply(r, params[i].parameters);
            }
            return r;
        },
        run: function (params) {
            r = g;
            params.push({
                method: 'emit',
                parameters: []
            });
            for(i = 0 , l = params.length; i < l; i++) {
                r = r[params[i].method].apply(r, params[i].parameters);
            }
            g.startTrace(false);
            return r;
        },
        startTrace: function (param) {
            g.startTrace(param);
        }
    });
} catch (exception) {
    console.log(exception.message);
}
//@ sourceMappingURL=heliosDB.js.map
