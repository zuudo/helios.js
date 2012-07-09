//var g = _.createGraph(jsonData)  
//graph.v(1).out().as('step').where('same',['keys','lang','name']).back('step')._().value()
//graph.v(1).out().aggregate('step').where('same',['keys','lang','name']).except('step')._().value()
//graph.v(1).out().aggregate('step').out().except('step')._().value()
//graph.v(1).out().aggregate('step').out().where('inclAny',['keys','lang']).except('step')._().value()

;(function(window) {
    'use strict';

/** Detect free variable `exports` */
var freeExports = typeof exports == 'object' && exports &&
    (typeof global == 'object' && global && global == global.global && (window = global), exports);

Helios.VERSION = '0.0.1';
Helios.ENV = 'undefined' === typeof ENV ? {} : ENV;
Helios.CONF = 'undefined' === typeof CONFIG ? {} : CONFIG;

var ArrayProto = Array.prototype,
	push = ArrayProto.push,
	slice = ArrayProto.slice;

var _wrappedValue = [];
/**
   * The `helios` function.
   *
   * @name Helios
   * @constructor
   * @param 
   * @returns {Object} Returns a `Helios` instance.
   */
function helios() {
	// allow invoking `Helios` without the `new` operator
	return new Helios();
}

function Helios() {
	return chain.call(this);
}

Helios.toString = function() { return "Helios"; };

var graph = {
	
    vertices: {}
    ,edges: {}
	//,v_index: {}
	//,e_index: {}
};

var _pipe = {
    steps: []
    ,namedStep: {}
};

Helios.newGraph = function(obj){ //Add conf param
	//TODO: Cater for optional params
	db.loadGraphJson(obj);
	return helios();
};

var db = {
	//Make Async
	loadGraphJson: function(jsonData){
		
		var i, l, rows = [], vertex = {}, edge = {};
		
		if(_.isUndefined(jsonData)) return;

		if(_.isString(jsonData)){
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
	}
};

Function.prototype.chain = function() {
	var that = this;
	return function() {
	    // New function runs the old function
	    var retVal = [];
	    push.call(retVal, _wrappedValue);

	    _.each(arguments, function(arg){
	    	push.call(retVal ,arg);
	    });
	    _wrappedValue = [];		
	    _wrappedValue = that.apply(this, retVal);
		return this;
	}
};

var returnFuncs = ["value", "stringify", "map"];

//Chain enable all Helios functions except value()
function chain() {
    for (var fn in this) {
	    if (typeof this[fn] == "function" && !_.include(returnFuncs, fn)) {
	        this[fn] = this[fn].chain();
	    }
    }
    return this;
}

function cleanUp(){
	_wrappedValue = [];
	_pipe.steps = [];
	_pipe.namedStep = {};
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
function wrapperValue() {
	var retVal = _wrappedValue;
	cleanUp();
	return retVal;
}

//TODO: Need a function that returns that obj in a format that allows lodash to perform its functions on the obj
function stringify(){
    var retVal = [];
    if(!!_wrappedValue[0].obj){
    	push.call(retVal,_wrappedValue);
		cleanUp();
		return JSON.stringify(map.apply(this,retVal));
	}
	retVal = _wrappedValue;
	cleanUp();
	return JSON.stringify(retVal);
}

function v() {

    var retVal = [], length, args = _.rest(arguments);
    length = args.length;
    while(length){
    	length--;
        push.call(retVal, graph.vertices[args[length]]);
    }
    _pipe.steps.push(retVal);
    return retVal;

}


function e() {
    var retVal = [], length, args = _.rest(arguments);
    length = args.length;
    while(length){
        length--;
        push.call(retVal, graph.edges[args[length]]);
    }
    _pipe.steps.push(retVal);
    return retVal;
}


function id() {
    var retVal = [];
    retVal = _.map(arguments[0], function(element, key, list) {
        return element.obj._id;
    });
    _pipe.steps.push(retVal);
    return retVal;
}

function label() {

    var retVal = [];

    retVal = _.map(arguments[0], function(element, key, list) {
        return element.obj._label;
    });

    _pipe.steps.push(retVal);
    return retVal;
}

function out() {

    var retVal = [],
        args = _.rest(arguments);

    _.each(arguments[0], function(vertex, key, list) {
    	// if(!!!vertex._outE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }
        if (!_.isEmpty(vertex.outE)) {
            var value = !!args.length ? _.pick(vertex.outE, args) : vertex.outE;
           	_.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge.inV);
            });
        }
    });

    _pipe.steps.push(retVal);
    return retVal;
}

function outV(){
    var retVal = _.map(arguments[0], function(edge, key, list) {
    	return edge.outV;
    });
    _pipe.steps.push(retVal);
    return retVal;
}

function in_() {

    var retVal = [],
        args = _.rest(arguments);

    _.each(arguments[0], function(vertex, key, list) {
    	// if(!!!vertex._outE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }
        if (!_.isEmpty(vertex.inE)) {
            var value = !!args.length ? _.pick(vertex.inE, args) : vertex.inE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge.outV);
            });
        }
    });

    _pipe.steps.push(retVal);
    return retVal;
}

function inV(){
    var retVal = _.map(arguments[0], function(edge, key, list) {
        return edge.inV;
    });
    _pipe.steps.push(retVal);
    return retVal;
}

function both() {

    var retVal = [],
        args = _.rest(arguments);

    _.each(arguments[0], function(vertex, key, list) {
    	// if(!!!vertex._outE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }
        if (!_.isEmpty(vertex.outE)) {
            var value = !!args.length ? _.pick(vertex.outE, args) : vertex.outE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge.inV);
            });
        }
     //    if(!!!vertex.inE){
    	// 	//Get vertex edges and load from the service
    	// 	//Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }
        if (!_.isEmpty(vertex.inE)) {
            var value = !!args.length ? _.pick(vertex.inE, args) : vertex.inE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge.outV);
            });
        }
    });
	
    _pipe.steps.push(retVal);
    return retVal;
}

function bothV() {
    var retVal = [];

    _.each(arguments[0], function(edge, key, list) {


                push.call(retVal, edge.inV);

                push.call(retVal, edge.outV);
   });
    
    _pipe.steps.push(retVal);
    return retVal;

	// var retVal = _.map(arguments[0], function(edge, key, list) {
 //        return edge.outV;
 //    });
 //    graph.step.push(retVal);
 //    return retVal;
}

function outE() {

    var retVal = [],
        args = _.rest(arguments);

    _.each(arguments[0], function(vertex, key, list) {
    	// if(!!!vertex._outE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }	    	
        if (!_.isEmpty(vertex.outE)) {
            var value = !!args.length ? _.pick(vertex.outE, args) : vertex.outE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge);
            });
        }
    });

    _pipe.steps.push(retVal);
    return retVal;

}

function inE() {

    var retVal = [],
        args = _.rest(arguments);

    _.each(arguments[0], function(vertex, key, list) {
    	// if(!!!vertex._inE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":15,"_type":"edge","_outV":6,"_inV":vtex._id,"_label":"created"}]});
    	// }	    	
        if (!_.isEmpty(vertex.inE)) {
            var value = !!args.length ? _.pick(vertex.inE, args) : vertex.inE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge);
            });
        }
    });

    _pipe.steps.push(retVal);
    return retVal;
}

function bothE() {

	var retVal = [],
        args = _.rest(arguments);

    _.each(arguments[0], function(vertex, key, list) {
    	
    	// if(!!!vertex._outE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }	    	
        if (!_.isEmpty(vertex.outE)) {
            var value = !!args.length ? _.pick(vertex.outE, args) : vertex.outE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge);
            });
        }
     //    if(!!!vertex.inE){
    	// 	//Get vertex edges and load from the service
    	// 	Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
    	// }	    	
        if (!_.isEmpty(vertex.inE)) {
            var value = !!args.length ? _.pick(vertex.inE, args) : vertex.inE;
            _.each(_.flatten(_.values(value)), function(edge) {
                push.call(retVal, edge);
            });
        }
    });

    _pipe.steps.push(retVal);
    return retVal;
}

function V() {
    var retVal = [];

    retVal = _.toArray(graph.vertices);
    _pipe.steps.push(retVal);

    return retVal;
}

function E() {
    var retVal = [];

    retVal = _.toArray(graph.edges);
    _pipe.steps.push(retVal);

    return retVal;
}

// //shorthand for uniq().prop().stringify()
function __(){
	_pipe.steps.push(arguments);
    return arguments[0]; 
}

//TODO: Need to look at aggregate to apply {closure}
function aggregate(){
    var //retVal = [],
        args = _.rest(arguments);

        if(!!args){

            _.isArray(args[0]) ? push.apply(args[0],arguments[0]) : _pipe.namedStep[args[0]] = _pipe.steps.length;

            // if(_.isFunction(args[1])){
            //     func = args[1];
            //     funcArgs = _.rest(args);

            //     argLen = funcArgs.length;

            //     for(var i=0; i < argLen; i++){
            //         funcParam.push(graph.step[graph.namedStep[funcArgs[i]]-1]);
            //     }

            //     _.each(filterStep, function(element){
            //         if(func.apply(element ,funcParam)){
            //             push.call(retVal,element);
            //         }
            //     });
            // }           
        }






    //     var temp = graph.step;
    // retVal = _.uniq(_.flatten(graph.step));

    //return retVal;
    return arguments[0];
}

//function andFilter() {}

function as(){

    _pipe.namedStep[arguments[1]] = _pipe.steps.length;
    return arguments[0];
}

function back(){
    var arg = arguments[1],
        length = _pipe.steps.length, steps = 0;
    if(_.isUndefined(arg))
    {
        arg = 1;
    }
    if(_.isString(arg)){
        if(_.isUndefined(_pipe.namedStep[arg])){
            //raise error
            // graph.tap(function(){
            //     alert('Error!! - No step called "' + arg + '"');
            // });
            return;
        }
        arg = length - _pipe.namedStep[arg];
    }

    steps = arg > length ? length - 1 : arg;
    while(steps){
        _pipe.steps.pop();
        steps--;
    }
    return _.last(_pipe.steps);
}

function cap() {}

function copySplit() {}

function except(){

    var arg = arguments[1], dSet, diff, retVal = [];

    dSet = _pipe.steps[_pipe.namedStep[arg] - 1];
    retVal = _.difference(arguments[0],dSet);
    _pipe.steps.push(retVal);
    return retVal;
}

function exhaustMerge() {}
function fairMerge() {}
function sideEffect() {}
//function transform() {}

function filter(){
    var  retVal = []
        ,records = arguments[0]
        ,args = _.rest(arguments)
        ,func
        ,funcArgs = []
        ,funcParam = []
        ,argLen;


    if(_.isFunction(args[0])){
        func = args[0];
        funcArgs = _.flatten(_.rest(args),true);

        argLen = funcArgs.length;

        for(var i=0; i < argLen; i++){
            funcParam.push(_pipe.steps[_pipe.namedStep[funcArgs[i]]-1]);
        }
        retVal = func.apply(records ,funcParam);
        
    } else {

        argLen = args.length;

        while(argLen){
            argLen -= 2;
            retVal = _.filter(records, _comp[args[argLen]](args[argLen + 1]));
        }
    }
    
    _pipe.namedStep.filter = _pipe.steps.length;    
    _pipe.steps.push(retVal);
    return retVal;
}

function gather() {}
function groupCount() {}
function ifThenElse() {}
function loop() {}

function map() {
	var retVal, params = [], args = arguments;
    //if args passed need to do _.pick()
	!!args.length ? 
		retVal = _.map(_wrappedValue, function(element){
			 params = [];
			 push.call(params, element.obj);
			 push.apply(params, args);
			return _.pick.apply(this, params);
		}) :
		retVal = _.map(_wrappedValue, function(element){
			return element.obj;
		})

	cleanUp();
    return retVal;
}

function memoize() {

}
function optional() {}
function orFilter() {
    var  retVal = []
        ,lastStep = arguments[0]
        ,args = _.rest(arguments)
        ,filterStep = _pipe.steps[_pipe.namedStep.filter - 1]
        ,func
        ,funcArgs = []
        ,funcParam = []
        ,argLen
        ,ids = [];

    if(_.isFunction(args[0])){
        func = args[0];
        funcArgs = _.flatten(_.rest(args),true);

        argLen = funcArgs.length;

        for(var i=0; i < argLen; i++){
            funcParam.push(_pipe.steps[_pipe.namedStep[funcArgs[i]]-1]);
        }

        retVal = func.apply(filterStep ,funcParam);
    } else {

        argLen = args.length;
        while(argLen){
            argLen -= 2;
            retVal = _.filter(filterStep, _comp[args[argLen]](args[argLen + 1]));
        }

    }

    for (var i = 0, len = retVal.length; i < len; i++){
        push.call(ids,retVal[i].obj._id);
    }
    ids = _.uniq(ids);

    for (var i = 0, len = lastStep.length; i < len; i++){
        if(!_.include(ids, lastStep[i].obj._id)){
            push.call(retVal, lastStep[i]);
        }
    }
    

    _pipe.steps.push(retVal);
    return retVal;    
}
function paths() {}
function propertyFilter() {}
function random() {}

function retain(){

    var arg = arguments[1], dSet, diff, retVal = [];

    dSet = _pipe.steps[_pipe.namedStep[arg] - 1];
    retVal = _.intersection(arguments[0],dSet);
    _pipe.steps.push(retVal);
    return retVal;
}

function scatter() {}

function step() {
    var  retVal
        ,args = _.rest(arguments)
        ,prevStep = _.last(_pipe.steps)
        ,func
        ,funcArgs = []
        ,argLen;

    if(_.isFunction(args[0])){
        func = args[0];
        funcArgs = _.flatten(_.rest(args),true);
        retVal = func.apply(arguments[0] ,funcArgs)
    } else {
        retVal = "Invalid function";
    }
    
    push.call(_pipe.steps, retVal);
    return retVal;    

}

function reduce() {}
function table() {}
function uniqueObject() {}
function uniquePath() {}

//comparators
var _comp = {
	eq: function(atts){
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

	neq: function (atts){
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

	lt: function (atts){

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

	lte: function (atts){
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

	gt: function (atts){
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

	gte: function (atts){
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
	btwn: function (atts){
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
	has: function (atts){
	    return function(x){
	        var args = _.rest(atts);
	        return _.intersection(_[atts[0]](x.obj),args).length === args.length;
	    }
	},
	//exclude All
	hasNot: function (atts){//not all
	    return function(x){
	        var args = _.rest(atts);
	        return _.intersection(_[atts[0]](x.obj),args).length !== args.length;
	    }
	},
	//include Any
	hasAny: function (atts){//any
	    return function(x){
	        return !!_.intersection(_[atts[0]](x.obj),_.rest(atts)).length;
	    }
	},
	//exclude Any
	hasNotAny: function (atts){//not any
	    return function(x){
	        return !!!_.intersection(_[atts[0]](x.obj),_.rest(atts)).length;
	    }
	},
	//exact element match
	match: function (atts){//not any

	    return function(x){
	        var args = _.rest(atts);
	        //TODO: This about whether _type should be in obj
	        //TODO: Allow for user specified _id ie. config
	        args.push('_type');
	        args.push('_id');
	        return !!!_.difference(_[atts[0]](x.obj),args).length;
	    }
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
Helios.prototype.except = except;
Helios.prototype.retain = retain;

Helios.prototype.stringify = stringify;
Helios.prototype.value = wrapperValue;
Helios.prototype.step = step;
Helios.prototype.transform = step;
Helios.prototype.gather = step;

Helios.prototype.db = db;
	
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

}(this));

