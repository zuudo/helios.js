"use strict"
/// <reference path="moment.d.ts" />
declare var Q_COMM;

module Helios {
    export interface IBase {
        Type:string;
    }

    export interface IElement extends IBase{
        obj:{};
        indexKeys:any;
        addToIndex:(idx:{}, idxName?:string) => void;
        graph:GraphDatabase;
    }

    export interface IVertex {
        outE:{};
        inE:{};
    }

    export interface IEdge {
        outV:IVertex;
        inV:IVertex;
        //associateVertices:(graph:GraphDatabase) => void;
    }

    export interface IGraphDatabase {
        vertices:{};
        edges:{};
        v_idx:{};
        e_idx:{};
        _:Mogwai.Pipeline;
    }

    declare var moment;
    declare var sax;

    var toString = Object.prototype.toString,
        ArrayProto = Array.prototype,
        push = ArrayProto.push,
        slice = ArrayProto.slice,
        indexOf = ArrayProto.indexOf;

    export class Element implements IElement {

        indexKeys:any;
        Type:string;
        constructor(public obj:{}, public graph:GraphDatabase) {

        }

        addToIndex(idx:{}, indexName?:string):void {
            var indexes:string[],
                props:string[],
                tempObj:{} = {};

            indexes = !indexName ? Utils.keys(idx) : [indexName];
            for (var i = 0, l = indexes.length; i < l; i++) {
                props = indexes[i].indexOf(".") > -1 ? indexes[i].split(".") : [indexes[i]];
                tempObj = this.obj;
                for (var i2 = 0, l2 = props.length; i2 < l2; i2++) {
                    if (tempObj.hasOwnProperty(props[i2])) {
                        if (Utils.isObject(tempObj[props[i2]])) {
                            tempObj = tempObj[props[i2]];
                            //continue;
                        } else {
                            if (i2 < l2 - 1) {
                                break;
                            }
                            var iter = Utils.isArray(tempObj[props[i2]]) ? tempObj[props[i2]] : [tempObj[props[i2]]];
                            for (var i3 = 0, l3 = iter.length; i3 < l3; i3++) {
                                if (!(idx[indexes[i]].hasOwnProperty(iter[i3]))) {
                                    idx[indexes[i]][iter[i3]] = {};
                                }
                                idx[indexes[i]][iter[i3]][this.obj[this.graph.meta.id]] = this;
                                push.call(this.indexKeys, indexes[i]);
                            }
                        }
                    }
                }
            }
        }
    }

   export class Vertex extends Element implements IVertex {

        outE:{} = {};
        inE:{} = {};

        constructor(obj:{}, graph:GraphDatabase) {
            super(obj, graph);
            this.Type = 'Vertex';
            //check if there are indexes
        }
    }

    export class Edge extends Element implements IEdge {

        outV:Vertex;
        inV:Vertex;

        constructor(obj:{}, graph:GraphDatabase) {
            super(obj, graph);
            this.Type = 'Edge';
        }

    }

    export interface IConfiguration {

        pathTraceEnabled:bool;

        date:{
            format:any;// = "DD/MM/YYYY"; //can be array
        };
        currency:{
            symbol:any;//can be array
            decimal:string;
        };

        meta:{
            id:string;
            label:string;
            type:string;
            outEid:string;
            inEid:string;
            outVid:string;
            inVid:string;
            VOut:string;
            VIn:string;
        };

        db:{
            baseUri:string;
            port:number;
            name:string;
            type:string;
            ssl:bool;
        };
    }

    export class GraphDatabase implements IGraphDatabase, IConfiguration {

        vertices:{};
        edges:{};

        v_idx:{};
        e_idx:{};

        _:Mogwai.Pipeline;

        pathTraceEnabled:bool = false;
        optionalTraceEnabled:bool = false;
        date:{
            format:any;//can be array
        } = {
            format: "DD/MM/YYYY"
        };

        currency:{
            symbol:any;//can be array
            decimal:string;
        } = {
            symbol: '$',
            decimal: '.'
        };

        meta:{
            id:string;
            label:string;
            type:string;
            outEid:string;
            inEid:string;
            outVid:string;
            inVid:string;
            VOut:string;
            VIn:string;
        } = {
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

        db:{
            baseUri:string;
            port:number;
            name:string;
            type:string;
            ssl:bool;
        } = {
            'baseUri': 'localhost',
            'port': 8182,
            'name': 'tinker',
            'type': 'orientdb',
            'ssl': false
        };

        constructor(options?:any) {

            if (!!options) {
                //Then passing in starts
                for (var k in options) {
                    if (options.hasOwnProperty(k)) {
                        this[k] = options[k];
                    }
                }
            } else {
                this.vertices = {};
                this.edges = {};
                this.v_idx = {};
                this.e_idx = {};

                if (!!options) {
                    this.setConfiguration(options);
                }
            }
            this._ = new Mogwai.Pipeline(this);
        }

//        close(): void {
//            this = undefined;
//        }

       pathTrace(turnOn:bool):bool {
          return this.pathTraceEnabled = turnOn;
       }

       optionalTrace(turnOn:bool):bool {
          return this.optionalTraceEnabled = turnOn;
       }

       // getPathEnabled():bool {
       //     return this.pathTraceEnabled;
       // }

//        getConfiguration():Configuration {
//            return this.CONFIG;
//
//        }
//
        //TODO: Test Configuration setting
        setConfiguration(options:{}):void {

            for (var k in options) {
                if (options.hasOwnProperty(k)) {
                    if (Utils.isObject(options[k])) {
                        var o = options[k];
                        for (var i in o) {
                            if (o.hasOwnProperty(i)) {
                                this[k][i] = o[i];
                            }
                        }
                        continue;
                    }
                    this[k] = options[k];
                }
                //this.config[k] = this[k];
            }

        }

        /*Use this to load JSON formatted Vertices into GraphDatabase*/
        loadVertices(rows:{}[]):void {

            var i:number,
                l:number = rows.length,
                hasVIndex:bool = !Utils.isEmpty(this.v_idx),
                vertex:Vertex;

            for (i = 0; i < l; i++) {
                vertex = new Vertex(rows[i], this);
                this.vertices[rows[i][this.meta.id]] = vertex;
                if (hasVIndex) {
                    vertex.addToIndex(this.v_idx);
                }
            }
        }

        /*Use this to load JSON formatted Edges into GraphDatabase*/
        loadEdges(rows:{}[]):void {

            var i:number,
                l:number,
                edge:Edge,
                hasEIndex:bool = !Utils.isEmpty(this.e_idx);

            for (i = 0, l = rows.length; i < l; i += 1) {
                edge = new Edge(rows[i], this);
                this.edges[edge.obj[this.meta.id]] = edge;
                //edge.associateVertices();
                this.associateVertices(edge);
                if (hasEIndex) {
                    edge.addToIndex(this.e_idx);
                }
            }
        }

        createVIndex(idxName:string):void {
            if (!(this.v_idx.hasOwnProperty(idxName))) {
                this.v_idx[idxName] = {};
                for (var k in this.vertices) {
                    if (this.vertices.hasOwnProperty(k)) {
                        this.vertices[k].addToIndex(this.v_idx, idxName);
                    }
                }
            }
        }

        createEIndex(idxName:string):void {
            if (!(this.e_idx.hasOwnProperty(idxName))) {
                this.e_idx[idxName] = {};
                for (var k in this.edges) {
                    if (this.edges.hasOwnProperty(k)) {
                        this.edges[k].addToIndex(this.e_idx, idxName);
                    }
                }
            }
        }

        deleteVIndex(idxName:string):void {
            delete this.v_idx[idxName];
        }

        deleteEIndex(idxName:string):void {
            delete this.e_idx[idxName];
        }

        associateVertices(edge:Edge):void {
            var vertex,
                outVobj = {},
                inVobj = {};

            if (!edge.graph.vertices[edge.obj[edge.graph.meta.outVid]]) {
                outVobj[edge.graph.meta.id] = edge.obj[edge.graph.meta.outVid];
                edge.graph.vertices[edge.obj[edge.graph.meta.outVid]] = new Vertex(outVobj, edge.graph);
            }
            vertex = edge.graph.vertices[edge.obj[edge.graph.meta.outVid]];
            if (!vertex.outE[edge.obj[edge.graph.meta.label]]) {
                vertex.outE[edge.obj[edge.graph.meta.label]] = [];
            }
            edge.outV = vertex;
            edge.obj[edge.graph.meta.VOut] = edge.outV.obj;
            delete edge.obj[edge.graph.meta.outVid];
            push.call(vertex.outE[edge.obj[edge.graph.meta.label]], edge);

            if (!edge.graph.vertices[edge.obj[edge.graph.meta.inVid]]) {
                inVobj[edge.graph.meta.id] = edge.obj[edge.graph.meta.inVid];
                edge.graph.vertices[edge.obj[edge.graph.meta.inVid]] = new Vertex(inVobj, edge.graph);
            }
            vertex = edge.graph.vertices[edge.obj[edge.graph.meta.inVid]];
            if (!vertex.inE[edge.obj[edge.graph.meta.label]]) {
                vertex.inE[edge.obj[edge.graph.meta.label]] = [];
            }
            edge.inV = vertex;
            edge.obj[edge.graph.meta.VIn] = edge.inV.obj;
            delete edge.obj[edge.graph.meta.inVid];
            push.call(vertex.inE[edge.obj[edge.graph.meta.label]], edge);
        }



        loadGraphSON(jsonData:string):string;
        loadGraphSON(jsonData:{ vertices?:{}[]; edges?:{}[]; }):string;
        loadGraphSON(jsonData:any):string {
            //process vertices

            var xmlhttp;

            var graph:GraphDatabase = this;

            if (Utils.isUndefined(jsonData)) { return null; }

            if (!!jsonData.vertices) {
               this.loadVertices(jsonData.vertices);
            }

            //process edges
            if (!!jsonData.edges) {
               this.loadEdges(jsonData.edges);
            }

            if (Utils.isString(jsonData)) {
                xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function () {
                    if (xmlhttp.readyState === 4) {
                        jsonData = JSON.parse(xmlhttp.responseText);

                        if (!!jsonData.vertices.length) {
                            graph.loadVertices(jsonData.vertices);
                        }

                        //process edges
                        if (jsonData.edges) {
                            graph.loadEdges(jsonData.edges);
                        }
                    }

                };
                xmlhttp.open("GET", jsonData, true);
                xmlhttp.send(null);
            }
            return "Data Loaded";
        }


        loadGraphML(xmlData:string):GraphDatabase {

            var i, j, l, propLen,
                xmlV = [], xmlE = [], vertex:Vertex, edge:Edge,
                attr:{},
                vertex:Vertex,
                edge:Edge,
                fileExt,
                xmlhttp,
                currProp:string,
                //parser,
                xmlDoc,
                properties,
                tempObj = {},
                parser = sax.parser(true, {lowercase:true});

            var hasVIndex = !Utils.isEmpty(this.v_idx);
            var hasEIndex = !Utils.isEmpty(this.e_idx);


            parser.onerror = (e) => {
            //  self.postMessage(e);// an error happened.

            };

            parser.ontext = (t) => {
                if(!!tempObj && (currProp in tempObj)){
                    tempObj[currProp] = t;
                    currProp = undefined;
                }
              // got some text.  t is the string of text.
            };

            parser.onopentag = (node) => {
              // opened a tag.  node has "name" and "attributes"
              switch(node.name){
                case 'node':
                    attr = node.attributes;
                    for(var k in attr){
                        if(attr.hasOwnProperty(k)){
                            switch(k){
                                case 'id':
                                    if(!!this.vertices[attr[k]]){
                                        tempObj = this.vertices[attr[k]].obj;
                                    } else {
                                        tempObj[this.meta.id] = attr[k];
                                    }
                                    break;
                                default:
                                    //do nothing
                            }
                        }
                    }
                    
                    break;
                case 'edge':
                    attr = node.attributes;
                    for(var k in attr){
                        if(attr.hasOwnProperty(k)){
                            switch(k){
                                case 'id':
                                    tempObj[this.meta.id] = attr[k];
                                    break;
                                case 'label':
                                    tempObj[this.meta.label] = attr[k];
                                    break;
                                case 'source':
                                    tempObj[this.meta.outVid] = attr[k];
                                    break;
                                case 'target':
                                    tempObj[this.meta.inVid] = attr[k];
                                    break;
                                default:
                                    //do nothing
                            }
                        }
                    }
                    break;
                case 'data':
                    tempObj[node.attributes.key] = undefined;
                    currProp = node.attributes.key;
                    break;
                default:
                    //do nothing
              }
              this;

            };


            parser.onclosetag = (node) => {
              // opened a tag.  
              switch(node){
                case 'node':
                    vertex = new Vertex(tempObj, this);
                    this.vertices[tempObj[this.meta.id]] = vertex;
                    //Add to index
                    if (hasVIndex) {
                        vertex.addToIndex(this.v_idx);
                    }
                    tempObj = {};            
                    break;
                case 'edge':
                    edge = new Edge(tempObj, this);
                    this.edges[tempObj[this.meta.id]] = edge;
                    this.associateVertices(edge);
                    //Add to index
                    if (hasEIndex) {
                        edge.addToIndex(this.e_idx);
                    }
                    tempObj = {};
                    break;
                default:
                    //do nothing
              }

            };

            parser.onend = () => {
              // parser stream is done, and ready to have more stuff written to it.
              tempObj = {};
              currProp = undefined;
            };



            if (Utils.isUndefined(xmlData)) {
                return null;
            }
            if (Utils.isString(xmlData)) {

                fileExt = xmlData.split('.').pop();

                if (fileExt.toLowerCase() === 'xml') {

                    xmlhttp = new XMLHttpRequest();
                    xmlhttp.onreadystatechange = function () {
                        if (xmlhttp.readyState === 4) {
                            //xmlDoc = parser.parseFromString(xmlhttp.responseText, "text/xml");
                            parser.write(xmlhttp.responseText).close();
                        }
                    };
                    xmlhttp.open("GET", xmlData, true);
                    xmlhttp.send(null);
                } else {

                    //if (window.DOMParser) {
                    //parser = new DOMParser();
                    //xmlDoc = parser.parseFromString(xmlData, "text/xml");
                    /*} else {// Internet Explorer
                     xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                     xmlDoc.async = false;
                     xmlDoc.loadXML(xmlData);
                     }*/
                }
            }

            // xmlV = xmlDoc.getElementsByTagName("node");
            // xmlE = xmlDoc.getElementsByTagName("edge");

            // //process vertices
            // if (!!xmlV.length) {
            //     l = xmlV.length;

            //     for (i = 0; i < l; i += 1) {
            //         properties = xmlV[i].getElementsByTagName("data");
            //         tempObj = {};
            //         propLen = properties.length;
            //         for (j = 0; j < propLen; j += 1) {
            //             tempObj[properties[j].getAttribute("key")] = properties[j].firstChild.nodeValue;
            //         }
            //         tempObj[this.meta.id] = xmlV[i].getAttribute("id");
            //         vertex = new Vertex(tempObj, this);
            //         this.vertices[tempObj[this.meta.id]] = vertex;
            //         //Add to index
            //         if (hasVIndex) {
            //             vertex.addToIndex(this.v_idx);
            //         }
            //     }
            // }

            // //process edges
            // if (!!xmlE.length) {
            //     l = xmlE.length;

            //     for (i = 0; i < l; i += 1) {
            //         properties = xmlE[i].getElementsByTagName("data");
            //         tempObj = {};
            //         propLen = properties.length;
            //         for (j = 0; j < propLen; j += 1) {
            //             tempObj[properties[j].getAttribute("key")] = properties[j].firstChild.nodeValue;
            //         }
            //         tempObj[this.meta.id] = xmlE[i].getAttribute("id");
            //         tempObj[this.meta.label] = xmlE[i].getAttribute("label");
            //         tempObj[this.meta.outVid] = xmlE[i].getAttribute("source");
            //         tempObj[this.meta.inVid] = xmlE[i].getAttribute("target");

            //         edge = new Edge(tempObj, this);
            //         this.edges[tempObj[this.meta.id]] = edge;
            //         edge.associateVertices();
            //         //Add to index
            //         if (hasEIndex) {
            //             edge.addToIndex(this.e_idx);
            //         }
            //     }
            // }
            return this;
        }

        //Can pass in Object Array, but must have _type = 'vertex' || _type = 'edge'
        v(...ids:string[]):Mogwai.Pipeline;  //g.v()
        v(...ids:number[]):Mogwai.Pipeline;  //g.v()
        v(...objs:{}[]):Mogwai.Pipeline;     //g.V
        v(...args:any[]):Mogwai.Pipeline {

            var pipe = [],
                l,
                temp:Vertex,
                tempObj:{} = {},
                compObj:{} = {},
                outputObj:{} = {},
                subset:{} = {},
                tempObjArray:any = {},//{ obj?:{}; }[] = [],
                preProcObj:{} = {},
                postProcObj:{} = {},
                tempObjArrLen:number = 0,
                isObject:bool = false;

            if (!args.length) {
                return this._.startPipe(this.vertices);
            }

            args = Utils.flatten(args);
            l = args.length;
            isObject = Utils.isObject(args[0]);
            if (isObject && !((this.meta.type in args[0]) && (args[0][this.meta.type] == 'vertex'))) {
                for (var i = 0; i < l; i++) {
                    compObj = args[i];

                    //iterate through the compObj and determine whether has idx
                    preProcObj = {};
                    postProcObj = {};
                    for (var k in compObj) {
                        if (compObj.hasOwnProperty(k)) {
                            if (this.v_idx.hasOwnProperty(k)) {
                                //add to comparable processing
                                preProcObj[k] = compObj[k];

                            } else {
                                //add to deferred process object
                                postProcObj[k] = compObj[k];
                            }
                        }
                    }
                    var item;
                    for (var prop in preProcObj) {
                        if (preProcObj.hasOwnProperty(prop)) {
                            var items = this.v_idx[prop];
                            for (var m in items) {
                                if (items.hasOwnProperty(m)) {
                                    var funcObj = preProcObj[prop];
                                    for (var func in funcObj) {
                                        if (funcObj.hasOwnProperty(func)) {
                                            //array comparables require the whole array for comparison
                                            if (Utils.include(['$exact', '$none', '$all'], func)) {
                                                item = items[m];
                                                for (var it in item) {
                                                    if (item.hasOwnProperty(it)) {
                                                        if (Mogwai.Compare[func].call(null, item[it].obj[prop], funcObj[func])) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (Mogwai.Compare[func].call(null, m, funcObj[func])) {
                                                    item = items[m];
                                                    for (var it in item) {
                                                        if (item.hasOwnProperty(it)) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (!Utils.isEmpty(tempObj)) {
                                push.call(tempObjArray, tempObj);
                            }
                        }
                    }

                    //I should just create a new Pipeline.
                    var pipeline:Mogwai.Pipeline;
                    var postIsEmpty = Utils.isEmpty(postProcObj);
                    tempObjArrLen = tempObjArray.length;
                    if (!!tempObjArrLen) {
                        if (tempObjArrLen == 1) {
                            if (postIsEmpty) {
                                outputObj = tempObjArray[0];
                            } else {
                                pipeline = this._.startPipe(tempObjArray[0]);
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        } else {
                            if (postIsEmpty) {
                                outputObj = Utils.intersectElement(tempObjArray);
                            } else {
                                pipeline = this._.startPipe(Utils.intersectElement(tempObjArray));
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        }
                    } else {
                        if (!postIsEmpty) {
                            pipeline = this._.startPipe(this.vertices);
                            tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                        }
                    }
                    if (!postIsEmpty) {
                        var id;
                        for (var ind = 0, len = tempObjArray.length; ind < len; ind++) {
                            id = tempObjArray[ind].obj[this.meta.id];
                            outputObj[id] = tempObjArray[ind];
                        }
                    }

                    tempObj = {};
                    tempObjArray = [];

                }
                return this._.startPipe(outputObj);
            }
            for (var i = 0; i < l; i++) {
                temp = isObject ? this.vertices[args[i][this.meta.id]] : this.vertices[args[i]];
                if(typeof temp === "undefined"){
                    throw new ReferenceError('No vertex with id ' + isObject ? args[i][this.meta.id] : args[i]);
                }
                push.call(pipe, temp);
            }
            return this._.startPipe(pipe);
        }

        e(...ids:string[]):Mogwai.Pipeline; //g.e()
        e(...ids:number[]):Mogwai.Pipeline; //g.e()
        e(...objs:{}[]):Mogwai.Pipeline;    //g.E()
        e(...args:any[]):Mogwai.Pipeline {

            var pipe = [],
                l,
                temp:Edge,
                tempObj:{} = {},
                compObj:{} = {},
                outputObj:{} = {},
                subset:{} = {},
                tempObjArray:{ obj?:{}; }[] = [],
                preProcObj:{} = {},
                postProcObj:{} = {},
                tempObjArrLen:number = 0,
                isObject:bool = false;

            if (!args.length) {
                return this._.startPipe(this.edges);
            }

            args = Utils.flatten(args);
            l = args.length;
            
            isObject = Utils.isObject(args[0]);
            if (isObject && !((this.meta.type in args[0]) && (args[0][this.meta.type] == 'edge'))) {
                for (var i = 0; i < l; i++) {
                    compObj = args[i];

                    //iterate through the compObj and determine whether has idx
                    preProcObj = {};
                    postProcObj = {};
                    for (var k in compObj) {
                        if (compObj.hasOwnProperty(k)) {
                            if (this.e_idx.hasOwnProperty(k)) {
                                //add to comparable processing
                                preProcObj[k] = compObj[k];

                            } else {
                                //add to deferred process object
                                postProcObj[k] = compObj[k];
                            }
                        }
                    }
                    var item;
                    for (var prop in preProcObj) {
                        if (preProcObj.hasOwnProperty(prop)) {
                            var items = this.e_idx[prop];
                            for (var m in items) {
                                if (items.hasOwnProperty(m)) {
                                    var funcObj = preProcObj[prop];
                                    for (var func in funcObj) {
                                        if (funcObj.hasOwnProperty(func)) {
                                            //array comparables require the whole array for comparison
                                            if (Utils.include(['$exact', '$none', '$all'], func)) {
                                                item = items[m];
                                                for (var it in item) {
                                                    if (item.hasOwnProperty(it)) {
                                                        if (Mogwai.Compare[func].call(null, item[it].obj[prop], funcObj[func])) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            } else {
                                                if (Mogwai.Compare[func].call(null, m, funcObj[func])) {
                                                    item = items[m];
                                                    for (var it in item) {
                                                        if (item.hasOwnProperty(it)) {
                                                            tempObj[it] = item[it];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            if (!Utils.isEmpty(tempObj)) {
                                tempObjArray.push(tempObj);
                            }
                        }
                    }
                    var pipeline:Mogwai.Pipeline;
                    var postIsEmpty = Utils.isEmpty(postProcObj);
                    tempObjArrLen = tempObjArray.length;
                    if (!!tempObjArrLen) {
                        if (tempObjArrLen == 1) {
                            if (postIsEmpty) {
                                outputObj = tempObjArray[0];
                            } else {
                                pipeline = this._.startPipe(tempObjArray[0]);
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        } else {
                            if (postIsEmpty) {
                                outputObj = Utils.intersectElement(tempObjArray);
                            } else {
                                pipeline = this._.startPipe(Utils.intersectElement(tempObjArray));
                                tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                            }
                        }
                    } else {
                        if (!postIsEmpty) {
                            pipeline = this._.startPipe(this.edges);
                            tempObjArray = Mogwai.getEndPipe.call(pipeline.where(postProcObj));
                        }
                    }
                    if (!postIsEmpty) {
                        var id;
                        for (var ind = 0, len = tempObjArray.length; ind < len; ind++) {
                            id = tempObjArray[ind].obj[this.meta.id];
                            outputObj[id] = tempObjArray[ind];
                        }
                    }

                    tempObj = {};
                    tempObjArray = [];

                }
                return this._.startPipe(outputObj);
            }
            for (var i = 0; i < l; i++) {
                temp = isObject ? this.edges[args[i][this.meta.id]] : this.edges[args[i]];
                if(typeof temp === "undefined"){
                    throw new ReferenceError('No edge with id ' + isObject ? args[i][this.meta.id] : args[i]);
                }
                push.call(pipe, temp);
            }
            return this._.startPipe(pipe);
        }

        //returns an id if created
        /*addV(vertex:{}): string {
         return "";
         }*/

    }



    export module Mogwai{

        export function getEndPipe():any[] {
            return this.endPipe;
        }
        export interface IPipeline {
            /*** Transform ***/
            out:(...labels:string[])=>Pipeline;
            in:(...labels:string[])=>Pipeline;


            // both:(...labels:string[])=>Pipeline;
            // bothE(...labels:string[])=>Pipeline;
            // bothV(...labels:string[])=>Pipeline;
            // cap(...labels:string[])=>Pipeline;
            // gather(...labels:string[])=>Pipeline;
            // id(...labels:string[])=>Pipeline;
            
            // inE(...labels:string[])=>Pipeline;
            // inV(...labels:string[])=>Pipeline;
            // property(...labels:string[])=>Pipeline;
            // label(...labels:string[])=>Pipeline;
            // map(...labels:string[])=>Pipeline;
            // memoize(...labels:string[])=>Pipeline;
            // order(...labels:string[])=>Pipeline;
            
            // outE(...labels:string[])=>Pipeline;
            // outV(...labels:string[])=>Pipeline;
            // path(...labels:string[])=>Pipeline;
            // scatter(...labels:string[])=>Pipeline;
            // select(...labels:string[])=>Pipeline;
            // transform(...labels:string[])=>Pipeline;
            
            // /*** Filter ***/
            // inde(...labels:string[])=>Pipeline; //index(i)
            // range(...labels:string[])=>Pipeline; //range('[i..j]')
            // and(...labels:string[])=>Pipeline;
            // back(...labels:string[])=>Pipeline;
            // dedup(...labels:string[])=>Pipeline;
            // except(...labels:string[])=>Pipeline;
            // filter(...labels:string[])=>Pipeline;
            // has(...labels:string[])=>Pipeline;
            // hasNot(...labels:string[])=>Pipeline;
            // interval(...labels:string[])=>Pipeline;
            // or(...labels:string[])=>Pipeline;
            // random(...labels:string[])=>Pipeline;
            // retain(...labels:string[])=>Pipeline;
            // simplePath(...labels:string[])=>Pipeline;
            
            // /*** Side Effect ***/ 
            // // aggregate //Not implemented
            // as(...labels:string[])=>Pipeline;
            // groupBy(...labels:string[])=>Pipeline;
            // groupCount(...labels:string[])=>Pipeline;
            // optional(...labels:string[])=>Pipeline;
            // sideEffect(...labels:string[])=>Pipeline;
            // // store //Not implemented
            // // table //Not implemented
            // // tree //Not implemented

            // /*** Branch ***/
            // copySplit(...labels:string[])=>Pipeline;
            // exhaustMerge(...labels:string[])=>Pipeline;
            // fairMerge(...labels:string[])=>Pipeline;
            // ifThenElse(...labels:string[])=>Pipeline; //g.v(1).out().ifThenElse('{it.name=='josh'}','{it.age}','{it.name}')
            // loop(...labels:string[])=>Pipeline;

            // /*** Methods ***/
            // //fill //Not implemented
            // count(...labels:string[])=>Pipeline;
            // iterate(...labels:string[])=>Pipeline;
            // next(...labels:string[])=>Pipeline;
            // toList(...labels:string[])=>Pipeline;
            // createIndex(...labels:string[])=>Pipeline;
            // put(...labels:string[])=>Pipeline;

            // getPropertyKeys(...labels:string[])=>Pipeline;
            // setProperty(...labels:string[])=>Pipeline;
            // property(...labels:string[])=>Pipeline;

        }
        export class Pipeline implements IPipeline{

            private pipeline:any[]; //requires Cleanup

            private traversed:{};
            private steps:{
                currentStep:number;
            };

            private asHash:{}; //requires Cleanup
            private endPipe:any[]; //requires Cleanup

            constructor(public graph:GraphDatabase, elements?:any) {
                if (!!elements) {
                    this.startPipe(elements);
                }
            }

            startPipe(elements:any):Pipeline {

                var pipe:{}[];

                this.steps = { currentStep: 1 };

                this.endPipe = [];
                this.pipeline = this.graph.pathTraceEnabled ? [] : undefined;

                Utils.each(elements, function (element) {
                    if (this.graph.pathTraceEnabled) {
                        pipe = [];
                        pipe.push(element);
                        this.pipeline.push(pipe);
                    }
                    this.endPipe.push(element)
                }, this);

                this.steps[this.steps.currentStep] = { func: 'startPipe', args: [] };
                if(this.graph.optionalTraceEnabled){
                    this.steps[this.steps.currentStep].elements = elements;    
                }

                return this;
            }


            id():any[] {
                return this.property(this.graph.meta.id);
            }

            /***************************************************************************************************

             label()     callable
             @returns    {Array}     emits edge labels.

             @example

             var result = g.e(70).label(); >> ["knows"]

             ***************************************************************************************************/
            label():any[] {
                return this.property(this.graph.meta.label);
            }

            out(...labels:string[]):Pipeline {

                var value:{},
                    vertex:Vertex,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    hasArgs:bool = !!labels.length,
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[],
                    pipe:IElement[];

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                this.steps[++this.steps.currentStep] = { func: 'out', args: labels };

                if (isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {};
                    iter = this.endPipe;
                }

                Utils.each(iter, function (next) {

                    if (isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if (this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if (!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            if(isTracingOptional){
                                if('elements' in this.steps[this.steps.currentStep]){
                                    push.call(this.steps[this.steps.currentStep].elements, this.traversed[vertex.obj[this.graph.meta.id]]);
                                } else {
                                    this.steps[this.steps.currentStep].elements = [this.traversed[vertex.obj[this.graph.meta.id]]];
                                }
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }

                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.inV);

                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge.inV);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge.inV];
                            }
                        }

                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.inV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.inV);
                        }
                    }, this);

                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;

                return this;

            }

            in(...labels:string[]):Pipeline {

                var value:{},
                    vertex:Vertex,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    hasArgs:bool = !!labels.length,
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[],
                    pipe:IElement[];

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                this.steps[++this.steps.currentStep] = { func: 'in', args: labels };

                if (isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {};
                    iter = this.endPipe;
                }

                Utils.each(iter, function (next) {

                    if (isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if (this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if (!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            if(isTracingOptional){
                                if('elements' in this.steps[this.steps.currentStep]){
                                    push.call(this.steps[this.steps.currentStep].elements, this.traversed[vertex.obj[this.graph.meta.id]]);
                                } else {
                                    this.steps[this.steps.currentStep].elements = [this.traversed[vertex.obj[this.graph.meta.id]]];
                                }
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }

                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.outV);
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge.outV);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge.outV];
                            }
                        }
                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.outV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.outV);
                        }
                    }, this);
                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            }

            /***************************************************************************************************

             @       outV()          callable/chainable
             @returns    {Object Array}  emits the outgoing tail vertex of the edge.
             @example

             var result = g.v(40).inE().outV().value();

             ***************************************************************************************************/
            outV():Pipeline {

                var edge:Edge,
                    iter:any[],
                    endPipeArray:any[] = [],
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];
                
                this.steps[++this.steps.currentStep] = { func:'outV' };

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Step ' + this.steps.currentStep + ' only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = isTracingPath ? slice.call(next, -1)[0] : next;
                    endPipeArray.push(edge.outV);
                    if(isTracingOptional){
                        if('elements' in this.steps[this.steps.currentStep]){
                            push.call(this.steps[this.steps.currentStep].elements, edge.outV);
                        } else {
                            this.steps[this.steps.currentStep].elements = [edge.outV];
                        }
                    }
                    if (isTracingPath) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.outV);
                        pipes.push(pipe);
                    }
                }, this);

                this.pipeline = isTracingPath ? pipes : undefined;
                this.endPipe = endPipeArray;
                return this;
            }

            /***************************************************************************************************

             @       inV()           callable/chainable
             @returns    {Object Array}  emits the incoming head vertex of the edge.
             @example

             var result = g.v(40).outE().inV().value();

             ***************************************************************************************************/
            inV():Pipeline {

                var edge:Edge,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];
                ;

                this.steps[++this.steps.currentStep] = { func:'inV' };

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Step ' + this.steps.currentStep + ' only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = isTracingPath ? slice.call(next, -1)[0] : next;
                    endPipeArray.push(edge.inV);
                    if(isTracingOptional){
                        if('elements' in this.steps[this.steps.currentStep]){
                            push.call(this.steps[this.steps.currentStep].elements, edge.inV);
                        } else {
                            this.steps[this.steps.currentStep].elements = [edge.inV];
                        }
                    }
                    if (isTracingPath) {
                        pipe = [];
                        pipe.push.apply(pipe, next);
                        pipe.push(edge.inV);
                        pipes.push(pipe);
                    }
                }, this);

                this.pipeline = isTracingPath ? pipes : undefined;
                this.endPipe = endPipeArray;
                return this;
            }


            /***************************************************************************************************

             @       outE()                  callable/chainable
             @param      {String*|String Array}  Comma separated list or array of labels.
             @returns    {Object Array}          emits the outgoing edges of the vertex.
             @example

             var result = g.v(10).outE().outV().value();
             var result = g.v(10).outE('knows').value();

             ***************************************************************************************************/
            outE(...labels:string[]):Pipeline {

                var value:{},
                    vertex:Vertex,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    hasArgs:bool = !!labels.length,
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                this.steps[++this.steps.currentStep] = { func: 'outE', args: labels };


                if (isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {};
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if (isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if (this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if (!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            if(isTracingOptional){
                                if('elements' in this.steps[this.steps.currentStep]){
                                    push.call(this.steps[this.steps.currentStep].elements, this.traversed[vertex.obj[this.graph.meta.id]]);
                                } else {
                                    this.steps[this.steps.currentStep].elements = [this.traversed[vertex.obj[this.graph.meta.id]]];
                                }
                            }                            
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }

                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge];
                            }
                        }
                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            }

            /***************************************************************************************************

             @       inE()                   callable/chainable
             @param      {String*|String Array}  Comma separated list or array of labels.
             @returns    {Object Array}          emits the incoming edges of the vertex.
             @example

             var result = g.v(10).inE().value();
             var result = g.v(10).inE('knows').value();

             ***************************************************************************************************/
            inE(...labels:string[]):Pipeline {

                var value:{},
                    vertex:Vertex,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    hasArgs:bool = !!labels.length,
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                this.steps[++this.steps.currentStep] = { func: 'inE', args: labels };

                if (isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {};
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if (isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if (this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if (!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            if(isTracingOptional){
                                if('elements' in this.steps[this.steps.currentStep]){
                                    push.call(this.steps[this.steps.currentStep].elements, this.traversed[vertex.obj[this.graph.meta.id]]);
                                } else {
                                    this.steps[this.steps.currentStep].elements = [this.traversed[vertex.obj[this.graph.meta.id]]];
                                }
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }

                    value = hasArgs ? Utils.pick(vertex.inE, labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge];
                            }
                        }
                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                    
                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            }

            /***************************************************************************************************

             @       both()                  callable/chainable
             @param      {String*|String Array}  Comma separated list or array of labels.
             @returns    {Object Array}          emits both adjacent Vertices of the vertex.
             @example

             var result = g.v(10).both().value();
             var result = g.v(10).both('knows').value();

             ****************************************************************************************************/
            both(...labels:string[]):Pipeline {

                var value:{},
                    vertex:Vertex,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    hasArgs:bool = !!labels.length,
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];

                this.steps[++this.steps.currentStep] = { func: 'both', args: labels };

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                if (isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {};
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if (isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if (this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if (!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                endPipeArray.push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            if(isTracingOptional){
                                if('elements' in this.steps[this.steps.currentStep]){
                                    push.call(this.steps[this.steps.currentStep].elements, this.traversed[vertex.obj[this.graph.meta.id]]);
                                } else {
                                    this.steps[this.steps.currentStep].elements = [this.traversed[vertex.obj[this.graph.meta.id]]];
                                }
                            }
                            return;
                        } else {
                            this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }

                    
                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge.inV);
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge.inV);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge.inV];
                            }
                        }
                        if (isTracingPath) {
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
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge.outV);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge.outV];
                            }
                        }
                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge.outV);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge.outV);
                        }
                    }, this);
                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            }

            /***************************************************************************************************

             @       bothV()         callable/chainable
             @returns    {Object Array}  emits both incoming and outgoing vertices of the edge.
             @example

             var result = g.e(70).bothV().value();

             ****************************************************************************************************/
            bothV():Pipeline {

                var edge:Edge,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];
                ;

                this.steps[++this.steps.currentStep] = { func: 'bothV'  };

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Edge') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                iter = isTracingPath ? this.pipeline : this.endPipe;
                Utils.each(iter, function (next) {
                    edge = isTracingPath ? slice.call(next, -1)[0] : next;
                    endPipeArray.push.apply(endPipeArray, [edge.outV, edge.inV]);
                    if(isTracingOptional){
                        if('elements' in this.steps[this.steps.currentStep]){
                            push.apply(this.steps[this.steps.currentStep].elements, [edge.outV, edge.inV]);
                        } else {
                            this.steps[this.steps.currentStep].elements = [edge.outV, edge.inV];
                        }
                    }
                    if (isTracingPath) {
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

                this.pipeline = isTracingPath ? pipes : undefined;
                this.endPipe = endPipeArray;
                return this;
            }

            /* MOVE TRAVERSED TO LOCAL VARIABLE*/

            /***************************************************************************************************

             @       bothE()                 callable/chainable
             @param      {String*|String Array}  Comma separated list or array of labels.
             @returns    {Object Array}          emits both incoming and outgoing edges of the vertex.
             @example

             var result = g.v(10).bothE().value();
             var result = g.v(10).bothE('knows').value();

             ****************************************************************************************************/
            bothE(...labels:string[]):Pipeline {

                var value:{},
                    vertex:Vertex,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    hasArgs:bool = !!labels.length,
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    isTracingOptional:bool = !!this.graph.optionalTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    pipe:IElement[];

                this.steps[++this.steps.currentStep] = { func: 'bothE', args: labels };

                if (!!this.endPipe.length && this.endPipe[0].Type !== 'Vertex') {
                    throw new TypeError('Only accepts incoming ' + this.endPipe[0].Type + 's');
                }

                if (isTracingPath) {
                    iter = this.pipeline;
                    pipes = [];
                } else {
                    this.traversed = {};
                    iter = this.endPipe;
                }
                Utils.each(iter, function (next) {
                    if (isTracingPath) {
                        vertex = slice.call(next, -1)[0];
                    } else {
                        vertex = next;
                        if (this.traversed.hasOwnProperty(vertex.obj[this.graph.meta.id])) {
                            if (!!this.traversed[vertex.obj[this.graph.meta.id]].length) {
                                push.apply(endPipeArray, this.traversed[vertex.obj[this.graph.meta.id]]);
                            }
                            if(isTracingOptional){
                                if('elements' in this.steps[this.steps.currentStep]){
                                    push.call(this.steps[this.steps.currentStep].elements, this.traversed[vertex.obj[this.graph.meta.id]]);
                                } else {
                                    this.steps[this.steps.currentStep].elements = [this.traversed[vertex.obj[this.graph.meta.id]]];
                                }
                            }
                            return;
                        } else {
                           this.traversed[vertex.obj[this.graph.meta.id]] = [];
                        }
                    }

                    value = hasArgs ? Utils.pick(vertex.outE, labels) : vertex.outE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge];
                            }
                        }
                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                
                    value = hasArgs ? Utils.pick(vertex.inE,labels) : vertex.inE;
                    Utils.each(Utils.flatten(Utils.values(value)), function (edge) {
                        endPipeArray.push(edge);
                        if(isTracingOptional){
                            if('elements' in this.steps[this.steps.currentStep]){
                                push.call(this.steps[this.steps.currentStep].elements, edge);
                            } else {
                                this.steps[this.steps.currentStep].elements = [edge];
                            }
                        }
                        if (isTracingPath) {
                            pipe = [];
                            pipe.push.apply(pipe, next);
                            pipe.push(edge);
                            pipes.push(pipe);
                        } else {
                            push.call(this.traversed[vertex.obj[this.graph.meta.id]], edge);
                        }
                    }, this);
                
                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                } else {
                    this.traversed = undefined;
                }
                this.endPipe = endPipeArray;
                return this;
            }

            property(prop:string):any[] {

                var array:any[] = [],
                    tempObj:{},
                    tempProp:string,
                    isEmbedded:bool = prop.indexOf(".") > -1;

                tempProp = isEmbedded ? prop.split(".").slice(-1)[0] : prop;

                Utils.each(this.endPipe, function (element) {
                    tempObj = isEmbedded ? Utils.embeddedObject(element.obj, prop) : element.obj;
                    if (!Utils.isObject(tempObj[tempProp]) && tempObj.hasOwnProperty(tempProp)) {
                        array.push(tempObj[tempProp]);
                    }
                });

                this.endPipe = [];
                return array;
            }

            //Needs to be optimized
            order(order?:number):Pipeline;
            order(func?:() => bool):Pipeline;
            order(order?:any):Pipeline {
                //order => if -1 the desc else asc
                var endPipeArray:any[] = [],
                    isElement:bool = !!this.endPipe.length && Utils.isElement(this.endPipe[0]),
                    type:string;

                if (!!order && Utils.isFunction(order)) {
                    if (isElement) {
                        type = this.endPipe[0].Type;
                        endPipeArray = Utils.pluck(this.endPipe, this.graph.meta.id);
                        endPipeArray.sort(order);
                        this.endPipe = Utils.materializeElementArray(endPipeArray, this.graph, type);
                    } else {
                        this.endPipe.sort(order);
                    }
                } else {
                    if (isElement) {
                        type = this.endPipe[0].Type;
                        endPipeArray = Utils.pluck(this.endPipe, this.graph.meta.id);
                        if (!!parseInt(endPipeArray[0])) {
                            order == -1 ? endPipeArray.sort(function (a, b) {
                                return b - a
                            }) : endPipeArray.sort(function (a, b) {
                                return a - b
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

            }

            //[i..j] -> range
            range(start:number, end?:number):Pipeline {
                this.endPipe = !!end ? this.endPipe.slice(start, end + 1) : this.endPipe.slice(start);
                return this;
            }

            //[i] -> get indexes
            index(...indices:number[]):Pipeline {
                var endPipeArray:any[] = [],
                    idx:number[] = Utils.flatten(indices);

                for (var i = 0, l = idx.length; i < l; i++) {
                    if (idx[i] > -1 && idx[i] < this.endPipe.length) {
                        endPipeArray.push(this.endPipe[idx[i]]);
                    }
                }
                this.endPipe = endPipeArray;
                return this;
            }

            /***************************************************************************************************
             Remove duplicate objects
             @       dedup()             callable/chainable
             @returns    {Object Array}      emits an Object Array
             @example

             g.v(10).out().in().dedup().value();

             ****************************************************************************************************/
            dedup():Pipeline {

                this.endPipe = Utils.uniqueElement(this.endPipe);
                return this;
            }


            except(dataSet:{}[]):Pipeline {
                var exclIds = Utils.pluck(Utils.flatten(dataSet), this.graph.meta.id);
                var ids = Utils.pluck(this.endPipe, this.graph.meta.id);
                var endPipeIds = Utils.difference(ids, exclIds);

                this.endPipe = Utils.materializeElementArray(endPipeIds, this.graph, this.endPipe[0].Type);

                return this;
            }

            //retain
            retain(dataSet:{}[]):Pipeline {

                var intersectIds = Utils.pluck(Utils.flatten(dataSet), this.graph.meta.id);
                var ids = Utils.pluck(this.endPipe, this.graph.meta.id);
                var endPipeIds = Utils.intersection(ids, intersectIds);
                this.endPipe = Utils.materializeElementArray(endPipeIds, this.graph, this.endPipe[0].Type);

                return this;
            }

            //has() and() or()
            where(...args:{}[]):Pipeline {

                var element:IElement,
                    iter:any[] = [],
                    l:number,
                    nextIter:any[] = [],
                    comparables:{}[] = [],
                    endPipeArray:any[] = [],
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    funcObj:{},
                    tempObj:{},
                    compObj:{},
                    tempProp:string,
                    propVals:any[] = [],
                    isIn:bool;

                this.steps[++this.steps.currentStep] = { func: 'where', args: args };
                iter = isTracingPath ? this.pipeline : this.endPipe;

                comparables = Utils.flatten(args);
                l = comparables.length;
                for (var i = 0; i < l; i++) {
                    compObj = comparables[i];
                    Utils.each(iter, function (next) {
                        element = isTracingPath ? slice.call(next, -1)[0] : next;
                        for (var prop in compObj) {
                            isIn = false;
                            if (compObj.hasOwnProperty(prop)) {
                                //$has, $hasNot, $hasAll & $hasNone
                                if (prop.charAt(0) === "$") {
                                    propVals = compObj[prop];
                                    if (!Compare[prop].call(null, element.obj, propVals)) {
                                        if (i < l) {
                                            nextIter.push(next);
                                        }
                                        return;
                                    }
                                } else {
                                    tempObj = element.obj;
                                    tempProp = prop;
                                    if (tempProp.indexOf(".") > -1) {
                                        tempObj = Utils.embeddedObject(tempObj, tempProp);
                                        tempProp = tempProp.split(".").slice(-1)[0];
                                    }
                                    if (Utils.isObject(tempObj[tempProp]) || !tempObj.hasOwnProperty(tempProp)) {
                                        if (i < l) {
                                            nextIter.push(next);
                                        }
                                        return;
                                    }
                                    funcObj = compObj[prop];
                                    for (var func in funcObj) {
                                        if (funcObj.hasOwnProperty(func)) {
                                            if (Compare[func].call(null, tempObj[tempProp], funcObj[func], this.graph)) {
                                                if (!isIn) {
                                                    isIn = true;
                                                }
                                            }
                                        }
                                    }
                                    if (!isIn) {
                                        if (i < l) {
                                            nextIter.push(next);
                                        }
                                        return;
                                    }
                                }
                            }
                        }
                        endPipeArray.push(element);
                        if (isTracingPath) {
                            pipes.push(next);
                        }
                    }, this);
                    iter = nextIter;
                    nextIter = [];
                }

                if (isTracingPath) {
                    this.pipeline = pipes;
                }
                this.endPipe = endPipeArray;
                return this;
            }


            filter(func:()=>any[], ...args:any[]):Pipeline {
                var element:IElement,
                    iter:any[] = [],
                    endPipeArray:any[] = [],
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined;

                iter = isTracingPath ? this.pipeline : this.endPipe;

                Utils.each(iter, function (next) {
                    element = isTracingPath ? slice.call(next, -1)[0] : next;
                    if (func.apply(element.obj, args)) {
                        endPipeArray.push(element);
                        if (isTracingPath) {
                            pipes.push(next);
                        }
                    }
                }, this);

                if (isTracingPath) {
                    this.pipeline = pipes;
                }
                this.endPipe = endPipeArray;
                return this;
            }

            // //Should this be a step?
            // //order -> select first
            // min(arg:string):Pipeline {
            //     var element:IElement,
            //         iter:any[] = [],
            //         endPipeArray:IElement[] = [],
            //         isTracingPath:bool = !!this.graph.pathTraceEnabled,
            //         pipes:any[] = isTracingPath ? [] : undefined,
            //         comp:number,
            //         newComp:number,
            //         tempObj:{},
            //         tempProp:string,
            //         isEmbedded:bool = arg.indexOf(".") > -1;

            //     iter = isTracingPath ? this.pipeline : this.endPipe;

            //     tempProp = isEmbedded ? arg.split(".").slice(-1)[0] : arg;

            //     Utils.each(iter, function (next) {
            //         element = isTracingPath ? slice.call(next, -1)[0] : next;

            //         tempObj = isEmbedded ? Utils.embeddedObject(element.obj, arg) : element.obj;

            //         if (tempObj.hasOwnProperty(tempProp) && !Utils.isArray(tempObj[tempProp])) {
            //             if (!isNaN(Utils.parseNumber(tempObj[tempProp], this.graph))) {
            //                 newComp = Utils.parseNumber(tempObj[tempProp], this.graph);
            //             } else {
                            
            //                 return;
            //             }

            //             if (!!comp) {
            //                 if (newComp < comp) {
            //                     endPipeArray = [element];
            //                     if (isTracingPath) {
            //                         pipes = [];
            //                         pipes.push(next);
            //                     }
            //                     comp = newComp;
            //                 } else if (newComp == comp) {
            //                     endPipeArray.push(element);
            //                     if (isTracingPath) {
            //                         pipes.push(next);
            //                     }
            //                 }
            //             } else {
            //                 comp = newComp;
            //                 endPipeArray.push(element);
            //                 if (isTracingPath) {
            //                     pipes.push(next);
            //                 }
            //             }
            //         }

            //     }, this);

            //     if (isTracingPath) {
            //         this.pipeline = pipes;
            //     }
            //     this.endPipe = endPipeArray;
            //     return this;
            // }

            // //order -> select first
            // max(arg:string):Pipeline {
            //     var element:IElement,
            //         iter:any[] = [],
            //         endPipeArray:IElement[] = [],
            //         isTracingPath:bool = !!this.graph.pathTraceEnabled,
            //         pipes:any[] = isTracingPath ? [] : undefined,
            //         comp:number,
            //         newComp:number,
            //         tempObj:{},
            //         tempProp:string,
            //         isEmbedded:bool = arg.indexOf(".") > -1;

            //     iter = isTracingPath ? this.pipeline : this.endPipe;

            //     tempProp = isEmbedded ? arg.split(".").slice(-1)[0] : arg;

            //     Utils.each(iter, function (next) {
            //         element = isTracingPath ? slice.call(next, -1)[0] : next;

            //         tempObj = isEmbedded ? Utils.embeddedObject(element.obj, arg) : element.obj;

            //         if (tempObj.hasOwnProperty(tempProp) && !Utils.isArray(tempObj[tempProp])) {
            //             if (!isNaN(Utils.parseNumber(tempObj[tempProp], this.graph))) {
            //                 newComp = Utils.parseNumber(tempObj[tempProp], this.graph);
            //             } else {
                            
            //                 return;
            //             }

            //             if (!!comp) {
            //                 if (newComp > comp) {
            //                     endPipeArray = [element];
            //                     if (isTracingPath) {
            //                         pipes = [];
            //                         pipes.push(next);
            //                     }
            //                     comp = newComp;
            //                 } else if (newComp == comp) {
            //                     endPipeArray.push(element);
            //                     if (isTracingPath) {
            //                         pipes.push(next);
            //                     }
            //                 }
            //             } else {
            //                 comp = newComp;
            //                 endPipeArray.push(element);
            //                 if (isTracingPath) {
            //                     pipes.push(next);
            //                 }
            //             }
            //         }

            //     }, this);

            //     if (isTracingPath) {
            //         this.pipeline = pipes;
            //     }
            //     this.endPipe = endPipeArray;
            //     return this;
            // }

            //used for loop() to refer back to a point...I think
            as(name:string):Pipeline {
                this.asHash = this.asHash || {};
                //Will not overwrite existing stored name
                if (!this.asHash[name]) {
                    this.asHash[name] = {};
                }
                this.asHash[name].step = this.steps.currentStep;
                return this;
            }

            back(x:number, finalCall?:bool):Pipeline;
            back(x:string, finalCall?:bool):Pipeline;
            back(x:any, finalCall?:bool):Pipeline {

                var backTo:number,
                    i:number=0,
                    l:number=0,
                    endPipeArray:any[] = [];

                if (!this.graph.pathTraceEnabled) {
                    throw Error('Tracing is off');
                    return;
                };
                if(!x){
                    throw Error('Paramater is required');
                    return;
                }

                if(Utils.isString(x)){
                    if(x in this.asHash){
                        backTo = this.asHash[x].step;    
                    } else {
                        throw Error('Unknown named position');
                    }
                } else {
                    backTo = this.steps.currentStep - x;
                }

                this.pipeline = Utils.uniqueRow(this.pipeline, backTo);
                l = this.pipeline.length;
                for(i=0;i<l;i++){
                    push.call(endPipeArray,this.pipeline[i][backTo-1]);
                }
                this.endPipe = endPipeArray;
                return this;
            }

            optional(x:number):Pipeline;
            optional(x:string):Pipeline;
            optional(x:any):Pipeline {

                var backTo:number;

                if (!this.graph.optionalTraceEnabled) {
                    throw Error('Tracing is off');
                    return;
                };
                if(!x){
                    throw Error('Paramater is required');
                    return;
                }

                if(Utils.isString(x)){
                    if(x in this.asHash){
                        backTo = this.asHash[x].step;    
                    } else {
                        throw Error('Unknown named position');
                    }
                } else {
                    backTo = this.steps.currentStep - x;
                }
                   
                this.endPipe = this.steps[backTo].elements;
                return this;
            }


            path(...props:string[]):any[] {
                var tempObjArray:{}[] = [],
                    tempArr:any[] = [],
                    tempObj:{}={},
                    outputArray:any[] = [],
                    len:number = 0;

                if (!this.graph.pathTraceEnabled) {
                    throw Error('Tracing is off');
                    return;
                }
                //reset steps
                this.steps = { currentStep: 0 };
                len = this.pipeline.length;

                if(!!props.length){
                    for (var i = 0; i < len; i++) {
                        tempObjArray = Utils.toObjArray(this.pipeline[i]);
                        for(var j = 0, l = tempObjArray.length; j < l; j++){
                            push.call(tempArr, Utils.pick(tempObjArray[j], props))
                        }
                        push.call(outputArray, tempArr);
                        tempObjArray = [];
                        tempArr = [];
                    }
                } else {

                    for (var i = 0; i < len; i++) {
                        
                        push.call(outputArray, Utils.toObjArray(this.pipeline[i]));
                    }
                }
                
                this.pipeline.length = 0;
                return outputArray;
            }


            /***************************************************************************************************

             Called to emit the result from traversing the graph.

             count()             callable
             @returns    {Number}            Returns count.

             @example

             var result = g.V().count();

             ****************************************************************************************************/
            count():number {
                return this.endPipe.length;
            }

            /***************************************************************************************************
             Group by property
             group()          callable/chainable
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

             ****************************************************************************************************/
            group(args:string[]):{} {

                var isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    props:string[] = [],
                    tempObj:{},
                    tempProp:string,
                    groupObj:{} = {},
                    o:{} = {},
                    outputObj:{} = {},
                    element:{};

                args = Utils.flatten(args);
                Utils.each(this.endPipe, function (next) {
                    element = isTracingPath ? slice.call(next, -1)[0].obj : next.obj;

                    o = {};
                    o[element[this.graph.meta.id]] = element;
                    for (var j = args.length - 1, propsLen = 0; j >= propsLen; j--) {
                        tempObj = element;
                        tempProp = args[j];
                        if (tempProp.indexOf(".") > -1) {
                            tempObj = Utils.embeddedObject(tempObj, tempProp);
                            tempProp = tempProp.split(".").slice(-1)[0];
                        }
                        if (!(Utils.isObject(tempObj[tempProp])) && tempObj.hasOwnProperty(tempProp)) {
                            props = Utils.isArray(tempObj[tempProp]) ? tempObj[tempProp] : [tempObj[tempProp]];
                            for (var f = 0, flen = props.length; f < flen; f++) {
                                groupObj[props[f]] = o;
                            }
                        } else {
                            groupObj['_no_' + args[j]] = o;
                            //give it an unclassified category
                        }
                        o = groupObj;
                        groupObj = {};

                    }
                    outputObj = Utils.merge(o, outputObj);
                });

                this.endPipe = [];
                return outputObj;

            }


            sum(args:string[]):{} {

                var isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    props:string[] = [],
                    tempObj:{},
                    tempProp:string,
                    outputObj:{ summed:{}; results:{}[]; }/* = { summed: {}, results: [] }*/,
                    o:{} = {},
                    isEmbedded:bool = false;


                function createChildren(val:any, ...properties:string[]):{} {
                    var i:number = properties.length,
                        retObj:{} = {},
                        groupObj:{ value?:number; } = { value: val };

                    retObj = groupObj;
                    while (!!i) {
                        groupObj = {};
                        groupObj[properties[--i]] = retObj;
                        retObj = groupObj;
                    }

                    return retObj;
                }

                args = Utils.flatten(args);
                for (var i = 0, propsLen = args.length; i < propsLen; i++) {
                    tempProp = args[i];
                    o[tempProp] = 0;
                    isEmbedded = false;
                    if (args[i].indexOf(".") > -1) {
                        tempProp = args[i].split(".").slice(-1)[0];
                        isEmbedded = true;
                    }
                    Utils.each(this.endPipe, function (next) {
                        tempObj = isTracingPath ? slice.call(next, -1)[0].obj : next.obj;
                        if (isEmbedded) {
                            tempObj = Utils.embeddedObject(tempObj, args[i]);
                        }
                        if (!(Utils.isObject(tempObj[tempProp])) && tempObj.hasOwnProperty(tempProp)) {
                            props = Utils.isArray(tempObj[tempProp]) ? tempObj[tempProp] : [tempObj[tempProp]];
                            for (var j = 0, len = props.length; j < len; j++) {
                                o[args[i]] = o[args[i]] + Utils.parseNumber([props[j]], this.graph);
                            }
                        }
                    });
                }

                props = [];
                var o2/* = {}*/, o3 = {};

                for (var k in o) {
                    if (o.hasOwnProperty(k)) {
                        if (k.indexOf(".") > -1) {
                            props.push(o[k]);
                            props.push.apply(props, k.split("."));
                            o2 = createChildren.apply(null, props);
                        } else {    //probably fix this
                            o2 = {};
                            o2[k] = {};
                            o2[k].value = o[k];
                        }
                        o3 = Utils.merge(o2, o3);
                    }
                }
                outputObj.summed = o3;
                outputObj.results = this.endPipe;
                this.endPipe = [];

                return outputObj;
            }


            transform(func:string):Pipeline {
                var endPipeArray:any[] = [];
                var customFunc = new Function("it","use strict; "+func+" return it;");
                Utils.each(this.endPipe, function (element) {
                    var t = customFunc(element.obj);
                    endPipeArray.push(customFunc.call(element.obj, element.obj));
                });
                this.endPipe = endPipeArray;
                return this;
            }

            store(x:any[], func?:() => any[], ...args:any[]):Pipeline {

                if (!func) {
                    x.push.apply(x, Utils.toObjArray(this.endPipe));
                } else {
                    Utils.each(this.endPipe, function (element) {
                        x.push(func.apply(element.obj, args));
                    });
                }
                return this;
            }

//            /***************************************************************************************************
//             Iterate over a specified region of the path
//                    loop()              callable/chainable
//             @param      !{Number|String}    Number of back steps or stored position
//             @param      !{Number}           Number of iterations i.e. how many times to traverse those steps
//             @returns    {Object}            emits an Object
//             @examples
//
//             g.v(40).out().in().loop(2, 3).value();
//             g.v(40).out().as('x').in().loop('x', 3).value();
//
//             *****************************************************************************************************/

            //Need to test back() and path() functions with the loop() escpecially when there is a function involved
            //loop(loopFor:number, stepBack:number, func?:() => any[], ...args:any[]):Pipeline;

            loop(loopFor:number, stepBack?:string, func?:() => any[], ...args:any[]):Pipeline;

            //loop(loopFor:any = 1, stepBack:any = 0, func?:() => any[], ...args:any[]):Pipeline {
            loop(loopFor:any, stepBack:any, func?:() => any[], ...args:any[]):Pipeline {
                var i:number,
                    stepFrom:number = 0,
                    stepTo:number = this.steps.currentStep,
                    endPipeArray:IElement[] = [],
                    element:IElement,
                    iter:any[] = [],
                    isTracingPath:bool = !!this.graph.pathTraceEnabled,
                    pipes:any[] = isTracingPath ? [] : undefined,
                    hasFunction:bool = !!func && typeof func == "function",
                    callFunc:() => void = function () {
                        iter = isTracingPath ? this.pipeline : this.endPipe;
                        Utils.each(iter, function (next) {
                            element = isTracingPath ? slice.call(next, -1)[0] : next;
                            if (func.apply(element.obj, args)) {
                                endPipeArray.push(element);
                                if (isTracingPath) {
                                    pipes.push(next);
                                }
                            }
                        }, this);
                    };

                if (!!loopFor && typeof loopFor == "function") {
                    hasFunction = true;
                    func = loopFor;
                    loopFor = 1;
                } else {
                    if (!!stepBack && typeof stepBack == "function") {
                        hasFunction = true;
                        func = stepBack;
                        stepBack = 0;
                    }
                }

                stepFrom = Utils.isString(stepBack) ? this.asHash[stepBack].step : this.steps.currentStep - stepBack;

                if (stepFrom < 2) {
                    throw Error('Cannot go loop back to step ' + stepFrom);
                }

                while (!!loopFor) {
                    for (i = stepFrom; i <= stepTo; i++) {
                        if (hasFunction) {
                            callFunc.call(this);
                        }
                        this[this.steps[i].func].apply(this, this.steps[i].args);
                    }
                    --loopFor;
                }
                if (hasFunction) {
                    callFunc.call(this);
                    if (isTracingPath) {
                        this.pipeline = pipes;
                    }
                    this.endPipe = endPipeArray;
                }
                return this;
            }


            
            emit():{ results:any[]; } {

                //reset steps
                this.steps = { currentStep: 0 };

                if (!!this.endPipe.length) {
                    if (!this.endPipe[0] || !Utils.isElement(this.endPipe[0])) {
                        return {results: this.endPipe};
                    }                    
                    return {results: Utils.toObjArray(this.endPipe)};
                }


                return {results: []};
            }

            // **************************************************************************************************

            //  Called to emit the stringified result from traversing the graph.

            //  stringify()             callable
            //  @param      {String*|String Array}  Comma delimited string or string array of keys to be mapped to emit.
            //  @returns    {String}                Returns a string.

            //  @example

            //  var result = g.V().stringify();

            //  **************************************************************************************************
            stringify():string {
                return JSON.stringify(this.emit().results);
            }

            hash():{} {
                //reset steps
                this.steps = { currentStep: 0 };
                return Utils.toHash(this.endPipe);
            }

            map(...props:string[]):any[] {
                var tempObjArray:any[] = [],
                    tempArr:any[] = [],
                    outputArray:any[] = [];

                //reset steps
                this.steps = { currentStep: 0 };

                if(!!props.length){
                    
                    tempObjArray = this.emit().results;
                    for(var j = 0, l = tempObjArray.length; j < l; j++){
                        push.call(outputArray, Utils.pick(tempObjArray[j], props))
                    }
                    tempObjArray = [];
                } else {
                    outputArray = this.emit().results;
                }
                return outputArray;
            }
        }

        export class Compare {
            //comparables

            static $eq(objVal:any, val:any, graph:GraphDatabase):bool {

                var objValIsArray:bool = Utils.isArray(objVal),
                    index:number;

                objVal = objValIsArray ? Utils.unique(objVal) : [objVal];
                index = objVal.length;
                while (index) {
                    --index;
                    if (((Utils.isDate(val, graph.date) && Utils.isDate(objVal[index], graph.date))
                        || (Utils.isMoney(val, graph.currency) && Utils.isMoney(objVal[index], graph.currency))
                        || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency))))
                        && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val, graph))) {

                        return true;
                    }
                }
                return false;
            }

            static $neq(objVal:any, val:any, graph:GraphDatabase):bool {
                return !Compare.$eq(objVal, val, graph);
            }

            static $lt(objVal:any, val:any, graph:GraphDatabase):bool {
                var objValIsArray:bool = Utils.isArray(objVal),
                    index:number;

                objVal = objValIsArray ? Utils.unique(objVal) : [objVal];
                index = objVal.length;
                while (index) {
                    --index;
                    if (((Utils.isDate(val, graph.date) && Utils.isDate(objVal[index], graph.date))
                        || (Utils.isMoney(val, graph.currency) && Utils.isMoney(objVal[index], graph.currency))
                        || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency))))
                        && (Utils.parseNumber(objVal[index], graph) < Utils.parseNumber(val, graph))) {

                        return true;
                    }
                }
                return false;
            }

            static $lte(objVal:any, val:any, graph:GraphDatabase):bool {
                var objValIsArray:bool = Utils.isArray(objVal),
                    index:number;

                objVal = objValIsArray ? Utils.unique(objVal) : [objVal];
                index = objVal.length;
                while (index) {
                    --index;
                    if (((Utils.isDate(val, graph.date) && Utils.isDate(objVal[index], graph.date))
                        || (Utils.isMoney(val, graph.currency) && Utils.isMoney(objVal[index], graph.currency))
                        || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency))))
                        && (Utils.parseNumber(objVal[index], graph) <= Utils.parseNumber(val, graph))) {

                        return true;
                    }
                }
                return false;
            }

            static $gt(objVal:any, val:any, graph:GraphDatabase):bool {
                return !Compare.$lte(objVal, val, graph);
            }

            static $gte(objVal:any, val:any, graph:GraphDatabase):bool {
                return !Compare.$lt(objVal, val, graph);
            }

            static $typeOf(objVal:any, val:string[], graph:GraphDatabase):bool {

                var objValIsArray:bool = Utils.isArray(objVal),
                    index:number,
                    i:number = 0,
                    valLen:number = val.length,
                    comp:string;

                index = val.length;
                while (index) {
                    --index;
                    comp = val[index].toLowerCase()
                    if (comp == 'number' && !Utils.isDate(objVal, graph.date) && !Utils.isMoney(objVal, graph.currency) && Utils.isNumber(Utils.parseNumber(objVal, graph))) {
                        return true;
                    } else if (comp == 'money' && Utils.isMoney(objVal, graph.currency)) {
                        return true;
                    } else if (comp == 'string' && !Utils.isDate(objVal, graph.date) && !Utils.isMoney(objVal, graph.currency) && Utils.isString(Utils.parseNumber(objVal, graph))) {
                        return true;
                    } else if (comp == 'array' && Utils.isArray(objVal)) {
                        return true;
                    } else if (comp == 'date' && Utils.isDate(objVal, graph.date)) {
                        return true;
                    }
                }
                return false;
            }

            static $notTypeOf(objVal:any, val:string[], graph:GraphDatabase):bool {
                return !Compare.$typeOf(objVal, val, graph);
            }

            static $in(objVal:any, val:any[], graph:GraphDatabase):bool {

                var objValIsArray:bool = Utils.isArray(objVal),
                    index:number,
                    i:number = 0,
                    valLen:number = val.length;

                objVal = objValIsArray ? Utils.unique(objVal) : [objVal];
                index = objVal.length;
                while (index) {
                    --index;
                    i = valLen;
                    while (!!i) {
                        --i;
                        if (((Utils.isDate(val[i], graph.date) && Utils.isDate(objVal[index], graph.date))
                            || (Utils.isMoney(val[i], graph.currency) && Utils.isMoney(objVal[index], graph.currency))
                            || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency))))
                            && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val[i], graph))) {

                            return true;
                        }
                    }
                }
                return false;
            }

            static $nin(objVal:any, val:any[], graph:GraphDatabase):bool {
                return !Compare.$in(objVal, val, graph);
            }

            static $match(objVal:any, val:string[], graph:GraphDatabase):bool {
                var objValIsArray:bool = Utils.isArray(objVal),
                    index:number,
                    i:number = 0,
                    valLen:number = val.length;

                objVal = objValIsArray ? Utils.unique(objVal) : [objVal];
                index = objVal.length;
                while (index) {
                    --index;
                    i = valLen;
                    while (!!i) {
                        --i;
                        if (Utils.isString(objVal[index]) && !(objVal[index].search(val[i]) === false)) {
                            return true;
                        }
                    }
                }
                return false;
            }

            //Array comparator
            static $all(objVal:any[], val:any[], graph:GraphDatabase):bool {

                var matches:number = 0,
                    index:number = 0,
                    i:number = 0,
                    valLen:number = 0;

                val = Utils.unique(val);
                objVal = Utils.unique(objVal);

                valLen = val.length;
                index = objVal.length;
                if (valLen <= index) {
                    while (index) {
                        --index;
                        i = valLen;
                        while (!!i) {
                            --i;
                            if (((Utils.isDate(val[i], graph.date) && Utils.isDate(objVal[index], graph.date))
                                || (Utils.isMoney(val[i], graph.currency) && Utils.isMoney(objVal[index], graph.currency))
                                || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency))))
                                && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val[i], graph))) {

                                matches++;
                            }
                        }
                    }
                }
                return matches == valLen;
            }

            //Array comparator
            static $none(objVal:any[], val:any[], graph:GraphDatabase):bool {
                return !Compare.$all(objVal, val, graph);
            }

            //Array comparator
            static $exact(objVal:any[], val:any[], graph:GraphDatabase):bool {

                var matches:number = 0,
                    index:number = 0,
                    i:number = 0,
                    valLen:number = 0;

                val = Utils.unique(val);
                objVal = Utils.unique(objVal);

                valLen = val.length;
                index = objVal.length;
                if (valLen == index) {
                    while (index) {
                        --index;
                        i = valLen;
                        while (!!i) {
                            --i;
                            if (((Utils.isDate(val[i], graph.date) && Utils.isDate(objVal[index], graph.date))
                                || (Utils.isMoney(val[i], graph.currency) && Utils.isMoney(objVal[index], graph.currency))
                                || (!(Utils.isDate(objVal[index], graph.date) || Utils.isMoney(objVal[index], graph.currency))))
                                && (Utils.parseNumber(objVal[index], graph) === Utils.parseNumber(val[i], graph))) {

                                matches++;
                            }
                        }
                    }
                }
                return matches == valLen;
            }

            /*
             $startsWith
             $endsWith
             $contains
             $notContains
             */

            static $hasAny(obj:{}, val:string[]):bool {
                var i:number = val.length,
                    tempObj:{},
                    tempProp:string;

                while (!!i) {
                    --i;
                    tempObj = obj;
                    tempProp = val[i];
                    if (tempProp.indexOf(".") > -1) {
                        tempObj = Utils.embeddedObject(tempObj, tempProp);
                        tempProp = tempProp.split(".").slice(-1)[0];
                    }
                    if (tempObj.hasOwnProperty(tempProp)) {
                        return true;
                    }
                }
                return false;
            }

            static $hasAll(obj:{}, val:string[]):bool {
                var i:number = val.length,
                    matches:number,
                    tempObj:{},
                    tempProp:string;

                while (!!i) {
                    --i;
                    tempObj = obj;
                    tempProp = val[i];
                    if (tempProp.indexOf(".") > -1) {
                        tempObj = Utils.embeddedObject(tempObj, tempProp);
                        tempProp = tempProp.split(".").slice(-1)[0];
                    }
                    if (tempObj.hasOwnProperty(tempProp)) {
                        matches++;
                    }
                }
                return matches == val.length;
            }

            static $notAny(obj:{}, val:string[]):bool {
                return !$hasAny(obj, val);
            }

            static $notAll(obj:{}, val:string[]):bool {
                return !$hasAll(obj, val);
            }

        }

    }

    class Utils {

        //app.zip = /^\w\w$/;
 
        //app.validDate = /^(?:(?:31(\/|-|\.)(?:0?[13578]|1[02]))\1|(?:(?:29|30)(\/|-|\.)(?:0?[1,3-9]|1[0-2])\2))(?:(?:1[6-9]|[2-9]\d)?\d{2})$|^(?:29(\/|-|\.)0?2\3(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00))))$|^(?:0?[1-9]|1\d|2[0-8])(\/|-|\.)(?:(?:0?[1-9])|(?:1[0-2]))\4(?:(?:1[6-9]|[2-9]\d)?\d{2})$/;
 
        //app.validCurrency = /^\$?\-?([1-9]{1}[0-9]{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(\.\d{0,2})?|0(\.\d{0,2})?|(\.\d{1,2}))$|^\-?\$?([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(\.\d{0,2})?|0(\.\d{0,2})?|(\.\d{1,2}))$|^\(\$?([1-9]{1}\d{0,2}(\,\d{3})*(\.\d{0,2})?|[1-9]{1}\d{0,}(\.\d{0,2})?|0(\.\d{0,2})?|(\.\d{1,2}))\)$/;

        static currencyRegex:{} = {
            '.': /[^0-9-.]+/g,
            ',': /[^0-9-,]+/g
        };

        static  toArray(o) {
            var k, r = [];
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    r.push(o[k]);
                }
            }
            return r;
        }

        static each(array:any, func:(element:any)=>void,/* callback?:(result:any)=>void,*/ context?:{}):void {

            var i:any, len:number, val:Element;

            //if (!Utils.is(func))
            //throw new TypeError();

            if (isArray(array)) {
                len = array.length;
                for (i = 0; i < len; i += 1) {
                    val = array[i]; // in case func mutates this
                    func.call(context, val);
                }
            } else {
                for (i in array) {
                    if (array.hasOwnProperty(i)) {
                        val = array[i]; // in case func mutates this
                        func.call(context, val);
                    }
                }
            }
            //callback()
        }

//        static  each(array:any, func:(element:any)=>void, context?:{}):void {
//
//            var i:any, len:number, val:Element;
//
//            //if (!Utils.is(func))
//            //throw new TypeError();
//
//            if (isArray(array)) {
//                len = array.length;
//                for (i = 0; i < len; i += 1) {
//                    val = array[i]; // in case func mutates this
//                    func.call(context, val);
//                }
//            } else {
//                for (i in array) {
//                    if (array.hasOwnProperty(i)) {
//                        val = array[i]; // in case func mutates this
//                        func.call(context, val);
//                    }
//                }
//            }
//        }


        //TODO: check intersection
        static intersection(arr1:any[], arr2:any[]/*, isObj:bool*/) {

            var r = [], o = {}, i, comp;
            for (i = 0; i < arr2.length; i += 1) {
//                if (!!isObj) {
//                    o[arr2[i][this.graph.meta.id]] = true;
//                } else {
                  o[arr2[i]] = true;
                //}
            }

            for (i = 0; i < arr1.length; i += 1) {
                comp = /*!!isObj ? arr1[i][arr1[i].graph.meta.id] :*/ arr1[i];
                if (!!o[comp]) {
                    r.push(arr1[i]);
                }
            }
            return r;
        }

        static intersectElement(elements:{}[]):{} {

            var o:{}, outputObj:{} = {}, compObj:{} = elements[0];

            for (var i = 1, l = elements.length; i < l; i++) {
                o = {};
                for (var k in elements[i]) {
                    if (elements[i].hasOwnProperty(k)) {
                        o[k] = true;
                    }
                }

                for (var h in compObj) {
                    if (!!o[h]) {
                        outputObj[h] = compObj[h];
                    }
                }
                if (isEmpty(outputObj)) {
                    return {};
                }
                compObj = outputObj;
            }
            return outputObj;
        }

        //Utils are internal s
        //TODO: Check difference
        static  difference(arr1:any[], arr2:any[]/*, isObj:bool*/):any[] {
            var r = [], o = {}, i, comp;
            for (i = 0; i < arr2.length; i += 1) {
//                if (!!isObj) {
//                    o[arr2[i][arr2[i].graph.meta.id]] = true;
//                } else {
                    o[arr2[i]] = true;
//                }
            }

            for (i = 0; i < arr1.length; i += 1) {
                comp = /*!!isObj ? arr1[i][arr1[i].graph.meta.id] :*/ arr1[i];
                if (!o[comp]) {
                    r.push(arr1[i]);
                }
            }
            return r;
        }

        static  diffElement(arr1:IElement[], arr2:IElement[]):any[] {
            var r = [], o = {}, i, comp;
            for (i = 0; i < arr2.length; i += 1) {
                o[arr2[i].obj[arr2[i].graph.meta.id]] = true;
            }

            for (i = 0; i < arr1.length; i += 1) {
                comp = arr1[i].obj[arr1[i].graph.meta.id];
                if (!o[comp]) {
                    r.push(arr1[i]);
                }
            }
            return r;
        }

        static  unique(array:any[]) {

            var o = {}, i, k, l = array.length, r = [];
            for (i = 0; i < l; i += 1) {
                o[array[i]] = array[i];
            }
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    r.push(o[k]);
                }
            }
            return r;
        }

        static  uniqueRow(arrays:IElement[][], step:number) {

            var o = {}, i, j, k, l = arrays.length, r = [];
            var prop;
            for(i = 0; i < l; i++) {
                prop = ""
                for(j = 0; j < step; j++){    
                    prop += arrays[i][j].obj[arrays[i][j].graph.meta.id] + ",";
                }
                o[prop] = arrays[i].slice(0,step);
            }
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    r.push(o[k]);
                }
            }
            return r;
        }
        static  uniqueElement(array:IElement[]):IElement[] {

            var o = {}, i, l = array.length, r = [];
            for (i = 0; i < l; i += 1) {
                o[array[i].obj[array[i].graph.meta.id]] = array[i];
            }
            for (i in o) {
                if (o.hasOwnProperty(i)) {
                    r.push(o[i]);
                }
            }
            return r;
        }

        static  include(array, i) {
            return indexOf.call(array, i) === -1 ? false : true;
        }

        static  keys(o) {
            var k, r = [];
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    r.push(k);
                }
            }
            return r;
        };

        static values(o) {
            return toArray(o);
        }

        static pick(o:{}, props:string[]):{} {

            var props = flatten(props),
                i = props.length,
                result = {},
                tempObj,
                tempProp:string;

            while (i) {
                i -= 1;
                tempProp = props[i];
                tempObj = o;
                if (tempProp.indexOf(".") > -1) {
                    tempObj = embeddedObject(o, tempProp);
                    tempProp = tempProp.split(".").slice(-1)[0];
                }

                if (tempObj.hasOwnProperty(tempProp)) {
                    result[tempProp] = tempObj[tempProp];
                }
            }
            return result;
        }

        static  pluck(objs:{ obj?:{}; }[], prop:string):any[] {

            var o,
                i = objs.length,
                tempObj:{},
                tempProp:string = prop,
                result = [],
                isElement:bool = false,
                isEmbedded:bool = false;

            if (!!i) {
                isElement = !!objs[0].obj;
            }
            if (prop.indexOf(".") > -1) {
                isEmbedded = true;
                tempProp = prop.split(".").slice(-1)[0];
            }
            while (i) {
                i -= 1;
                o = isElement ? objs[i].obj : objs[i];
                tempObj = isEmbedded ? embeddedObject(o, prop) : o;
                if (tempObj.hasOwnProperty(tempProp)) {
                    push.call(result, tempObj[tempProp]);
                }
            }

            return result;
        }

        static toHash(array:IElement[]):{} {
            var id:string,
                i:number,
                len:number = array.length,
                result:{} = {},
                o:{} = {};

            if(!!len){
                id = array[0].graph.meta.id;
                for (i = 0; i < len; i += 1) {
                    o = array[i].obj;
                    result[o[id]] = o;
                }
            }

            return result;
        }

        static  toObjArray(array:any[]):{}[] {
            var i, l = array.length, result:{}[] = [];

            for (i = 0; i < l; i += 1) {
                result.push(array[i].obj);
            }
            return result;
        }

        static materializeElementArray(array:{}[], db:GraphDatabase, type:string):IElement[];
        static materializeElementArray(array:any[], db:GraphDatabase, type:string):IElement[] {
            var i, l = array.length,
                result:IElement[] = [],
                elements:{} = type == "Vertex" ? db.vertices : db.edges,
                isObjArray:bool = false;

            if (!!l) {
                isObjArray = isObject(array[0]);
            }

            for (i = 0; i < l; i += 1) {
                result.push(isObjArray ? elements[array[i][db.meta.id]] : elements[array[i]]);
            }
            return result;
        }

        static flatten(array:any[], shallow:bool = false) {

            var result = [],
                value:any,
                index = -1,
                length;

            if (!array) {
                return result;
            }

            length = array.length;

            while ((index += 1) < length) {
                value = array[index];
                if (isArray(value)) {
                    push.apply(result, shallow ? value : flatten(value));
                } else {
                    result.push(value);
                }
            }
            return result;
        }

        static  embeddedObject(o:{}, prop:string):{} {
            var props:string[] = prop.indexOf(".") > -1 ? prop.split(".") : [prop],
                l:number = props.length,
                lastProp:string = props[l - 1],
                currentProp:string;

            for (var i = 0; i < l; i++) {
                if (o.hasOwnProperty(props[i])) {
                    currentProp = props[i];
                    if (!isObject(o[currentProp])) {
                        break;
                    }
                    o = o[currentProp];
                }
            }
            if (currentProp != lastProp) {
                o = {};
            }
            return o;
        }


        /*
         * Recursively merge properties of two objects
         */
        static  merge(obj1:{}, obj2:{}):{} {

            for (var p in obj2) {
                try {
                    // Property in destination object set; update its value.
                    if (obj1.hasOwnProperty(p)) {
                        obj1[p] = merge(obj1[p], obj2[p]);
                    } else {
                        obj1[p] = obj2[p];
                    }
                } catch (e) {
                    // Property in destination object not set; create it and set its value.
                    obj1[p] = obj2[p];
                }
            }

            return obj1;
        }


        static isArray(o:any):bool {
            return toString.call(o) === '[object Array]';
        }

        static isString(o:any):bool {
            return toString.call(o) === '[object String]';
        }

        static isNumber(o:any):bool {
            return toString.call(o) === '[object Number]';
        }

        static  isObject(o:any):bool {
            return toString.call(o) === '[object Object]';
        }

        static isEmpty(o:any):bool {
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
        }

        static isFunction(o:any):bool {
            return toString.call(o) === '[object ]';
        }

        static isNull(o:any):bool {
            return toString.call(o) === '[object Null]';
        }

        static isUndefined(o:any):bool {
            return toString.call(o) === '[object Undefined]';
        }

        static isElement(o:any):bool {
            return o.hasOwnProperty('obj');
        }

        static isDate(o:any, date:{ format:any;}):bool {
            return isString(o) ? moment(o, date.format).isValid() : false;
        }

        static isMoney(val:any, curr:{ symbol:any; decimal:string; }):bool {
            var i:number,
                l:number = curr.symbol.length;

            if (isString(val)) {
                for (i = 0; i < l; i++) {
                    if (val.indexOf(curr.symbol[i]) > -1) {
                        return !isNaN(parseFloat(val.replace(currencyRegex[curr.decimal], '')));
                    }
                }
            }
            return false;
        }

        //convert string to number OR return string
        static  parseNumber(val:any, graph:GraphDatabase):any {
            if (isDate(val, graph.date.format)) {
                return moment(val, graph.date.format).valueOf();
            }
            if (isString(val)) {
                if (isNaN(parseFloat(val.replace(currencyRegex[graph.currency.decimal], '')))) {
                    return val;
                }
                return parseFloat(val.replace(currencyRegex[graph.currency.decimal], ''));
            }
            return val;
        }
    }
}



try{
    importScripts('sax.js', 'moment.min.js', 'q.min.js', 'uuid.js', 'q-comm.js');
    var i, l, g, r;
    var noEmitArray = ['id','label','property','count','stringify','hash','path', 'map'];
    Q_COMM.Connection(this, {
        init: function (params) {
            //for(var i=0;i<3000000000;i++){}
            g = !!params ? new Helios.GraphDatabase(params) : new Helios.GraphDatabase();
            return 'Database created';
        },
        run: function (params) {
            r = g;

            var lastMessage = params.slice(-1)[0]; 
            if(lastMessage.method == 'back'){
                params.slice(-1)[0].parameters.push(true);
            }
            if(lastMessage.emit){
                params.push({method:'emit', parameters:[]});
            }

            for(i=0, l=params.length;i<l;i++){
                r = r[params[i].method].apply(r, params[i].parameters);
            }
            g.pathTrace(false);
            g.optionalTrace(false);
            return r;
        },
        pathTrace: function (param) {
            g.pathTrace(param);
        },
        optionalTrace: function (param) {
            g.optionalTrace(param);
        }
    });
} catch (exception){
    console.log(exception.message);
}

