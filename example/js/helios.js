//var g = _.createGraph(jsonData)  
//_store.v(1).out().as('step').where('same',['keys','lang','name']).back('step')._().value()
//_store.v(1).out().aggregate('step').where('same',['keys','lang','name']).except('step')._().value()
//_store.v(1).out().aggregate('step').out().except('step')._().value()
//_store.v(1).out().aggregate('step').out().where('inclAny',['keys','lang']).except('step')._().value()

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

var _wrapped = [];
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

var _store = {
	 graph: {}
    //,edges: {}
	,step: []
	,namedStep: {}
	//,v_index: {}
	//,e_index: {}
};

Helios.newGraph = function(data){ //Add conf param
	//TODO: Cater for optional params
	db.loadGraphJson(data);
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
				_store.graph[rows[i]._id] = { 'data': rows[i], 'type': 'vertex', 'outE': {}, 'inE': {} };
			}
		}
		
		//process edges
		if(jsonData.edges){
			rows = jsonData.edges;
			l = rows.length; 

			for(i=0; i<l;i+=1) {
				edge = { 'data': rows[i], 'type': 'edge', 'outV': {}, 'inV': {} };
				
				if(!_store.graph[edge.data._outV]){
					//create a dummy vertex then go get it from server async
					_store.graph[edge.data._outV] = { 'data': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
					
				}
				vertex = _store.graph[edge.data._outV];
				if(!vertex.outE[edge.data._label]){
					vertex.outE[edge.data._label] = [];
				}
				edge.outV = vertex;
				push.call(vertex.outE[edge.data._label], edge);

				if(!_store.graph[edge.data._inV]){
					//create a dummy vertex then go get it from server async
					_store.graph[edge.data._inV] = { 'data': {}, 'type': 'vertex', 'outE': {}, 'inE': {} };
					
				}
				vertex = _store.graph[edge.data._inV];
				if(!vertex.inE[edge.data._label]){
					vertex.inE[edge.data._label] = [];
				}
				vertex = _store.graph[edge.data._inV];
				edge.inV = vertex;
				push.call(vertex.inE[edge.data._label], edge);

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
	    push.call(retVal, _wrapped);

	    _.each(arguments, function(arg){
	    	push.call(retVal ,arg);
	    });
	    _wrapped = [];		
	    _wrapped = that.apply(this, retVal);
		return this;
	}
};

//Chain enable all Helios functions except value()
function chain() {
    for (var fn in this) {
	    if (typeof this[fn] == "function" && fn != "value" && fn != "stringify") {
	        this[fn] = this[fn].chain();
	    }
    }
    return this;
}

function cleanUp(){
	_wrapped = [];
	_store.step = [];
	_store.namedStep = {};
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
	var retVal = _wrapped;
	cleanUp();
	return retVal;
}

//TODO: Need a function that returns that data in a format that allows lodash to perform its functions on the data
function stringify(){
    var retVal = [];
    if(!!_wrapped[0].data){
    	push.call(retVal,_wrapped);
		cleanUp();
		return JSON.stringify(map.apply(this,retVal));
	}
	retVal = _wrapped;
	cleanUp();
	return JSON.stringify(retVal);
}

function v() {

    var retVal = [], length, args = _.rest(arguments);
    length = args.length;
    while(length){
    	length--;
        push.call(retVal, _store.graph[args[length]]);
    }
    _store.step.push(retVal);
    return retVal;

}

/** Not Implemented **/
/*
function e() {
    var  retVal = []
        ,length
        ,args = _.rest(arguments);

    length = args.length;
    while(length){
        length--;
        push.call(retVal, _store.edges[args[length]]);
    }
    _store.step.push(retVal);
    return retVal;    
}
*/

function id() {
    var retVal = [];
    retVal = _.map(arguments[0], function(element, key, list) {
        return element.data._id;
    });
    _store.step.push(retVal);
    return retVal;
}

function label() {

    var retVal = [];

    retVal = _.map(arguments[0], function(element, key, list) {
        return element.data._label;
    });

    _store.step.push(retVal);
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

    _store.step.push(retVal);
    return retVal;
}

function outV(){
    var retVal = _.map(arguments[0], function(edge, key, list) {
    	return edge.outV;
    });
    _store.step.push(retVal);
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

    _store.step.push(retVal);
    return retVal;
}

function inV(){
    var retVal = _.map(arguments[0], function(edge, key, list) {
        return edge.inV;
    });
    _store.step.push(retVal);
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
	
    _store.step.push(retVal);
    return retVal;
}

function bothV() {
	var retVal = _.map(arguments[0], function(edge, key, list) {
        return edge.outV;
    });
    _store.step.push(retVal);
    return retVal;
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

    _store.step.push(retVal);
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

    _store.step.push(retVal);
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

    _store.step.push(retVal);
    return retVal;
}

function V() {
    var retVal = [];

    retVal = _.toArray(_store.graph);
    _store.step.push(retVal);

    return retVal;
}

function E() {
    var retVal = [];

    _.each(_store.graph, function(element, key, list){
    	push.call(retVal, _.flatten(_.toArray(element.outE)));
    	push.call(retVal, _.flatten(_.toArray(element.inE)));
    });
    
    retVal = _.uniq(_.flatten(retVal));
    _store.step.push(retVal);

    return retVal;
}

// //shorthand for uniq().prop().stringify()
function __(){
	_store.step.push(arguments);
    return arguments[0]; 
}

//TODO: Need to look at aggregate to apply {closure}
function aggregate(){
    return as.apply(this, arguments);
}

//function andFilter() {}

function as(){

    _store.namedStep[arguments[1]] = _store.step.length;
    return arguments[0];
}

function back(){
    var arg = arguments[1],
        length = _store.step.length, steps = 0;
    if(_.isUndefined(arg))
    {
        arg = 1;
    }
    if(_.isString(arg)){
        if(_.isUndefined(_store.namedStep[arg])){
            //raise error
            _store.tap(function(){
                alert('Error!! - No step called "' + arg + '"');
            });
            return;
        }
        arg = length - _store.namedStep[arg];
    }

    steps = arg > length ? length - 1 : arg;
    while(steps){
        _store.step.pop();
        steps--;
    }
    return _.last(_store.step);
}

function cap() {}

function copySplit() {}

function except(){

    var arg = arguments[1], dSet, diff, retVal = [];

    dSet = _store.step[_store.namedStep[arg] - 1];
    retVal = _.difference(arguments[0],dSet);
    _store.step.push(retVal);
    return retVal;
}

function exhaustMerge() {}
function fairMerge() {}
function sideEffect() {}
function transform() {}

function filter(){
    var retVal = arguments[0],
        args = _.rest(arguments),
        length;

    if(args.length === 1){
        args = _.flatten(args,true);
    };

    length = args.length;

    while(length){
        length -= 2;
        retVal = _.filter(retVal, _comp[args[length]](args[length + 1]));
    }
    
    _store.namedStep.filter = _store.step.length;    
    _store.step.push(retVal);
    return retVal;
}

function gather() {}
function groupCount() {}
function ifThenElse() {}
function loop() {}

function map() {
	var retVal, temp, args = _.flatten(_.rest(arguments));
    //if args passed need to do _.pick()
	args.length ? 
		retVal = _.map(arguments[0], function(element){
			temp = [];
			push.call(temp, element.data);
			push.apply(temp, args);
			return _.pick.apply(this, temp);
		}) :
		retVal = _.map(arguments[0], function(element){
			return element.data;
		})

	_store.step.push(retVal);
    return retVal;
}

function memoize() {}
function optional() {}
function orFilter() {
    var  retVal = []
        ,lastStep = arguments[0]
        ,args = _.rest(arguments)
        ,filterStep = _store.step[_store.namedStep.filter - 1]
        ,length
        ,ids = [];

    if(args.length === 1){
        args = _.flatten(args,true);
    };

    length = args.length;

    while(length){
        length -= 2;
        retVal = _.filter(filterStep, _comp[args[length]](args[length + 1]));
    }


    for (var i = 0, len = retVal.length; i < len; i++){
        push.call(ids,retVal[i].data._id);
    }
    ids = _.uniq(ids);

    for (var i = 0, len = lastStep.length; i < len; i++){
        if(!_.include(ids, lastStep[i].data._id)){
            push.call(retVal, lastStep[i]);
        }
    }

    _store.step.push(retVal);
    return retVal;    
}
function paths() {}
function propertyFilter() {}
function random() {}

function retain(){

    var arg = arguments[1], dSet, diff, retVal = [];

    dSet = _store.step[_store.namedStep[arg] - 1];
    retVal = _.intersection(arguments[0],dSet);
    _store.step.push(retVal);
    return retVal;
}

function scatter() {}
function step() {}
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
	            if(x.data[atts[length]] === atts[length + 1]){
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
	            if(x.data[atts[length]] !== atts[length + 1]){
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
	            if(x.data[atts[length]] < atts[length + 1]){
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
	            if(x.data[atts[length]] <= atts[length + 1]){
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
	            if(x.data[atts[length]] > atts[length + 1]){
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
	            if(x.data[atts[length]] >= atts[length + 1]){
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
	            if(x.data[atts[length]] > atts[length + 1] && x.data[atts[length]] < atts[length + 2]){
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
	        return _.intersection(_[atts[0]](x.data),args).length === args.length;
	    }
	},
	//exclude All
	hasNot: function (atts){//not all
	    return function(x){
	        var args = _.rest(atts);
	        return _.intersection(_[atts[0]](x.data),args).length !== args.length;
	    }
	},
	//include Any
	hasAny: function (atts){//any
	    return function(x){
	        return !!_.intersection(_[atts[0]](x.data),_.rest(atts)).length;
	    }
	},
	//exclude Any
	hasNotAny: function (atts){//not any
	    return function(x){
	        return !!!_.intersection(_[atts[0]](x.data),_.rest(atts)).length;
	    }
	},
	//exact element match
	match: function (atts){//not any

	    return function(x){
	        var args = _.rest(atts);
	        //TODO: This about whether _type should be in data
	        //TODO: Allow for user specified _id ie. config
	        args.push('_type');
	        args.push('_id');
	        return !!!_.difference(_[atts[0]](x.data),args).length;
	    }
	}
}

Helios.prototype._ = __;
Helios.prototype.map = map;
Helios.prototype.id = id;
Helios.prototype.label = label;

Helios.prototype.v = v;
//Helios.prototype.e = e; //Not Implemented
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

