describe("Heliosdb", function() {

  var testData = {
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

  var g = Helios.newGraph(testData);

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

  it("Basic Traversals and Transforms", function() {

    var results = [];


        expect(g.V().value().length).toEqual(6);

        expect(g.E().value().length).toEqual(6);

        results = [];
        results = g.v(1).out().value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('name','josh');
        expect(results).toContainKeyValue('name','vadas');
        expect(results).toContainKeyValue('name','lop');

        results = [];
        results = g.v(1).out('knows').value();
        expect(results.length).toEqual(2);

        expect(results).toContainKeyValue('name','josh');
        expect(results).toContainKeyValue('name','vadas');

        ////////////

        results = [];
        results = g.v(1).outE('knows').value();
        expect(results.length).toEqual(2);

        expect(results).toContainKeyValue('_id', 7);
        expect(results).toContainKeyValue('_id', 8);

        results = [];
        results = g.v(1).outE().value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('_id', 7);
        expect(results).toContainKeyValue('_id', 8);
        expect(results).toContainKeyValue('_id', 9);


        /////////////

        results = [];
        results = g.v(4).in().value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 1);

        results = [];
        results = g.v(4).in('knows').value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 1);

        /////////////

        results = [];
        results = g.v(4).inE().value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 8);

        results = [];
        results = g.v(4).inE('knows').value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 8);

        /////////////

        results = [];
        results = g.v(4).both().value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('_id', 1);
        expect(results).toContainKeyValue('_id', 3);
        expect(results).toContainKeyValue('_id', 5);

        results = [];
        results = g.v(4).both('created').value();
        expect(results.length).toEqual(2);

        expect(results).toContainKeyValue('_id', 3);
        expect(results).toContainKeyValue('_id', 5);

        /////////////

        results = [];
        results = g.v(4).bothE().value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('_id', 10);
        expect(results).toContainKeyValue('_id', 11);
        expect(results).toContainKeyValue('_id', 8);

        results = [];
        results = g.v(4).bothE('created').value();
        expect(results.length).toEqual(2);

        expect(results).toContainKeyValue('_id', 10);
        expect(results).toContainKeyValue('_id', 11);

        /////////////

        results = [];
        results = g.e(10).outV().value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 4);

        results = [];
        results = g.e(10).inV().value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 5);

        results = [];
        results = g.e(10).bothV().value();
        expect(results.length).toEqual(2);

        expect(results).toContainKeyValue('_id', 5);
        expect(results).toContainKeyValue('_id', 4);
 
        /////////////

        results = [];
        results = g.v(1).outE('knows', 'created').value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('_id', 7);
        expect(results).toContainKeyValue('_id', 8);
        expect(results).toContainKeyValue('_id', 9);

        results = [];
        results = g.v(2).inE('knows', 'created').value();
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 7);

        results = [];
        results = g.v(2).inE('knows', 'created').value();
        expect(results.length).toEqual(1);
        expect(results).toContainKeyValue('_id', 7);
        
        expect(g.v(1).outE('knows').value()).toContainKeyValue('_id', results[0].obj._id);
        

        results = [];
        results = g.v(4).bothE('knows', 'created').value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('_id', 8);
        expect(results).toContainKeyValue('_id', 11);
        expect(results).toContainKeyValue('_id', 10);

        ////////

        expect(g.v(1).out('knows', 'created').value().length).toEqual(3);
        expect(g.v(2).in('knows', 'created').value().length).toEqual(1);
        expect(g.v(2).in('knows', 'created').value()[0].obj._id).toEqual(1);
        expect(g.v(4).both('knows', 'created').value().length).toEqual(3);
  });

  describe("Filter-Based Steps", function() {
    it("closure", function(){
      var results = g.v(1).outE().inV().filter(function() { return this; }).value();
      expect(results.length).toEqual(3);
      expect(results).toContainKeyValue('_id', 2);
      expect(results).toContainKeyValue('_id', 3);
      expect(results).toContainKeyValue('_id', 4);

      var results = g.v(1).outE().inV().filter(function() { return []; }).value();
      expect(results.length).toEqual(0);

      var results = g.v(1).outE().inV().filter(function() {   
                                                              var arr = [];
                                                              _.each(this, function(element){
                                                                if(_.isEqual(element.obj, g.v(2).value()[0].obj)){
                                                                  arr.push(element);
                                                                }
                                                              });
                                                            return arr;
                                                          }).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('_id', 2);

      var results = g.v(1).outE().inV().filter(function() { return false; })
                    .orFilter(function() {
                      var arr = [];
                      _.each(this, function(element){
                        if(element.obj._id === 2){
                          arr.push(element);
                        }
                      });
                      return arr;}).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('_id', 2);

      var results = g.v(1).outE().inV().filter(function() { return false; })
                    .orFilter(function() {
                      var arr = [];
                      _.each(this, function(element){
                        if(element.obj._id === 2){
                          arr.push(element);
                        }
                      });
                      return arr; })
                    .andFilter(function() { var arr = [];
                      _.each(this, function(element){
                        if(element.obj.name === 'vadas'){
                          arr.push(element);
                        }
                      });
                      return arr; }).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('_id', 2);

      var results = g.v(1).outE().inV().filter(function() { return false; })
                    .orFilter(function() {
                      var arr = [];
                      _.each(this, function(element){
                        if(element.obj._id === 2){
                          arr.push(element);
                        }
                      });
                      return arr;
                      })
                    .andFilter(function() { 
                      var arr = [];
                      _.each(this, function(element){
                        if(element.obj.name === 'josh'){
                          arr.push(element);
                        }
                      });
                      return arr;
                     }).value();

      expect(results.length).toEqual(0);

    });

    it("eq", function() {
      var results = g.v(1).out().filter('eq',['name','vadas']).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','vadas');

      expect(g.V().outE().inV().filter('eq',['name','lop']).id().value().length).toEqual(3);

    });
    it("neq", function() {
      var results = g.v(1).out().filter('neq',['name','vadas']).value();
      expect(results.length).toEqual(2);
        expect(results).toContainKeyValue('name','josh');
        expect(results).toContainKeyValue('name','lop');
    });
    it("lt", function() {
      var results = g.v(1).out().filter('lt',['age',30]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','vadas');
    });
    it("lte", function() {
      var results = g.v(1).out().filter('lte',['age',27]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','vadas');
    });
    it("gt", function() {
      var results = g.v(1).out().filter('gt',['age',30]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','josh');
    });
    it("gte", function() {
      var results = g.v(1).out().filter('gte',['age',32]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','josh');
    });
    it("btwn", function() {
      var results = g.v(1).out().filter('btwn',['age',30, 33]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','josh');
    });
    it("has", function() {
      var results = g.v(1).out().filter('has',['keys','name', 'age']).value();
      expect(results.length).toEqual(2);
      expect(results).toContainKeyValue('name','josh');
      expect(results).toContainKeyValue('name','vadas');
      
      results = [];
      results = g.v(1).out().filter('has',['keys', 'age', 'lang']).value();
      expect(results.length).toEqual(0);

    });
    it("hasNot", function() {
      var results = g.v(1).out().filter('hasNot',['keys','name', 'age']).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','lop');

      results = [];

      results = g.v(1).out().filter('hasNot',['keys', 'age']).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','lop');

    });
    it("hasAny", function() {
      var results = g.v(1).out().filter('hasAny',['keys', 'age', 'lang']).value();
      expect(results.length).toEqual(3);
      expect(results).toContainKeyValue('name','josh');
      expect(results).toContainKeyValue('name','vadas');
      expect(results).toContainKeyValue('name','lop');
    });

    it("hasNotAny", function() {
      var results = g.v(1).out().filter('hasNotAny',['keys', 'name', 'age']).value();
      expect(results.length).toEqual(0);
    });
    it("match", function() {
      var results = g.v(1).out().filter('match',['keys', 'name', 'age']).value();
      expect(results.length).toEqual(2);
      expect(results).toContainKeyValue('name','josh');
      expect(results).toContainKeyValue('name','vadas');
      
      results = [];
      results = g.v(1).out().filter('match',['keys', 'name']).value();
      expect(results.length).toEqual(0);
    });
    it("and queries", function() {
      var results = g.v(1).out().filter('eq',['name','vadas'], 'gt', ['age', 25]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','vadas');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas']).andFilter('gt', ['age', 25]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','vadas');      

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas']).andFilter('lt', ['age', 25]).value();
      expect(results.length).toEqual(0);

    });
    it("or queries", function() {
      var results = g.v(1).out().filter('eq',['name','vadas', 'age', 32]).value();
      expect(results.length).toEqual(2);
      expect(results).toContainKeyValue('name','josh');
      expect(results).toContainKeyValue('name','vadas');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).value();
      expect(results.length).toEqual(2);
      expect(results).toContainKeyValue('name','josh');
      expect(results).toContainKeyValue('name','vadas');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop']).value();
      expect(results.length).toEqual(3);
      expect(results).toContainKeyValue('name','josh');
      expect(results).toContainKeyValue('name','vadas');
      expect(results).toContainKeyValue('name','lop');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop']).andFilter('eq',['age',32]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','josh');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas'],'eq',['age',32]).orFilter('lt', ['age', 30])
                            .orFilter('eq', ['name', 'lop']).andFilter('eq',['age',32]).value();
      expect(results.length).toEqual(0);

    });
  });

  describe("SideEffect-Based Steps", function() {
    it("aggregation No Cap", function(){

      var results = g.v(1).outE().inV().aggregate('x').outE().inV()
                    .filter(function(x) { 
                      var retVal = [], isContained = false;
                      _.each(this, function(element){
                        isContined = false;
                        _.each(x, function(item){ 
                             if(item.obj._id === element.obj._id) {
                               isContained = true;
                              }
                           });
                        if(!isContained){
                          retVal.push(element);
                        }
                      });
                      return retVal;}, 'x').value();

      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('_id',5);

      ///////////////////////////////////////////

      results = [];
      results = g.v(1).outE().inV().aggregate().value();
      var results2 = g.v(1).outE().inV().value();
      expect(results).toEqual(results2);

      ////////////////////////////////////////////

      results = [];
      var x = [];
      results = g.v(1).outE().inV().aggregate(x).value();
      
      expect(results).toEqual(x);

      ////////////////////////////////////////////

      results = [];
      x = [];
      results = g.v(1).out('knows').aggregate(x, function(incAge){
                      var retVal = [];
                        _.each(this, function(element){
                          element.obj.age += incAge;
                          retVal.push(element);
                        });
                      return retVal;}, 10).value();
      
      expect(results[0].obj.age).toEqual(37);
      expect(results[1].obj.age).toEqual(42);
      expect(results[0].obj.age).toEqual(x[0].obj.age);
      expect(results[1].obj.age).toEqual(x[1].obj.age);

      ////////////////////////////////////////////

      results = [];
      results = g.v(1).out('knows').aggregate(function(decAge){
                      var retVal = [];
                        _.each(this, function(element){
                          element.obj.age -= decAge;
                          retVal.push(element);
                        });
                      return retVal;}, 10).value();
      
      expect(results[0].obj.age).toEqual(27);
      expect(results[1].obj.age).toEqual(32);

    });
  
    // it("aggregation Cap", function(){

    //   var results = g.v(1).outE().inV().aggregate('x').outE().inV()
    //                 .filter(function(x) { 
    //                           var retVal = true;
    //                           _.each(x, function(item){ 
    //                             if(retVal) {
    //                               retVal = item.obj._id !== this.obj._id;
    //                             }
    //                           }, this); 
    //                         return retVal;}, 'x').value();
    //   expect(results.length).toEqual(1);
    //   expect(results).toContainKeyValue('_id',5);

    //   results = [];
    //   results = g.v(1).outE().inV().aggregate().value();
    //   var results2 = g.v(1).outE().inV().value();
    //   expect(results.length).toEqual(results2.length);

    //   for(var i = 0, len = results.length; i < len; i++){
    //     expect(results[i].obj._id).toEqual(results2[i].obj._id);
    //   }
    // });

    it("generic step", function(){
      var results = g.v(1).out().step(function(){ 
                                var arr = []; 
                                _.each(this, function(element){
                                  arr.push(element.obj.name)}); 
                                return arr; }).value();
      expect(results.length).toEqual(3);
      expect(results).toContain('vadas');
      expect(results).toContain('josh');
      expect(results).toContain('lop');

      results = [];
      results = g.v(1).out().step(function(){ return this; }).in().value();
      expect(results.length).toEqual(5);
      expect(results).toContainKeyValue('_id',1);
      expect(results).toContainKeyValue('_id',4);
      expect(results).toContainKeyValue('_id',6);

      results = [];
      var x = 3;
      results = g.v(1).out().step(function(x){ return x + 1; }, x).value();
      expect(results).toEqual(4);

    });

    it("map", function(){
      var results = g.v(1).out().map();
      expect(results.length).toEqual(3);

      results = [];
      results = g.v(1).map();
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','marko');
      expect(results).toContainMap('_id',1);

      results = [];
      results = g.v(1).map('name', 'age');
      expect(results.length).toEqual(1);
      expect(results).toContainMap('name','marko');
      expect(results).toContainMap('age',29);
      expect(results).not.toContainMap('_id',1);

    });

  });


});








