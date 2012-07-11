//var g = createGraph(jsonData)  
//graph.v(1).out().as('step').where('same',['keys','lang','name']).back('step')._().value()
//graph.v(1).out().aggregate('step').where('same',['keys','lang','name']).except('step')._().value()
//graph.v(1).out().aggregate('step').out().except('step')._().value()
//graph.v(1).out().aggregate('step').out().where('inclAny',['keys','lang']).except('step')._().value()
//;(function(window, undefined) {
;(function (window, undefined) {
    'use strict';

/** Detect free variable `exports` */
    var freeExports = typeof exports == 'object' && exports &&
            (typeof global == 'object' && global && global == global.global && (window = global), exports);

    var ArrayProto = Array.prototype,
        push = ArrayProto.push,
        pop = ArrayProto.pop,
        slice = ArrayProto.slice,
        shift = ArrayProto.shift,
        indexOf = ArrayProto.indexOf,
        concat = ArrayProto.concat,
        graph = {},
        fn = {},
        comparable = {},
        util = {},
        defaultPrototype = {},  /////////?????
        pipeline = {},
        pipedValue = [],
        unchainedFuncs = ["value", "stringify", "map"];

    Function.prototype.pipe = function () {
        var that = this;
        return function () {
            // New function runs the old function
            var retVal = [];
            push.call(retVal, pipedValue);

            fn.each(arguments, function (arg) {
                push.call(retVal, arg);
            });
            pipedValue = [];
            pipedValue = that.apply(this, retVal);
            return this;
        };
    };

    //pipe enable all Helios functions except end of pipe functions
    function pipe() {
        var func;
        for (func in this) {
            if (typeof this[func] == "function" && !fn.include(unchainedFuncs, func)) {
                this[func] = this[func].pipe();
            }
        }
        return this;
    }

    //Object constructor
    function Helios () {
       return pipe.call(this);
    }

    /**
       * The 'helios' function.
       *
       * @name helios
       * @constructor
       * @param 
       * @returns {Object} Returns a 'Helios' instance.
       */
    function helios() {
    	// allow invoking 'Helios' without the 'new' operator
    	return new Helios();
    }

    Helios.toString = function() { return "Helios"; };

            Helios.VERSION = '0.0.1';
            Helios.ENV = 'undefined' === typeof ENV ? {} : ENV;
            Helios.CONF = 'undefined' === typeof CONFIG ? {} : CONFIG;


    graph = {
    	
        vertices: {}
        ,edges: {}
    	//,v_index: {}
    	//,e_index: {}
    };

    pipeline = {
        steps: []
        ,namedStep: {}
    };


    Helios.newGraph = function(obj){ //Add conf param
    	//TODO: Cater for optional params
    	loadGraphSON(obj);
    	return helios();
    };

    function loadGraphSON(jsonData){
    		
    		var i, l, rows = [], vertex = {}, edge = {};
    		if(util.isUndefined(jsonData)) return;
    		if(util.isString(jsonData)){
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

    			for(i=0; i<l;i+=1) {
    				graph.vertices[rows[i]._id] = { 'obj': rows[i], 'type': 'vertex', 'outE': {}, 'inE': {} };
    			}
    		}
    		
    		//process edges
    		if(jsonData.edges){
    			rows = jsonData.edges;
    			l = rows.length; 

    			for(i=0; i<l;i+=1) {
    				edge = { 'obj': rows[i], 'type': 'edge', 'outV': {}, 'inV': {} };
    				
    				if(!graph.vertices[edge.obj._outV]){
    					//create a dummy vertex then go get it from server async
    					graph.vertices[edge.obj._outV] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
    					
    				}
    				vertex = graph.vertices[edge.obj._outV];
    				if(!vertex.outE[edge.obj._label]){
    					vertex.outE[edge.obj._label] = [];
    				}
    				edge.outV = vertex;
    				push.call(vertex.outE[edge.obj._label], edge);

    				if(!graph.vertices[edge.obj._inV]){
    					//create a dummy vertex then go get it from server async
    					graph.vertices[edge.obj._inV] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
    					
    				}
    				vertex = graph.vertices[edge.obj._inV];
    				if(!vertex.inE[edge.obj._label]){
    					vertex.inE[edge.obj._label] = [];
    				}
    				vertex = graph.vertices[edge.obj._inV];
    				edge.inV = vertex;
    				push.call(vertex.inE[edge.obj._label], edge);

                    graph.edges[edge.obj._id] = edge;
    			}
    		}
    		return true;
    };

    util.resetPipe = function (){
    	pipedValue = [];
    	pipeline.steps = [];
    	pipeline.namedStep = {};
    }

    fn.intersection = function (arr1, arr2){
        var r = [], o = {}, i;
        for (i = 0; i < arr2.length; i++) {
            o[arr2[i]] = true;
        }
        
        for (i = 0; i < arr1.length; i++) {
            if (!!o[arr1[i]]) {
                r.push(arr1[i]);
            }
        }
        return r;
    }

    fn.difference = function(arr1, arr2){
        var r = [], o = {}, i;
        for (i = 0; i < arr2.length; i++) {
            o[arr2[i]] = true;
        }
        
        for (i = 0; i < arr1.length; i++) {
            if (!o[arr1[i]]) {
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
        return util.toArray(o);
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
    fn.flatten = function(array, shallow){

        var result = [];
        if (!array) {
          return result;
        }
        var value,
            index = -1,
            length = array.length;

        while (++index < length) {
          value = array[index];
          if (util.isArray(value)) {
            push.apply(result, shallow ? value : fn.flatten(value));
          } else {
            result.push(value);
          }
        }
        return result;

    }

    fn.map = function(array, func){

        var len = array.length, val, retVal = [];
        
        if (!util.isFunction(func))
          throw new TypeError();
        
        for (var i = 0; i < len; i++)
        {
            val = array[i]; // in case func mutates this
            
              retVal.push(func.call(null, val));
        }
              
        return retVal;

    }

    fn.filter = function(array, func){

        var len = array.length, val, retVal = [];
        
        if (!util.isFunction(func))
          throw new TypeError();
        
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
        
        if (!util.isFunction(func))
          throw new TypeError();
        
        for (var i = 0; i < len; i++)
        {
            val = array[i]; // in case func mutates this
            func.call(null, val);
              //retVal.push(val);
        }
              
        //return retVal;

    }
    util.isArray = function(o){
        return Object.prototype.toString.call(o) === '[object Array]';
    }

    util.isString = function(o){
        return Object.prototype.toString.call(o) === '[object String]';
    }
    util.isNumber = function(o){
        return Object.prototype.toString.call(o) === '[object Number]';
    }
    util.isEmpty = function(o){
        for(var key in o){
            return !o[key];
        }
    }
    util.isFalsey = function(){}
    util.isFunction = function(o){
        return Object.prototype.toString.call(o) === '[object Function]';    
    }
    util.isUndefined = function(o){
        return Object.prototype.toString.call(o) === '[object Undefined]';
    }
    util.toArray = function(o){
        var k, r = [];
        for(k in o) {
            r.push(o[k]);
        }
        return r;        
    }
    



//object.hasOwnProperty(proName)

    /**
       * Extracts the wrapped value.
       *
       * @name value
       * @memberOf _
       * @category Chaining
       * @returns {Mixed} Returns the wrapped value.
       * @example
       *
       * _([1, 2, 3]).value();
       * // => [1, 2, 3]
       */
    function wrapperValue(){
    	var retVal = pipedValue;
    	util.resetPipe();
    	return retVal;
    }

    //TODO: Need a function that returns that obj in a format that allows lodash to perform its functions on the obj
    function stringify(){
        var retVal = [], args = arguments;
        if(!!pipedValue[0].obj){
    		return JSON.stringify(map.apply(null, args));
    	}
    	retVal = pipedValue;
    	util.resetPipe();
    	return JSON.stringify(retVal);
    }

    function v() {

        var retVal = [], 
        args = slice.call(arguments, 1),
        length = args.length;
        while(length){
        	length--;
            push.call(retVal, graph.vertices[args[length]]);
        }
        pipeline.steps.push(retVal);
        return retVal;

    }


    function e() {
        var retVal = [], length, args = slice.call(arguments, 1);
        length = args.length;
        while(length){
            length--;
            push.call(retVal, graph.edges[args[length]]);
        }
        pipeline.steps.push(retVal);
        return retVal;
    }


    function id() {
        var retVal = [];
        retVal = fn.map(arguments[0], function(element, key, list) {
            return element.obj._id;
        });
        pipeline.steps.push(retVal);
        return retVal;
    }

    function label() {

        var retVal = [];

        retVal = fn.map(arguments[0], function(element, key, list) {
            return element.obj._label;
        });

        pipeline.steps.push(retVal);
        return retVal;
    }

    function out() {

        var retVal = [],
            args = slice.call(arguments, 1);

        fn.each(arguments[0], function(vertex, key, list) {
            // if(!vertex._outE){
            //  //Get vertex edges and load from the service
            //  Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
            // }
            if (!util.isEmpty(vertex.outE)) {
                var value = !!args.length ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge.inV);
                });
            }
        });

        push.call(pipeline.steps,retVal);
        return retVal;
    }

    function outV(){
        var retVal = fn.map(arguments[0], function(edge, key, list) {
        	return edge.outV;
        });
        pipeline.steps.push(retVal);
        return retVal;
    }

    function in_() {

        var retVal = [],
            args = slice.call(arguments, 1);

        fn.each(arguments[0], function(vertex, key, list) {
        	// if(!vertex._outE){
        	// 	//Get vertex edges and load from the service
        	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
        	// }
            if (!util.isEmpty(vertex.inE)) {
                var value = !!args.length ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge.outV);
                });
            }
        });

        pipeline.steps.push(retVal);
        return retVal;
    }

    function inV(){
        var retVal = fn.map(arguments[0], function(edge, key, list) {
            return edge.inV;
        });
        pipeline.steps.push(retVal);
        return retVal;
    }

    function both() {

        var retVal = [],
            args = slice.call(arguments, 1);

        fn.each(arguments[0], function(vertex, key, list) {
        	// if(!vertex._outE){
        	// 	//Get vertex edges and load from the service
        	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
        	// }
            if (!util.isEmpty(vertex.outE)) {
                var value = !!args.length ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge.inV);
                });
            }
         //    if(!vertex.inE){
        	// 	//Get vertex edges and load from the service
        	// 	//Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
        	// }
            if (!util.isEmpty(vertex.inE)) {
                var value = !!args.length ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge.outV);
                });
            }
        });
    	
        pipeline.steps.push(retVal);
        return retVal;
    }

    function bothV() {
        var retVal = [];

        fn.each(arguments[0], function(edge, key, list) {


                    push.call(retVal, edge.inV);

                    push.call(retVal, edge.outV);
       });
        
        pipeline.steps.push(retVal);
        return retVal;

    	// var retVal = fn.map(arguments[0], function(edge, key, list) {
     //        return edge.outV;
     //    });
     //    graph.step.push(retVal);
     //    return retVal;
    }

    function outE() {

        var retVal = [],
            args = slice.call(arguments, 1);

        fn.each(arguments[0], function(vertex, key, list) {
        	// if(!vertex._outE){
        	// 	//Get vertex edges and load from the service
        	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
        	// }	    	
            if (!util.isEmpty(vertex.outE)) {
                var value = !!args.length ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge);
                });
            }
        });

        pipeline.steps.push(retVal);
        return retVal;

    }

    function inE() {

        var retVal = [],
            args = slice.call(arguments, 1);

        fn.each(arguments[0], function(vertex, key, list) {
        	// if(!vertex._inE){
        	// 	//Get vertex edges and load from the service
        	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":15,"_type":"edge","_outV":6,"_inV":vtex._id,"_label":"created"}]});
        	// }	    	
            if (!util.isEmpty(vertex.inE)) {
                var value = !!args.length ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge);
                });
            }
        });

        pipeline.steps.push(retVal);
        return retVal;
    }

    function bothE() {

    	var retVal = [],
            args = slice.call(arguments, 1);

        fn.each(arguments[0], function(vertex, key, list) {
        	
        	// if(!vertex._outE){
        	// 	//Get vertex edges and load from the service
        	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
        	// }	    	
            if (!util.isEmpty(vertex.outE)) {
                var value = !!args.length ? fn.pick(vertex.outE, args) : vertex.outE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge);
                });
            }
         //    if(!vertex.inE){
        	// 	//Get vertex edges and load from the service
        	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
        	// }	    	
            if (!util.isEmpty(vertex.inE)) {
                var value = !!args.length ? fn.pick(vertex.inE, args) : vertex.inE;
                fn.each(fn.flatten(fn.values(value)), function(edge) {
                    push.call(retVal, edge);
                });
            }
        });

        pipeline.steps.push(retVal);
        return retVal;
    }

    function V() {
        var retVal = [];

        retVal = util.toArray(graph.vertices);
        pipeline.steps.push(retVal);

        return retVal;
    }

    function E() {
        var retVal = [];

        retVal = util.toArray(graph.edges);
        pipeline.steps.push(retVal);

        return retVal;
    }

    function __(){
    	pipeline.steps.push(arguments);
        return arguments[0]; 
    }

    //TODO: Need to look at aggregate to apply {closure}
    function aggregate(){
        var retVal = arguments[0],
            args = slice.call(arguments, 1), func, funcArgs = [];

            if(!!args.length){
                //if passwd in argument is an Array populate it and move on else store as a named pipe 
                util.isArray(args[0]) ? push.apply(args[0],arguments[0]) : pipeline.namedStep[args[0]] = pipeline.steps.length;

                if(util.isFunction(args[1]) || util.isFunction(args[0])){
                    if(util.isFunction(args[1])) {
                        func = args[1];
                        args.shift();
                    }
                    else { 
                        func = args[0];
                    }
                    funcArgs = slice.call(args, 1);
                    retVal = func.apply(arguments[0] ,funcArgs);
                }           
            }
        pipeline.steps.push(retVal);
        return retVal;
    }

    //function andFilter() {}

    function as(){

        pipeline.namedStep[arguments[1]] = pipeline.steps.length;
        return arguments[0];
    }

    function back(){
        var arg = arguments[1],
            length = pipeline.steps.length, steps = 0;
        if(util.isUndefined(arg))
        {
            arg = 1;
        }
        if(util.isString(arg)){
            if(util.isUndefined(pipeline.namedStep[arg])){
                //raise error
                // graph.tap(function(){
                //     alert('Error!! - No step called "' + arg + '"');
                // });
                return;
            }
            arg = length - pipeline.namedStep[arg];
        }

        steps = arg > length ? length - 1 : arg;
        while(steps){
            pipeline.steps.pop();
            steps--;
        }
        return slice.call(pipeline.steps, -1);
    }

    //function cap() {}

    function copySplit() {}

    function except(){

        var arg = arguments[1], dSet, diff, retVal = [];

        dSet = pipeline.steps[pipeline.namedStep[arg] - 1];
        retVal = fn.difference(arguments[0],dSet);
        pipeline.steps.push(retVal);
        return retVal;
    }

    function exhaustMerge() {}
    function fairMerge() {}
    function sideEffect() {}
    //function transform() {}

    function filter(){
        var  retVal = []
            ,records = arguments[0]
            ,args = slice.call(arguments, 1)
            ,func
            ,funcArgs = []
            ,funcParam = []
            ,argLen;


        if(util.isFunction(args[0])){
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);

            argLen = funcArgs.length;

            for(var i=0; i < argLen; i++){
                funcParam.push(pipeline.steps[pipeline.namedStep[funcArgs[i]]-1]);
            }
            retVal = func.apply(records ,funcParam);
            
        } else {

            argLen = args.length;

            while(argLen){
                argLen -= 2;
                retVal = fn.filter(records, comparable[args[argLen]](args[argLen + 1]));
            }
        }
        
        pipeline.namedStep.filter = pipeline.steps.length;    
        pipeline.steps.push(retVal);
        return retVal;
    }

    //function gather() {}
    function groupCount() {}
    function ifThenElse() {}
    function loop() {}

    function map(){
    	var retVal, params = [], args = arguments;
        //if args passed need to do fn.pick()
    	!!args.length ? 
    		retVal = fn.map(pipedValue, function(element){
    			 params = [];
    			 push.call(params, element.obj);
    			 push.apply(params, args);
    			return fn.pick.apply(this, params);
    		}) :
    		retVal = fn.map(pipedValue, function(element){
    			return element.obj;
    		})

    	util.resetPipe();
        return retVal;
    }

    //function memoize() {}
    //function optional() {}

    function orFilter() {
        var  retVal = []
            ,lastStep = arguments[0]
            ,args = slice.call(arguments, 1)
            ,filterStep = pipeline.steps[pipeline.namedStep.filter - 1]
            ,func
            ,funcArgs = []
            ,funcParam = []
            ,argLen
            ,ids = [];

        if(util.isFunction(args[0])){
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);

            argLen = funcArgs.length;

            for(var i=0; i < argLen; i++){
                funcParam.push(pipeline.steps[pipeline.namedStep[funcArgs[i]]-1]);
            }

            retVal = func.apply(filterStep ,funcParam);
        } else {

            argLen = args.length;
            while(argLen){
                argLen -= 2;
                retVal = fn.filter(filterStep, comparable[args[argLen]](args[argLen + 1]));
            }

        }

        for (var i = 0, len = retVal.length; i < len; i++){
            push.call(ids,retVal[i].obj._id);
        }
        ids = fn.unique(ids);

        for (var i = 0, len = lastStep.length; i < len; i++){
            if(!fn.include(ids, lastStep[i].obj._id)){
                push.call(retVal, lastStep[i]);
            }
        }
        

        pipeline.steps.push(retVal);
        return retVal;    
    }
    function paths() {}
    function propertyFilter() {}
    //function random() {}

    function retain(){

        var arg = arguments[1], dSet, diff, retVal = [];

        dSet = pipeline.steps[pipeline.namedStep[arg] - 1];
        retVal = fn.intersection(arguments[0],dSet);
        pipeline.steps.push(retVal);
        return retVal;
    }

    //function scatter() {}

    function step() {
        var  retVal
            ,args = slice.call(arguments, 1)
            ,prevStep = slice.call(pipeline.steps, -1)
            ,func
            ,funcArgs = []
            ,argLen;

        if(util.isFunction(args[0])){
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);
            retVal = func.apply(arguments[0] ,funcArgs)
        } else {
            retVal = "Invalid function";
        }
        
        push.call(pipeline.steps, retVal);
        return retVal;    

    }

    function reduce() {}
    //function table() {}
    function uniqueObject() {}
    function uniquePath() {}

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
            return fn.intersection(_[atts[0]](x.obj),args).length === args.length;
        }
    },
    //exclude All
    comparable.hasNot = function (atts){//not all
        return function(x){
            var args = slice.call(atts, 1);
            return fn.intersection(_[atts[0]](x.obj),args).length !== args.length;
        }
    },
    //include Any
    comparable.hasAny = function (atts){//any
        return function(x){
            return !!fn.intersection(_[atts[0]](x.obj),slice.call(atts, 1)).length;
        }
    },
    //exclude Any
    comparable.hasNotAny = function (atts){//not any
        return function(x){
            return !fn.intersection(_[atts[0]](x.obj),slice.call(atts, 1)).length;
        }
    },
    //exact element match
    comparable.match = function (atts){//not any

        return function(x){
            var args = slice.call(atts, 1);
            //TODO: This about whether _type should be in obj
            //TODO: Allow for user specified _id ie. config
            push.apply(args,['_type','_id']);
            return !fn.difference(_[atts[0]](x.obj),args).length;
        }
    }


    Helios.prototype._ = __;
    Helios.prototype.map = map;
    Helios.prototype.id = id;
    Helios.prototype.label = label;

    Helios.prototype.v = v;
    Helios.prototype.e = e;
    Helios.prototype.V = V;
    Helios.prototype.E = E;
    Helios.prototype.out = out;
    Helios.prototype.in = in_;
    Helios.prototype.outV = outV;
    Helios.prototype.outE = outE;
    Helios.prototype.inV = inV;
    Helios.prototype.inE = inE;
    Helios.prototype.both = both;
    Helios.prototype.bothV = bothV;
    Helios.prototype.bothE = bothE;

    Helios.prototype.filter = filter;
    Helios.prototype.andFilter = filter;
    Helios.prototype.orFilter = orFilter;

    Helios.prototype.as = as;
    Helios.prototype.back = back;
    Helios.prototype.aggregate = aggregate;
    Helios.prototype.store = aggregate;
    Helios.prototype.except = except;
    Helios.prototype.retain = retain;

    Helios.prototype.stringify = stringify;
    Helios.prototype.value = wrapperValue;
    Helios.prototype.step = step;
    Helios.prototype.transform = step;
    Helios.prototype.gather = step;

    Helios.prototype.loadGraphSON = loadGraphSON;

    //Helios.prototype.fn = fn;
    	
    // From Lo-Dash >>>
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

	//<<< From Lo-Dash

    //window.Helios = Helios;

}(this));

