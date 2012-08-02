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
        _env,
        graphUtils = {},
        fn = {},
        comparable = {},
        utils = {},
        graph = {'vertices': {}, 'edges': {}, 'v_idx': {}, 'e_idx': {}} ,
        unpipedFuncs = ['label', 'id', 'value', 'stringify', 'map', 'clone', 'path', 'fork', 'pin'];

    Function.prototype.pipe = function () {
        var that = this;
        return function () {
            var pipedArgs = [],
            isStep = !fn.include(['as', 'back', 'loop', 'countBy', 'groupBy', 'groupSum', 'store'], that.name);

            //reset any travesal - used by tail() & head()
            this._traversedVertices = {};
            this._traversedEdges = {};

            push.call(pipedArgs, this.pipedObjects);
            push.apply(pipedArgs, arguments);
            
            if(isStep){
                this.pipeline.steps[this.pipeline.steps.currentStep += 1] = { 'pipedInArgs': pipedArgs, 'func': that, 'pipedOutArgs':[] };
            }
            //New piped Objects to be passed to the next step
            this.pipedObjects = that.apply(this, pipedArgs);
            if(isStep && this.pipeline.steps.currentStep !== 0){
                  push.call(this.pipeline.steps[this.pipeline.steps.currentStep].pipedOutArgs, this.pipedObjects);
            }
            return this;
        };
    };

    //pipe enable all Helios functions except unpiped functions
    function pipe() {
        var func;
        for (func in this) {
            if (typeof this[func] == "function" && !fn.include(unpipedFuncs, func)) {
                this[func] = this[func].pipe();
            }
        }
        return this;
    }

    //Object constructor
    function Helios () {

        this._traversedVertices = {};
        this._traversedEdges = {};
        this.pipeline = {};
        this.pipedObjects = [];
        //used to prevent steps being reset for fork()
        this.preserveSteps = false;

        utils.resetPipe.call(this);
        return pipe.call(this);
    }


    Helios.toString = function() { return "Helios"; };

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
        'vIndicies': [],
        'eIndicies': []
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
    Helios.newGraph = function(aGraph, conf){
        var isJSON = false, fileExt;

        if(utils.isString(aGraph)){
            fileExt = aGraph.split('.').pop();
            isJSON = fileExt.toLowerCase() === 'json';
        } 

        if(!!aGraph && (aGraph.hasOwnProperty('vertices') || aGraph.hasOwnProperty('edges'))) {
            isJSON = true;
        } 

        if(!!aGraph && !utils.isString(aGraph) && !isJSON || !!conf){
            if(!conf){
                conf = aGraph;
                aGraph = false;
            }
            for(var key in conf){
                Helios.ENV[key] = conf[key];
            }
        }
        if(!!aGraph && isJSON){
    	   graphUtils.loadGraphSON(aGraph);
        }
        if(!!aGraph && !isJSON){
            graphUtils.loadGraphML(aGraph);
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
    graphUtils.loadGraphSON = function(jsonData){
    		
    	var i, l, rows = [], vertex = {}, edge = {};

        _env = Helios.ENV;

		if(utils.isUndefined(jsonData)) return;
		if(utils.isString(jsonData)){
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
			        if(xmlhttp.readyState == 4){
			        	jsonData = JSON.parse(xmlhttp.response);
			        }
			};
			xmlhttp.open("GET",jsonData,false);
			xmlhttp.send(null);
		}

		//process vertices
		if(jsonData.vertices){
			rows = jsonData.vertices;
			l = rows.length; 

            if(!!_env.vIndicies.length){
                fn.each(_env.vIndicies, function(idxName){
                    graph.v_idx[idxName]={};
                });
            }

			for(i=0; i<l;i+=1) {
				graph.vertices[rows[i][_env.id]] = { 'obj': rows[i], 'type': 'vertex', 'outE': {}, 'inE': {} };
                vertex = graph.vertices[rows[i][_env.id]];
                fn.each(_env.vIndicies, function(idxName){
                    if(!!vertex.obj[idxName]){
                        if(!graph.v_idx[idxName][vertex.obj[idxName]]){
                            graph.v_idx[idxName][vertex.obj[idxName]] = [];
                        }
                        push.call(graph.v_idx[idxName][vertex.obj[idxName]],vertex);
                    }
                });
			}
		}
		
		//process edges
		if(jsonData.edges){
			rows = jsonData.edges;
			l = rows.length; 

            if(!!_env.eIndicies.length){
                fn.each(_env.eIndicies, function(idxName){
                    graph.e_idx[idxName]={};
                });
            }

			for(i=0; i<l;i+=1) {

				edge = { 'obj': rows[i], 'type': 'edge', 'outV': {}, 'inV': {} };
				graph.edges[edge.obj[_env.id]] = edge;
                fn.each(_env.eIndicies, function(idxName){
                    if(!!edge.obj[idxName]){
                        if(!graph.e_idx[idxName][edge.obj[idxName]]){
                            graph.e_idx[idxName][edge.obj[idxName]] = [];
                        }
                        push.call(graph.e_idx[idxName][edge.obj[idxName]],edge);
                    }
                });
                utils.associateVertices(edge);
			}
		}
		return Helios;
    };

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
    graphUtils.loadGraphML = function(xmlData){
            
        var i, j, l, propLen, xmlV = [], xmlE = [], vertex = {}, edge = {},
        fileExt, 
        xmlhttp,
        parser,
        xmlDoc, 
        properties, 
        tempObj = {};

        _env = Helios.ENV;

        if(utils.isUndefined(xmlData)) return;
        if(utils.isString(xmlData)){

            fileExt = xmlData.split('.').pop();

            if(fileExt.toLowerCase() === 'xml'){

                xmlhttp = new XMLHttpRequest();
                xmlhttp.onreadystatechange = function() {
                        if(xmlhttp.readyState == 4){
                            xmlDoc = xmlhttp.responseXML;
                        }
                };
                xmlhttp.open("GET",xmlData,false);
                xmlhttp.send(null);
            } else {

                if (window.DOMParser){
                    parser=new DOMParser();
                    xmlDoc=parser.parseFromString(xmlData,"text/xml");
                } else // Internet Explorer
                {
                    xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async=false;
                    xmlDoc.loadXML(xmlData); 
                }
            }
        }

        xmlV = xmlDoc.getElementsByTagName("node");
        xmlE = xmlDoc.getElementsByTagName("edge");

        //process vertices
        if(!!xmlV.length){
            l = xmlV.length; 

            for(i=0; i<l;i+=1) {
                properties = xmlV[i].getElementsByTagName("data");
                tempObj = {};
                propLen = properties.length;
                for(var j=0; j<propLen; j++){
                    tempObj[properties[j].getAttribute("key")] = properties[j].firstChild.nodeValue;
                }
                tempObj[_env.id] = xmlV[i].getAttribute("id");
                tempObj[_env.type] = 'vertex';
                graph.vertices[xmlV[i].getAttribute("id")] = { 'obj': tempObj, 'type': 'vertex', 'outE': {}, 'inE': {} };

            }
        }
        
        //process edges
        if(!!xmlE.length){
            l = xmlE.length; 

            for(i=0; i<l;i+=1) {
                properties = xmlE[i].getElementsByTagName("data");
                tempObj = {};
                propLen = properties.length;
                for(j=0; j<propLen; j++){
                    tempObj[properties[j].getAttribute("key")] = properties[j].firstChild.nodeValue;
                }
                tempObj[_env.id] = xmlE[i].getAttribute("id");
                tempObj[_env.type] = 'edge';
                tempObj[_env.label] = xmlE[i].getAttribute("label");
                tempObj[_env.outVid] = xmlE[i].getAttribute("source");
                tempObj[_env.inVid] = xmlE[i].getAttribute("target");

                graph.edges[xmlE[i].getAttribute("id")] = { 'obj': tempObj, 'type': 'edge', 'outV': {}, 'inV': {} };
                edge = graph.edges[xmlE[i].getAttribute("id")];

                utils.associateVertices(edge);
            }
        }
        return Helios;
    };

    utils.associateVertices = function(edge){
        var vertex;

        if(!graph.vertices[edge.obj[_env.outVid]]){
            graph.vertices[edge.obj[_env.outVid]] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
            
        }
        vertex = graph.vertices[edge.obj[_env.outVid]];
        if(!vertex.outE[edge.obj[_env.label]]){
            vertex.outE[edge.obj[_env.label]] = [];
        }
        edge.outV = vertex;
        push.call(vertex.outE[edge.obj[_env.label]], edge);

        if(!graph.vertices[edge.obj[_env.inVid]]){
            graph.vertices[edge.obj[_env.inVid]] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
            
        }
        vertex = graph.vertices[edge.obj[_env.inVid]];
        if(!vertex.inE[edge.obj[_env.label]]){
            vertex.inE[edge.obj[_env.label]] = [];
        }
        vertex = graph.vertices[edge.obj[_env.inVid]];
        edge.inV = vertex;
        push.call(vertex.inE[edge.obj[_env.label]], edge);
    }

    /***************************************************************************************************

        Clear and reset the graph.

        @name       graph.close()
        @returns    {Helios}                    Returns the instance of Helios.

        @example

            g.graph.close();

    ***************************************************************************************************/
    graphUtils.close = function(){
        graph = {'vertices': {}, 'edges': {}, 'v_idx': {}, 'e_idx': {}};
        return Helios;
    }

    //utils are internal utility functions
    utils.resetPipe = function (){
        if(!this.preserveSteps){
            this.pipeline = {
                'steps': {
                    'currentStep': 0
                },
                'namedStep': {}            
            };
        }
        //if this.pipelineCache has been created then signifies to
        //preserve step 1 - used by pin()
        if(!utils.isEmpty(this.pipelineCache)){
            this.pipeline.steps['1'] = {};
            this.pipeline.steps['1'].pipedInArgs = [];
            this.pipeline.steps['1'].func = this.pipelineCache.func;            
            this.pipeline.steps['1'].pipedOutArgs = this.pipelineCache.pipedOutArgs;
            this.pipeline.steps.currentStep = 1;
            this.pipedObjects = this.pipelineCache.pipedOutArgs[0];
        }
    }

    utils.toArray = function(o){
        var k, r = [];
        for(k in o) {
            r.push(o[k]);
        }
        return r;        
    }
    
    utils.isArray = function(o){
        return toString.call(o) === '[object Array]';
    }

    utils.isString = function(o){
        return toString.call(o) === '[object String]';
    }
    utils.isNumber = function(o){
        return toString.call(o) === '[object Number]';
    }
    
    utils.isDate = function(o){
        return toString.call(o) === '[object Date]';
    }
    
    utils.isEmpty = function(o){
        if(!o){
            return true;
        }
        for(var key in o){
            return !o[key];
        }
        return true;
    }

    utils.isFunction = function(o){
        return toString.call(o) === '[object Function]';    
    }
    utils.isNull = function(o){
        return toString.call(o) === '[object Null]';
    }

    utils.isUndefined = function(o){
        return toString.call(o) === '[object Undefined]';
    }
    
    fn.intersection = function (arr1, arr2, isObj){
        var r = [], o = {}, i, comp;
        for (i = 0; i < arr2.length; i++) {
            !!isObj ? o[arr2[i].obj[_env.id]] = true : o[arr2[i]] = true;
        }
        
        for (i = 0; i < arr1.length; i++) {
            comp = !!isObj ? arr1[i].obj[_env.id] : arr1[i];
            if (!!o[comp]) {
                r.push(arr1[i]);
            }
        }
        return r;
    }

    //fn are internal Functions
    fn.difference = function(arr1, arr2, isObj){
        var r = [], o = {}, i, comp;
        for (i = 0; i < arr2.length; i++) {
            !!isObj ? o[arr2[i].obj[_env.id]] = true : o[arr2[i]] = true;
        }
        
        for (i = 0; i < arr1.length; i++) {
            comp = !!isObj ? arr1[i].obj[_env.id] : arr1[i];
            if (!o[comp]) {
                r.push(arr1[i]);
            }
        }
        return r;
    }

    fn.unique = function(array){

        var o = {}, i, l = array.length, r = [];
        for(i=0; i<l;i+=1) o[array[i]] = array[i];
        for(i in o) r.push(o[i]);
        return r;

    }
    fn.uniqueObject = function(array){

        var o = {}, i, l = array.length, r = [];
        for(i=0; i<l;i+=1) o[array[i].obj[_env.id]] = array[i];
        for(i in o) r.push(o[i]);
        return r;

    }
    
    fn.countBy = function(array, o, props){

        var retVal = arguments[0],
            i, j, 
            l = array.length, 
            element = {},
            propsLen;

        if(!props){
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for(i=0; i<l;i+=1) {
            element = array[i].obj;
            for(j=0; j < propsLen; j++){
                !o[props[j]] ? o[props[j]] = 1  : o[props[j]] += 1 ;
            }
        }
        return retVal;

    }
    fn.sumBy = function(array, o, props){
        //TODO: Need to cater for CURRENCIES

        var retVal = arguments[0],
            i, j, 
            l = array.length, 
            element = {},
            propsLen;

        if(!props){
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for(i=0; i<l;i+=1) {
            element = array[i].obj;
            for(j=0; j < propsLen; j++){
                !o[props[j]] ? o[props[j]] = element[props[j]] : o[props[j]] += element[props[j]];
            }
        }
        return retVal;

    }

    fn.groupBy = function(arr, o, props){

        var retVal = arguments[0],
            i, j,
            array = dedup(arr),
            l = array.length,
            element = {},
            propsLen,
            group;

        if(!props){
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for(i=0; i<l; i+=1) {
            element = array[i].obj;
            group = o;
            for(j=0; j < propsLen; j++){
                if(j === propsLen - 1){
                    !group[element[props[j]]] ? group[element[props[j]]] = [element]: push.call(group[element[props[j]]],element);
                }else {
                    if(!group[element[props[j]]]) {
                        group[element[props[j]]] = {};
                    }                    
                }
                group = group[element[props[j]]];
            }
        }
        return retVal;
    }

    fn.groupCount = function(arr, o, props){

        var retVal = arguments[0],
            i, j,
            array = dedup(arr),
            l = array.length,
            element = {},
            propsLen,
            group;

        if(!props){
            props = o;
            o = {};
            retVal = o;
        }
        propsLen = props.length;
        for(i=0; i<l; i+=1) {
            element = array[i].obj;
            group = o;
            for(j=0; j < propsLen; j++){

                if(j === propsLen - 1){
                    !group[element[props[j]]] ? group[element[props[j]]] = [element]: push.call(group[element[props[j]]],element);
                }else{
                    if(!group[element[props[j]]]) {
                        group[element[props[j]]] = {};
                    }
                }
                group = group[element[props[j]]];
                !group.count ? group.count = 1  : group.count += 1;
            }
        }
        return retVal;
    }

    fn.clone = function(o){
        return JSON.parse(JSON.stringify(o));
    }

    fn.include = function(array, i){
        return indexOf.call(array, i) === -1 ? false : true;
    }
    fn.keys = function(o){
        var k, r = [];
        for(k in o) {
            r.push(k);
        }
        return r;  
    }
    fn.values = function(o){
        return utils.toArray(o);
    }
    
    fn.pick = function(o){

        var prop,
        props = concat.apply(ArrayProto, arguments),
        i = props.length,
        result = {};
        
        while (i--) {
          prop = props[i];
          if (prop in o) {
            result[prop] = o[prop];
          }
        }
        return result;

    }
    fn.getObjProp = function(array){
        var i, l = array.length, result = [];
        
        for(i=0;i<l;i++){
            push.call(result,array[i].obj);
        }
        return result;

    }

    fn.flatten = function(array, shallow){

        var result = [],
            value,
            index = -1,
            length;

        if (!array) {
          return result;
        }
        
        length = array.length;

        while (++index < length) {
          value = array[index];
          if (utils.isArray(value)) {
            push.apply(result, shallow ? value : fn.flatten(value));
          } else {
            result.push(value);
          }
        }
        return result;

    }

    fn.map = function(array, func){

        var len = array.length, val, retVal = [];
        
        //if (!utils.isFunction(func))
          //throw new TypeError();
        
        for (var i = 0; i < len; i++)
        {
            val = array[i]; // in case func mutates this
            retVal.push(func.call(null, val));
        }
              
        return retVal;

    }

    fn.filter = function(array, func){

        var len = array.length, val, retVal = [];
        
        //if (!utils.isFunction(func))
          //throw new TypeError();
        
        for (var i = 0; i < len; i++)
        {
            val = array[i]; // in case func mutates this
            if (func.call(null, val))
              retVal.push(val);
        }
              
        return retVal;

    }

    fn.each = function(array, func){

        var len = array.length, val, retVal = [];
        
        //if (!utils.isFunction(func))
          //throw new TypeError();
        
        for (var i = 0; i < len; i++)
        {
            val = array[i]; // in case func mutates this
            func.call(null, val);
        }
    }


    /***************************************************************************************************

        Called to emit the result from traversing the graph.

        @name       pipedValue()        Not to be called directly
        @alias      value()             callable
        @returns    {Object Array}      Returns a Referenced Object Array to emitted Vertices or Edges.
        
        @example
            
            var result = g.V().value();

    ***************************************************************************************************/
    function pipedValue(){
        var retVal = [], args = arguments;
        if(!!this.pipedObjects[0] && !!this.pipedObjects[0].obj){
            retVal = fn.getObjProp(this.pipedObjects);
        } else {
            retVal = this.pipedObjects;            
        }

    	utils.resetPipe.call(this);
    	return retVal;
    }

    /***************************************************************************************************

        Creates a new instance of Helios to continue traversing the graph.

        @name       fork()        callable
        @returns    {Helios}      Returns Helios referenc
        
        @example
            
            var g2 = g.v(1).fork();
                     g2.out().value();

    ***************************************************************************************************/
    function fork(){
        var newHelios = new Helios();
            newHelios.pipedObjects = this.pipedObjects;
            utils.resetPipe.call(newHelios);

            newHelios.pipeline.steps['1'] = {};
            newHelios.pipeline.steps['1'].pipedInArgs = this.pipeline.steps[this.pipeline.steps.currentStep].pipedInArgs;
            newHelios.pipeline.steps['1'].func = this.pipeline.steps[this.pipeline.steps.currentStep].func;            
            newHelios.pipeline.steps['1'].pipedOutArgs = this.pipeline.steps[this.pipeline.steps.currentStep].pipedOutArgs;
            newHelios.pipeline.steps.currentStep = 1;
            newHelios.preserveSteps = true;

            utils.resetPipe.call(this);
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
    function pin(){
        var newHelios = new Helios();
            newHelios.pipedObjects = this.pipedObjects;
            newHelios.pipelineCache = {};
            newHelios.pipelineCache.pipedOutArgs = this.pipeline.steps[this.pipeline.steps.currentStep].pipedOutArgs;
            newHelios.pipelineCache.func = this.pipeline.steps[this.pipeline.steps.currentStep].func;
            utils.resetPipe.call(this);
            utils.resetPipe.call(newHelios);
            return newHelios;
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
    function stringify(){
        var retVal = [], args = arguments;
        if(!!this.pipedObjects[0] && !!this.pipedObjects[0].obj){
    		return JSON.stringify(map.apply(this, args));
    	}
    	retVal = this.pipedObjects;
    	utils.resetPipe();
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
            retVal = [], 
            o={}, 
            edge, 
            edgeStr, i, j, stepRecs, len;

        for(i = 1; i <= stepsObj.currentStep; i++){
            stepRecs = stepsObj[i].pipedOutArgs[0];
            stepPaths = o['step '+i] = [];
            for(j=0, len = stepRecs.length; j<len;j++){
                if(stepRecs[j].type === 'vertex'){
                    push.call(stepPaths,'v['+stepRecs[j].obj[_env.id]+']');
                } else {
                    edge = stepRecs[j].obj;
                    edgeStr = 'v['+ edge[_env.outVid] + '], e[' + edge[_env.id] + '][' + 
                                edge[_env.outVid] + '-' + edge[_env.label] + '->' + 
                                edge[_env.inVid] + '], v[' + edge[_env.inVid] +']';
                    push.call(stepPaths,edgeStr);
                }
            }
        }
        push.call(retVal,JSON.stringify(o));
        push.apply(retVal, this.pipedObjects);
        utils.resetPipe();
        return retVal;
    }

    /***************************************************************************************************

        Called to obtain root vertices to begin traversal.

        @name       v()             callable/chainable
        @param      {Mixed*}        Pass in comma separated list or array of ids
        @returns    {Object Array}  emits Vertices.
        
        @example
            
            var result = g.v(10).value();

    ***************************************************************************************************/
    function v() {

        var retVal = [], 
        args = fn.flatten(slice.call(arguments, 1)),
        length = args.length;
        while(length){
        	length--;
            push.call(retVal, graph.vertices[args[length]]);
        }
         
        return retVal;

    }

    /***************************************************************************************************

        Called to obtain root edges to begin traversal.

        @name       e()             callable/chainable
        @param      {Mixed*}        Pass in comma separated list or array of ids
        @returns    {Object Array}  emits Edges.
        
        @example
            
            var result = g.e(70).value();

    ***************************************************************************************************/
    function e() {
        var retVal = [], length, args = fn.flatten(slice.call(arguments, 1));
        length = args.length;
        while(length){
            length--;
            push.call(retVal, graph.edges[args[length]]);
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

        retVal = fn.map(this.pipedObjects, function(element, key, list) {
            return element.obj[_env.id];
        });
        
        utils.resetPipe();
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

        retVal = fn.map(this.pipedObjects, function(element, key, list) {
            return element.obj[_env.label];
        });

        utils.resetPipe(); 
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

        fn.each(arguments[0], function(vertex, key, list) {
            if (!utils.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
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
    function outV(){
        var retVal = fn.map(arguments[0], function(edge, key, list) {
        	return edge.outV;
        });
         
        return retVal;
    }

     function _in () {

        var retVal = [],
            args = slice.call(arguments, 1),
            hasArgs = !!args.length,
            value;

        fn.each(arguments[0], function(vertex, key, list) {
            if (!utils.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
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
    function inV(){
        var retVal = fn.map(arguments[0], function(edge, key, list) {
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

        fn.each(arguments[0], function(vertex, key, list) {
            if (!utils.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge.inV);
                });
            }
            if (!utils.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
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

        fn.each(arguments[0], function(edge, key, list) {
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

        fn.each(arguments[0], function(vertex, key, list) {
            if (!utils.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
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

        fn.each(arguments[0], function(vertex, key, list) {
            if (!utils.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
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

        fn.each(arguments[0], function(vertex, key, list) {
        	
            if (!utils.isEmpty(vertex.outE)) {
                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge);
                });
            }
            if (!utils.isEmpty(vertex.inE)) {
                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
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
            return graph.v_idx[args[0]][args[1]];
        };

        return utils.toArray(graph.vertices);
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
            return graph.e_idx[args[0]][args[1]];
        };
        return utils.toArray(graph.edges);
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

        fn.each(arguments[0], function(vertex) {
            if(!self._traversedVertices[vertex.obj[_env.id]]){  
                self._traversedVertices[vertex.obj[_env.id]] = 'visited'; 

                value = hasArgs ? fn.pick(vertex.outE, args) : vertex.outE;
                if(utils.isEmpty(value)){
                    if(hasArgs){
                        if(!utils.isEmpty(fn.pick(vertex.inE, args))){
                            push.call(retVal, vertex);
                        }
                    } else {
                        push.call(retVal, vertex);
                    }
                } else {
                    tempArr = [];
                    tempPipe = [];
                    fn.each(fn.flatten(fn.values(value)), function(edge) {
                        if(!self._traversedEdges[edge.obj[_env.id]]){
                            push.call(tempArr, edge.inV);
                            self._traversedEdges[edge.obj[_env.id]] = 'visited';
                        }
                    });
                    push.call(tempPipe,tempArr);
                    push.apply(tempPipe,args);
                    push.apply(retVal,tail.apply(self,tempPipe));    
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

        fn.each(arguments[0], function(vertex) {
            if(!self._traversedVertices[vertex.obj[_env.id]]){  
                self._traversedVertices[vertex.obj[_env.id]] = 'visited';

                value = hasArgs ? fn.pick(vertex.inE, args) : vertex.inE;
                if(utils.isEmpty(value)){
                    if(hasArgs){
                        if(!utils.isEmpty(fn.pick(vertex.outE, args))){
                            push.call(retVal, vertex);
                        }
                    } else {
                        push.call(retVal, vertex);
                    }
                } else {
                    tempArr = [];
                    tempPipe = [];
                    fn.each(fn.flatten(fn.values(value)), function(edge) {
                        if(!self._traversedEdges[edge.obj[_env.id]]){
                            push.call(tempArr, edge.outV);
                            self._traversedEdges[edge.obj[_env.id]] = 'visited';
                        }
                    });
                    push.call(tempPipe,tempArr);
                    push.apply(tempPipe,args);
                    push.apply(retVal,head.apply(self,tempPipe));
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
            results = g.v(10).out('knows').store(x, function(incAge){
                                                        var retVal = [];
                                                        fn.each(this, function(element){
                                                          element.obj.age += incAge;
                                                          retVal.push(element);
                                                        });
                                                    return retVal;}, 10).value();

    ***************************************************************************************************/
    function store(){
        var retVal = arguments[0],
            args = slice.call(arguments, 1), func, funcArgs = [];

            if(!!args.length){
                //if pass in Array, populate it, else store as a named pipe 
                utils.isArray(args[0]) ? push.apply(args[0],arguments[0]) : this.pipeline.namedStep[args[0]] = this.pipeline.steps.currentStep;

                if(utils.isFunction(args[1])){
                    func = args[1];
                    args.shift();
                    funcArgs = fn.flatten(slice.call(args, 1));
                    retVal = func.apply(arguments[0], funcArgs);
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
    function back(){
        var backSteps = arguments[1],
            stepBackTo;
            
            if(utils.isArray(backSteps)){
                return backSteps;
            }

            if(utils.isString(backSteps)){
                if(utils.isUndefined(this.pipeline.namedStep[backSteps])){
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
    function except(){

        var arg = arguments[1], dSet, diff, retVal = [];
        dSet = utils.isArray(arg) ? arg : this.pipeline.steps[this.pipeline.namedStep[arg]].pipedOutArgs[0];
        retVal = fn.difference(arguments[0],dSet, true);
         
        return retVal;
    }

    /***************************************************************************************************
        Allow Objects to pass that meet specified criteria
        @name       filter()            callable/chainable
        @alias      andFilter()         callable/chainable only after filter() has been called
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
            
            var results = g.v(10).filter(function(name) {  return this.obj.name === name; },'marko').value();

            g.v(10).out().filter('eq',['name','vadas']).value();
            g.v(10).out().filter('eq',['name','vadas']).value();
            g.v(10).out().filter('neq',['name','vadas']).value();
            g.v(10).out().filter('lt',['age',30]).value();
            g.v(10).out().filter('lte',['age',27]).value();
            g.v(10).out().filter('gt',['age',30]).value();
            g.v(10).out().filter('gte',['age',32]).value();
            g.v(10).out().filter('btwn',['age',30, 33]).value();
            
            *********************************************************************************************
            * has, hasNot, hasAny & hasNotAny take 'keys' or 'values' as the first value in array.      *
            *********************************************************************************************
            g.v(10).out().filter('has',['keys','name', 'age']).value();
            g.v(10).out().filter('hasAny',['keys', 'age', 'lang']).value();
            g.v(10).out().filter('hasAny',['values', 'josh', 'lop']).value();
            
            *********************************************************************************************
            * passing in more Comparables are treated as logical 'AND' ie. name === vadas & age > 25    *
            * but can also be used with the andFilter()                                                 *
            *********************************************************************************************            
            g.v(10).out().filter('eq',['name','vadas'], 'gt', ['age', 25]).value();
            g.v(10).out().filter('eq',['name','vadas']).andFilter('gt', ['age', 25]).value();

            *********************************************************************************************
            * passing in more Key/Value pairs are treated as logical 'OR' ie. name === 'vadas' ||       *
            * age === 32 but you can also use the orFilter()                                            *
            *********************************************************************************************            
            g.v(10).out().filter('eq',['name','vadas', 'age', 32]).value();
            g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).value();
            g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop']).value();

    ***************************************************************************************************/
    function filter(){

        var     retVal = [],
                records = arguments[0],
                args = slice.call(arguments, 1),
                func,
                funcArgs = [],
                argLen = args.length;

        if(utils.isFunction(args[0])){
            
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);

            fn.each(records, function(element){
                if(func.apply(element.obj, funcArgs)) {
                    push.call(retVal, element);
                }
            });

        } else {

            while(argLen){
                argLen -= 2;
                retVal = fn.filter(records, comparable[args[argLen]](args[argLen + 1]));
            }
        }
        
        this.pipeline.namedStep.filter = this.pipeline.steps.currentStep;    
         
        return retVal;
    }

    /***************************************************************************************************
        Allow Objects to pass that meet specified criteria
        @name       orFilter()          callable/chainable only after filter() has been called
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
            g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).value();
            g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop']).value();

    ***************************************************************************************************/
    function orFilter() {
        var  retVal = []
            ,prevRecords = arguments[0]
            ,args = slice.call(arguments, 1)
            ,records = this.pipeline.steps[this.pipeline.namedStep.filter].pipedInArgs[0]
            ,func
            ,funcArgs = []
            ,argLen
            ,ids = [];

        if(utils.isFunction(args[0])){
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);

            fn.each(records, function(element){
                if(func.apply(element.obj, funcArgs)) {
                    push.call(retVal, element);
                }
            });


        } else {

            argLen = args.length;
            while(argLen){
                argLen -= 2;
                retVal = fn.filter(records, comparable[args[argLen]](args[argLen + 1]));
            }

        }

        for (var i = 0, len = retVal.length; i < len; i++){
            push.call(ids,retVal[i].obj[_env.id]);
        }
        ids = fn.unique(ids);

        for (var i = 0, len = prevRecords.length; i < len; i++){
            if(!fn.include(ids, prevRecords[i].obj[_env.id])){
                push.call(retVal, prevRecords[i]);
            }
        }
         
        return retVal;    
    }

    /***************************************************************************************************
        Output the property map
        @name       map()               callable
        @param      {String*|Array}     Optional comma separated String or Array of properties to map.
        @returns    {Object Array}      emits an Object Array
        @example
            
            g.v(10).map();
            g.v(10).map('name', 'age');
            g.v(10).map(['name', 'age']);

    ***************************************************************************************************/
    function map(){
        var retVal, params = [], args = arguments;
        //if args passed need to do fn.pick()
        !!args.length ? 
            retVal = fn.map(this.pipedObjects, function(element){
                 params = [];
                 push.call(params, element.obj);
                 push.apply(params, args);
                return fn.pick.apply(this, params);
            }) :
            retVal = fn.map(this.pipedObjects, function(element){
                return element.obj;
            })

        utils.resetPipe();
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
    function retain(){

        var arg = arguments[1], dSet, diff, retVal = [];

        dSet = utils.isArray(arg) ? arg : this.pipeline.steps[this.pipeline.namedStep[arg]].pipedOutArgs[0];
        retVal = fn.intersection(arguments[0],dSet, true);
         
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

            g.v(10).out().step(function(){ 
                                var arr = []; 
                                fn.each(this, function(element){
                                  arr.push(element.obj.name)}); 
                                return arr; }).value();

    ***************************************************************************************************/
    function step() {
        var  retVal = [],
            tempArr = []
            ,args = slice.call(arguments, 1)
            ,func
            ,funcArgs = [];

        if(utils.isFunction(args[0])){
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);
            retVal = func.apply(arguments[0] ,funcArgs);
        } else {
            retVal = "Invalid function";
        }
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
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        utils.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

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
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        utils.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

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
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        utils.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

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
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        utils.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

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
            func,
            funcName,
            fromStep,
            toStep,
            self = this;

            if(utils.isString(backSteps)){
                backSteps = self.pipeline.steps.currentStep + 1 - self.pipeline.namedStep[backSteps];
            }
        
            while(iterations--){
                fromStep = self.pipeline.steps.currentStep + 1 - backSteps; //Need to add one to allow for loop step which is not counted
                toStep = self.pipeline.steps.currentStep;
                for(var j=fromStep; j<=toStep; j++){
                    func = self.pipeline.steps[j].func;
                    funcName = func.name === '_in'? 'in' : func.name;
                    this[funcName].apply(self, slice.call(self.pipeline.steps[j].pipedInArgs, 1));
                }
                
            }

        return self.pipeline.steps[self.pipeline.steps.currentStep].pipedOutArgs[0];        

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
        Clone output objects
        @name       clone()                 callable
        @returns    {Object Array}          emits an Object Array
        @example

        g.v(10).out().clone();

    ***************************************************************************************************/    
    function clone() {
        return JSON.parse(stringify());
    }



    //comparables
    comparable.eq = function(atts){
        return function(x){

            var length = atts.length;
            while(length){
                length -= 2;
                if(x.obj[atts[length]] === atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },

    comparable.neq = function (atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x.obj[atts[length]] !== atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },

    comparable.lt = function (atts){

        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x.obj[atts[length]] < atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },

    comparable.lte = function (atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x.obj[atts[length]] <= atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },

    comparable.gt = function (atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x.obj[atts[length]] > atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },

    comparable.gte = function (atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x.obj[atts[length]] >= atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },

    //Extras
    comparable.btwn = function (atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 3;
                if(x.obj[atts[length]] > atts[length + 1] && x.obj[atts[length]] < atts[length + 2]){
                    return true;
                }
            }
            return false;
        }
    },
    //args[0] -> 'keys','values'
    //TODO: Accept RegEx and Embedded Object Referencing
    //TODO: Test how dates would work
    //has All the listed properties
    comparable.has = function (atts){
        return function(x){
            var args = slice.call(atts, 1);
            return fn.intersection(fn[atts[0]](x.obj),args).length === args.length;
        }
    },
    //exclude All
    comparable.hasNot = function (atts){//not all
        return function(x){
            var args = slice.call(atts, 1);
            return fn.intersection(fn[atts[0]](x.obj),args).length !== args.length;
        }
    },
    //include Any
    comparable.hasAny = function (atts){//any
        return function(x){
            return !!fn.intersection(fn[atts[0]](x.obj),slice.call(atts, 1)).length;
        }
    },
    //exclude Any
    comparable.hasNotAny = function (atts){//not any
        return function(x){
            return !fn.intersection(fn[atts[0]](x.obj),slice.call(atts, 1)).length;
        }
    },


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
    Helios.prototype.in = _in;
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
    Helios.prototype.fork = fork;
    Helios.prototype.pin = pin;

    //Filter-Based Steps
    Helios.prototype.filter = filter;
    Helios.prototype.andFilter = filter;
    Helios.prototype.orFilter = orFilter;
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

    //Branch-Based Steps
    Helios.prototype.loop = loop;

    //Methods
    Helios.prototype.v = v;
    Helios.prototype.e = e;
    Helios.prototype.graph = graphUtils;

    //Misc
    Helios.prototype.clone = clone;

    // expose Helios
    // some AMD build optimizers, like r.js, check for specific condition patterns like the following:
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    	// Expose Helios to the global object even when an AMD loader is present in
    	// case Helios was injected by a third-party script and not intended to be
    	// loaded as a module..
    	window.Helios = Helios;

    	// define as an anonymous module so, through path mapping, it can be
    	// referenced.
    	define(function() {
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

