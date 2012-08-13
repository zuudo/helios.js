/*
    Helios.js    
    Licensed under the MIT license

    Copyright (c) 2012 Entrendipity Pty. Ltd.
*/
;(function (window, undefined) {
    'use strict';

    /** Detect free variable 'exports' */
    var freeExports = typeof exports == 'object' && exports &&
            (typeof global == 'object' && global && global == global.global && (window = global), exports);

    var toString = Object.prototype.toString,
        ArrayProto = Array.prototype,
        push = ArrayProto.push,
        pop = ArrayProto.pop,
        slice = ArrayProto.slice,
        shift = ArrayProto.shift,
        indexOf = ArrayProto.indexOf,
        concat = ArrayProto.concat,
        env, //config env variables
        fn = {}, //internal functions
        dbfn = {}, //graph database functions
        comparable = {}, //comparable functions i.e. eq, neq ...
        hasVIndex = false,
        hasEIndex = false,
        graph = {'vertices': {}, 'edges': {}, 'v_idx': {}, 'e_idx': {}},
        unpipedFuncs = ['label', 'id', 'value', 'distinct', 'stringify', 'count', 'map', 'clone', 'path', 'fork', 'pin', 'delete'];

    Function.prototype.pipe = function () {
        var that = this;
        return function () {
            var pipedArgs = [],
                isStep = !fn.include(['as', 'back', 'loop', 'countBy', 'groupBy', 'groupSum', 'store', 'addV', 'update',
                                        'addOutE', 'addInE', 'moveOutE', 'moveInE'], that.name);

            //reset any travesal - used by tail() & head()
            this.traversedVertices = {};
            this.traversedEdges = {};

            push.call(pipedArgs, this.pipedObjects);
            push.apply(pipedArgs, arguments);
            if (isStep) {
                this.pipeline.steps[this.pipeline.steps.currentStep += 1] = { 'pipedInArgs': pipedArgs, 'func': that, 'pipedOutArgs': [] };
            }
            //New piped Objects to be passed to the next step
            this.pipedObjects = that.apply(this, pipedArgs);
            if (isStep && this.pipeline.steps.currentStep !== 0) {
                push.call(this.pipeline.steps[this.pipeline.steps.currentStep].pipedOutArgs, this.pipedObjects);
            }
            return this;
        };
    };

    //pipe enable all Helios functions except unpiped functions
    function pipe() {
        var func, self = this;
        for (func in self) {
            //if (self.hasOwnProperty(func)) {
            if (typeof self[func] === "function" && !fn.include(unpipedFuncs, func)) {
                self[func] = self[func].pipe();
            }
            //}
        }
        return self;
    }

    //Object constructor
    function Helios() {

        this.traversedVertices = {};
        this.traversedEdges = {};
        this.pipeline = {};
        this.pipedObjects = [];
        //used to prevent steps being reset for fork()
        this.preserveSteps = false;

        fn.resetPipe.call(this);
        return pipe.call(this);
    }


    Helios.toString = function () { return "Helios"; };

    Helios.VERSION = '0.0.1';

    //default configuration
    Helios.ENV = {
        'id': '_id',
        'label': '_label',
        'type': '_type',
        'outEid': '_outE',
        'inEid': '_inE',
        'outVid': '_outV',
        'inVid': '_inV',
        'VOut':'out',
        'VIn':'in'
    };


    /****************************************************************************************************
     *              N.B.    The bang symbol (!) signifies are required parameter.                       *
     *                      The splat symbol (*) signifies many                                         *
     ****************************************************************************************************/

    /***************************************************************************************************

        API: N.B. All examples will use the 'g' variable to demonstrate how to use Helios and uses the
                sample data where necessary to describe output
        
        @sample data

            var config = {
                'id':'@rid',
                'label': '@label',
                'type':'@type',
                'outEid': '@outE',
                'inEid': '@inE',
                'outVid': '@outV',
                'inVid': '@inV'
            };

            var someData = {
                "vertices":[
                    {"name":"marko","age":29,"@rid":10,"@type":"vertex"},
                    {"name":"vadas","age":27,"@rid":20,"@type":"vertex"},
                    {"name":"lop","lang":"java","@rid":30,"@type":"vertex"},
                    {"name":"josh","age":32,"@rid":40,"@type":"vertex"},
                    {"name":"ripple","lang":"java","@rid":50,"@type":"vertex"},
                    {"name":"peter","age":35,"@rid":60,"@type":"vertex"}
                    ],
                "edges":[
                    {"weight":0.5,"@rid":70,"@type":"edge","@outV":10,"@inV":20,"@label":"knows"},
                    {"weight":1.0,"@rid":80,"@type":"edge","@outV":10,"@inV":40,"@label":"knows"},
                    {"weight":0.4,"@rid":90,"@type":"edge","@outV":10,"@inV":30,"@label":"created"},
                    {"weight":1.0,"@rid":100,"@type":"edge","@outV":40,"@inV":50,"@label":"created"},
                    {"weight":0.4,"@rid":110,"@type":"edge","@outV":40,"@inV":30,"@label":"created"},
                    {"weight":0.2,"@rid":120,"@type":"edge","@outV":60,"@inV":30,"@label":"created"}
                ]
            };

            var g = Helios.newGraph(someData, config);

    ***************************************************************************************************/

    /****************************************************************************************************

        Creates a reference to Helios
        @name       Helios.newGraph()
        @param      {GraphSON|GraphML}  The graph data to add to database. Needs to be in GraphSON
                                        format, otherwise Helios.ENV needs to be configured.
        @param      {JSON}              Object to set Helios.ENV parameters. All ENV args are optional.
        @returns    {Helios}            Returns an instance of Helios.
        
        @example

            var config = {
                'id':'@rid',
                'label': '@label',
                'type':'@type',
                'outEid': '@outE',
                'inEid': '@inE',
                'outVid': '@outV',
                'inVid': '@inV'
            };

            var someData = {
                "vertices":[
                    {"name":"marko","age":29,"@rid":10,"@type":"vertex"},
                    {"name":"vadas","age":27,"@rid":20,"@type":"vertex"},
                    {"name":"lop","lang":"java","@rid":30,"@type":"vertex"},
                    {"name":"josh","age":32,"@rid":40,"@type":"vertex"},
                    {"name":"ripple","lang":"java","@rid":50,"@type":"vertex"},
                    {"name":"peter","age":35,"@rid":60,"@type":"vertex"}
                    ],
                "edges":[
                    {"weight":0.5,"@rid":70,"@type":"edge","@outV":10,"@inV":20,"@label":"knows"},
                    {"weight":1.0,"@rid":80,"@type":"edge","@outV":10,"@inV":40,"@label":"knows"},
                    {"weight":0.4,"@rid":90,"@type":"edge","@outV":10,"@inV":30,"@label":"created"},
                    {"weight":1.0,"@rid":100,"@type":"edge","@outV":40,"@inV":50,"@label":"created"},
                    {"weight":0.4,"@rid":110,"@type":"edge","@outV":40,"@inV":30,"@label":"created"},
                    {"weight":0.2,"@rid":120,"@type":"edge","@outV":60,"@inV":30,"@label":"created"}
                ]
            };

            var g = Helios.newGraph(someData, config);

            >>>>> N.B. All examples will use the 'g' variable to demonstrate how to use Helios <<<<<

    ***************************************************************************************************/
    Helios.newGraph = function (aGraph, conf) {
        var isJSON = false, fileExt, key;

        if (fn.isString(aGraph)) {
            fileExt = aGraph.split('.').pop();
            isJSON = fileExt.toLowerCase() === 'json';
        }

        if (!!aGraph && (aGraph.hasOwnProperty('vertices') || aGraph.hasOwnProperty('edges'))) {
            isJSON = true;
        }

        if ((!!aGraph && !fn.isString(aGraph) && !isJSON) || !!conf) {
            if (!conf) {
                conf = aGraph;
                aGraph = false;
            }
            for (key in conf) {
                if (conf.hasOwnProperty(key)) {
                    Helios.ENV[key] = conf[key];
                }
            }
        }
        if (!!aGraph && isJSON) {
            dbfn.loadGraphSON(aGraph);
        }
        if (!!aGraph && !isJSON) {
            dbfn.loadGraphML(aGraph);
        }
        return new Helios();
    };

    /***************************************************************************************************

        Graph Utils: Loads GraphSON data into Helios. Reloading the same data will replace/update existing records.
                     Called fro Helios object used graph.

        @name       graph.loadGraphSON()    callable
        @param      !{JSON}                 The graph data to add to database. Needs to be in GraphSON
                                            format, otherwise Helios.ENV needs to be configured.
        @returns    {Helios}                Returns the instance of Helios.

        @example

            var someData = {
                "vertices":[
                    {"name":"marko","age":29,"@rid":10,"@type":"vertex"},
                    {"name":"vadas","age":27,"@rid":20,"@type":"vertex"},
                    {"name":"lop","lang":"java","@rid":30,"@type":"vertex"},
                    {"name":"josh","age":32,"@rid":40,"@type":"vertex"},
                    {"name":"ripple","lang":"java","@rid":50,"@type":"vertex"},
                    {"name":"peter","age":35,"@rid":60,"@type":"vertex"}
                    ],
                "edges":[
                    {"weight":0.5,"@rid":70,"@type":"edge","@outV":10,"@inV":20,"@label":"knows"},
                    {"weight":1.0,"@rid":80,"@type":"edge","@outV":10,"@inV":40,"@label":"knows"},
                    {"weight":0.4,"@rid":90,"@type":"edge","@outV":10,"@inV":30,"@label":"created"},
                    {"weight":1.0,"@rid":100,"@type":"edge","@outV":40,"@inV":50,"@label":"created"},
                    {"weight":0.4,"@rid":110,"@type":"edge","@outV":40,"@inV":30,"@label":"created"},
                    {"weight":0.2,"@rid":120,"@type":"edge","@outV":60,"@inV":30,"@label":"created"}
                ]
            };

            var g= Helios.newGraph();
            g.graph.loadGraphSON(someData);

    ***************************************************************************************************/
    dbfn.loadGraphSON = function (jsonData) {

        var xmlhttp;

        env = Helios.ENV;

		if (fn.isUndefined(jsonData)) { return; }
		if (fn.isString(jsonData)) {
			xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState === 4) {
                    jsonData = JSON.parse(xmlhttp.response);
                }
			};
			xmlhttp.open("GET", jsonData, false);
			xmlhttp.send(null);
		}

		//process vertices
		if (jsonData.vertices) {
            dbfn.loadVertices(jsonData.vertices);
		}

		//process edges
		if (jsonData.edges) {
            dbfn.loadEdges(jsonData.edges);
		}
		return Helios;
    };

    /*Use this to load JSON Verticies into Graph*/
    dbfn.loadVertices = function(){
        
        var i,
            retVal = [],
            rows =  fn.flatten(slice.call(arguments)),
            l = rows.length, 
            vertex = {};

        hasVIndex = !fn.isEmpty(graph.v_idx);

        for (i = 0; i < l; i += 1) {
            graph.vertices[rows[i][env.id]] = { 'obj': rows[i], 'type': 'vertex', 'outE': {}, 'inE': {} };
            vertex = graph.vertices[rows[i][env.id]];
            push.call(retVal, vertex);
            //Add to index
            if (hasVIndex) {
                fn.addVIndex(vertex);
            }
        }
        return retVal;
    }

    /*Use this to load JSON Edges into Graph*/
    dbfn.loadEdges = function(){
        
        var i,
            retVal = [],        
            rows = fn.flatten(slice.call(arguments)),
            l = rows.length,
            edge = {};

        hasEIndex = !fn.isEmpty(graph.e_idx);

        for (i = 0; i < l; i += 1) {
            edge = { 'obj': rows[i], 'type': 'edge', 'outV': {}, 'inV': {} };
            graph.edges[edge.obj[env.id]] = edge;
            fn.associateVertices(edge);
            edge.obj[env.VOut] = edge.outV.obj;
            edge.obj[env.VIn] = edge.inV.obj;
            delete edge.obj[env.outVid];
            delete edge.obj[env.inVid];
            push.call(retVal, edge);
            //Add to index
            if (hasEIndex) {
                fn.addEIndex(edge);
            }
        }
        return retVal;
    }
    /***************************************************************************************************

        Graph Utils: Loads GraphML data into Helios. Reloading the same data will replace/update existing records.
                     Called fro Helios object used graph.

        @name       graph.loadGraphML()     callable
        @param      !{XML}                  The graph data to add to database. Needs to be in GraphML
                                            format.
        @returns    {Helios}                Returns the instance of Helios.

        @example

            var g= Helios.newGraph();
            g.graph.loadGraphML(someXMLData);

    ***************************************************************************************************/
    dbfn.loadGraphML = function (xmlData) {

        var i, j, l, propLen,
            xmlV = [], xmlE = [], vertex = {}, edge = {},
            fileExt,
            xmlhttp,
            parser,
            xmlDoc,
            properties,
            tempObj = {};

        hasVIndex = !fn.isEmpty(graph.v_idx);
        hasEIndex = !fn.isEmpty(graph.e_idx);

        env = Helios.ENV;

        if (fn.isUndefined(xmlData)) { return; }
        if (fn.isString(xmlData)) {

            fileExt = xmlData.split('.').pop();

            if (fileExt.toLowerCase() === 'xml') {

                xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState === 4) {
                        xmlDoc = xmlhttp.responseXML;
                    }
                };
                xmlhttp.open("GET", xmlData, false);
                xmlhttp.send(null);
            } else {

                if (window.DOMParser) {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xmlData, "text/xml");
                } else {// Internet Explorer
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(xmlData);
                }
            }
        }

        xmlV = xmlDoc.getElementsByTagName("node");
        xmlE = xmlDoc.getElementsByTagName("edge");

        //process vertices
        if (!!xmlV.length) {
            l = xmlV.length;

            for (i = 0; i < l; i += 1) {
                properties = xmlV[i].getElementsByTagName("data");
                tempObj = {};
                propLen = properties.length;
                for (j = 0; j < propLen; j += 1) {
                    tempObj[properties[j].getAttribute("key")] = properties[j].firstChild.nodeValue;
                }
                tempObj[env.id] = xmlV[i].getAttribute("id");
                tempObj[env.type] = 'vertex';
                graph.vertices[xmlV[i].getAttribute("id")] = { 'obj': tempObj, 'type': 'vertex', 'outE': {}, 'inE': {} };
                vertex = graph.vertices[xmlV[i].getAttribute("id")];
                //Add to index
                if (hasVIndex) {
                    fn.addVIndex(vertex);
                }
            }
        }

        //process edges
        if (!!xmlE.length) {
            l = xmlE.length;

            for (i = 0; i < l; i += 1) {
                properties = xmlE[i].getElementsByTagName("data");
                tempObj = {};
                propLen = properties.length;
                for (j = 0; j < propLen; j += 1) {
                    tempObj[properties[j].getAttribute("key")] = properties[j].firstChild.nodeValue;
                }
                tempObj[env.id] = xmlE[i].getAttribute("id");
                tempObj[env.type] = 'edge';
                tempObj[env.label] = xmlE[i].getAttribute("label");
                tempObj[env.outVid] = xmlE[i].getAttribute("source");
                tempObj[env.inVid] = xmlE[i].getAttribute("target");

                graph.edges[xmlE[i].getAttribute("id")] = { 'obj': tempObj, 'type': 'edge', 'outV': {}, 'inV': {} };
                edge = graph.edges[xmlE[i].getAttribute("id")];
                fn.associateVertices(edge);
                edge.obj[env.VOut] = edge.outV.obj;
                edge.obj[env.VIn] = edge.inV.obj;
                delete edge.obj[env.outVid];
                delete edge.obj[env.inVid];
                //Add to index
                if (hasEIndex) {
                    fn.addEIndex(edge);
                }
            }
        }
        return Helios;
    };


    dbfn.createVIndex = function (idxName) {
        var vertices = [];

        if (!graph.v_idx[idxName]) {
            vertices = fn.toArray(graph.vertices);
            graph.v_idx[idxName] = {};
            fn.each(vertices, function (vertex) {
                fn.addVIndex(vertex, idxName);
            });
        }
        hasVIndex = !fn.isEmpty(graph.v_idx);
    };

    dbfn.deleteVIndex = function (idxName) {
        delete graph.v_idx[idxName];
        hasVIndex = !fn.isEmpty(graph.v_idx);
    };

    dbfn.createEIndex = function (idxName) {
        var edges = [];

        if (!graph.e_idx[idxName]) {
            edges = fn.toArray(graph.edges);
            graph.e_idx[idxName] = {};
            fn.each(edges, function (edge) {
                fn.addEIndex(edge, idxName);
            });
        }
        hasEIndex = !fn.isEmpty(graph.e_idx);
    };

    dbfn.deleteEIndex = function (idxName) {
        delete graph.e_idx[idxName];
        hasEIndex = !fn.isEmpty(graph.e_idx);
    };

    dbfn.addV = function () {
        var args = fn.flatten(slice.call(arguments, 0)),
            newVertices = [];

        fn.each(args, function(vertex){
            //create vertex if it doesn't have an id
            if (!!!vertex[env.id]) {
                vertex[env.id] = uuid.v4(); //new id
                //vertex[env.type] = 'vertex';
                push.call(newVertices, vertex);
            }

        });
        
        return fn.toObjArray(dbfn.loadVertices(newVertices));
    }

    fn.addVIndex = function (vertex, idxName) {
        var idx;
        if (idxName) {
            if (!!vertex.obj[idxName]) {
                if (!graph.v_idx[idxName][vertex.obj[idxName]]) {
                    graph.v_idx[idxName][vertex.obj[idxName]] = {};
                }
                graph.v_idx[idxName][vertex.obj[idxName]][vertex.obj[env.id]] = vertex;
            }
        } else {
            for (idx in graph.v_idx) {
                if (graph.v_idx.hasOwnProperty(idx)) {
                    if (!!vertex.obj[idx]) {
                        if (!graph.v_idx[idx][vertex.obj[idx]]) {
                            graph.v_idx[idx][vertex.obj[idx]] = {};
                        }
                        graph.v_idx[idx][vertex.obj[idx]][vertex.obj[env.id]] = vertex;
                    }
                }
            }
        }
    };

    //deletes an element from all indexes
    fn.deleteElementIndexes = function (element) {
        var key, idxName;
        
        if (element.type === 'vertex') {
            for (idxName in graph.v_idx) {
                if (graph.v_idx.hasOwnProperty(idxName)) {
                    if (!!element.obj[idxName]) {
                        key = element.obj[idxName];
                        delete graph.v_idx[idxName][key][element.obj[env.id]];
                        if (fn.isEmpty(graph.v_idx[idxName][key])) {
                            delete graph.v_idx[idxName][key];
                        }                        
                    }
                }
            }
        } else {
            for (idxName in graph.e_idx) {
                if (graph.e_idx.hasOwnProperty(idxName)) {
                    if (!!element.obj[idxName]) {
                        key = element.obj[idxName];
                        delete graph.e_idx[idxName][key][element.obj[env.id]];
                        if (fn.isEmpty(graph.e_idx[idxName][key])) {
                            delete graph.e_idx[idxName][key];
                        } 
                    }
                }
            }
        }
    };

    // fn.updateIndexedElement = function (fromElement, toElement, idxName) {
    //     var key, idxName;
        
    //     if (element.type === 'vertex') {
    //         for (idxName in graph.v_idx) {
    //             if (graph.v_idx.hasOwnProperty(idxName)) {
    //                 if (!!element.obj[idxName]) {
    //                     key = element.obj[idxName];
    //                     delete graph.v_idx[idxName][key][element.obj[env.id]];
    //                 }
    //             }
    //         }
    //     } else {
    //         for (idxName in graph.e_idx) {
    //             if (graph.e_idx.hasOwnProperty(idxName)) {
    //                 if (!!element.obj[idxName]) {
    //                     key = element.obj[idxName];
    //                     delete graph.e_idx[idxName][key][element.obj[env.id]];
    //                 }
    //             }
    //         }
    //     }
    // };

    fn.addEIndex = function (edge, idxName) {
        var idx;
        if (idxName) {
            if (!!edge.obj[idxName]) {
                if (!graph.e_idx[idxName][edge.obj[idxName]]) {
                    graph.e_idx[idxName][edge.obj[idxName]] = {};
                }
                graph.e_idx[idxName][edge.obj[idxName]][edge.obj[env.id]] = edge;
            }
        } else {
            for (idx in graph.e_idx) {
                if (graph.e_idx.hasOwnProperty(idx)) {
                    if (!!edge.obj[idx]) {
                        if (!graph.e_idx[idx][edge.obj[idx]]) {
                            graph.e_idx[idx][edge.obj[idx]] = {};
                        }
                        graph.e_idx[idx][edge.obj[idx]][edge.obj[env.id]] = edge;
                    }
                }
            }
        }
    };

    fn.associateVertices = function (edge) {
        var vertex;

        if (!graph.vertices[edge.obj[env.outVid]]) {
            graph.vertices[edge.obj[env.outVid]] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
        }
        vertex = graph.vertices[edge.obj[env.outVid]];
        if (!vertex.outE[edge.obj[env.label]]) {
            vertex.outE[edge.obj[env.label]] = [];
        }
        edge.outV = vertex;
        push.call(vertex.outE[edge.obj[env.label]], edge);

        if (!graph.vertices[edge.obj[env.inVid]]) {
            graph.vertices[edge.obj[env.inVid]] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
        }
        vertex = graph.vertices[edge.obj[env.inVid]];
        if (!vertex.inE[edge.obj[env.label]]) {
            vertex.inE[edge.obj[env.label]] = [];
        }
        vertex = graph.vertices[edge.obj[env.inVid]];
        edge.inV = vertex;
        push.call(vertex.inE[edge.obj[env.label]], edge);
    };

    /***************************************************************************************************

        Clear and reset the graph.

        @name       graph.close()
        @returns    {Helios}                    Returns the instance of Helios.

        @example

            g.graph.close();

    ***************************************************************************************************/
    dbfn.close = function () {
        graph = {'vertices': {}, 'edges': {}, 'v_idx': {}, 'e_idx': {}};
        return Helios;
    };

    //utils are internal utility functions
    fn.resetPipe = function () {
        if (!this.preserveSteps) {
            this.pipeline = {
                'steps': {
                    'currentStep': 0
                },
                'namedStep': {}
            };
        }
        //if this.pipelineCache has been created then signifies to
        //preserve step 1 - used by pin()
        if (!fn.isEmpty(this.pipelineCache)) {
            this.pipeline.steps['1'] = {};
            this.pipeline.steps['1'].pipedInArgs = [];
            this.pipeline.steps['1'].func = this.pipelineCache.func;
            this.pipeline.steps['1'].pipedOutArgs = this.pipelineCache.pipedOutArgs;
            this.pipeline.steps.currentStep = 1;
            this.pipedObjects = this.pipelineCache.pipedOutArgs[0];
        }
    };

    fn.toArray = function (o) {
        var k, r = [];
        for (k in o) {
            if (o.hasOwnProperty(k)) {
                //This is done so that when a temp id is updated from the server
                //it won't be included in arrays and counts
                //if (o[k].obj[env.id] == k) { 
                    r.push(o[k]);
                //}
            }
        }
        return r;
    };

    fn.isArray = function (o) {
        return toString.call(o) === '[object Array]';
    };

    fn.isString = function (o) {
        return toString.call(o) === '[object String]';
    };

    fn.isNumber = function (o) {
        return toString.call(o) === '[object Number]';
    };

    fn.isDate = function (o) {
        return toString.call(o) === '[object Date]';
    };

    fn.isObject = function (o) {
        return toString.call(o) === '[object Object]';
    };

    fn.isEmpty = function (o) {
        var key;
        if (!o) {
            return true;
        }
        for (key in o) {
            if (o.hasOwnProperty(key)) {
                return !o[key];
            }
        }
        return true;
    };

    fn.isFunction = function (o) {
        return toString.call(o) === '[object Function]';
    };

    fn.isNull = function (o) {
        return toString.call(o) === '[object Null]';
    };

    fn.isUndefined = function (o) {
        return toString.call(o) === '[object Undefined]';
    };

    fn.intersection = function (arr1, arr2, isObj) {
        var r = [], o = {}, i, comp;
        for (i = 0; i < arr2.length; i += 1) {
            if (!!isObj) {
                o[arr2[i][env.id]] = true;
            } else {
                o[arr2[i]] = true;
            }
        }

        for (i = 0; i < arr1.length; i += 1) {
            comp = !!isObj ? arr1[i][env.id] : arr1[i];
            if (!!o[comp]) {
                r.push(arr1[i]);
            }
        }
        return r;
    };

    //fn are internal Functions
    fn.difference = function (arr1, arr2, isObj) {
        var r = [], o = {}, i, comp;
        for (i = 0; i < arr2.length; i += 1) {
            if (!!isObj) {
                o[arr2[i][env.id]] = true;
            } else {
                o[arr2[i]] = true;
            }
        }

        for (i = 0; i < arr1.length; i += 1) {
            comp = !!isObj ? arr1[i][env.id] : arr1[i];
            if (!o[comp]) {
                r.push(arr1[i]);
            }
        }
        return r;
    };

    fn.unique = function (array) {

        var o = {}, i, l = array.length, r = [];
        for (i = 0; i < l; i += 1) {
            o[array[i]] = array[i];
        }
        for (i in o) {
            if (o.hasOwnProperty(i)) {
                r.push(o[i]);
            }
        }
        return r;

    };

    fn.uniqueObject = function (array) {

        var o = {}, i, l = array.length, r = [];
        for (i = 0; i < l; i += 1) {
            o[array[i].obj[env.id]] = array[i];
        }
        for (i in o) {
            if (o.hasOwnProperty(i)) {
                r.push(o[i]);
            }
        }
        return r;
    };

    fn.countBy = function (array, o, props) {

        var retVal = arguments[0],
            i,
            j,
            l = array.length,
            element = {},
            propsLen;

        if (!props) {
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for (i = 0; i < l; i += 1) {
            element = array[i].obj;
            for (j = 0; j < propsLen; j += 1) {
                if (!o[props[j]]) {
                    o[props[j]] = 1;
                } else {
                    o[props[j]] += 1;
                }
            }
        }
        return retVal;
    };

    fn.sumBy = function (array, o, props) {
        //TODO: Need to cater for CURRENCY values

        var retVal = arguments[0],
            i,
            j,
            l = array.length,
            element = {},
            propsLen;

        if (!props) {
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for (i = 0; i < l; i += 1) {
            element = array[i].obj;
            for (j = 0; j < propsLen; j += 1) {
                if (!o[props[j]]) {
                    o[props[j]] = fn.isNumber(element[props[j]]) ? element[props[j]] : 0;
                } else {
                    o[props[j]] += fn.isNumber(element[props[j]]) ? element[props[j]] : 0;
                }
            }
        }
        return retVal;
    };

    fn.groupBy = function (arr, o, props) {

        var retVal = arguments[0],
            i,
            j,
            array = fn.uniqueObject(arr),
            l = array.length,
            element = {},
            propsLen,
            group;

        if (!props) {
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for (i = 0; i < l; i += 1) {
            element = array[i].obj;
            group = o;
            for (j = 0; j < propsLen; j += 1) {
                if (j === propsLen - 1) {
                    if (!group[element[props[j]]]) {
                        group[element[props[j]]] = [element];
                    } else {
                        push.call(group[element[props[j]]], element);
                    }
                } else {
                    if (!group[element[props[j]]]) {
                        group[element[props[j]]] = {};
                    }
                }
                group = group[element[props[j]]];
            }
        }
        return retVal;
    };

    fn.groupCount = function (arr, o, props) {

        var retVal = arguments[0],
            i,
            j,
            array = dedup(arr),
            l = array.length,
            element = {},
            propsLen,
            group;

        if (!props) {
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for (i = 0; i < l; i += 1) {
            element = array[i].obj;
            group = o;
            for (j = 0; j < propsLen; j += 1) {
                if (j === propsLen - 1) {
                    if (!group[element[props[j]]]) {
                        group[element[props[j]]] = [element];
                    } else {
                        push.call(group[element[props[j]]], element);
                    }
                } else {
                    if (!group[element[props[j]]]) {
                        group[element[props[j]]] = {};
                    }
                }
                group = group[element[props[j]]];
                if (!group.count) {
                    group.count = 1;
                } else {
                    group.count += 1;
                }
            }
        }
        return retVal;
    };

    fn.clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    fn.include = function (array, i) {
        return indexOf.call(array, i) === -1 ? false : true;
    };

    fn.keys = function (o) {
        var k, r = [];
        for (k in o) {
            if (o.hasOwnProperty(k)) {
                r.push(k);
            }
        }
        return r;
    };

    fn.values = function (o) {
        return fn.toArray(o);
    };

    fn.pick = function (o) {

        var prop,
            props = concat.apply(ArrayProto, arguments),
            i = props.length,
            result = {};

        while (i) {
            i -= 1;
            prop = props[i];
            if (o.hasOwnProperty(prop)) {
                result[prop] = o[prop];
            }
        }
        return result;
    };

    fn.toObjArray = function (array) {
        var i, l = array.length, result = [];

        for (i = 0; i < l; i += 1) {
            push.call(result, array[i].obj);
        }
        return result;
    };

    fn.flatten = function (array, shallow) {

        var result = [],
            value,
            index = -1,
            length;

        if (!array) {
            return result;
        }

        length = array.length;

        while ((index += 1) < length) {
            value = array[index];
            if (fn.isArray(value)) {
                push.apply(result, shallow ? value : fn.flatten(value));
            } else {
                result.push(value);
            }
        }
        return result;
    };

    fn.map = function (array, func) {

        var i, len = array.length, val, retVal = [];

        //if (!fn.isFunction(func))
          //throw new TypeError();

        for (i = 0; i < len; i += 1) {
            val = array[i]; // in case func mutates this
            retVal.push(func.call(null, val));
        }
        return retVal;
    };

    fn.where = function (array, func) {

        var i, len = array.length, val, retVal = [];

        //if (!fn.isFunction(func))
          //throw new TypeError();

        for (i = 0; i < len; i += 1) {
            val = array[i]; // in case func mutates this
            if (func.call(null, val)) {
                retVal.push(val);
            }
        }
        return retVal;
    };

    fn.each = function (array, func) {

        var i, len = array.length, val, retVal = [];

        //if (!fn.isFunction(func))
          //throw new TypeError();

        for (i = 0; i < len; i += 1) {
            val = array[i]; // in case func mutates this
            func.call(null, val);
        }
    };

    fn.removeEdge = function (objArr, id) {
        var i, len, retVal = [];

        if (!!!id) {
            id = objArr;
            objArr = undefined;
        }
        delete graph.edges[id];
        if (!!!objArr) {
            return retVal;
        }
        len = objArr.length;
        for (i = 0; i < len; i += 1) {
            if (objArr[i].obj[env.id] == id) {
                if (hasEIndex) {
                    fn.deleteElementIndexes(objArr[i]);
                }
                push.apply(retVal, slice.call(objArr, i + 1));
                return retVal;
            } else {
                push.call(retVal, objArr[i]);
            }
        }
        return retVal;
    }

    fn.removeAllEdges = function (objArr) {
        var i, len, edgeArr = [], retVal = [], eid;

        for (label in objArr) {
            if (objArr.hasOwnProperty(label)) {
                edgeArr = objArr[label];
                push.apply(retVal, edgeArr);
                len = edgeArr.length;
                for (i = 0; i < len; i += 1) {
                    eid = edgeArr[i].obj[env.id];
                    edgeArr[i].inV.inE[label] = fn.removeEdge(edgeArr[i].inV.inE[label], eid);
                    edgeArr[i].outV.outE[label] = fn.removeEdge(edgeArr[i].outV.outE[label], eid);
                }
            }
        }
        return retVal;
    }
    /***************************************************************************************************

        Called to emit the result from traversing the graph.

        @name       pipedValue()        Not to be called directly
        @alias      value()             callable
        @returns    {Object Array}      Returns a Referenced Object Array to emitted Vertices or Edges.
        
        @example
            
            var result = g.V().value();

    ***************************************************************************************************/
    function pipedValue() {
        var retVal = [];
        if (!!this.pipedObjects[0] && !!this.pipedObjects[0].obj) {
            retVal = fn.toObjArray(this.pipedObjects);
        } else {
            retVal = this.pipedObjects;
        }

        fn.resetPipe.call(this);
        return retVal;
    }

    /***************************************************************************************************

        Called to emit a dedup'ed result from traversing the graph.

        @name       distinct()          callable
        @returns    {Object Array}      Returns a Distinct set of Referenced Object Array Vertices or Edges.
                                        Essentially a short cut for dedup().value();
        
        @example
            
            var result = g.V().out().distinct();

    ***************************************************************************************************/
    function distinct() {
        return this.dedup().value();
    }

    /***************************************************************************************************

        Creates a new instance of Helios to continue traversing the graph.

        @name       fork()        callable
        @returns    {Helios}      Returns Helios referenc
        
        @example
            
            var g2 = g.v(1).fork();
                     g2.out().value();

    ***************************************************************************************************/
    function fork() {
        var newHelios = {};

        newHelios = new Helios();
        newHelios.pipedObjects = this.pipedObjects;
        fn.resetPipe.call(newHelios);

        newHelios.pipeline.steps['1'] = {};
        newHelios.pipeline.steps['1'].pipedInArgs = this.pipeline.steps[this.pipeline.steps.currentStep].pipedInArgs;
        newHelios.pipeline.steps['1'].func = this.pipeline.steps[this.pipeline.steps.currentStep].func;
        newHelios.pipeline.steps['1'].pipedOutArgs = this.pipeline.steps[this.pipeline.steps.currentStep].pipedOutArgs;
        newHelios.pipeline.steps.currentStep = 1;
        newHelios.preserveSteps = true;

        fn.resetPipe.call(this);
        return newHelios;
    }

    /***************************************************************************************************

        Creates a new instance of Helios pinned to a point in the graph for traversal.

        @name       pin()         callable
        @returns    {Helios}      Returns Helios reference.
        
        @example
            
            var g2 = g.v(1).pin();
                     g2.out().value();

    ***************************************************************************************************/
    function pin() {
        var newHelios = {};
        newHelios = new Helios();
        newHelios.pipedObjects = this.pipedObjects;
        newHelios.pipelineCache = {};
        newHelios.pipelineCache.pipedOutArgs = this.pipeline.steps[this.pipeline.steps.currentStep].pipedOutArgs;
        newHelios.pipelineCache.func = this.pipeline.steps[this.pipeline.steps.currentStep].func;
        fn.resetPipe.call(this);
        fn.resetPipe.call(newHelios);
        return newHelios;
    }

    /***************************************************************************************************
        Output the property map
        @name       map()               callable
        @param      !{String*|Array}    Required comma separated String or Array of properties to map.
        @returns    {Object Array}      emits an Object Array
        @example
            
            g.v(10).map('name', 'age');
            g.v(10).map(['name', 'age']);

    ***************************************************************************************************/
    function map() {
        var retVal = [], params = [], args = arguments;

        if (!!args.length) {
            retVal = fn.map(this.pipedObjects, function (element) {
                params = [element.obj];
                push.apply(params, args);
                return fn.pick.apply(this, params);
            });
        }
        fn.resetPipe.call(this);
        return retVal;
    }

    /***************************************************************************************************

        Called to emit the stringified result from traversing the graph.

        @name       stringify()             callable
        @param      {String*|String Array}  Comma delimited string or string array of keys to be mapped to emit.
        @returns    {String}                Returns a string.
        
        @example
            
            var result = g.V().stringify();
            var result = g.V().stringify('name','age');

    ***************************************************************************************************/
    function stringify() {
        var retVal = [], args = arguments;
        if (!!this.pipedObjects[0] && !!this.pipedObjects[0].obj) {
            if (!!args.length) {
                return JSON.stringify(map.apply(this, args));
            }
            retVal = fn.toObjArray(this.pipedObjects);
        } else {
            retVal = this.pipedObjects;
        }
        fn.resetPipe.call(this);
        return JSON.stringify(retVal);
    }

    /***************************************************************************************************

        Called to emit the traversal path.

        @name       path()                     callable
        @returns    {String[0] & Object Array} Returns the Path string in position 0, and an emitted Objects
                                               in subsequent positions of Array.
        
        @example
            
            var result = g.v(10).out().path();

            result >> ["{"step 1":["v[10]"],"step 2":["v[20]","v[40]","v[30]"]}", Object, Object, Object]


    ***************************************************************************************************/
    function path() {

        var retVal = [],
            stepPaths,
            stepsObj = this.pipeline.steps,
            o = {},
            edge,
            edgeStr,
            i,
            j,
            stepRecs,
            len;

        for (i = 1; i <= stepsObj.currentStep; i += 1) {
            stepRecs = stepsObj[i].pipedOutArgs[0];
            stepPaths = o['step ' + i] = [];
            for (j = 0, len = stepRecs.length; j < len; j += 1) {
                if (stepRecs[j].type === 'vertex') {
                    push.call(stepPaths, 'v[' + stepRecs[j].obj[env.id] + ']');
                } else {
                    edge = stepRecs[j].obj;
                    edgeStr = 'v[' + edge[env.VOut][env.id] + '], e[' + edge[env.id] + 
                                '][' + edge[env.VOut][env.id] + '-' + edge[env.label] + 
                                '->' + edge[env.VIn][env.id] + '], v[' + edge[env.VIn][env.id] + ']';
                    push.call(stepPaths, edgeStr);
                }
            }
        }
        push.call(retVal, JSON.stringify(o));
        push.apply(retVal, fn.toObjArray(this.pipedObjects));
        fn.resetPipe.call(this);
        return retVal;
    }

    /***************************************************************************************************

        Called to obtain root vertices to begin traversal.

        @name       v()             callable/chainable
        @param      {Mixed*}        Pass in comma separated or array of ids or vertex objects
        @returns    {Object Array}  emits Vertex Array.
        
        @example
            
            var result = g.v([10, 40]).value();
            g.v(result).value(); -> This will return the same as above

    ***************************************************************************************************/
    function v() {

        var retVal = [],
            args = fn.flatten(slice.call(arguments, 1)),
            vid, 
            length = args.length;

        while (length) {
            length -= 1;
            if (!!args[length][env.id]) {
                vid = args[length][env.id];
            } else {
                vid = args[length];
            }
            push.call(retVal, graph.vertices[vid]);
        }

        return retVal;
    }

    /***************************************************************************************************

        Called to obtain root edges to begin traversal.

        @name       e()             callable/chainable
        @param      {Mixed*}        Pass in comma separated or array of ids or edge objects.
        @returns    {Object Array}  emits Edge Array.
        
        @example
            
            var result = g.e(70,80).value();
            g.(result).value(); -> This will return the same as above

    ***************************************************************************************************/
    function e() {
        var retVal = [], length,
            args = fn.flatten(slice.call(arguments, 1)),
            eid,
            length = args.length;
        
        while (length) {
            length -= 1;
            if (!!args[length][env.id]) {
                eid = args[length][env.id];
            } else {
                eid = args[length];
            }
            push.call(retVal, graph.edges[eid]);
        }
        return retVal;
    }

    /***************************************************************************************************

        @name       id()        callable
        @returns    {Array}     emits object ids.
        
        @example
            
            var result = g.e(70).id(); >> [70]

    ***************************************************************************************************/
    function id() {
        var retVal = [];

        retVal = fn.map(this.pipedObjects, function (element, key, list) {
            return element.obj[env.id];
        });
        fn.resetPipe();
        return retVal;
    }

    /***************************************************************************************************

        @name       label()     callable
        @returns    {Array}     emits edge labels.
        
        @example
            
            var result = g.e(70).label(); >> ["knows"]

    ***************************************************************************************************/
    function label() {

        var retVal = [];

        retVal = fn.map(this.pipedObjects, function (element, key, list) {
            return element.obj[env.label];
        });

        fn.resetPipe();
        return retVal;
    }

    /***************************************************************************************************

        @name       out()                   callable/chainable
        @param      {String*|String Array}  Comma separated list or array of labels.
        @returns    {Object Array}          emits Out adjacent Vertices to the vertex.
        @example
            
            var result = g.v(10).out().value();
            var result = g.v(10).out('knows').value();

    ***************************************************************************************************/
    function out() {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function (vertex, key, list) {
            if (!fn.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge.inV);
                });
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       outV()          callable/chainable
        @returns    {Object Array}  emits the outgoing tail vertex of the edge.
        @example
            
            var result = g.v(40).inE().outV().value();

    ***************************************************************************************************/
    function outV() {
        var retVal = fn.map(arguments[0], function (edge, key, list) {
            return edge.outV;
        });
        return retVal;
    }

    function _in() {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function (vertex, key, list) {
            if (!fn.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge.outV);
                });
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       inV()           callable/chainable
        @returns    {Object Array}  emits the incoming head vertex of the edge.
        @example
            
            var result = g.v(40).outE().inV().value();

    ***************************************************************************************************/
    function inV() {
        var retVal = fn.map(arguments[0], function (edge, key, list) {
            return edge.inV;
        });
        return retVal;
    }


    /***************************************************************************************************

        @name       both()                  callable/chainable
        @param      {String*|String Array}  Comma separated list or array of labels.
        @returns    {Object Array}          emits both adjacent Vertices of the vertex.
        @example
            
            var result = g.v(10).both().value();
            var result = g.v(10).both('knows').value();

    ***************************************************************************************************/
    function both() {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function (vertex, key, list) {
            if (!fn.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge.inV);
                });
            }
            if (!fn.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge.outV);
                });
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       bothV()         callable/chainable
        @returns    {Object Array}  emits both incoming and outgoing vertices of the edge.
        @example
            
            var result = g.e(70).bothV().value();

    ***************************************************************************************************/
    function bothV() {
        var retVal = [];

        fn.each(arguments[0], function (edge, key, list) {
            push.call(retVal, edge.inV);
            push.call(retVal, edge.outV);
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       outE()                  callable/chainable
        @param      {String*|String Array}  Comma separated list or array of labels.
        @returns    {Object Array}          emits the outgoing edges of the vertex.
        @example
            
            var result = g.v(10).outE().outV().value();
            var result = g.v(10).outE('knows').value();

    ***************************************************************************************************/
    function outE() {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function (vertex, key, list) {
            if (!fn.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge);
                });
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       inE()                   callable/chainable
        @param      {String*|String Array}  Comma separated list or array of labels.
        @returns    {Object Array}          emits the incoming edges of the vertex.
        @example
            
            var result = g.v(10).inE().value();
            var result = g.v(10).inE('knows').value();

    ***************************************************************************************************/
    function inE() {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function (vertex, key, list) {
            if (!fn.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge);
                });
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       bothE()                 callable/chainable
        @param      {String*|String Array}  Comma separated list or array of labels.
        @returns    {Object Array}          emits both incoming and outgoing edges of the vertex.
        @example
            
            var result = g.v(10).bothE().value();
            var result = g.v(10).bothE('knows').value();

    ***************************************************************************************************/
    function bothE() {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function (vertex, key, list) {

            if (!fn.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge);
                });
            }
            if (!fn.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function (edge) {
                    push.call(retVal, edge);
                });
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       V()             callable/chainable
        @param      {key, value}    Optional comma separated key/value pair.
        @returns    {Object Array}  emits all graph vertices.
        @example
            
            var result = g.V().value();

    ***************************************************************************************************/
    function V() {
        var args = slice.call(arguments, 1);

        if (args.length === 2) {
            return fn.toArray(graph.v_idx[args[0]][args[1]]);
        }
        return fn.toArray(graph.vertices);
    }

    /***************************************************************************************************

        @name       E()             callable/chainable
        @param      {key, value}    Optional comma separated key/value pair.
        @returns    {Object Array}  emits all graph edges.
        @example
            
            var result = g.E().value();

    ***************************************************************************************************/
    function E() {
        var args = slice.call(arguments, 1);

        if (args.length === 2) {
            return fn.toArray(graph.e_idx[args[0]][args[1]]);
        }
        return fn.toArray(graph.edges);
    }

    /***************************************************************************************************
        Remove duplicate objects
        @name       dedup()             callable/chainable
        @returns    {Object Array}      emits an Object Array
        @example

        g.v(10).out().in().dedup().value();

    ***************************************************************************************************/
    function dedup() {
        var  retVal = fn.uniqueObject(arguments[0]);
        return retVal;
    }

    /***************************************************************************************************

        @name       tail()                  callable/chainable
        @param      {String*|String Array}  Comma separated list or array of labels.
        @returns    {Object Array}          emits deduped tail Vertices relative to the vertex.
        @example
            
            var result = g.v(10).tail().value();
            var result = g.v(10).tail('knows').value();

    ***************************************************************************************************/
    function tail() {

        var retVal = [],
            tempArr = [],
            tempPipe = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value,
            self = this;

        fn.each(arguments[0], function (vertex) {
            if (!self.traversedVertices[vertex.obj[env.id]]) {
                self.traversedVertices[vertex.obj[env.id]] = 'visited';

                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                if (fn.isEmpty(value)) {
                    if (hasArgs) {
                        if (!fn.isEmpty(fn.pick(vertex.inE, args))) {
                            push.call(retVal, vertex);
                        }
                    } else {
                        push.call(retVal, vertex);
                    }
                } else {
                    tempArr = [];
                    tempPipe = [];
                    fn.each(fn.flatten(fn.values(value)), function (edge) {
                        if (!self.traversedEdges[edge.obj[env.id]]) {
                            push.call(tempArr, edge.inV);
                            self.traversedEdges[edge.obj[env.id]] = 'visited';
                        }
                    });
                    push.call(tempPipe, tempArr);
                    push.apply(tempPipe, args);
                    push.apply(retVal, tail.apply(self, tempPipe));
                }
            }
        });

        return retVal;
    }

    /***************************************************************************************************

    @name       head()                  callable/chainable
    @param      {String*|String Array}  Comma separated list or array of labels.
    @returns    {Object Array}          emits deduped head Vertices relative to the vertex.
    @example
        
        var result = g.v(10).head().value();
        var result = g.v(10).head('knows').value();

    ***************************************************************************************************/
    function head() {

        var retVal = [],
            tempArr = [],
            tempPipe = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value,
            self = this;

        fn.each(arguments[0], function (vertex) {
            if (!self.traversedVertices[vertex.obj[env.id]]) {
                self.traversedVertices[vertex.obj[env.id]] = 'visited';

                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                if (fn.isEmpty(value)) {
                    if (hasArgs) {
                        if (!fn.isEmpty(fn.pick(vertex.outE, args))) {
                            push.call(retVal, vertex);
                        }
                    } else {
                        push.call(retVal, vertex);
                    }
                } else {
                    tempArr = [];
                    tempPipe = [];
                    fn.each(fn.flatten(fn.values(value)), function (edge) {
                        if (!self.traversedEdges[edge.obj[env.id]]) {
                            push.call(tempArr, edge.outV);
                            self.traversedEdges[edge.obj[env.id]] = 'visited';
                        }
                    });
                    push.call(tempPipe, tempArr);
                    push.apply(tempPipe, args);
                    push.apply(retVal, head.apply(self, tempPipe));
                }
            }
        });
        return retVal;
    }

    /***************************************************************************************************

        @name       store()                 callable/chainable
        @alias      as()                    callable/chainable
        @param      !{String*|Array Var}    String to be used as idetifier or Array variable to store output.
        @param      {Function}              User Defined.
        @param      {Mixed*|Array}          Values to be passed to Function. Order of arguments should match paramaters
        @returns    {Object Array}          Returns the objects after apply the Function (if defined). If an Array is 
                                            passed the object will also be stored in that Array after applying the Function.
        @examples
            
            var result = g.v(10).outE().inV().store().value();

            results = g.v(10).out().as('x').in().back('x').value();
            results = g.v(10).out().store('x').in().back('x').value();

            var x = [];
            results = g.v(10).outE().inV().store(x).value();


            x = [];
            results = g.v(10).out('knows').store(x, function (incAge) {
                                                        var retVal = [];
                                                        fn.each(this, function (element) {
                                                          element.age += incAge;
                                                          retVal.push(element);
                                                        });
                                                    return retVal;}, 10).value();

    ***************************************************************************************************/
    function store() {
        var retVal = arguments[0],
            args = slice.call(arguments, 1),
            func,
            funcArgs = [];

        if (!!args.length) {
            //if pass in Array, populate it, else store as a named pipe 
            if (fn.isArray(args[0])) {
                push.apply(args[0], fn.toObjArray(arguments[0]));
            } else {
                this.pipeline.namedStep[args[0]] = this.pipeline.steps.currentStep;
            }
            if (fn.isFunction(args[1])) {
                func = args[1];
                args.shift();
                funcArgs = fn.flatten(slice.call(args, 1));
                retVal = func.apply(fn.toObjArray(arguments[0]), funcArgs);
            }
        }
        return retVal;
    }

    /***************************************************************************************************
        Go back to the results from n-steps ago.
        @name       back()                  callable/chainable
        @param      !{Number|String|Array}  If a Number is passed, Helios will go back the results n steps ago.
                                            If a String is passed, Helios will use results from a previously stored step.
                                            If an Object Array is passed, which was saved from output during a store(),
                                            Helios will use those results.
        @returns    {Object Array}          emits an Object Array
        @examples
            
            results = g.v(10).out().in().back(2).value();
            results = g.v(10).out().as('x').in().back('x').value();
            results = g.v(10).out().store('x').in().back('x').value();
            
            var arr = [];
            results = g.v(10).out().store(arr).in().back(arr).value();

    ***************************************************************************************************/
    function back() {
        var backSteps = arguments[1],
            stepBackTo;

        if (fn.isArray(backSteps)) {
            return backSteps;
        }

        if (fn.isString(backSteps)) {
            if (fn.isUndefined(this.pipeline.namedStep[backSteps])) {
                return;
            }
            stepBackTo = this.pipeline.namedStep[backSteps];
        } else {
            stepBackTo = this.pipeline.steps.currentStep - backSteps;
        }
        return this.pipeline.steps[stepBackTo].pipedOutArgs[0];
    }

    /***************************************************************************************************
        Allow everything to pass except what is in collection
        @name       except()            callable/chainable
        @param      !{String|Array}     If a String is passed, Helios will use results from a previously stored step.
                                        If an Array is passed, which was saved from output during a store(),
                                        Helios will use those results.
        @returns    {Object Array}      emits an Object Array
        @example
            
            g.v(10).out().store('x').out().except('x').value();
            
            var arr = [];
            results = g.v(10).out().store(arr).out().except(arr).value();

    ***************************************************************************************************/
    function except() {

        var arg = arguments[1], dSet, diff, retVal = [];
        dSet = fn.isArray(arg) ? arg : fn.toObjArray(this.pipeline.steps[this.pipeline.namedStep[arg]].pipedOutArgs[0]);
        retVal = fn.difference(fn.toObjArray(arguments[0]), dSet, true);

        return retVal;
    }

    /***************************************************************************************************
        Allow Objects to pass that meet specified criteria
        @name       where()            callable/chainable
        @alias      and()         callable/chainable only after where() has been called
        @param      {Function}          User defined. 'this' is a single outgoing object
        @param      {Mixed|Array}       Comma separtated or Array of Values to be passed to Function.
                                        Order of arguments should match paramaters
        >>>>OR<<<<<

        @param      {Comparable String} 'eq' = equal to,
                                        'neq' = not equal to,
                                        'lt' = less than,
                                        'lte' = less than or equal to,
                                        'gt' = greater than,
                                        'gte' = greater than or equal to,
                                        'btwn' = between,
                                        'has' = has all,
                                        'hasNot' = does not have all,
                                        'hasAny' = has any,
                                        'hasNotAny' = does not have any
        @param      {Array}             Comma separtated or Array of Key/Values pairs or Keys oe Values to be compared.

        @returns    {Object Array}      Returns the objects after apply the Function (if defined). If an Array is 
                                        passed the object will also be stored in that Array after applying the Function.
        @examples
            
            var results = g.v(10).where(function (name) {  return this.name === name; },'marko').value();

            g.v(10).out().where('eq',['name','vadas']).value();
            g.v(10).out().where('eq',['name','vadas']).value();
            g.v(10).out().where('neq',['name','vadas']).value();
            g.v(10).out().where('lt',['age',30]).value();
            g.v(10).out().where('lte',['age',27]).value();
            g.v(10).out().where('gt',['age',30]).value();
            g.v(10).out().where('gte',['age',32]).value();
            g.v(10).out().where('btwn',['age',30, 33]).value();
            
            *********************************************************************************************
            * has, hasNot, hasAny & hasNotAny take 'keys' or 'values' as the first value in array.      *
            *********************************************************************************************
            g.v(10).out().where('has',['keys','name', 'age']).value();
            g.v(10).out().where('hasAny',['keys', 'age', 'lang']).value();
            g.v(10).out().where('hasAny',['values', 'josh', 'lop']).value();
            
            *********************************************************************************************
            * passing in more Comparables are treated as logical 'AND' ie. name === vadas & age > 25    *
            * but can also be used with the and()                                                 *
            *********************************************************************************************            
            g.v(10).out().where('eq',['name','vadas'], 'gt', ['age', 25]).value();
            g.v(10).out().where('eq',['name','vadas']).and('gt', ['age', 25]).value();

            *********************************************************************************************
            * passing in more Key/Value pairs are treated as logical 'OR' ie. name === 'vadas' ||       *
            * age === 32 but you can also use the or()                                            *
            *********************************************************************************************            
            g.v(10).out().where('eq',['name','vadas', 'age', 32]).value();
            g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).value();
            g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).or('eq', ['name', 'lop']).value();

    ***************************************************************************************************/
    function where() {

        var retVal = [],
            records = arguments[0],
            args = slice.call(arguments, 1),
            func,
            funcArgs = [],
            argLen = args.length;

        if (fn.isFunction(args[0])) {
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1), true);

            fn.each(records, function (element) {
                if (func.apply(element.obj, funcArgs)) {
                    push.call(retVal, element);
                }
            });

        } else {

            while (argLen) {
                argLen -= 2;
                retVal = fn.where(records, comparable[args[argLen]](args[argLen + 1]));
            }
        }
        this.pipeline.namedStep.where = this.pipeline.steps.currentStep;
        return retVal;
    }

    /***************************************************************************************************
        Allow Objects to pass that meet specified criteria
        @name       or()          callable/chainable only after where() has been called
        @param      {Function}          User defined. 'this' is a single outgoing object
        @param      {Mixed|Array}       Comma separtated or Array of Values to be passed to Function.
                                        Order of arguments should match paramaters
        >>>>>OR<<<<<

        @param      {Comparable String} 'eq' = equal to,
                                        'neq' = not equal to,
                                        'lt' = less than,
                                        'lte' = less than or equal to,
                                        'gt' = greater than,
                                        'gte' = greater than or equal to,
                                        'btwn' = between,
                                        'has' = has all,
                                        'hasNot' = does not have all,
                                        'hasAny' = has any,
                                        'hasNotAny' = does not have any
        @param      {Array}             Comma separtated or Array of Key/Values pairs or Keys oe Values to be compared.

        @returns    {Object Array}      Returns the objects after apply the Function (if defined). If an Array is 
                                        passed the object will also be stored in that Array after applying the Function.
        @examples
            g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).value();
            g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).or('eq', ['name', 'lop']).value();

    ***************************************************************************************************/
    function or() {
        var retVal = [],
            prevRecords = arguments[0],
            args = slice.call(arguments, 1),
            records = this.pipeline.steps[this.pipeline.namedStep.where].pipedInArgs[0],
            func,
            funcArgs = [],
            argLen,
            i,
            len,
            ids = [];

        if (fn.isFunction(args[0])) {
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1), true);

            fn.each(records, function (element) {
                if (func.apply(element.obj, funcArgs)) {
                    push.call(retVal, element);
                }
            });


        } else {

            argLen = args.length;
            while (argLen) {
                argLen -= 2;
                retVal = fn.where(records, comparable[args[argLen]](args[argLen + 1]));
            }

        }
        len = retVal.length;
        for (i = 0; i < len; i += 1) {
            push.call(ids, retVal[i].obj[env.id]);
        }
        ids = fn.unique(ids);
        len = prevRecords.length;
        for (i = 0; i < len; i += 1) {
            if (!fn.include(ids, prevRecords[i].obj[env.id])) {
                push.call(retVal, prevRecords[i]);
            }
        }
        return retVal;
    }

    /***************************************************************************************************
        Allow nothing to pass but retain what is include in the collection
        @name       include()           callable/chainable
        @param      !{String|Array}     If a String is passed, Helios will use results from a previously stored step.
                                        If an Array is passed, which was saved from output during a store(),
                                        Helios will use those results.
        @returns    {Object Array}      emits an Object Array
        @examples

            g.v(10).out().store('x').out().retain('x').value();
            
            var arr = [];
            results = g.v(10).out().store(arr).out().retain(arr).value();

    ***************************************************************************************************/
    function retain() {

        var arg = arguments[1], dSet, diff, retVal = [];

        dSet = fn.isArray(arg) ? arg : fn.toObjArray(this.pipeline.steps[this.pipeline.namedStep[arg]].pipedOutArgs[0]);
        retVal = fn.intersection(fn.toObjArray(arguments[0]), dSet, true);
        return retVal;
    }

    /***************************************************************************************************
        Generic Step
        @name       step()              callable/chainable
        @alias      transform()         callable/chainable
        @alias      sideEffect()        callable/chainable
        @param      !{Function}         User defined. 'this' is the array of outgoing objects.
        @returns    {Object Array}      emits an Object Array
        @examples

            g.v(10).out().step(function () { 
                                var arr = []; 
                                fn.each(this, function (element) {
                                  arr.push(element.name)}); 
                                return arr; }).value();

    ***************************************************************************************************/
    function step() {
        var retVal = [],
            tempArr = [],
            args = slice.call(arguments, 1),
            func,
            funcArgs = [];

        if (fn.isFunction(args[0])) {
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1), true);
            retVal = func.apply(arguments[0], funcArgs);
        } else {
            retVal = "Invalid function";
        }
        return retVal;
    }

    /***************************************************************************************************

        Called to emit the result from traversing the graph.

        @name       count()             callable
        @returns    {Number}            Returns count.
        
        @example
            
            var result = g.V().count();

    ***************************************************************************************************/
    function count() {
        var retVal = this.pipedObjects.length;

        fn.resetPipe.call(this);
        return retVal;
    }

    /***************************************************************************************************
        Count by property
        @name       countBy()           callable/chainable
        @param      {Object}            Optional Object variable to store output. If an Object variable is passed
                                        in the output will be stored in that variable and processing will
                                        proceed as normal, otherwise the modified object is returned and
                                        is not chainable
        @param      !{String*|Array}    Comma separated String or Array of properties.
        @returns    {Object}            emits an Object
        @example

        g.v(1).out('knows').countBy(['salary','age']).value()
        g.v(1).out('knows').countBy('salary','age').value()

        var t = {};
        g.v(1).out('knows').countBy(t,['salary','age']).value()
        
        *****************************************************************************************
        * To aggregate call this function multiple times passing in same variable               *
        *****************************************************************************************
        var t = {};
        g.v(1).out('knows').countBy(t,['salary','age']).in.countBy(t,['salary','age']).value()

    ***************************************************************************************************/
    function countBy() {
        var args = fn.flatten(slice.call(arguments, 1)),
            objVar = args[0],
            params;

        if (fn.isString(args[0])) {
            objVar = slice.call(args);
        } else {
            params = slice.call(args, 1);
        }
        return fn.countBy(arguments[0], objVar, params);
    }


    /***************************************************************************************************
        Sum by property
        @name       groupSum()          callable/chainable
        @param      {Object}            Optional Object variable to store output. If an Object variable is passed
                                        in the output will be stored in that variable and processing will
                                        proceed as normal, otherwise the modified object is returned and
                                        is not chainable
        @param      !{String*|Array}    Comma separated String or Array of Keys. Values must be Numbers. 
        @returns    {Object}            emits an Object
        @example

        g.v(1).out('knows').groupSum(['salary','age']).value()
        g.v(1).out('knows').groupSum('salary','age').value()

        var t = {};
        g.v(1).out('knows').groupSum(t,['salary','age']).value()
        to aggregate call this function multiple times passing in same variable
        
        *****************************************************************************************
        * To aggregate call this function multiple times passing in same variable               *
        *****************************************************************************************
        var t = {};
        g.v(1).out('knows').countBy(t,['salary','age']).in.groupSum(t,['salary','age']).value()

    ***************************************************************************************************/
    function groupSum() {
        var args = fn.flatten(slice.call(arguments, 1)),
            objVar = args[0],
            params;

        if (fn.isString(args[0])) {
            objVar = slice.call(args);
        } else {
            params = slice.call(args, 1);
        }
        return fn.sumBy(arguments[0], objVar, params);
    }


    /***************************************************************************************************
        Group by property
        @name       groupSum()          callable/chainable
        @param      {Object}            Optional Object variable to store output. If an Object variable is passed
                                        in the output will be stored in that variable and processing will
                                        proceed as normal, otherwise the modified object is returned and
                                        is not chainable
        @param      !{String*|Array}    Comma separated String or Array of properties.
        @returns    {Object}            emits an Object
        @example

        g.v(1).out('knows').groupBy(['salary','age']).value()
        g.v(1).out('knows').groupBy('salary','age').value()
        g.V().outE().inV().groupBy(['age','name']).stringify();

        var t = {};
        g.v(1).out('knows').groupBy(t,['salary','age']).value()

    ***************************************************************************************************/
    function groupBy() {
        var args = fn.flatten(slice.call(arguments, 1)),
            objVar = args[0],
            params;

        if (fn.isString(args[0])) {
            objVar = slice.call(args);
        } else {
            params = slice.call(args, 1);
        }
        return fn.groupBy(arguments[0], objVar, params);
    }


    /***************************************************************************************************
        Group by and Count by property
        @name       groupSum()          callable/chainable
        @param      {Object}            Optional Object variable to store output. If an Object variable is passed
                                        in the output will be stored in that variable and processing will
                                        proceed as normal, otherwise the modified object is returned and
                                        is not chainable
        @param      !{String*|Array}    Comma separated String or Array of properties.
        @returns    {Object}            emits an Object
        @example

        var t = {};
        g.v(1).out('knows').groupCount(t,['salary','age']).value()

    ***************************************************************************************************/
    function groupCount() {
        var args = fn.flatten(slice.call(arguments, 1)),
            objVar = args[0],
            params;

        if (fn.isString(args[0])) {
            objVar = slice.call(args);
        } else {
            params = slice.call(args, 1);
        }
        return fn.groupCount(arguments[0], objVar, params);
    }

    /***************************************************************************************************
        Iterate over a specified region of the path
        @name       loop()              callable/chainable
        @param      !{Number|String}    Number of back steps or stored position
        @param      !{Number}           Number of iterations i.e. how many times to traverse those steps
        @returns    {Object}            emits an Object
        @examples

        g.v(40).out().in().loop(2, 3).value();
        g.v(40).out().as('x').in().loop('x', 3).value();

    ***************************************************************************************************/
    function loop() {

        var backSteps = arguments[1],
            iterations = arguments[2] - 1, //Reduce the iterations because one has already been done
            j,
            func,
            funcName,
            fromStep,
            toStep,
            self = this;

        if (fn.isString(backSteps)) {
            backSteps = self.pipeline.steps.currentStep + 1 - self.pipeline.namedStep[backSteps];
        }
    
        while (iterations--) {
            fromStep = self.pipeline.steps.currentStep + 1 - backSteps; //Need to add one to allow for loop step which is not counted
            toStep = self.pipeline.steps.currentStep;
            for (j = fromStep; j <= toStep; j += 1) {
                func = self.pipeline.steps[j].func;
                funcName = func.name === '_in' ? 'in' : func.name;
                this[funcName].apply(self, slice.call(self.pipeline.steps[j].pipedInArgs, 1));
            }
        }

        return self.pipeline.steps[self.pipeline.steps.currentStep].pipedOutArgs[0];

    }

    /***************************************************************************************************
        Clone output objects
        @name       clone()                 callable
        @returns    {Object Array}          emits an Object Array
        @example

        g.v(10).out().clone();

    ***************************************************************************************************/
    function clone() {
        return JSON.parse(stringify.call(this));
    }

    /*******CRUD********/

    /***************************************************************************************************

        Add vertex to graph

        @name       addV()                  callable/chainable.
        @param      {!Object|Object Array}  Required. JSON object or Object Array.
        @returns    {Object Array}          emits objects from previous step.

        ****NB. Objects should be passed in without an id. If an id present it is assumed that the object already exists.
        @example
            
            var t = { name: 'frank', age: '40' };
            var result = g.v(1).out().in().addV(t).out().value();

    ***************************************************************************************************/
    function addV() {

        var retVal = slice.call(arguments[0]),
            args = fn.flatten(slice.call(arguments, 1)),
            newVertices = [];

        fn.each(args, function(vertex){
            //create vertex if it doesn't have an id
            if (!!!vertex[env.id]) {
                vertex[env.id] = uuid.v4(); //temp id
                if (!!!newVertex[env.type]) {
                    newVertex[env.type] = 'vertex';
                }
                push.call(newVertices, vertex);
            }

        });

        if (!!newVertices.length) {
             dbfn.loadVertices(newVertices);
        }

        return retVal;
    }

    /***************************************************************************************************

        Add edge to graph

        @name       addoutE()                   callable/chainable.
        @param      {!Object|Object Array}  Required. JSON object or Object Array of Edges
        @param      {!Object|Object Array}  Required. JSON object or Object Array of Vertices
        @returns    {Object Array}          emits objects from previous step.

        ****NB. New Objects should be passed in without an id. If an id present it is assumed that the object already exists.
        @example
            
            //add method adds a vertex with an in coming edge from v(10). Path = v(10)->'knows'->'frank'
            var result = g.v(10).addV({ name: 'frank', age: '40' } }]}).out().value();
            var t = {};
            var result = g.v(1).out().in().add([{ name: 'frank', age: '40' },{ name: 'lisa', age: '36' }],
                                    { inE: [{ '_label' : 'knows', 'weight' : 0.4 }]}, t).out().value()
            result would contain 'frank' vertex.

            //add(new vertex props[,EdgeObj, OutArrVar]);
    ***************************************************************************************************/
    function addOutE() {

        var retVal = slice.call(arguments[0]),
            edges = fn.flatten(slice.call(arguments, 1, 2)),
            vertices = fn.flatten(slice.call(arguments, 2, 3)),
            pipedInVertices = fn.uniqueObject(arguments[0]),
            newEdge = {},
            loadedVertex = {},
            key;

        //Raise Error if incoming objects are not vertices
        try {
            if ((!!retVal[0] && retVal[0].type !== 'vertex') || !!!pipedInVertices.length) {
                throw TypeError();
            }
            if (!!!edges.length || !!!vertices.length) {
                throw "Required"
            }
        } catch (err) {
            if (err instanceof TypeError) {
                return "Action aborted => addOutE() can only be run against vertex objects."
            }
            if (err === "Required") {
                return "Action aborted => Both addOutE() parameters are required."
            }
        } finally {
            //Rollback transaction
            //Unlock graph
        }

        fn.each(pipedInVertices, function (vertex) {
             fn.each(vertices, function(newVertex){
                //create vertex if it doesn't have an id
                if (!!!newVertex[env.id]) {
                    newVertex[env.id] = uuid.v4(); //temp id
                    if (!!!newVertex[env.type]) {
                        newVertex[env.type] = 'vertex';
                    }
                    loadedVertex = dbfn.loadVertices(newVertex)[0];
                } else {
                    loadedVertex = graph.vertices[newVertex[env.id]];
                }
                fn.each(edges, function(edge){
                    if (!!loadedVertex.outE[edge[env.label]]) {
                        return;
                    }
                    newEdge = {};
                    newEdge[env.type] = 'edge';
                    newEdge[env.label] = 'NoLabel!';
                    for (key in edge) {
                        if (edge.hasOwnProperty(key)) {
                            newEdge[key] = edge[key];    
                        }
                    }
                    newEdge[env.id] = uuid.v4(); //temp id
                    newEdge[env.outVid] = vertex.obj[env.id];
                    newEdge[env.inVid] = newVertex[env.id];
                    dbfn.loadEdges(newEdge);
                });
            });
        });

        return retVal;
    }

    /***************************************************************************************************

        Add edge to graph

        @name       addInE()                callable/chainable.
        @param      {!Object|Object Array}  Required. JSON object or Object Array of Edges
        @param      {!Object|Object Array}  Required. JSON object or Object Array of Vertices
        @returns    {Object Array}          emits objects from previous step.

        ****NB. New Objects should be passed in without an id. If an id present it is assumed that the object already exists.
        @example
            
            //add method adds a vertex with an in coming edge from v(10). Path = v(10)->'knows'->'frank'
            var result = g.v(10).addV({ name: 'frank', age: '40' } }]}).out().value();
            var t = {};
            var result = g.v(1).out().in().add([{ name: 'frank', age: '40' },{ name: 'lisa', age: '36' }],
                                    { inE: [{ '_label' : 'knows', 'weight' : 0.4 }]}, t).out().value()
            result would contain 'frank' vertex.

            //add(new vertex props[,EdgeObj, OutArrVar]);
    ***************************************************************************************************/
    function addInE() {

        var retVal = slice.call(arguments[0]),
            edges = fn.flatten(slice.call(arguments, 1, 2)),
            vertices = fn.flatten(slice.call(arguments, 2, 3)),
            pipedInVertices = fn.uniqueObject(arguments[0]),
            newEdge = {},
            loadedVertex = {},
            key;

        //Raise Error if incoming objects are not vertices
        try {
            if ((!!retVal[0] && retVal[0].type !== 'vertex') || !!!pipedInVertices.length) {
                throw TypeError();
            }
            if (!!!edges.length || !!!vertices.length) {
                throw "Required"
            }
        } catch (err) {
            if (err instanceof TypeError) {
                return "Action aborted => addInE() can only be run against vertex objects."
            }
            if (err === "Required") {
                return "Action aborted => Both addInE() parameters are required."
            }
        } finally {
            //Rollback transaction
            //Unlock graph
        }

        fn.each(pipedInVertices, function (vertex) {
             fn.each(vertices, function(newVertex){
                //create vertex if it doesn't have an id
                if (!!!newVertex[env.id]) {
                    newVertex[env.id] = uuid.v4(); //temp id
                    if (!!!newVertex[env.type]) {
                        newVertex[env.type] = 'vertex';
                    }
                    loadedVertex = dbfn.loadVertices(newVertex)[0];
                } else {
                    loadedVertex = graph.vertices[newVertex[env.id]];
                }
                fn.each(edges, function(edge){
                    if (!!loadedVertex.outE[edge[env.label]]) {
                        return;
                    }
                    newEdge = {};
                    newEdge[env.type] = 'edge';
                    newEdge[env.label] = 'NoLabel!';
                    for (key in edge) {
                        if (edge.hasOwnProperty(key)) {
                            newEdge[key] = edge[key];    
                        }
                    }
                    newEdge[env.id] = uuid.v4(); //temp id
                    newEdge[env.outVid] = newVertex[env.id];
                    newEdge[env.inVid] = vertex.obj[env.id];
                    dbfn.loadEdges(newEdge);
                });
            });
        });

        return retVal;
    }

    /***************************************************************************************************
        
        Delete objects or Object properties from graph

        @name       delete()                callable/not chainable
        @param      {String*|String Array}  Optional. Comma separated or string array specifying properties to delete.
                                            If a paramater is passed only the property is deleted, if no parameter
                                            then the object is deleted.
        @returns    {Object}                emits object containing deleted or modified vertices and edges.
        @example
            
            var result = g.v(10).delete(); -> deletes v(10)
            var result = g.v(10).delete('name'); -> deleted 'name' property in v(10)

    ***************************************************************************************************/
    function _delete() {
        var retVal = { vertex:[], edge:[] },
            args = fn.flatten(slice.call(arguments, 0)),
            dedupedObjs = [],
            hasArgs = !!args.length,
            sysFields = fn.toArray(env),
            vertex,
            edgeArr = [],
            eid,
            label,
            inV,
            outV;

        if (!!this.pipedObjects[0] && !!this.pipedObjects[0].obj) {
            dedupedObjs = fn.uniqueObject(this.pipedObjects);
            fn.each(dedupedObjs, function(element){
                if (hasArgs) {
                    fn.each (args, function(prop) {
                        if (!fn.include(sysFields, prop)) {
                            if (element.type === 'vertex') {
                                if (!!graph.vertices[element.obj[env.id]].obj[prop]) {
                                    if (!!graph.v_idx[prop]) {
                                        fn.deleteElementIndexes(element);
                                    }
                                    delete graph.vertices[element.obj[env.id]].obj[prop];
                                    push.call(retVal.vertex, element.obj);
                                }

                            } else {
                                if (!!graph.edges[element.obj[env.id]].obj[prop]) {
                                    if (!!graph.e_idx[prop]) {
                                        fn.deleteElementIndexes(element);
                                    }
                                    delete graph.edges[element.obj[env.id]].obj[prop];
                                    push.call(retVal.edge, element.obj);
                                }
                            }
                        }
                    })
                } else {
                    if (element.type === 'vertex') {
                        //vertex = graph.vertices[element.obj[env.id]];
                        //delete associated edges
                        if (!!element.outE) {
                            push.apply(retVal.edge, fn.removeAllEdges(element.outE));
                        }
                        if (!!element.inE) {
                            push.apply(retVal.edge, fn.removeAllEdges(element.inE));
                        }
                        if (hasVIndex) {
                            fn.deleteElementIndexes(element);
                        }
                        push.call(retVal.vertex, element.obj);
                        delete graph.vertices[element.obj[env.id]];
                    } else {
                        push.call(retVal.edge, element.obj);
                        eid = element.obj[env.id];
                        label = element.obj[env.label];
                        element.inV.inE[label] = fn.removeEdge(element.inV.inE[label], eid);
                        element.outV.outE[label] = fn.removeEdge(element.outV.outE[label], eid);
                    }
                }
            })
        }

        fn.resetPipe.call(this);
        return retVal;
    }


    /***************************************************************************************************
        
        Update or Add object properties to graph

        @name       update()                callable
        @param      {!Object*|Object Array*}Required. Comma separated JSON objects or Object Arrays.
                                            Default behavior: Order matters. 
                                            Properties in objects with no id will over write the same properties in
                                            objects with id if that object is passed in after.
                                            NB.  You can pass in 2 arrays if desired. See example below. 
        @returns    {Object Array}          emits objects from previous step which may or may not included
                                            the updated objects.
        
        If id passed in update just that, if no id apply update to all objects. Order matters. No id object
        write to all object and may overwi

        @example
            
            var result = g.v(10).update({ name: 'John', surname: 'Doe'}); //adds surname property to all
                                                                            updated objects
            
            var noIdArr = [];
            noIdArr.push({ name: 'john'});

            var idArr = [];
            idArr.push({ '@id': 10, name: 'frank'});
            
            //No id objects passed in first
            g.v(10, 40).update(noIdArr, idArr).value(); //v(10).name === 'frank'; v(40).name === 'john'; 
            //No id objects passed in last
            g.v(10, 40).update(idArr, noIdArr).value(); //v(10).name === 'john'; v(40).name === 'john';

    ***************************************************************************************************/
    function update() {

        var retVal = slice.call(arguments[0]),
            args = fn.flatten(slice.call(arguments, 1)),
            pipedInObjs = fn.uniqueObject(arguments[0]),
            sysFields = [env.id, env.VIn, env.VOut],
            key,
            idxArr = [],
            isIndexed = false;

        if (!!!pipedInObjs.length) {
            return retVal;
        }
        idxArr = pipedInObjs[0].type === 'vertex' ? graph.v_idx : graph.e_idx;
        fn.each(pipedInObjs, function(element) {
            fn.each(args, function(newProps) {
                //Check to see if the update object has an id. If so,
                //only update where equal to id
                if (!!newProps[env.id]) {
                    if (element.obj[env.id] == newProps[env.id]) {
                        for (key in newProps) {
                            if (newProps.hasOwnProperty(key) && !fn.include(sysFields, key)) {
                                if (element.obj[key] !== newProps[key]) {
                                    //check to see if there is an index assoc. with key
                                    if (!!idxArr[key]) {
                                        //if there is an index move to the new location
                                        delete idxArr[key][element.obj[key]][element.obj[env.id]];
                                        if (fn.isEmpty(idxArr[key][element.obj[key]])) {
                                            delete idxArr[key][element.obj[key]];
                                        }
                                        element.obj[key] = newProps[key];
                                        if (!!!idxArr[key][element.obj[key]]) {
                                            idxArr[key][element.obj[key]] = {};
                                        }
                                        idxArr[key][element.obj[key]][element.obj[env.id]] = element.obj;
                                    } else {
                                        element.obj[key] = newProps[key];
                                    }
                                }
                            }
                        }
                    }
                } else {
                    for (key in newProps) {
                        if (newProps.hasOwnProperty(key) && !fn.include(sysFields, key)) {
                            if (element.obj[key] !== newProps[key]) {
                                //check to see if there is an index assoc. with key
                                if (!!idxArr[key]) {
                                    //if there is an index move to the new location
                                    delete idxArr[key][element.obj[key]][element.obj[env.id]];
                                    if (fn.isEmpty(idxArr[key][element.obj[key]])) {
                                        delete idxArr[key][element.obj[key]];
                                    }
                                    element.obj[key] = newProps[key];
                                    if (!!!idxArr[key][element.obj[key]]) {
                                        idxArr[key][element.obj[key]] = {};
                                    }
                                    idxArr[key][element.obj[key]][element.obj[env.id]] = element.obj;
                                } else {
                                    element.obj[key] = newProps[key];
                                }
                            }
                        }
                    }
                }
            });
        });
        return retVal;
    }


    /***************************************************************************************************
        
        Reassign Out Edge from one vertex to another

        @name       assignOutE()    callable
        @param      {String}        Required. label.
        @param      !{id | Object}  Required. An existing vertex id or existing vertex object.
        @param      !{id | Object}  Required. If no id is present in the Object it will create a new Vertex.
        @param      {Object var}    Optional. Object to store created Edge.
        @returns    {Object}        new Edge object.

        @example

            var result = g.v(10).assignOutE('knows', 1, { name: 'John', age: 29});

    ***************************************************************************************************/
    function moveOutE() {

        var retVal = slice.call(arguments[0]),
            pipedInVertices = fn.uniqueObject(arguments[0]),
            args = slice.call(arguments, 1),
            label = args[0],
            fromV = args[1],
            toV = args[2],
            fromVid,
            toVid,
            edgeVar,
            dedupedObjs = [],
            value,
            key,
            tempEdge,
            edgeObj,
            edgeId,
            newEdge,
            sysFields = fn.toArray(env),
            self;

        if (args.length === 4) {
            edgeVar = args[3];
        }

        fromVid = !!fromV[env.id] ? fromV[env.id] : fromV;

        if (fn.isObject(toV)) {
            if (!!!toV[env.id]) {
                toV[env.id] = uuid.v4(); //temp id
                if (!!!toV[env.type]) {
                    toV[env.type] = 'vertex';
                }
                dbfn.loadVertices(toV);
            }
            toVid = toV[env.id];
        } else {
            toVid = toV;
        }

        fn.each(pipedInVertices, function (vertex) {
            if (!fn.isEmpty(vertex.outE)) {
                value = fn.pick(vertex.outE, label);
                fn.each(value[label], function (edge) {
                    if (edge.inV.obj[env.id] == fromVid) {
                        
                        //Create new edge
                        tempEdge = {};
                        edgeObj = edge.obj;
                        for (key in edgeObj) {
                            if (edgeObj.hasOwnProperty(key) && !fn.include(sysFields, key)) {
                                tempEdge[key] = edgeObj[key];    
                            }
                        }

                        tempEdge[env.id] = uuid.v4(); //temp id
                        tempEdge[env.label] = label;
                        tempEdge[env.outVid] = vertex.obj[env.id];
                        tempEdge[env.inVid] = toVid;
                        newEdge = dbfn.loadEdges(tempEdge)[0];
                        if (!!edgeVar) {
                            edgeVar.oldEdge = fn.clone(edge.obj);
                            edgeVar.newEdge = newEdge.obj;
                        }
                        vertex.outE[label] = fn.removeEdge(vertex.outE[label], edge.obj[env.id]);
                    }
                });
            }
        });

        return retVal;
    }

    /***************************************************************************************************
        
        Reassign In Edge from one vertex to another

        @name       assignInE()     callable
        @param      {String}        Required. label.
        @param      !{id | Object}  Required. An existing vertex id or existing vertex object.
        @param      !{id | Object}  Required. If no id is present in the Object it will create a new Vertex.
        @param      {Object var}    Optional. Object to store created Edge.
        @returns    {Object}        new Edge object.

        @example

            var result = g.v(10).assignInE('knows', 40, { name: 'John', age: 29});

    ***************************************************************************************************/
    function moveInE() {

        var retVal = slice.call(arguments[0]),
            pipedInVertices = fn.uniqueObject(arguments[0]),
            args = slice.call(arguments, 1),
            label = args[0],
            fromV = args[1],
            toV = args[2],
            fromVid,
            toVid,
            edgeVar,
            dedupedObjs = [],
            value,
            key,
            tempEdge,
            edgeObj,
            edgeId,
            newEdge,
            sysFields = fn.toArray(env),
            self;

        if (args.length === 4) {
            edgeVar = args[3];
        }

        fromVid = !!fromV[env.id] ? fromV[env.id] : fromV;

        if (fn.isObject(toV)) {
            if (!!!toV[env.id]) {
                toV[env.id] = uuid.v4(); //temp id
                if (!!!toV[env.type]) {
                    toV[env.type] = 'vertex';
                }
                dbfn.loadVertices(toV);
            }
            toVid = toV[env.id];
        } else {
            toVid = toV;
        }

        fn.each(pipedInVertices, function (vertex) {
            if (!fn.isEmpty(vertex.inE)) {
                value = fn.pick(vertex.inE, label);
                fn.each(value[label], function (edge) {
                    if (edge.outV.obj[env.id] == fromVid) {
                        
                        //Create new edge
                        tempEdge = {};
                        edgeObj = edge.obj;
                        for (key in edgeObj) {
                            if (edgeObj.hasOwnProperty(key) && !fn.include(sysFields, key)) {
                                tempEdge[key] = edgeObj[key];    
                            }
                        }

                        tempEdge[env.id] = uuid.v4(); //temp id
                        tempEdge[env.label] = label;
                        tempEdge[env.outVid] = toVid;
                        tempEdge[env.inVid] = vertex.obj[env.id];
                        newEdge = dbfn.loadEdges(tempEdge)[0];
                        if (!!edgeVar) {
                            edgeVar.oldEdge = fn.clone(edge.obj);
                            edgeVar.newEdge = newEdge.obj;
                        }
                        vertex.inE[label] = fn.removeEdge(vertex.inE[label], edge.obj[env.id]);
                    }
                });
            }
        });

        return retVal;
    }

    //comparables
    comparable.eq = function (atts) {
        return function (x) {

            var length = atts.length;
            while (length) {
                length -= 2;
                if (x.obj[atts[length]] === atts[length + 1]) {
                    return true;
                }
            }
            return false;
        };
    };

    comparable.neq = function (atts) {
        return function (x) {
            var length = atts.length;
            while (length) {
                length -= 2;
                if (x.obj[atts[length]] !== atts[length + 1]) {
                    return true;
                }
            }
            return false;
        };
    };

    comparable.lt = function (atts) {

        return function (x) {
            var length = atts.length;
            while (length) {
                length -= 2;
                if (x.obj[atts[length]] < atts[length + 1]) {
                    return true;
                }
            }
            return false;
        };
    };

    comparable.lte = function (atts) {
        return function (x) {
            var length = atts.length;
            while (length) {
                length -= 2;
                if (x.obj[atts[length]] <= atts[length + 1]) {
                    return true;
                }
            }
            return false;
        };
    };

    comparable.gt = function (atts) {
        return function (x) {
            var length = atts.length;
            while (length) {
                length -= 2;
                if (x.obj[atts[length]] > atts[length + 1]) {
                    return true;
                }
            }
            return false;
        };
    };

    comparable.gte = function (atts) {
        return function (x) {
            var length = atts.length;
            while (length) {
                length -= 2;
                if (x.obj[atts[length]] >= atts[length + 1]) {
                    return true;
                }
            }
            return false;
        };
    };

    //Extras
    comparable.btwn = function (atts) {
        return function (x) {
            var length = atts.length;
            while (length) {
                length -= 3;
                if (x.obj[atts[length]] > atts[length + 1] && x.obj[atts[length]] < atts[length + 2]) {
                    return true;
                }
            }
            return false;
        };
    };
    //args[0] -> 'keys','values'
    //TODO: Accept RegEx and Embedded Object Referencing
    //TODO: Test how dates would work
    //has All the listed properties
    comparable.has = function (atts) {
        return function (x) {
            var args = slice.call(atts, 1);
            return fn.intersection(fn[atts[0]](x.obj), args).length === args.length;
        };
    };
    //exclude All
    comparable.hasNot = function (atts) {//not all
        return function (x) {
            var args = slice.call(atts, 1);
            return fn.intersection(fn[atts[0]](x.obj), args).length !== args.length;
        };
    };
    //include Any
    comparable.hasAny = function (atts) {//any
        return function (x) {
            return !!fn.intersection(fn[atts[0]](x.obj), slice.call(atts, 1)).length;
        };
    };
    //exclude Any
    comparable.hasNotAny = function (atts) {//not any
        return function (x) {
            return !fn.intersection(fn[atts[0]](x.obj), slice.call(atts, 1)).length;
        };
    };


    //Generic Step
    Helios.prototype.step = step;

    //Transform-Based Steps
    Helios.prototype.transform = step;
    Helios.prototype.map = map;
    Helios.prototype.id = id;
    Helios.prototype.label = label;

    Helios.prototype.V = V;
    Helios.prototype.E = E;
    Helios.prototype.out = out;
    Helios.prototype['in'] = _in;
    Helios.prototype.outV = outV;
    Helios.prototype.outE = outE;
    Helios.prototype.inV = inV;
    Helios.prototype.inE = inE;
    Helios.prototype.both = both;
    Helios.prototype.bothV = bothV;
    Helios.prototype.bothE = bothE;
    Helios.prototype.head = head;
    Helios.prototype.tail = tail;
    Helios.prototype.path = path;
    Helios.prototype.stringify = stringify;
    Helios.prototype.value = pipedValue;
    Helios.prototype.distinct = distinct;
    Helios.prototype.fork = fork;
    Helios.prototype.pin = pin;

    /*TODO*/
    /*
    dedup() -> add param to dedup by ie. dedup('name')
    limit(2) -> nb. not ordered but can be proceeded by order() to affect output
    order() -> add param to order by ie. order('name', true): 2nd param is to specity (default) false = ASC or true = DESC
    range('0..2') -> nb. not ordered but can be proceeded by order() to affect output
    */

    //Filter-Based Steps
    Helios.prototype.where = where;
    Helios.prototype.and = where;
    Helios.prototype.or = or;
    Helios.prototype.back = back;
    Helios.prototype.except = except;
    Helios.prototype.retain = retain;
    Helios.prototype.dedup = dedup;

    //SideEffect-Based Steps
    Helios.prototype.sideEffect = step;
    Helios.prototype.as = store;
    Helios.prototype.store = store;
    Helios.prototype.countBy = countBy;
    Helios.prototype.groupBy = groupBy;
    Helios.prototype.groupCount = groupCount;
    Helios.prototype.groupSum = groupSum;
    Helios.prototype.count = count;

    //Branch-Based Steps
    Helios.prototype.loop = loop;

    //Methods
    Helios.prototype.v = v;
    Helios.prototype.e = e;
    Helios.prototype.graph = dbfn;

    //Misc
    Helios.prototype.clone = clone;

    //CRUD
    Helios.prototype.addV = addV;
    Helios.prototype.update = update;
    Helios.prototype['delete'] = _delete;
    Helios.prototype.addOutE = addOutE;
    Helios.prototype.addInE = addInE;
    Helios.prototype.moveOutE = moveOutE;
    Helios.prototype.moveInE = moveInE;


    // expose Helios
    // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        // Expose Helios to the global object even when an AMD loader is present in
        // case Helios was injected by a third-party script and not intended to be
        // loaded as a module..
        window.Helios = Helios;

        // define as an anonymous module so, through path mapping, it can be
        // referenced.
        define(function () {
          return Helios;
        });
    }
    // check for `exports` after `define` in case a build optimizer adds an `exports` object
    else if (freeExports) {
        // in Node.js or RingoJS v0.8.0+
        if (typeof module == 'object' && module && module.exports == freeExports) {
          (module.exports = Helios).Helios = Helios;
        }
        // in Narwhal or RingoJS v0.7.0-
        else {
            freeExports.Helios = Helios;
        }
    }
    else {
        // in a browser or Rhino
        window.Helios = Helios;
    }


}(this));

