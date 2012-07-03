//var g = _.createGraph(jsonData)  
//_graph.v(1).out().as('step').where('same',['keys','lang','name']).back('step')._().value()
//_graph.v(1).out().aggregate('step').where('same',['keys','lang','name']).except('step')._().value()
//_graph.v(1).out().aggregate('step').out().except('step')._().value()
//_graph.v(1).out().aggregate('step').out().where('inclAny',['keys','lang']).except('step')._().value()
//Array.prototype.splice.call(arguments, 0, 1);


;(function(window) {
    'use strict';

/** Detect free variable `exports` */
var freeExports = typeof exports == 'object' && exports &&
    (typeof global == 'object' && global && global == global.global && (window = global), exports);

var Helios = Helios || {}; 

Helios.VERSION = '0.0.1';
Helios.ENV = 'undefined' === typeof ENV ? {} : ENV;
Helios.CONF = 'undefined' === typeof CONFIG ? {} : CONFIG;

var _graph = {
    vertices: {},
    edges: {},
    step: [],
    namedStep: {}
    //,v_index: {}
    //,e_index: {}
};

Helios.toString = function() { return "Helios"; };

Helios.createGraph = function(data){ //Add conf param
    //TODO: Cater for optional params
    
    var helios = helios || {};
    
    helios = data ? Helios.db.loadJson(data): _.chain(null);

    //Add Helios database functions
    helios.db = Helios.db;

    return helios;
};

Helios.db = {
//Other Helios Database type functions
/*
buildIndex\DeleteIndex
save\commit\etc...

*******>>>>
create\update\delete\retrieve (CRUD)
have been pushed into Mogwai

*/  
    loadJson:function(jsonData){
        var i, l, rows = [], edge = {};
    
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
                _graph.vertices[rows[i]._id] = { 'data': rows[i], 'type': 'vertex'/*, '_outE': {}, '_inE': {} */};
            }
        }
        
        //process edges
        //_graph.edges = _graph.edges || {};
        if(jsonData.edges){
            rows = jsonData.edges;
            l = rows.length; 

            for(i=0; i<l;i+=1) {
                _graph.edges[rows[i]._id] = { 'data': rows[i], 'type': 'edge' };
                edge = _graph.edges[rows[i]._id].data;

                //add edges to vertices

                if(!!!_graph.vertices[edge._outV]){
                    //get vertex from server and add to data.vertices
                }

                _graph.vertices[edge._outV]._outE = _graph.vertices[edge._outV]._outE ? _graph.vertices[edge._outV]._outE : {};
                if(_.isUndefined(_graph.vertices[edge._outV]._outE[edge._label])){
                    _graph.vertices[edge._outV]._outE[edge._label] = [];
                }
                if(_.indexOf(_graph.vertices[edge._outV]._outE[edge._label], edge._id) === -1) {
                    _graph.vertices[edge._outV]._outE[edge._label].push(edge._id);
                }

                if(!!!_graph.vertices[edge._inV]){
                    //get vertex from server
                }
                _graph.vertices[edge._inV]._inE = _graph.vertices[edge._inV]._inE ? _graph.vertices[edge._inV]._inE : {};
                if(_.isUndefined(_graph.vertices[edge._inV]._inE[edge._label])){
                    _graph.vertices[edge._inV]._inE[edge._label] = [];
                } 
                if(_.indexOf(_graph.vertices[edge._inV]._inE[edge._label],edge._id) === -1 ){
                    _graph.vertices[edge._inV]._inE[edge._label].push(edge._id);
                }
            }
        }
        return _.chain(null);
    },
    commit: function(){
        return null;
    },
    rollback: function(){
        return null;
    }
};

//lodash Helios extension -> mogwai
_.mixin({

    addVertex: function(){
        return null;
    },
    addEdge: function(){
        return null;
    },
    remove: function(){
        return null;
    },
    update: function(){
        return null;
    },
    //Suggestion: create CRUD mixin functions that CRUDs returned items???
    /*
        eg. g.v(1).out().addEdge(label, VertexObj)
                OR
            g.v(1).as('v1').out('knows').addEdge('hates', 'v1');
            //all the people the v1 knows now hate him

            g.v(1,4).addVertex(EdgeObjArr, NewVertexObj);
            //This will add the newly created vertex to db and create relevant Edges based on EdgeArr
            //for all vertecies v1, v4
            //  EdgeObjArr = [{
                    'direction': 'in',
                    '_label': 'knows',
                    'weight': 0.3
                }];

        ********>>>>
        *Can store in variable and run any time??? Need to review and test this
        
        var toBeDeleted = g.v(1,4);
        toBeDeleted.remove();
    */

    //TODO: Need a function that returns that data in a format that allows lodash to perform its functions on the data
    stringify: function(){
        return JSON.stringify(_.flatten(arguments));
    },
    props: function(){

        var emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(element, key, list) {
            return !!args.length ? _.pick(element, args) : element;
        });

        return _.flatten(_.compact(emitVal));
    },

    //shorthand for uniq().prop().stringify()
    _: function(){
        return  _.chain(arguments[0]).uniq().props(_.flatten(_.rest(arguments))).stringify().value();
    },
    v: function(_id){

        var emitVal = [], length, args = _.flatten(_.rest(arguments));
        _graph.step = [];
        _graph.namedStep = {};

        length = args.length;
        while(length){
            emitVal.push(_graph.vertices[length--].data);
        }
        _graph.step.push(emitVal);
        return emitVal;

    },
    V: function(){
        var emitVal = [];
        _graph.step = [];
        _graph.namedStep = {};

        emitVal = _.toArray(_.pluck(_graph.vertices,'data'));
        _graph.step.push(emitVal);

        return emitVal;
    },

    E: function() {
        var emitVal = [];
        _graph.step = [];
        _graph.namedStep = {};

        emitVal = _.toArray(_.pluck(_graph.edges,'data'));
        _graph.step.push(emitVal);

        return emitVal;
    },
    id: function(){

        var emitVal = [];

        emitVal = _.map(arguments[0], function(element, key, list) {
            return element._id;
        });

        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    label: function(){

        var emitVal = [];

        emitVal = _.map(arguments[0], function(element, key, list) {
            return element._label;
        });

        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    out : function() {

        var vertex = {},
            emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vtex, key, list) {
            vertex = _graph.vertices[vtex._id];
            if(!!!vertex._outE){
                //Get vertex edges and load from the service
                Helios.db.loadJson({"edges":[{"weight":0.2,"_id":7,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
            }
            if (!_.isEmpty(vertex._outE)) {
                var value = !!args.length ? _.pick(vertex._outE, args) : vertex._outE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return _graph.vertices[_graph.edges[eid].data._inV].data;
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },

    'in': function(){

        var vertex = {},
            emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vtex, key, list) {
            vertex = _graph.vertices[vtex._id];
            if(!!!vertex._inE){
                //Get vertex edges and load from the service
                Helios.db.loadJson({"edges":[{"weight":0.2,"_id":8,"_type":"edge","_outV":6,"_inV":vtex._id,"_label":"created"}]});
            }
            if (!_.isEmpty(vertex._inE)) {
                var value = !!args.length ? _.pick(vertex._inE, args) : vertex._inE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return _graph.vertices[_graph.edges[eid].data._outV].data;
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },

    outE: function(){

        var vertex = {},
            emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vtex, key, list) {
            vertex = _graph.vertices[vtex._id];
            if(!!!vertex._outE){
                //Get vertex edges and load from the service
                Helios.db.loadJson({"edges":[{"weight":0.2,"_id":9,"_type":"edge","_outV":vtex._id,"_inV":3,"_label":"created"}]});
            }           
            if (!_.isEmpty(vertex._outE)) {
                var value = !!args.length ? _.pick(vertex._outE, args) : vertex._outE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return _graph.edges[eid].data;
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;

    },
    inE: function(){

        var vertex = {},
            emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vtex, key, list) {
            vertex = _graph.vertices[vtex._id];
            if(!!!vertex._inE){
                //Get vertex edges and load from the service
                Helios.db.loadJson({"edges":[{"weight":0.2,"_id":15,"_type":"edge","_outV":6,"_inV":vtex._id,"_label":"created"}]});
            }           
            if (!_.isEmpty(vertex._inE)) {
                var value = !!args.length ? _.pick(vertex._inE, args) : vertex._inE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return _graph.edges[eid].data;
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    outV: function(){

        var emitVal = _.map(arguments[0], function(edge, key, list) {
            return _graph.vertices[edge._outV].data;
        });
        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    inV: function(){
        var emitVal = _.map(arguments[0], function(edge, key, list) {
            return _graph.vertices[edge._inV].data;
        });
        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    both : function() {

        var emitVal = [];

        emitVal.push(_.out.apply(this, arguments));
        emitVal.push(_.in.apply(this, arguments));
        emitVal = _.flatten(emitVal);
        _graph.step.push(emitVal);
        return emitVal;
    },
    bothE : function() {

        var emitVal = [];

        emitVal.push(_.outE.apply(this, arguments));
        emitVal.push(_.inE.apply(this, arguments));
        emitVal = _.flatten(emitVal);
        _graph.step.push(emitVal);
        return emitVal;
    },
    bothV : function() {

        var emitVal = [];

        emitVal.push(_.outV.apply(this, arguments));
        emitVal.push(_.inV.apply(this, arguments));
        emitVal = _.flatten(emitVal);
        _graph.step.push(emitVal);
        return emitVal;
    },
    where: function(){
        var emitVal = arguments[0],
            args = _.rest(arguments),
            length;

        if(args.length === 1){
            args = _.flatten(args,true);
        };

        length = args.length;

        while(length){
            length -= 2;
            emitVal = _.filter(emitVal,_[args[length]](args[length + 1]));
        }
        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;

    },
    eq: function(atts){
        return function(x){

            var length = atts.length;
            while(length){
                length -= 2;
                if(x[atts[length]] === atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },
    neq: function(atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x[atts[length]] !== atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },
    gt: function(atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x[atts[length]] > atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },
    lt: function(atts){

        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x[atts[length]] < atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },
    gte: function(atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x[atts[length]] >= atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },
    lte: function(atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 2;
                if(x[atts[length]] <= atts[length + 1]){
                    return true;
                }
            }
            return false;
        }
    },
    btwn: function(atts){
        return function(x){
            var length = atts.length;
            while(length){
                length -= 3;
                if(x[atts[length]] > atts[length + 1] && x[atts[length]] < atts[length + 2]){
                    return true;
                }
            }
            return false;
        }
    },
    //args[0] -> 'keys','values'
    //TODO: Accept RegEx and Embedded Object Referencing
    //TODO: Test how dates would work
    //include All
    inclAll: function(atts){ //all
        return function(x){
            var args = _.rest(atts);
            return _.intersection(_[atts[0]](x),args).length === args.length;
        }
    },
    //exclude All
    exclAll: function(atts){//not all
        return function(x){
            var args = _.rest(atts);
            return _.intersection(_[atts[0]](x),args).length !== args.length;
        }
    },
    //include Any
    inclAny: function(atts){//any
        return function(x){
            return !!_.intersection(_[atts[0]](x),_.rest(atts)).length;
        }
    },
    //exclude Any
    exclAny: function(atts){//not any
        return function(x){
            return !!!_.intersection(_[atts[0]](x),_.rest(atts)).length;
        }
    },
    //exact element match
    same: function(atts){//not any

        return function(x){
            var args = _.rest(atts);
            //TODO: This about whether _type should be in data
            //TODO: Allow for user specified _id ie. config
            args.push('_type');
            args.push('_id');
            return !!!_.difference(_[atts[0]](x),args).length;
        }
    },

    except: function(){

        var arg = arguments[1], dSet, diff, emitVal = [];

        dSet = _graph.step[_graph.namedStep[arg] - 1];
        emitVal = _.difference(arguments[0],dSet);
        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    retain: function(){

        var arg = arguments[1], dSet, diff, emitVal = [];

        dSet = _graph.step[_graph.namedStep[arg] - 1];
        emitVal = _.intersection(arguments[0],dSet);
        emitVal = _.flatten(_.compact(emitVal));
        _graph.step.push(emitVal);
        return emitVal;
    },
    as: function(){

        _graph.namedStep[arguments[1]] = _graph.step.length;
        return arguments[0];
    },
    back: function(){
        var arg = arguments[1],
            length = _graph.step.length, steps = 0;
        if(_.isUndefined(arg))
        {
            arg = 1;
        }
        if(_.isString(arg)){
            if(_.isUndefined(_graph.namedStep[arg])){
                //raise error
                _graph.tap(function(){
                    alert('Error!! - No step called "' + arg + '"');
                });
                return;
            }
            arg = length - _graph.namedStep[arg];
        }

        steps = arg > length ? length - 1 : arg;
        while(steps){
            _graph.step.pop();
            steps--;
        }
        return _.last(_graph.step);
    },

    //TODO:Need to look at aggregate to apply {closure}
    aggregate: function(){
        return _.as.apply(this, arguments);
    }
});//lodash mixin end
    
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

