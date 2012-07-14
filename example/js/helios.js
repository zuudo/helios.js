//var g = createGraph(jsonData)  
//graph.v(1).out().as('step').where('same',['keys','lang','name']).back('step')._().value()
//graph.v(1).out().aggregate('step').where('same',['keys','lang','name']).except('step')._().value()
//graph.v(1).out().aggregate('step').out().except('step')._().value()
//graph.v(1).out().aggregate('step').out().where('inclAny',['keys','lang']).except('step')._().value()
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
        graph = { 'vertices': {}, 'edges': {} }, //,v_index: {} ,e_index: {}
        fn = {},
        comparable = {},
        util = {},
        pipeline = { 'steps': { 'currentStep': 0 }, 'namedStep': {} },
        pipedObjects = [],
        lastStepFuncs = ['value', 'stringify', 'map', 'clone', 'path'];

//pipeline = pipelinePrototype;
    Function.prototype.pipe = function () {
        var that = this;
        return function () {
            var pipedArgs = [],
            isStep = !fn.include(['as', 'back', 'loop', 'groupCount', 'groupBy', 'groupSum'], that.name);

            push.call(pipedArgs, pipedObjects);
            push.apply(pipedArgs, arguments);
            
            if(isStep){
                pipeline.steps[pipeline.steps.currentStep += 1] = { 'pipedInArgs': pipedArgs, 'func': that, 'pipedOutArgs':[] };
            }
            //New piped Objects to be passed to the next step
            pipedObjects = that.apply(this, pipedArgs);
            if(isStep && pipeline.steps.currentStep !== 0){
                  push.call(pipeline.steps[pipeline.steps.currentStep].pipedOutArgs, pipedObjects);
            }
            return this;
        };
    };

    //pipe enable all Helios functions except end of pipe functions
    function pipe() {
        var func;
        for (func in this) {
            if (typeof this[func] == "function" && !fn.include(lastStepFuncs, func)) {
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
    				graph.vertices[rows[i]._id] = { 'obj': rows[i], 'type': 'vertex', 'outE': {}, 'inE': {}, 'path': {} };
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
    					graph.vertices[edge.obj._outV] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {}, 'path': {} };
    					
    				}
    				vertex = graph.vertices[edge.obj._outV];
    				if(!vertex.outE[edge.obj._label]){
    					vertex.outE[edge.obj._label] = [];
    				}
    				edge.outV = vertex;
    				push.call(vertex.outE[edge.obj._label], edge);

    				if(!graph.vertices[edge.obj._inV]){
    					//create a dummy vertex then go get it from server async
    					graph.vertices[edge.obj._inV] = { 'obj': {}, 'type': 'vertex', 'outE': {}, 'inE': {}, 'path': {} };
    					
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
    	pipedObjects = [];
        pipeline = {};
        pipeline = {
            'steps': {
                'currentStep': 0
            },
            'namedStep': {}            
        };
    }

    util.toArray = function(o){
        var k, r = [];
        for(k in o) {
            r.push(o[k]);
        }
        return r;        
    }
    
    util.isArray = function(o){
        return toString.call(o) === '[object Array]';
    }

    util.isString = function(o){
        return toString.call(o) === '[object String]';
    }
    util.isNumber = function(o){
        return toString.call(o) === '[object Number]';
    }
    
    util.isDate = function(o){
        return toString.call(o) === '[object Date]';
    }
    
    util.isEmpty = function(o){
        for(var key in o){
            return !o[key];
        }
    }

    util.isFunction = function(o){
        return toString.call(o) === '[object Function]';    
    }
    util.isNull = function(o){
        return toString.call(o) === '[object Null]';
    }

    util.isUndefined = function(o){
        return toString.call(o) === '[object Undefined]';
    }
/*    util.isFalsey = function(o){
        return  !!!o;
    }
    util.isTruthy = function(o){
        return  !!o;
    }*/
    
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
    fn.uniqueObject = function(array){

        var o = {}, i, l = array.length, r = [];
        for(i=0; i<l;i+=1) o[array[i].obj._id] = array[i];
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
    fn.groupBy = function(array, o, props){

        var retVal = arguments[0],
            i, j,
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
        }
    }

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
    function pipedValue(){
    	var retVal = pipedObjects;
    	util.resetPipe();
    	return retVal;
    }

    //TODO: Need a function that returns that obj in a format that allows lodash to perform its functions on the obj
    function stringify(){
        var retVal = [], args = arguments;
        if(!!pipedObjects[0] && !!pipedObjects[0].obj){
    		return JSON.stringify(map.apply(null, args));
    	}
    	retVal = pipedObjects;
    	util.resetPipe();
    	return JSON.stringify(retVal);
    }

    function path() {


        var retVal = [], stepPaths, stepsObj = pipeline.steps, retVal = [], o={}, edge, edgeStr, i, j, stepRecs, len;

        for(i = 1; i <= stepsObj.currentStep; i++){
            stepRecs = stepsObj[i].pipedOutArgs[0];
            stepPaths = o['step '+i] = [];
            for(j=0, len = stepRecs.length; j<len;j++){
                if(stepRecs[j].type === 'vertex'){
                    push.call(stepPaths,'v['+stepRecs[j].obj._id+']');
                } else {
                    edge = stepRecs[j].obj;
                    edgeStr = 'v['+ edge._outV + '], e[' + edge._id + '][' + edge._outV + '-' + edge._label + '->' + edge._inV + '], v[' + edge._inV +']';
                    push.call(stepPaths,edgeStr);
                }
            }
        }
        push.call(retVal,JSON.stringify(o));
        push.apply(retVal, pipedObjects);
        util.resetPipe();
        return retVal;
    }

    function v() {

        var retVal = [], 
        args = slice.call(arguments, 1),
        length = args.length;
        while(length){
        	length--;
            push.call(retVal, graph.vertices[args[length]]);
        }
         
        return retVal;

    }


    function e() {
        var retVal = [], length, args = slice.call(arguments, 1);
        length = args.length;
        while(length){
            length--;
            push.call(retVal, graph.edges[args[length]]);
        }
         
        return retVal;
    }


    function id() {
        var retVal = [];
        retVal = fn.map(arguments[0], function(element, key, list) {
            return element.obj._id;
        });
         
        return retVal;
    }

    function label() {

        var retVal = [];

        retVal = fn.map(arguments[0], function(element, key, list) {
            return element.obj._label;
        });

         
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
         
        return retVal;
    }

    function outV(){
        var retVal = fn.map(arguments[0], function(edge, key, list) {
        	return edge.outV;
        });
         
        return retVal;
    }

     function _in () {

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

         
        return retVal;
    }

    function inV(){
        var retVal = fn.map(arguments[0], function(edge, key, list) {
            return edge.inV;
        });
         
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
    	
         
        return retVal;
    }

    function bothV() {
        var retVal = [];

        fn.each(arguments[0], function(edge, key, list) {
            push.call(retVal, edge.inV);
            push.call(retVal, edge.outV);
       });
       return retVal;
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

         
        return retVal;
    }

    function V() {
        var retVal = [];

        retVal = util.toArray(graph.vertices);
         

        return retVal;
    }

    function E() {
        var retVal = [];

        retVal = util.toArray(graph.edges);
         

        return retVal;
    }

    //fill array with objects emitted from this step
    function store(){
        var retVal = arguments[0],
            args = slice.call(arguments, 1), func, funcArgs = [];

            if(!!args.length){
                //if pass an Array populate it and move on else store as a named pipe 
                util.isArray(args[0]) ? push.apply(args[0],arguments[0]) : pipeline.namedStep[args[0]] = pipeline.steps.currentStep;

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
         
        return retVal;
    }

    function as(){

        pipeline.namedStep[arguments[1]] = pipeline.steps.currentStep;
        return arguments[0];
    }

    function back(){
        var backSteps = arguments[1],
            stepBackTo;
        
        
            if(util.isString(backSteps)){
                if(util.isUndefined(pipeline.namedStep[backSteps])){
                    //raise error
                    // graph.tap(function(){
                    //     alert('Error!! - No step called "' + arg + '"');
                    // });
                    return;
                }
                stepBackTo = pipeline.namedStep[backSteps];
            } else {
                stepBackTo = pipeline.steps.currentStep - backSteps;
                
            }

        return pipeline.steps[stepBackTo].pipedOutArgs[0];
    }

    function except(){

        var arg = arguments[1], dSet, diff, retVal = [];

        dSet = pipeline.steps[pipeline.namedStep[arg]];
        retVal = fn.difference(arguments[0],dSet);
         
        return retVal;
    }


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
                funcParam.push(pipeline.steps[pipeline.namedStep[funcArgs[i]]].pipedInArgs[0]);
            }
            retVal = func.apply(records ,funcParam);
            
        } else {

            argLen = args.length;

            while(argLen){
                argLen -= 2;
                retVal = fn.filter(records, comparable[args[argLen]](args[argLen + 1]));
            }
        }
        
        pipeline.namedStep.filter = pipeline.steps.currentStep;    
         
        return retVal;
    }

    function orFilter() {
        var  retVal = []
            ,prevObjs = arguments[0]
            ,args = slice.call(arguments, 1)
            ,filterObjs = pipeline.steps[pipeline.namedStep.filter].pipedInArgs[0]
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
                funcParam.push(pipeline.steps[pipeline.namedStep[funcArgs[i]].pipedInArgs[0]]);
            }

            retVal = func.apply(filterObjs ,funcParam);
        } else {

            argLen = args.length;
            while(argLen){
                argLen -= 2;
                retVal = fn.filter(filterObjs, comparable[args[argLen]](args[argLen + 1]));
            }

        }

        for (var i = 0, len = retVal.length; i < len; i++){
            push.call(ids,retVal[i].obj._id);
        }
        ids = fn.unique(ids);

        for (var i = 0, len = prevObjs.length; i < len; i++){
            if(!fn.include(ids, prevObjs[i].obj._id)){
                push.call(retVal, prevObjs[i]);
            }
        }
         
        return retVal;    
    }

    function map(){
        var retVal, params = [], args = arguments;
        //if args passed need to do fn.pick()
        !!args.length ? 
            retVal = fn.map(pipedObjects, function(element){
                 params = [];
                 push.call(params, element.obj);
                 push.apply(params, args);
                return fn.pick.apply(this, params);
            }) :
            retVal = fn.map(pipedObjects, function(element){
                return element.obj;
            })

        util.resetPipe();
        return retVal;
    }

    function retain(){

        var arg = arguments[1], dSet, diff, retVal = [];

        dSet = pipeline.steps[pipeline.namedStep[arg]];
        retVal = fn.intersection(arguments[0],dSet);
         
        return retVal;
    }

    function step() {
        var  retVal
            ,args = slice.call(arguments, 1)
            ,func
            ,funcArgs = [];

        if(util.isFunction(args[0])){
            func = args[0];
            funcArgs = fn.flatten(slice.call(args, 1),true);
            retVal = func.apply(arguments[0] ,funcArgs)
        } else {
            retVal = "Invalid function";
        }
        return retVal;    

    }

    //var t = {};
    //g.v(1).out('knows').groupCount(t,['salary','age']).value()
    //to aggregate call this function multiple times passing in same variable
    //g.v(1).out('knows').groupCount(t,['salary','age']).in.groupCount(t,['salary','age']).value()
    function groupCount() {
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        util.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

        return fn.countBy(arguments[0], objVar, params);
    }

    //var t = {};
    //g.v(1).out('knows').groupSum(t,['salary','age']).value()
    //to aggregate call this function multiple times passing in same variable
    //g.v(1).out('knows').groupCount(t,['salary','age']).in.groupSum(t,['salary','age']).value()
    function groupSum() {
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        util.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

        return fn.sumBy(arguments[0], objVar, params);
    }

    //var t = {};
    //g.v(1).out('knows').groupBy(t,['salary','age']).value()
    function groupBy() {
        var args = fn.flatten(slice.call(arguments,1)),
            objVar= args[0], params;
        
        util.isString(args[0]) ? objVar = slice.call(args) : params = slice.call(args,1);

        return fn.groupBy(arguments[0], objVar, params);        
    }

    //function ifThenElse() {}
    //loop(back Step, number of iterations i.e. how many times you would like to see those steps);
    function loop() {

        var backSteps = arguments[1],
            iterations = arguments[2] - 1, //Reduce the iterations because one has already been done
            func,
            funcName,
            fromStep,
            toStep;
        
            while(iterations--){
                fromStep = pipeline.steps.currentStep + 1 - backSteps; //Need to add one to allow for loop step which is not counted
                toStep = pipeline.steps.currentStep;
                for(var j=fromStep; j<=toStep; j++){
                    func = pipeline.steps[j].func;
                    funcName = func.name === '_in'? 'in' : func.name;
                    this[funcName].apply(pipeline.steps[j].pipedInArgs[0], slice.call(pipeline.steps[j].pipedInArgs, 1));
                }
                
            }

        return pipeline.steps[pipeline.steps.currentStep].pipedOutArgs[0];        

    }
    
    function dedup() {
        var  retVal = fn.uniqueObject(arguments[0]);
        return retVal;  
    }

    function clone() {
        return JSON.parse(stringify());
    }

    //function sideEffect() {}
    //function transform() {}

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
    Helios.prototype.path = path;
    Helios.prototype.stringify = stringify;
    Helios.prototype.value = pipedValue;

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
    Helios.prototype.as = as;
    //Helios.prototype.aggregate = aggregate;
    Helios.prototype.store = store;
    Helios.prototype.groupCount = groupCount;
    Helios.prototype.groupBy = groupBy;
    Helios.prototype.groupSum = groupSum;

    //Branch-Based Steps
    Helios.prototype.loop = loop;
    //Helios.prototype.ifThenElse = ifThenElse;

    //Methods
    Helios.prototype.v = v;
    Helios.prototype.e = e;
    Helios.prototype.loadGraphSON = loadGraphSON;

    //Misc
    Helios.prototype.clone = clone;

    /*Not implemented*/
    //function _(){}
    //function cap() {}
    //function copySplit() {}
    //function exhaustMerge() {}
    //function fairMerge() {}
    //function gather() {}
    //function memoize() {}
    //function optional() {}
    //function propertyFilter() {}
    //function random() {}
    //function scatter() {}
    //function reduce() {}
    //function table() {}
    //function uniquePath() {}


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

