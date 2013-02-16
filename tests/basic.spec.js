//noinspection JSUnresolvedFunction
/**
 * Created with JetBrains WebStorm.
 * User: frank
 * Date: 11/02/13
 * Time: 9:39 PM
 * To change this template use File | Settings | File Templates.
 */


//noinspection JSUnresolvedFunction
describe('jasmine-node', function(){
    var g = new Helios.Graph();
    var someData = {
        "vertices": [
            {
                "name": "marko",
                "age": '29',
                "_id": '1',
                "_type": "vertex"
            },
            {
                "name": "vadas",
                "age": '9',
                "_id": '2',
                "_type": "vertex"
            },
            {
                "name": "lop",
                "lang": "java",
                "_id": '3',
                "_type": "vertex"
            },
            {
                "name": "josh",
                "age": '3',
                "_id": '4',
                "_type": "vertex"
            },
            {
                "name": "ripple",
                "lang": "java",
                "_id": '5',
                "_type": "vertex"
            },
            {
                "name": "peter",
                "age": '35',
                "_id": '6',
                "_type": "vertex"
            }
        ],
        "edges": [
            {
                "weight": 0.5,
                "_id": '7',
                "_type": "edge",
                "_outV": '1',
                "_inV": '2',
                "_label": "knows"
            },
            {
                "weight": 1.0,
                "_id": '8',
                "_type": "edge",
                "_outV": '1',
                "_inV": '4',
                "_label": "knows"
            },
            {
                "weight": 0.4,
                "_id": '9',
                "_type": "edge",
                "_outV": '1',
                "_inV": '3',
                "_label": "created"
            },
            {
                "weight": 1.0,
                "_id": '10',
                "_type": "edge",
                "_outV": '4',
                "_inV": '5',
                "_label": "created"
            },
            {
                "weight": 0.4,
                "_id": '11',
                "_type": "edge",
                "_outV": '4',
                "_inV": '3',
                "_label": "created"
            },
            {
                "weight": 0.2,
                "_id": '12',
                "_type": "edge",
                "_outV": '6',
                "_inV": '3',
                "_label": "created"
            }
        ]
    };

    //g.loadGraphSON(someData);
    //g.loadGraphSON('graph-example-1.json');

    //noinspection JSUnresolvedFunction
    beforeEach(function() {
        this.addMatchers({

            toContainMap: function(){
                var arr = this.actual
                    , key = arguments[0]
                    , val = arguments[1]

                for (var i = 0, len = arr.length; i < len; i++){
                    if (arr[i][key] === val){
                        return true;
                    };
                }
                return false;
            }

        });
    });

    //noinspection JSUnresolvedFunction
//    it('should pass', function(){
//        expect(g.v().count()).toEqual(6);
//
//    });


    describe("Asynchronous specs", function() {
        var value, flag;

        it("should support async execution of test preparation and exepectations", function() {

//Specs are written by defining a set of blocks with calls to runs, which usually finish with an asynchronous call.

            runs(function() {
                flag = false;
                value = 0;
                g.loadGraphSON(someData);
                setTimeout(function() {
                    flag = true;
                }, 5000);
            });

//The waitsFor block takes a latch function, a failure message, and a timeout.

//The latch function polls until it returns true or the timeout expires, whichever comes first. If the timeout expires, the
//spec fails with the error message.

            waitsFor(function() {
                value = 6;
                return flag;
            }, "The Value should be incremented", 7500);

//Once the asynchronous conditions have been met, another runs block defines final test behavior.
//This is usually expectations based on state after the asynch call returns.

            runs(function() {
                //expect(value).toBeGreaterThan(0);
                expect(g.v().count()).toEqual(6);
            });
        });
    });

//    describe("Transform-Based Steps", function() {
//        it("Basic", function() {
//
//
//            //expect(g.v().emit().length).toEqual(6);
//            expect(g.v().count()).toEqual(6);
//
//            //results = g.v({ name:'marko' }).emit();
//            //expect(results.length).toEqual(1);
//            //expect(results).toContainMap('name','marko');
//
//            //expect(g.v({ name:'marko'}).out().emit()).toEqual(g.v(1).out().emit());
//
//            /*expect(g.e().emit().length).toEqual(6);
//
//             results = g.e('_label','created').emit();
//             expect(results.length).toEqual(4);
//             expect(results).toContainMap(configTest.id, 90);
//             expect(results).toContainMap(configTest.id, 100);
//             expect(results).toContainMap(configTest.id, 110);
//             expect(results).toContainMap(configTest.id, 120);
//
//             results = g.v(10).out().emit();
//             expect(results.length).toEqual(3);
//
//             expect(results).toContainMap('name','josh');
//             expect(results).toContainMap('name','vadas');
//             expect(results).toContainMap('name','lop');
//
//             results = g.v(10).emit();
//             expect(g.v([10]).emit()).toEqual(g.v(results).emit());
//
//             results = g.e(70).emit();
//             expect(g.e([70]).emit()).toEqual(g.e(results).emit());
//
//             results = g.v(10).out('knows').emit();
//             expect(results.length).toEqual(2);
//
//             expect(results).toContainMap('name','josh');
//             expect(results).toContainMap('name','vadas');
//
//             results = g.v(10).out('nonExistentLabel').emit();
//             expect(results.length).toEqual(0);
//
//             ////////////
//
//             results = g.v(10).outE('knows').emit();
//             expect(results.length).toEqual(2);
//
//             expect(results).toContainMap(configTest.id, 70);
//             expect(results).toContainMap(configTest.id, 80);
//
//             results = g.v(10).outE().emit();
//             expect(results.length).toEqual(3);
//
//             expect(results).toContainMap(configTest.id, 70);
//             expect(results).toContainMap(configTest.id, 80);
//             expect(results).toContainMap(configTest.id, 90);
//
//
//             /////////////
//
//             results = g.v(40).in().emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 10);
//
//             results = g.v(40).in('knows').emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 10);
//
//             /////////////
//
//             results = g.v(40).inE().emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 80);
//
//             results = g.v(40).inE('knows').emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 80);
//
//             /////////////
//
//             results = g.v(40).both().emit();
//             expect(results.length).toEqual(3);
//
//             expect(results).toContainMap(configTest.id, 10);
//             expect(results).toContainMap(configTest.id, 30);
//             expect(results).toContainMap(configTest.id, 50);
//
//             results = g.v(40).both('created').emit();
//             expect(results.length).toEqual(2);
//
//             expect(results).toContainMap(configTest.id, 30);
//             expect(results).toContainMap(configTest.id, 50);
//
//             /////////////
//
//             results = g.v(40).bothE().emit();
//             expect(results.length).toEqual(3);
//
//             expect(results).toContainMap(configTest.id, 100);
//             expect(results).toContainMap(configTest.id, 110);
//             expect(results).toContainMap(configTest.id, 80);
//
//             results = g.v(40).bothE('created').emit();
//             expect(results.length).toEqual(2);
//
//             expect(results).toContainMap(configTest.id, 100);
//             expect(results).toContainMap(configTest.id, 110);
//
//             /////////////
//
//             results = g.e(100).outV().emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 40);
//
//             results = g.e(100).inV().emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 50);
//
//             results = g.e(100).bothV().emit();
//             expect(results.length).toEqual(2);
//
//             expect(results).toContainMap(configTest.id, 50);
//             expect(results).toContainMap(configTest.id, 40);
//
//             /////////////
//
//             results = g.v(10).outE('knows', 'created').emit();
//             expect(results.length).toEqual(3);
//
//             expect(results).toContainMap(configTest.id, 70);
//             expect(results).toContainMap(configTest.id, 80);
//             expect(results).toContainMap(configTest.id, 90);
//
//             results = g.v(20).inE('knows', 'created').emit();
//             expect(results.length).toEqual(1);
//
//             expect(results).toContainMap(configTest.id, 70);
//
//             results = g.v(20).inE('knows', 'created').emit();
//             expect(results.length).toEqual(1);
//             expect(results).toContainMap(configTest.id, 70);
//
//             expect(g.v(10).outE('knows').emit()).toContainMap(configTest.id, results[0][configTest.id]);
//
//             results = g.v(40).bothE('knows', 'created').emit();
//             expect(results.length).toEqual(3);
//
//             expect(results).toContainMap(configTest.id, 80);
//             expect(results).toContainMap(configTest.id, 110);
//             expect(results).toContainMap(configTest.id, 100);
//
//             ////////
//
//             expect(g.v(10).out('knows', 'created').emit().length).toEqual(3);
//             expect(g.v(20).in('knows', 'created').emit().length).toEqual(1);
//             expect(g.v(20).in('knows', 'created').emit()[0][configTest.id]).toEqual(10);
//             expect(g.v(40).both('knows', 'created').emit().length).toEqual(3);*/
//
//        });
//        /*
//         it("tail", function() {
//         results = g.v(10).tail().emit();
//         expect(results.length).toEqual(3);
//         expect(results).toContainMap(configTest.id, 20);
//         expect(results).toContainMap(configTest.id, 30);
//         expect(results).toContainMap(configTest.id, 50);
//
//         results = g.v(10).tail('knows').emit();
//         expect(results.length).toEqual(2);
//         expect(results).toContainMap(configTest.id, 20);
//         expect(results).toContainMap(configTest.id, 40);
//
//         results = g.V().tail().emit();
//         expect(results.length).toEqual(3);
//         expect(results).toContainMap(configTest.id, 20);
//         expect(results).toContainMap(configTest.id, 30);
//         expect(results).toContainMap(configTest.id, 50);
//
//         results = g.V().tail('knows').emit();
//         expect(results.length).toEqual(2);
//         expect(results).toContainMap(configTest.id, 20);
//         expect(results).toContainMap(configTest.id, 40);
//
//         });
//
//         it("head", function() {
//         results = g.v(40).head().emit();
//         expect(results.length).toEqual(1);
//         expect(results).toContainMap(configTest.id, 10);
//
//         results = g.v(40).head('knows').emit();
//         expect(results.length).toEqual(1);
//         expect(results).toContainMap(configTest.id, 10);
//
//         results = g.V().head().emit();
//         expect(results.length).toEqual(2);
//         expect(results).toContainMap(configTest.id, 10);
//         expect(results).toContainMap(configTest.id, 60);
//
//         results = g.V().head('knows').emit();
//         expect(results.length).toEqual(1);
//         expect(results).toContainMap(configTest.id, 10);
//         });
//
//         it("path", function() {
//         results = g.v(10).out('knows').path();
//         expect(results.length).toEqual(3);
//
//         expect(results[0]).toEqual('{"step 1":["v[10]"],"step 2":["v[20]","v[40]"]}');
//         expect(results[1][configTest.id]).toEqual(20);
//         expect(results[2][configTest.id]).toEqual(40);
//         });
//
//         it("stringify", function() {
//         results = g.v(10).out().stringify();
//         expect(results).toEqual('[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"},{"name":"josh","age":32,"@rid":40,"@type":"vertex"},{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}]');
//
//         results = g.v(10).out().stringify('name');
//         expect(results).toEqual('[{"name":"vadas"},{"name":"josh"},{"name":"lop"}]');
//         });
//
//         it("clone", function() {
//         results = g.v(10).out().clone();
//         expect(results.length).toEqual(3);
//         });  */
//    });
//    /* describe("Filter-Based Steps", function() {
//     it("closure", function(){
//
//     results = g.v(10).where(function(name) {  return this.name === name; },'marko').emit();
//     expect(results.length).toEqual(1);
//
//     results = g.v(10).outE().inV().where(function() { return true; }).emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap(configTest.id, 20);
//     expect(results).toContainMap(configTest.id, 30);
//     expect(results).toContainMap(configTest.id, 40);
//
//     results = g.v(10).outE().inV().where(function() { return false; }).emit();
//     expect(results.length).toEqual(0);
//
//     results = g.v(10).outE().inV().where(function() { return this[configTest.id] === g.v(20).emit()[0][configTest.id]; }).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id, 20);
//
//     results = g.v(10).outE().inV().where(function() { return false; })
//     .or(function() { return this[configTest.id] === 20; }).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id, 20);
//
//     ///////////////////////////////////////////////////////////////////////////
//
//     results = g.v(10).outE().inV().where(function() { return false; })
//     .or(function() { return this[configTest.id] === 20; })
//     .and(function() { return this.name === 'vadas'; } ).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id, 20);
//
//     ///////////////////////////////////////////////////////////////////////////
//
//     results = g.v(10).outE().inV().where(function() { return false; })
//     .or(function() { return this[configTest.id] === 20; })
//     .and(function() { return this.name === 'josh';}).emit();
//
//     expect(results.length).toEqual(0);
//
//     });
//
//     it("eq", function() {
//     results = g.v(10).out().where('eq',['name','vadas']).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','vadas');
//
//     expect(g.V().outE().inV().where('eq',['name','lop']).id().length).toEqual(3);
//     expect(g.E().outV().inE().label().length).toEqual(2);
//
//     });
//     it("neq", function() {
//     results = g.v(10).out().where('neq',['name','vadas']).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','lop');
//     });
//     it("lt", function() {
//     results = g.v(10).out().where('lt',['age',30]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','vadas');
//     });
//     it("lte", function() {
//     results = g.v(10).out().where('lte',['age',27]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','vadas');
//     });
//     it("gt", function() {
//     results = g.v(10).out().where('gt',['age',30]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','josh');
//     });
//     it("gte", function() {
//     results = g.v(10).out().where('gte',['age',32]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','josh');
//     });
//     it("btwn", function() {
//     results = g.v(10).out().where('btwn',['age',30, 33]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','josh');
//     });
//     it("has", function() {
//     results = g.v(10).out().where('has',['keys','name', 'age']).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','vadas');
//
//     results = [];
//     results = g.v(10).out().where('has',['keys', 'age', 'lang']).emit();
//     expect(results.length).toEqual(0);
//
//     });
//     it("hasNot", function() {
//     results = g.v(10).out().where('hasNot',['keys','name', 'age']).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','lop');
//
//     results = [];
//
//     results = g.v(10).out().where('hasNot',['keys', 'age']).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','lop');
//
//     });
//     it("hasAny", function() {
//     results = g.v(10).out().where('hasAny',['keys', 'age', 'lang']).emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','vadas');
//     expect(results).toContainMap('name','lop');
//     });
//
//     it("hasAny values", function() {
//     results = g.v(10).out().where('hasAny',['values', 'josh', 'lop']).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','lop');
//     });
//
//     it("hasNotAny", function() {
//     results = g.v(10).out().where('hasNotAny',['keys', 'name', 'age']).emit();
//     expect(results.length).toEqual(0);
//     });
//
//     it("and queries", function() {
//     results = g.v(10).out().where('eq',['name','vadas'], 'gt', ['age', 25]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','vadas');
//
//     results = [];
//     results = g.v(10).out().where('eq',['name','vadas']).and('gt', ['age', 25]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','vadas');
//
//     results = [];
//     results = g.v(10).out().where('eq',['name','vadas']).and('lt', ['age', 25]).emit();
//     expect(results.length).toEqual(0);
//
//     });
//     it("or queries", function() {
//     results = g.v(10).out().where('eq',['name','vadas', 'age', 32]).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','vadas');
//
//     results = [];
//     results = g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','vadas');
//
//     results = [];
//     results = g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).or('eq', ['name', 'lop']).emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap('name','josh');
//     expect(results).toContainMap('name','vadas');
//     expect(results).toContainMap('name','lop');
//
//     results = [];
//     results = g.v(10).out().where('eq',['name','vadas']).or('gt', ['age', 25]).or('eq', ['name', 'lop'])
//     .and('eq',['age',32]).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','josh');
//
//     results = [];
//     results = g.v(10).out().where('eq',['name','vadas'],'eq',['age',32]).or('lt', ['age', 30])
//     .or('eq', ['name', 'lop']).and('eq',['age',32]).emit();
//     expect(results.length).toEqual(0);
//
//     });
//     it("dedup", function() {
//     results = g.v(10).out().in().dedup().emit();
//     expect(results.length).toEqual(3);
//     });
//
//     it("back", function(){
//     results = g.v(10).out().in().back(1).emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,30);
//     expect(results).toContainMap(configTest.id,40);
//
//     results = g.v(10).out().in().back(2).emit();
//     expect(results.length).toEqual(1);
//     expect(results[0][configTest.id]).toEqual(10);
//
//     results = g.v(10).out().as('x').in().back('x').emit();
//     expect(results.length).toEqual(3);
//
//     var x = [];
//     results = g.v(10).out().store(x).in().back(x).emit();
//     expect(results.length).toEqual(3);
//
//     });
//
//     it("except", function(){
//     results = g.v(10).out().store('x').out().except('x').emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id,50);
//     });
//
//     it("except with Array", function(){
//     var x = [];
//     results = g.v(10).out().store(x).out().except(x).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id,50);
//     });
//
//     it("retain", function(){
//     results = g.v(10).out().store('x').out().retain('x').emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id,30);
//     });
//
//     it("retain with Array", function(){
//     var x = [];
//     results = g.v(10).out().store(x).out().retain(x).emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id,30);
//     });
//     });
//
//     describe("SideEffect-Based Steps", function() {
//
//
//     it("as", function(){
//     results = g.v(10).out().as('x').in().back('x').emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,30);
//     expect(results).toContainMap(configTest.id,40);
//
//     results = g.v(10).as('y').out().in().back('y').emit();
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap(configTest.id,10);
//
//     });
//
//     it("generic step", function(){
//     results = g.v(10).out().step(function(){
//     var arr = [];
//     _.each(this, function(element){
//     arr.push(element)});
//     return arr; }).emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,30);
//     expect(results).toContainMap(configTest.id,40);
//
//     results = g.v(10).out().step(function(){ return this; }).in().emit();
//     expect(results.length).toEqual(5);
//     expect(results).toContainMap(configTest.id,10);
//     expect(results).toContainMap(configTest.id,40);
//     expect(results).toContainMap(configTest.id,60);
//
//     // results = [];
//     // var x = 3;
//     // results = g.v(10).out().step(function(x){ return x + 1; }, x).emit();
//     // expect(results).toEqual(4);
//
//     });
//
//     it("store", function(){
//
//     results = g.v(10).outE().inV().store().emit();
//     results2 = g.v(10).outE().inV().emit();
//     expect(results).toEqual(results2);
//
//     ////////////////////////////////////////////
//
//     var x = [];
//     results = g.v(10).outE().inV().store(x).emit();
//
//     expect(results.length).toEqual(x.length);
//
//     //////////////////////////////////////////
//
//     x = [];
//     results = g.v(10).out('knows').store(x, function(incAge){
//     var retVal = [];
//     _.each(this, function(element){
//     element.age += incAge;
//     retVal.push(element);
//     });
//     return retVal;
//     }, [10]).emit();
//
//     expect(results[0].age).toEqual(37);
//     expect(results[1].age).toEqual(42);
//     expect(results[0].age).toEqual(x[0].age);
//     expect(results[1].age).toEqual(x[1].age);
//
//     ////////////////////////////////////////////
//
//     results = g.v(10).out('knows').store('x',function(decAge){
//     var retVal = [];
//     _.each(this, function(element){
//     element.age -= decAge;
//     retVal.push(element);
//     });
//     return retVal;
//     }, 10).emit();
//
//     expect(results[0].age).toEqual(27);
//     expect(results[1].age).toEqual(32);
//
//     });
//
//     it("map", function(){
//
//     results = g.v(10).map('name', 'age');
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','marko');
//     expect(results).toContainMap('age',29);
//     expect(results).not.toContainMap(configTest.id,10);
//
//     results = g.v(10).map(['name', 'age']);
//     expect(results.length).toEqual(1);
//     expect(results).toContainMap('name','marko');
//     expect(results).toContainMap('age',29);
//     expect(results).not.toContainMap(configTest.id,10);
//     });
//
//     it("groupBy", function(){
//     results = g.V().outE().inV().groupBy('@type').stringify();
//     expect(results).toEqual('{"vertex":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"},{"name":"lop","lang":"java","@rid":30,"@type":"vertex"},{"name":"josh","age":32,"@rid":40,"@type":"vertex"},{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}');
//
//
//     results = g.V().outE().inV().groupBy('age','name').stringify();
//     expect(results).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//
//     results = g.V().outE().inV().groupBy(['age','name']).stringify();
//     expect(results).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//
//     var t = {};
//     results = g.V().outE().inV().groupBy(t,'age','name').emit();
//     expect(JSON.stringify(t)).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//     expect(results.length).toEqual(6);
//
//     var u = {};
//     results = g.V().outE().inV().groupBy(u,['age','name']).emit();
//     expect(JSON.stringify(u)).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//     expect(results.length).toEqual(6);
//     });
//
//     it("groupCount", function(){
//     results = g.V().outE().inV().groupCount('@type').stringify();
//     expect(results).toEqual('{"vertex":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"},{"name":"lop","lang":"java","@rid":30,"@type":"vertex"},{"name":"josh","age":32,"@rid":40,"@type":"vertex"},{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}');
//
//     results = g.V().outE().inV().groupCount('@type','name').stringify();
//     expect(results).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//
//     results = g.V().outE().inV().groupCount(['@type','name']).stringify();
//     expect(results).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//
//     var t = {};
//     results = g.V().outE().inV().groupCount(t, '@type','name').emit();
//     expect(JSON.stringify(t)).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//     expect(results.length).toEqual(6);
//
//     var u = {};
//     results = g.V().outE().inV().groupCount(u, ['@type','name']).emit();
//     expect(JSON.stringify(u)).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
//     expect(results.length).toEqual(6);
//
//     });
//
//     it("countBy", function(){
//
//     results = g.v(10).out('knows').countBy(configTest.type).emit();
//     expect(JSON.stringify(results)).toEqual('{"@type":2}');
//
//     results = g.v(10).out('knows').countBy([configTest.type, configTest.id]).emit();
//     expect(JSON.stringify(results)).toEqual('{"@type":2,"@rid":2}');
//
//     results = g.v(10).out('knows').countBy(configTest.type, configTest.id).emit();
//     expect(JSON.stringify(results)).toEqual('{"@type":2,"@rid":2}');
//
//     var t = {};
//     results = g.v(10).out('knows').countBy(t, [configTest.type, configTest.id]).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,40);
//
//     expect(JSON.stringify(t)).toEqual('{"@type":2,"@rid":2}');
//
//     var t = {};
//     results = g.v(10).out('knows').countBy(t, configTest.type, configTest.id).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,40);
//
//     expect(JSON.stringify(t)).toEqual('{"@type":2,"@rid":2}');
//
//     });
//
//     it("groupSum", function(){
//     results = g.v(10).out('knows').groupSum('age').emit();
//     expect(JSON.stringify(results)).toEqual('{"age":59}');
//
//     results = g.v(10).out('knows').groupSum('age', configTest.id).emit();
//     expect(JSON.stringify(results)).toEqual('{"age":59,"@rid":60}');
//
//     var t = {};
//     results = g.v(10).out('knows').groupSum(t, 'age', configTest.id).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,40);
//
//     expect(JSON.stringify(t)).toEqual('{"age":59,"@rid":60}');
//
//     var t = {};
//     results = g.v(10).out('knows').groupSum(t, ['age', configTest.id]).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,40);
//
//     expect(JSON.stringify(t)).toEqual('{"age":59,"@rid":60}');
//
//     });
//
//     });
//
//     describe("Branch-Based Steps", function() {
//     it('loop', function(){
//
//     results = g.v(10).out().loop(1, 2).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,50);
//     expect(results).toContainMap(configTest.id,30);
//
//     results = g.v(10).out().as('x').loop('x', 2).emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,50);
//     expect(results).toContainMap(configTest.id,30);
//
//     results = g.v(40).out().in().loop(2, 1).emit();
//     expect(results.length).toEqual(4);
//     expect(results).toContainMap(configTest.id,40);
//     expect(results).toContainMap(configTest.id,10);
//     expect(results).toContainMap(configTest.id,60);
//
//     results = g.v(40).out().as('x').in().loop('x', 1).emit();
//     expect(results.length).toEqual(4);
//     expect(results).toContainMap(configTest.id,40);
//     expect(results).toContainMap(configTest.id,10);
//     expect(results).toContainMap(configTest.id,60);
//
//
//     results = g.v(40).out().as('x').in().loop('x', 3).emit();
//     expect(results.length).toEqual(66);
//
//     results = g.v(40).out().in().loop(2, 3).emit();
//     expect(results.length).toEqual(66);
//
//     });
//
//     });
//
//     describe("sub graph", function() {
//     it('fork', function(){
//
//     var t = g.v(10).fork();
//     results = t.out().emit();
//     expect(results.length).toEqual(3);
//     expect(results).toContainMap(configTest.id,40);
//     expect(results).toContainMap(configTest.id,20);
//     expect(results).toContainMap(configTest.id,30);
//
//     results = t.out().emit();
//     expect(results.length).toEqual(2);
//     expect(results).toContainMap(configTest.id,50);
//     expect(results).toContainMap(configTest.id,30);
//
//     });
//
//     it('pin', function(){
//
//     var t = g.v(10).pin();
//     expect(t.out().emit()).toEqual(t.out().emit());
//
//
//     });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//     });*/

});