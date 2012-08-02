describe("Heliosdb", function() {

  var results = [];
  var originalData = {
  "vertices":[
    {"name":"marko","age":29,"_id":1,"_type":"vertex"},
    {"name":"vadas","age":27,"_id":2,"_type":"vertex"},
    {"name":"lop","lang":"java","_id":3,"_type":"vertex"},
    {"name":"josh","age":32,"_id":4,"_type":"vertex"},
    {"name":"ripple","lang":"java","_id":5,"_type":"vertex"},
    {"name":"peter","age":35,"_id":6,"_type":"vertex"}
  ],
  "edges":[
    {"weight":0.5,"_id":7,"_type":"edge","_outV":1,"_inV":2,"_label":"knows"},
    {"weight":1.0,"_id":8,"_type":"edge","_outV":1,"_inV":4,"_label":"knows"},
    {"weight":0.4,"_id":9,"_type":"edge","_outV":1,"_inV":3,"_label":"created"},
    {"weight":1.0,"_id":10,"_type":"edge","_outV":4,"_inV":5,"_label":"created"},
    {"weight":0.4,"_id":11,"_type":"edge","_outV":4,"_inV":3,"_label":"created"},
    {"weight":0.2,"_id":12,"_type":"edge","_outV":6,"_inV":3,"_label":"created"}
  ]
  };

  var testData = {
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

 

  var testDataNoVertex = {
    "vertices":[],
    "edges":[
      {"weight":0.5,"_id":7,"_type":"edge","_outV":1,"_inV":2,"_label":"knows"},
      {"weight":1.0,"_id":8,"_type":"edge","_outV":1,"_inV":4,"_label":"knows"},
      {"weight":0.4,"_id":9,"_type":"edge","_outV":1,"_inV":3,"_label":"created"},
      {"weight":1.0,"_id":10,"_type":"edge","_outV":4,"_inV":5,"_label":"created"},
      {"weight":0.4,"_id":11,"_type":"edge","_outV":4,"_inV":3,"_label":"created"},
      {"weight":0.2,"_id":12,"_type":"edge","_outV":6,"_inV":3,"_label":"created"}
    ]
  };

  var configTest = {
    'id':'@rid',
    'label': '@label',
    'type':'@type',
    'outEid': '@outE',
    'inEid': '@inE',
    'outVid': '@outV',
    'inVid': '@inV',
    'vIndicies': ['name'],
    'eIndicies': ['@label']
  };
  
   var g= Helios.newGraph(configTest);
   g.graph.loadGraphSON(testData);

  // Helios.ENV = {
  //   'id':'@rid',
  //   'label': '@label',
  //   'type':'@type',
  //   'outEid': '@outE',
  //   'inEid': '@inE',
  //   'outVid': '@outV',
  //   'inVid': '@inV'
  // };

  //var g= Helios.newGraph(testData);
  

  beforeEach(function() {
    this.addMatchers({
      //one param
      
      toContainKeyValue: function(){
        var arr = this.actual
          , key = arguments[0]
          , val = arguments[1]

        for (var i = 0, len = arr.length; i < len; i++){
            if (arr[i].obj[key] === val){
              return true;
            };
        }
        return false;
      },

      //one param
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

  // describe('Import\\Export', function() {
  
  //   it("Load No Config", function() {
  //     g = Helios.newGraph(originalData);
  //     expect(g.V().value().length).toEqual(6);
  //     expect(g.E().value().length).toEqual(6);
  //   });

  //   it("Load No Vertex", function() {
  //     g = Helios.newGraph(testDataNoVertex);
  //     expect(g.V().value().length).toEqual(6);
  //     expect(g.E().value().length).toEqual(6);
  //   });  

  //   it("Load - config on ENV", function() {
  //     Helios.ENV.id = '@rid';
  //     g = Helios.newGraph();
  //     g.graph.loadGraphSON(testData);
  //     expect(g.V().value().length).toEqual(6);
  //     expect(g.E().value().length).toEqual(6);
  //   });


  //   it("Load - config first", function() {
  //     configTest = {'id':'@rid'};
  //     g = Helios.newGraph(testData, configTest);
  //     expect(g.V().value().length).toEqual(6);
  //     expect(g.E().value().length).toEqual(6);
  //   });

  // });

describe("Transform-Based Steps", function() {
  it("Basic", function() {


        expect(g.V().value().length).toEqual(6);
        expect(g.V().count()).toEqual(6);

        results = g.V('name','marko').value();
        expect(results.length).toEqual(1);
        expect(results).toContainMap('name','marko');

        expect(g.V('name','marko').out().value()).toEqual(g.v(10).out().value());

        expect(g.E().value().length).toEqual(6);

        results = g.E('@label','created').value();
        expect(results.length).toEqual(4);
        expect(results).toContainMap(configTest.id, 90);
        expect(results).toContainMap(configTest.id, 100);
        expect(results).toContainMap(configTest.id, 110);
        expect(results).toContainMap(configTest.id, 120);

        results = g.v(10).out().value();
        expect(results.length).toEqual(3);

        expect(results).toContainMap('name','josh');
        expect(results).toContainMap('name','vadas');
        expect(results).toContainMap('name','lop');

        results = g.v(10).out('knows').value();
        expect(results.length).toEqual(2);

        expect(results).toContainMap('name','josh');
        expect(results).toContainMap('name','vadas');

        results = g.v(10).out('nonExistentLabel').value();
        expect(results.length).toEqual(0);

        ////////////

        results = g.v(10).outE('knows').value();
        expect(results.length).toEqual(2);

        expect(results).toContainMap(configTest.id, 70);
        expect(results).toContainMap(configTest.id, 80);

        results = g.v(10).outE().value();
        expect(results.length).toEqual(3);

        expect(results).toContainMap(configTest.id, 70);
        expect(results).toContainMap(configTest.id, 80);
        expect(results).toContainMap(configTest.id, 90);


        /////////////

        results = g.v(40).in().value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 10);

        results = g.v(40).in('knows').value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 10);

        /////////////

        results = g.v(40).inE().value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 80);

        results = g.v(40).inE('knows').value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 80);

        /////////////

        results = g.v(40).both().value();
        expect(results.length).toEqual(3);

        expect(results).toContainMap(configTest.id, 10);
        expect(results).toContainMap(configTest.id, 30);
        expect(results).toContainMap(configTest.id, 50);

        results = g.v(40).both('created').value();
        expect(results.length).toEqual(2);

        expect(results).toContainMap(configTest.id, 30);
        expect(results).toContainMap(configTest.id, 50);

        /////////////

        results = g.v(40).bothE().value();
        expect(results.length).toEqual(3);

        expect(results).toContainMap(configTest.id, 100);
        expect(results).toContainMap(configTest.id, 110);
        expect(results).toContainMap(configTest.id, 80);

        results = g.v(40).bothE('created').value();
        expect(results.length).toEqual(2);

        expect(results).toContainMap(configTest.id, 100);
        expect(results).toContainMap(configTest.id, 110);

        /////////////

        results = g.e(100).outV().value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 40);

        results = g.e(100).inV().value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 50);

        results = g.e(100).bothV().value();
        expect(results.length).toEqual(2);

        expect(results).toContainMap(configTest.id, 50);
        expect(results).toContainMap(configTest.id, 40);
 
        /////////////

        results = g.v(10).outE('knows', 'created').value();
        expect(results.length).toEqual(3);

        expect(results).toContainMap(configTest.id, 70);
        expect(results).toContainMap(configTest.id, 80);
        expect(results).toContainMap(configTest.id, 90);

        results = g.v(20).inE('knows', 'created').value();
        expect(results.length).toEqual(1);

        expect(results).toContainMap(configTest.id, 70);

        results = g.v(20).inE('knows', 'created').value();
        expect(results.length).toEqual(1);
        expect(results).toContainMap(configTest.id, 70);
        
        expect(g.v(10).outE('knows').value()).toContainMap(configTest.id, results[0][configTest.id]);
        
        results = g.v(40).bothE('knows', 'created').value();
        expect(results.length).toEqual(3);

        expect(results).toContainMap(configTest.id, 80);
        expect(results).toContainMap(configTest.id, 110);
        expect(results).toContainMap(configTest.id, 100);

        ////////

        expect(g.v(10).out('knows', 'created').value().length).toEqual(3);
        expect(g.v(20).in('knows', 'created').value().length).toEqual(1);
        expect(g.v(20).in('knows', 'created').value()[0][configTest.id]).toEqual(10);
        expect(g.v(40).both('knows', 'created').value().length).toEqual(3);

  });

  it("tail", function() {
    results = g.v(10).tail().value();
    expect(results.length).toEqual(3);
    expect(results).toContainMap(configTest.id, 20);
    expect(results).toContainMap(configTest.id, 30);
    expect(results).toContainMap(configTest.id, 50);

    results = g.v(10).tail('knows').value();
    expect(results.length).toEqual(2);
    expect(results).toContainMap(configTest.id, 20);
    expect(results).toContainMap(configTest.id, 40);

    results = g.V().tail().value();
    expect(results.length).toEqual(3);
    expect(results).toContainMap(configTest.id, 20);
    expect(results).toContainMap(configTest.id, 30);
    expect(results).toContainMap(configTest.id, 50);

    results = g.V().tail('knows').value();
    expect(results.length).toEqual(2);
    expect(results).toContainMap(configTest.id, 20);
    expect(results).toContainMap(configTest.id, 40);

  });

  it("head", function() {
        results = g.v(40).head().value();
        expect(results.length).toEqual(1);
        expect(results).toContainMap(configTest.id, 10);

        results = g.v(40).head('knows').value();
        expect(results.length).toEqual(1);
        expect(results).toContainMap(configTest.id, 10);

        results = g.V().head().value();
        expect(results.length).toEqual(2);
        expect(results).toContainMap(configTest.id, 10);
        expect(results).toContainMap(configTest.id, 60);

        results = g.V().head('knows').value();
        expect(results.length).toEqual(1);
        expect(results).toContainMap(configTest.id, 10);
  });

  it("path", function() {
    results = g.v(10).out('knows').path();
    expect(results.length).toEqual(3);

    expect(results[0]).toEqual('{"step 1":["v[10]"],"step 2":["v[20]","v[40]"]}');
    expect(results[1].obj[configTest.id]).toEqual(20);
    expect(results[2].obj[configTest.id]).toEqual(40);
  });

});
  describe("Filter-Based Steps", function() {
    it("closure", function(){
      
      results = g.v(10).filter(function(name) {  return this.name === name; },'marko').value();
      expect(results.length).toEqual(1);

      results = g.v(10).outE().inV().filter(function() { return true; }).value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap(configTest.id, 20);
      expect(results).toContainMap(configTest.id, 30);
      expect(results).toContainMap(configTest.id, 40);

      results = g.v(10).outE().inV().filter(function() { return false; }).value();
      expect(results.length).toEqual(0);

      results = g.v(10).outE().inV().filter(function() { return this[configTest.id] === g.v(20).value()[0][configTest.id]; }).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id, 20);

      results = g.v(10).outE().inV().filter(function() { return false; })
                    .orFilter(function() { return this[configTest.id] === 20; }).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id, 20);

      ///////////////////////////////////////////////////////////////////////////
   
      results = g.v(10).outE().inV().filter(function() { return false; })
                    .orFilter(function() { return this[configTest.id] === 20; })
                    .andFilter(function() { return this.name === 'vadas'; } ).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id, 20);

      ///////////////////////////////////////////////////////////////////////////
      
      results = g.v(10).outE().inV().filter(function() { return false; })
                    .orFilter(function() { return this[configTest.id] === 20; })
                    .andFilter(function() { return this.name === 'josh';}).value();

      expect(results.length).toEqual(0);

    });

    it("eq", function() {
      results = g.v(10).out().filter('eq',['name','vadas']).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','vadas');

      expect(g.V().outE().inV().filter('eq',['name','lop']).id().length).toEqual(3);
      expect(g.E().outV().inE().label().length).toEqual(2);

    });
    it("neq", function() {
      results = g.v(10).out().filter('neq',['name','vadas']).value();
      expect(results.length).toEqual(2);
        expect(results).toContainMap('name','josh');
        expect(results).toContainMap('name','lop');
    });
    it("lt", function() {
      results = g.v(10).out().filter('lt',['age',30]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','vadas');
    });
    it("lte", function() {
      results = g.v(10).out().filter('lte',['age',27]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','vadas');
    });
    it("gt", function() {
      results = g.v(10).out().filter('gt',['age',30]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','josh');
    });
    it("gte", function() {
      results = g.v(10).out().filter('gte',['age',32]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','josh');
    });
    it("btwn", function() {
      results = g.v(10).out().filter('btwn',['age',30, 33]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','josh');
    });
    it("has", function() {
      results = g.v(10).out().filter('has',['keys','name', 'age']).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap('name','josh');
      expect(results).toContainMap('name','vadas');
      
      results = [];
      results = g.v(10).out().filter('has',['keys', 'age', 'lang']).value();
      expect(results.length).toEqual(0);

    });
    it("hasNot", function() {
      results = g.v(10).out().filter('hasNot',['keys','name', 'age']).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','lop');

      results = [];

      results = g.v(10).out().filter('hasNot',['keys', 'age']).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','lop');

    });
    it("hasAny", function() {
      results = g.v(10).out().filter('hasAny',['keys', 'age', 'lang']).value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap('name','josh');
      expect(results).toContainMap('name','vadas');
      expect(results).toContainMap('name','lop');
    });

    it("hasAny values", function() {
      results = g.v(10).out().filter('hasAny',['values', 'josh', 'lop']).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap('name','josh');
      expect(results).toContainMap('name','lop');
    });

    it("hasNotAny", function() {
      results = g.v(10).out().filter('hasNotAny',['keys', 'name', 'age']).value();
      expect(results.length).toEqual(0);
    });

    it("and queries", function() {
      results = g.v(10).out().filter('eq',['name','vadas'], 'gt', ['age', 25]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','vadas');

      results = [];
      results = g.v(10).out().filter('eq',['name','vadas']).andFilter('gt', ['age', 25]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','vadas');      

      results = [];
      results = g.v(10).out().filter('eq',['name','vadas']).andFilter('lt', ['age', 25]).value();
      expect(results.length).toEqual(0);

    });
    it("or queries", function() {
      results = g.v(10).out().filter('eq',['name','vadas', 'age', 32]).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap('name','josh');
      expect(results).toContainMap('name','vadas');

      results = [];
      results = g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap('name','josh');
      expect(results).toContainMap('name','vadas');

      results = [];
      results = g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop']).value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap('name','josh');
      expect(results).toContainMap('name','vadas');
      expect(results).toContainMap('name','lop');

      results = [];
      results = g.v(10).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop'])
                              .andFilter('eq',['age',32]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','josh');

      results = [];
      results = g.v(10).out().filter('eq',['name','vadas'],'eq',['age',32]).orFilter('lt', ['age', 30])
                            .orFilter('eq', ['name', 'lop']).andFilter('eq',['age',32]).value();
      expect(results.length).toEqual(0);

    });
    it("dedup", function() {
      results = g.v(10).out().in().dedup().value();
      expect(results.length).toEqual(3);
    });

    it("back", function(){
      results = g.v(10).out().in().back(1).value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,30);
      expect(results).toContainMap(configTest.id,40);

      results = g.v(10).out().in().back(2).value();
      expect(results.length).toEqual(1);
      expect(results[0][configTest.id]).toEqual(10);            

      results = g.v(10).out().as('x').in().back('x').value();
      expect(results.length).toEqual(3);

      var x = [];
      results = g.v(10).out().store(x).in().back(x).value();
      expect(results.length).toEqual(3);

    });

    it("except", function(){
      results = g.v(10).out().store('x').out().except('x').value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id,50);
    });

    it("except with Array", function(){
      var x = [];
      results = g.v(10).out().store(x).out().except(x).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id,50);
    });
    
    it("retain", function(){
      results = g.v(10).out().store('x').out().retain('x').value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id,30);
    });

    it("retain with Array", function(){
      var x = [];
      results = g.v(10).out().store(x).out().retain(x).value();
      expect(results.length).toEqual(1);
      expect(results).toContainMap(configTest.id,30);
    });
  });

  describe("SideEffect-Based Steps", function() {


    it("as", function(){
      results = g.v(10).out().as('x').in().back('x').value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,30);
      expect(results).toContainMap(configTest.id,40);

       results = g.v(10).as('y').out().in().back('y').value();
       expect(results.length).toEqual(1);
       expect(results).toContainMap(configTest.id,10);

    });

    it("generic step", function(){
      results = g.v(10).out().step(function(){ 
                                var arr = []; 
                                _.each(this, function(element){
                                  arr.push(element)}); 
                                return arr; }).value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,30);
      expect(results).toContainMap(configTest.id,40);

      results = g.v(10).out().step(function(){ return this; }).in().value();
      expect(results.length).toEqual(5);
      expect(results).toContainMap(configTest.id,10);
      expect(results).toContainMap(configTest.id,40);
      expect(results).toContainMap(configTest.id,60);

      // results = [];
      // var x = 3;
      // results = g.v(10).out().step(function(x){ return x + 1; }, x).value();
      // expect(results).toEqual(4);

    });

    it("store", function(){

      results = g.v(10).outE().inV().store().value();
      results2 = g.v(10).outE().inV().value();
      expect(results).toEqual(results2);

      ////////////////////////////////////////////

      var x = [];
      results = g.v(10).outE().inV().store(x).value();
      
      expect(results.length).toEqual(x.length);

      //////////////////////////////////////////

      x = [];
      results = g.v(10).out('knows').store(x, function(incAge){
                      var retVal = [];
                        _.each(this, function(element){
                          element.obj.age += incAge;
                          retVal.push(element);
                        });
                      return retVal;
                    }, [10]).value();
      
      expect(results[0].age).toEqual(37);
      expect(results[1].age).toEqual(42);
      expect(results[0].age).toEqual(x[0].obj.age);
      expect(results[1].age).toEqual(x[1].obj.age);

      ////////////////////////////////////////////

      results = g.v(10).out('knows').store('x',function(decAge){
                      var retVal = [];
                        _.each(this, function(element){
                          element.obj.age -= decAge;
                          retVal.push(element);
                        });
                      return retVal;
                    }, 10).value();
      
      expect(results[0].age).toEqual(27);
      expect(results[1].age).toEqual(32);

    });

    it("map", function(){

      results = g.v(10).map('name', 'age');
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','marko');
      expect(results).toContainMap('age',29);
      expect(results).not.toContainMap(configTest.id,10);

      results = g.v(10).map(['name', 'age']);
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','marko');
      expect(results).toContainMap('age',29);
      expect(results).not.toContainMap(configTest.id,10);
    });

    it("groupBy", function(){
      results = g.V().outE().inV().groupBy('@type').stringify();
      expect(results).toEqual('{"vertex":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"},{"name":"lop","lang":"java","@rid":30,"@type":"vertex"},{"name":"josh","age":32,"@rid":40,"@type":"vertex"},{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}');


      results = g.V().outE().inV().groupBy('age','name').stringify();
      expect(results).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');

      results = g.V().outE().inV().groupBy(['age','name']).stringify();
      expect(results).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');

      var t = {};
      results = g.V().outE().inV().groupBy(t,'age','name').value();
      expect(JSON.stringify(t)).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
      expect(results.length).toEqual(6);

      var u = {};
      results = g.V().outE().inV().groupBy(u,['age','name']).value();
      expect(JSON.stringify(u)).toEqual('{"27":{"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}]},"32":{"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}]},"undefined":{"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
      expect(results.length).toEqual(6);
    });

    it("groupCount", function(){
      results = g.V().outE().inV().groupCount('@type').stringify();
      expect(results).toEqual('{"vertex":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"},{"name":"lop","lang":"java","@rid":30,"@type":"vertex"},{"name":"josh","age":32,"@rid":40,"@type":"vertex"},{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}');

      results = g.V().outE().inV().groupCount('@type','name').stringify();
      expect(results).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');

      results = g.V().outE().inV().groupCount(['@type','name']).stringify();
      expect(results).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');

      var t = {};
      results = g.V().outE().inV().groupCount(t, '@type','name').value();
      expect(JSON.stringify(t)).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
      expect(results.length).toEqual(6);

      var u = {};
      results = g.V().outE().inV().groupCount(u, ['@type','name']).value();
      expect(JSON.stringify(u)).toEqual('{"vertex":{"count":4,"vadas":[{"name":"vadas","age":27,"@rid":20,"@type":"vertex"}],"lop":[{"name":"lop","lang":"java","@rid":30,"@type":"vertex"}],"josh":[{"name":"josh","age":32,"@rid":40,"@type":"vertex"}],"ripple":[{"name":"ripple","lang":"java","@rid":50,"@type":"vertex"}]}}');
      expect(results.length).toEqual(6);

    });

    it("countBy", function(){

      results = g.v(10).out('knows').countBy(configTest.type).value();
      expect(JSON.stringify(results)).toEqual('{"@type":2}');

      results = g.v(10).out('knows').countBy([configTest.type, configTest.id]).value();
      expect(JSON.stringify(results)).toEqual('{"@type":2,"@rid":2}');

      results = g.v(10).out('knows').countBy(configTest.type, configTest.id).value();
      expect(JSON.stringify(results)).toEqual('{"@type":2,"@rid":2}');

      var t = {};
      results = g.v(10).out('knows').countBy(t, [configTest.type, configTest.id]).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,40);      

      expect(JSON.stringify(t)).toEqual('{"@type":2,"@rid":2}');

      var t = {};
      results = g.v(10).out('knows').countBy(t, configTest.type, configTest.id).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,40);      

      expect(JSON.stringify(t)).toEqual('{"@type":2,"@rid":2}');

    });

    it("groupSum", function(){
      results = g.v(10).out('knows').groupSum('age').value();
      expect(JSON.stringify(results)).toEqual('{"age":59}');

      results = g.v(10).out('knows').groupSum('age', configTest.id).value();
      expect(JSON.stringify(results)).toEqual('{"age":59,"@rid":60}');

      var t = {};
      results = g.v(10).out('knows').groupSum(t, 'age', configTest.id).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,40);      

      expect(JSON.stringify(t)).toEqual('{"age":59,"@rid":60}');

      var t = {};
      results = g.v(10).out('knows').groupSum(t, ['age', configTest.id]).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,40);      

      expect(JSON.stringify(t)).toEqual('{"age":59,"@rid":60}');

    });

  });

  describe("Branch-Based Steps", function() {
    it('loop', function(){

      results = g.v(10).out().loop(1, 2).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,50);
      expect(results).toContainMap(configTest.id,30);      

      results = g.v(10).out().as('x').loop('x', 2).value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,50);
      expect(results).toContainMap(configTest.id,30);     

      results = g.v(40).out().in().loop(2, 1).value();
      expect(results.length).toEqual(4);
      expect(results).toContainMap(configTest.id,40);
      expect(results).toContainMap(configTest.id,10);
      expect(results).toContainMap(configTest.id,60);

      results = g.v(40).out().as('x').in().loop('x', 1).value();
      expect(results.length).toEqual(4);
      expect(results).toContainMap(configTest.id,40);
      expect(results).toContainMap(configTest.id,10);
      expect(results).toContainMap(configTest.id,60);


      results = g.v(40).out().as('x').in().loop('x', 3).value();
      expect(results.length).toEqual(66);

      results = g.v(40).out().in().loop(2, 3).value();
      expect(results.length).toEqual(66);

    });

  });

  describe("sub graph", function() {
    it('fork', function(){

      var t = g.v(10).fork();
      results = t.out().value();
      expect(results.length).toEqual(3);
      expect(results).toContainMap(configTest.id,40);
      expect(results).toContainMap(configTest.id,20);
      expect(results).toContainMap(configTest.id,30);  

      results = t.out().value();
      expect(results.length).toEqual(2);
      expect(results).toContainMap(configTest.id,50);
      expect(results).toContainMap(configTest.id,30);          

    });

    it('pin', function(){

      var t = g.v(10).pin();
      expect(t.out().value()).toEqual(t.out().value());
      

    });


















  });
});






