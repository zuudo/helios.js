describe("Helios", function() {

  var g = Helios.newGraph('../../data/graph-example-1.json');

  beforeEach(function() {
    this.addMatchers({
      //one param
      toContainKeyValue: function(){
        var arr = this.actual
          , key = arguments[0]
          , val = arguments[1]

        for (var i = 0, len = arr.length; i < len; i++){
            if (arr[i].data[key] === val){
              return true;
            };
        }
        return false;
      }
    });
  });

  it("Basic Traversals", function() {

    var results = [];

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
        /* Not implemented */
        /*
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
        expect(results.length).toEqual(1);

        expect(results).toContainKeyValue('_id', 5);
        expect(results).toContainKeyValue('_id', 4);
        */

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
        
        expect(g.v(1).outE('knows').value()).toContainKeyValue('_id', results[0].data._id);
        

        results = [];
        results = g.v(4).bothE('knows', 'created').value();
        expect(results.length).toEqual(3);

        expect(results).toContainKeyValue('_id', 8);
        expect(results).toContainKeyValue('_id', 11);
        expect(results).toContainKeyValue('_id', 10);

        ////////

        expect(g.v(1).out('knows', 'created').value().length).toEqual(3);
        expect(g.v(2).in('knows', 'created').value().length).toEqual(1);
        expect(g.v(2).in('knows', 'created').value()[0].data._id).toEqual(1);
        expect(g.v(4).both('knows', 'created').value().length).toEqual(3);
  });

  describe("Filter", function() {
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
      expect(results).toContainKeyValue('name','vadas');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas']).orFilter('gt', ['age', 25]).orFilter('eq', ['name', 'lop']).andFilter('eq',['age',32]).value();
      expect(results.length).toEqual(1);
      expect(results).toContainKeyValue('name','josh');

      results = [];
      results = g.v(1).out().filter('eq',['name','vadas'],'eq',['age',32]).orFilter('lt', ['age', 30])
                            .orFilter('eq', ['name', 'lop']).andFilter('eq',['age',32]).value();
      expect(results.length).toEqual(0);
      //expect(results).toContainKeyValue('name','josh');

      //expect(results).toContainKeyValue('name','vadas');
      //expect(results).toContainKeyValue('name','lop');
      //      expect(g.V().outE().inV().filter('eq',['name','lop']).id().value().length).toEqual(3);

    });
  });
});