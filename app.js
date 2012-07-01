//var g = _.createGraph(database)  
//g.v(1).out().as('step').where('same',['keys','lang','name']).back('step')._().value()
//g.v(1).out().aggregate('step').where('same',['keys','lang','name']).except('step')._().value()
//g.v(1).out().aggregate('step').out().except('step')._().value()
//g.v(1).out().aggregate('step').out().where('inclAny',['keys','lang']).except('step')._().value()

_.mixin({

    createGraph: function(database){
        g = _.chain(database);
        g.vertices = g._wrapped.vertices;
        g.edges = g._wrapped.edges;
        g.v_index = g._wrapped.v_index;
        g.e_index = g._wrapped.e_index;
        g.step = [];
        g.namedStep = {};
        return g;
    },

    stringify: function(){
        return JSON.stringify(_.flatten(arguments));
    },
    props: function(){

        var emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(element, key, list) {
            return !!args.length ? _.pick(element.data, args) : element.data;
        });

        return _.flatten(_.compact(emitVal));
    },

    //shorthand for uniq().prop().stringify()
    _: function(){
        args = _.flatten(_.rest(arguments));
        return	_.chain(arguments[0]).uniq().props(args).stringify().value();
    },
    v: function(_id){

        var emitVal = [], length, args = _.flatten(_.rest(arguments));
        g.step = [];
        g.namedStep = {};

        length = args.length;
        while(length){
            emitVal.push(g.vertices[length--]);
        }
        g.step.push(emitVal);
        return emitVal;

    },
    V: function(){
        var emitVal = [];
        g.step = [];
        g.namedStep = {};

        emitVal = _.toArray(g.vertices);
        g.step.push(emitVal);

        return emitVal;
    },

    E: function() {
        var emitVal = [];
        g.step = [];
        g.namedStep = {};

        emitVal = _.toArray(g.edges);
        g.step.push(emitVal);

        return emitVal;
    },
    id: function(){

        var emitVal = [];

        emitVal = _.map(arguments[0], function(element, key, list) {
            return element.data._id;
        });

        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    label: function(){

        var emitVal = [];

        emitVal = _.map(arguments[0], function(element, key, list) {
            return element.data._label;
        });

        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    out : function() {

        var emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vertex, key, list) {
            if (!_.isEmpty(vertex.outE)) {
                var value = !!args.length ? _.pick(vertex.outE, args) : vertex.outE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return g.vertices[g.edges[eid].inV];
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },

    'in': function(){

        var emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vertex, key, list) {
            if (!_.isEmpty(vertex.inE)) {
                var value = !!args.length ? _.pick(vertex.inE, args) : vertex.inE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return g.vertices[g.edges[eid].outV];
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },

    outE: function(){

        var emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vertex, key, list) {
            if (!_.isEmpty(vertex.outE)) {
                var value = !!args.length ? _.pick(vertex.outE, args) : vertex.outE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return g.edges[eid];
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;

    },
    inE: function(){

        var emitVal = [],
            args = _.flatten(_.rest(arguments));

        emitVal = _.map(arguments[0], function(vertex, key, list) {
            if (!_.isEmpty(vertex.inE)) {
                var value = !!args.length ? _.pick(vertex.inE, args) : vertex.inE;
                return _.map(_.flatten(_.values(value)), function(eid) {
                    return g.edges[eid];
                });
            }
        });

        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    outV: function(){

        var emitVal = _.map(arguments[0], function(edge, key, list) {
            return g.vertices[edge.outV];
        });
        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    inV: function(){
        var emitVal = _.map(arguments[0], function(edge, key, list) {
            return g.vertices[edge.inV];
        });
        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    both : function() {

        var emitVal = [];

        emitVal.push(_.out.apply(this, arguments));
        emitVal.push(_.in.apply(this, arguments));
        emitVal = _.flatten(emitVal);
        g.step.push(emitVal);
        return emitVal;
    },
    bothE : function() {

        var emitVal = [];

        emitVal.push(_.outE.apply(this, arguments));
        emitVal.push(_.inE.apply(this, arguments));
        emitVal = _.flatten(emitVal);
        g.step.push(emitVal);
        return emitVal;
    },
    bothV : function() {

        var emitVal = [];

        emitVal.push(_.outV.apply(this, arguments));
        emitVal.push(_.inV.apply(this, arguments));
        emitVal = _.flatten(emitVal);
        g.step.push(emitVal);
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
        g.step.push(emitVal);
        return emitVal;

    },
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
    neq: function(atts){
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
    gt: function(atts){
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
    lt: function(atts){

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
    gte: function(atts){
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
    lte: function(atts){
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
    btwn: function(atts){
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
    //include All
    inclAll: function(atts){ //all
        return function(x){
            var args = _.rest(atts);
            return _.intersection(_[atts[0]](x.data),args).length === args.length;
        }
    },
    //exclude All
    exclAll: function(atts){//not all
        return function(x){
            var args = _.rest(atts);
            return _.intersection(_[atts[0]](x.data),args).length !== args.length;
        }
    },
    //include Any
    inclAny: function(atts){//any
        return function(x){
            return !!_.intersection(_[atts[0]](x.data),_.rest(atts)).length;
        }
    },
    //exclude Any
    exclAny: function(atts){//not any
        return function(x){
            return !!!_.intersection(_[atts[0]](x.data),_.rest(atts)).length;
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
            return !!!_.difference(_[atts[0]](x.data),args).length;
        }
    },

    except: function(){

        var arg = arguments[1], dSet, diff, emitVal = [];

        dSet = g.step[g.namedStep[arg] - 1];
        emitVal = _.difference(arguments[0],dSet);
        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    retain: function(){

        var arg = arguments[1], dSet, diff, emitVal = [];

        dSet = g.step[g.namedStep[arg] - 1];
        emitVal = _.intersection(arguments[0],dSet);
        emitVal = _.flatten(_.compact(emitVal));
        g.step.push(emitVal);
        return emitVal;
    },
    as: function(){

        g.namedStep[arguments[1]] = g.step.length;
        return arguments[0];
    },
    back: function(){
        var arg = arguments[1],
            length = g.step.length, steps = 0;
        if(_.isUndefined(arg))
        {
            arg = 1;
        }
        if(_.isString(arg)){
            if(_.isUndefined(g.namedStep[arg])){
                //raise error
                g.tap(function(){
                    alert('Error!! - No step called "' + arg + '"');
                });
                return;
            }
            arg = length - g.namedStep[arg];
        }

        steps = arg > length ? length - 1 : arg;
        while(steps){
            g.step.pop();
            steps--;
        }
        return _.last(g.step);
    },

    //TODO:Need to look at aggregate to apply {closure}
    aggregate: function(){
        return _.as.apply(this, arguments);
    }


});





;(function(window, undefined) {
    'use strict';

    var DB = {

        "vertices":{
            1 : {
                "data" : { '_id': 1, "name": 'marko', "age": 29, "_type" : "person"},
                "outE" : { "knows":[7,8], "created":[9] },
                "inE": {},
                "type": "vertex"
            },
            2 : {
                "data" : { '_id': 2, "name": 'vadas', "age": 27, "_type" : "person"},
                "outE": {},
                "inE": { "knows":[7]},
                "type": "vertex"
            },
            3 : {
                "data" : { '_id': 3, "name": 'lop', "lang": 'java', "_type" : "language"},
                "outE": {},
                "inE": { "created":[9,11,12] },
                "type": "vertex"
            },
            4 : {
                "data" : { '_id': 4, "name": 'josh', "age": 32, "_type" : "person"},
                "outE": {"created":[11,10]},
                "inE": { "knows":[8] },
                "type": "vertex"
            },
            5 : {
                "data" : { '_id': 5, "name": 'ripple', "lang": 'java', "_type" : "language"},
                "outE": {},
                "inE": { "created":[10] },
                "type": "vertex"
            },
            6 : {
                "data" : { '_id': 6, "name": 'peter', "age": 35, "_type" : "person"},
                "outE": { "created":[12] },
                "inE": {},
                "type": "vertex"
            }
        },

        "edges":{
            7 : { "data" : { '_id': 7, '_label': 'knows', "weight": 0.5, "_type" : "edge"}, "outV": 1, "inV": 2, "type":"edge" },
            8 : { "data" : { '_id': 8, '_label': 'knows', "weight": 1.0, "_type" : "edge"}, "outV": 1, "inV": 4, "type":"edge" },
            9 : { "data" : { '_id': 9, '_label': 'created', "weight": 0.4, "_type" : "edge"}, "outV": 1, "inV": 3, "type":"edge" },
            10: { "data" : { '_id': 10, '_label': 'created', "weight": 1.0, "_type" : "edge"}, "outV": 4, "inV": 5, "type":"edge" },
            11: { "data" : { '_id': 11, '_label': 'created', "weight": 0.4, "_type" : "edge"}, "outV": 4, "inV": 3, "type":"edge" },
            12: { "data" : { '_id': 12, '_label': 'created', "weight": 0.2, "_type" : "edge"}, "outV": 6, "inV": 3, "type":"edge" }
        },

        "v_index":
        {
            "name":{"marko":["1"],"vadas":["2"],"lop":["3"],"josh":["4"],"ripple":["5"],"peter":["6"]}
        },

        "e_index":
        {
            
        }
    };

    return window.database = DB;
}(this));