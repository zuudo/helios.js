var expect = chai.expect;

var g;
before(function(){
    g = new Helios.GraphDatabase();
    var testData = {
      "graph": {
        "mode":"NORMAL",
        "vertices":[
          {"name":"marko","age":29,"_id":1,"_type":"vertex", "dow":["mon", "tue"], "dob":"1984-05-05", "active":true, "salary":"$120,000", "device":{"qty":3,"mobile":{"phone":["iphone", "samsung"], "tablet":["galaxy"]}}},
          {"name":"vadas","age":27,"_id":2,"_type":"vertex", "dow":["mon", "wed", "thu"], "dob":"1986-03-12", "active":false, "salary":"$100,000", "device":{"qty":1,"mobile":{"phone":["iphone"]}}},
          {"name":"lop","lang":"java","_id":3,"_type":"vertex"},
          {"name":"josh","age":32,"_id":4,"_type":"vertex", "dow":["fri"], "dob":"1981-09-01T00:00:00.000Z", "active":true, "salary":"$80,000", "device":{"qty":2,"mobile":{"phone":["iphone"], "tablet":["ipad"]}}},
          {"name":"ripple","lang":"java","_id":5,"_type":"vertex"},
          {"name":"peter","age":35,"_id":6,"_type":"vertex", "dow":["mon","fri"], "dob":"1978-12-13", "active":true, "salary":"$70,000", "device":{"qty":2,"mobile":{"phone":["iphone"], "tablet":["ipad"]}}}
        ],
        "edges":[
          {"weight":0.5,"_id":7,"_type":"edge","_outV":1,"_inV":2,"_label":"knows"},
          {"weight":1.0,"_id":8,"_type":"edge","_outV":1,"_inV":4,"_label":"knows"},
          {"weight":0.4,"_id":9,"_type":"edge","_outV":1,"_inV":3,"_label":"created"},
          {"weight":1.0,"_id":10,"_type":"edge","_outV":4,"_inV":5,"_label":"created"},
          {"weight":0.4,"_id":11,"_type":"edge","_outV":4,"_inV":3,"_label":"created"},
          {"weight":0.2,"_id":12,"_type":"edge","_outV":6,"_inV":3,"_label":"created"}
        ]
      }
    };

    g.loadGraphSON(testData);
});

after(function(){
    g.close();
});

describe('Simple Transform', function() {

    describe('id', function() {
        it("should return all ids", function(){
            var result = g.v().id().emit();
            expect(result).to.eql([1,2,3,4,5,6]);
        });
    });
  
    describe('label', function() {
        it("should return created", function(){
            var result = g.v(6).outE().label().emit();
            expect(result).to.eql(['created']);
        });
    });

    describe('key', function() {
        it("should return name property = lop", function(){
            var result = g.v(3).property('name').emit();
            expect(result).to.eql(['lop']);
        });
    });

    describe('v', function() {
      
        it("should return all vertices", function(){
            var result = g.v().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should get id 1", function(){
            var result = g.v(1).emit();
            expect(result.length).to.equal(1);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should return id 1 & 4", function(){
            var result = g.v(1, 4).emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return lang=java", function(){
            var result = g.v({'lang':{$eq:'java'}}).emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'lop');
            expect(result).to.have.deep.property('[1].name', 'ripple');
        });

        it("should return empty Array", function(){
            expect(g.v({'lang':{$eq:'something'}}).emit()).to.have.length(0);
        });

    });

    describe('e', function() {
          
        it("should return all vertices", function(){
            var result = g.e().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0]._id', 7);
        });

        it("should get id 1", function(){
            var result = g.e(7).emit();
            expect(result.length).to.equal(1);
        });

        it("should return empty Array", function(){
            expect(g.e({'lang':{$eq:'something'}}).emit()).to.have.length(0);
        });

        it("should return id 7 & 7", function(){
            var result = g.e(7, 7).emit();
            expect(result.length).to.equal(2);

        });

        it("should return lang=java", function(){
            var result = g.v({'lang':{$eq:'java'}}).emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'lop');
            expect(result).to.have.deep.property('[1].name', 'ripple');
        });

      });

    describe('v.out', function() {
          
        it("should get all out vertices", function(){
            var result = g.v().out().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should filter for 'knows'", function(){
            var result = g.v().out('knows').emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should filter for 'knows' as array", function(){
            var result = g.v().out(['knows']).emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should filter for 'knows' & 'created'", function(){
            var result = g.v().out('knows', 'created').emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'lop');
        });

        it("should filter for 'knows' & 'created' as array", function(){
            var result = g.v().out(['knows', 'created']).emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'lop');
        });

        it("should get out vertices from id 1", function(){
            var result = g.v(1).out().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should return out vertices from id 1 & 4", function(){
            var result = g.v(1, 4).out().emit();
            expect(result.length).to.equal(5);
            expect(result).to.have.deep.property('[0].name', 'vadas');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return out vertices from id 1 & 4 passed in as array", function(){
            var result = g.v([1, 4]).out().emit();
            expect(result.length).to.equal(5);
            expect(result).to.have.deep.property('[0].name', 'vadas');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return out vertices from name=marko", function(){
            var result = g.v({'name':{$eq:'marko'}}).out().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

      });

    describe('v.outE.inV', function() {
          
        it("should get all out vertices", function(){
            var result = g.v().outE().inV().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should filter for 'knows'", function(){
            var result = g.v().outE('knows').inV().emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should filter for 'knows' as array", function(){
            var result = g.v().outE(['knows']).inV().emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should filter for 'knows' & 'created'", function(){
            var result = g.v().outE('knows', 'created').inV().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'lop');
        });

        it("should filter for 'knows' & 'created' as array", function(){
            var result = g.v().outE(['knows', 'created']).inV().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'lop');
        });

        it("should get out vertices from id 1", function(){
            var result = g.v(1).outE().inV().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

        it("should return out vertices from id 1 & 4", function(){
            var result = g.v(1, 4).outE().inV().emit();
            expect(result.length).to.equal(5);
            expect(result).to.have.deep.property('[0].name', 'vadas');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return out vertices from id 1 & 4 passed in as array", function(){
            var result = g.v([1, 4]).outE().inV().emit();
            expect(result.length).to.equal(5);
            expect(result).to.have.deep.property('[0].name', 'vadas');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return out vertices from name=marko", function(){
            var result = g.v({'name':{$eq:'marko'}}).outE().inV().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'vadas');
        });

      });

    describe('v.in', function() {
          
        it("should get all in vertices", function(){
            var result = g.v().in().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'marko');
        });

        it("should filter for 'knows'", function(){
            var result = g.v().in('knows').emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows' as array", function(){
            var result = g.v().in(['knows']).emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows' & 'created'", function(){
            var result = g.v().in('knows', 'created').emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows' & 'created' as array", function(){
            var result = g.v().in(['knows', 'created']).emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should get in vertices from id 3", function(){
            var result = g.v(3).in().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should return in vertices from id 3 & 4", function(){
            var result = g.v(3, 4).in().emit();
            expect(result.length).to.equal(4);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return in vertices from id 3 & 4 passed in as array", function(){
            var result = g.v([3, 4]).in().emit();
            expect(result.length).to.equal(4);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return in vertices from name=lop", function(){
            var result = g.v({'name':{$eq:'lop'}}).in().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

      });

    describe('v.inE.outV', function() {
          
        it("should get all out vertices", function(){
            var result = g.v().inE().outV().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows'", function(){
            var result = g.v().inE('knows').outV().emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows' as array", function(){
            var result = g.v().inE(['knows']).outV().emit();
            expect(result.length).to.equal(2);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows' & 'created'", function(){
            var result = g.v().inE('knows', 'created').outV().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should filter for 'knows' & 'created' as array", function(){
            var result = g.v().inE(['knows', 'created']).outV().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should get out vertices from id 3", function(){
            var result = g.v(3).inE().outV().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

        it("should return out vertices from id 3 & 4", function(){
            var result = g.v(3, 4).inE().outV().emit();
            expect(result.length).to.equal(4);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return out vertices from id 3 & 4 passed in as array", function(){
            var result = g.v([3, 4]).inE().outV().emit();
            expect(result.length).to.equal(4);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return out vertices from name=lop", function(){
            var result = g.v({'name':{$eq:'lop'}}).inE().outV().emit();
            expect(result.length).to.equal(3);
            expect(result).to.have.deep.property('[0].name', 'marko');
        });

      });

    describe('v.both', function() {
      
        it("should get all out vertices", function(){
            var result = g.v().both().emit();
            expect(result.length).to.equal(12);
        });

        it("should filter for 'knows'", function(){
            var result = g.v().both('knows').emit();
            expect(result.length).to.equal(4);
        });

        it("should filter for 'knows' as array", function(){
            var result = g.v().both(['knows']).emit();
            expect(result.length).to.equal(4);
        });

        it("should filter for 'knows' & 'created'", function(){
            var result = g.v().both('knows', 'created').emit();
            expect(result.length).to.equal(12);
        });

        it("should filter for 'knows' & 'created' as array", function(){
            var result = g.v().both(['knows', 'created']).emit();
            expect(result.length).to.equal(12);
        });

        it("should get both vertices from id 4", function(){
            var result = g.v(4).both().emit();
            expect(result.length).to.equal(3);
        });

        it("should return both vertices from id 3 & 4", function(){
            var result = g.v(3, 4).both().emit();
            expect(result.length).to.equal(6);
        });

        it("should return both vertices from id 3 & 4 passed in as array", function(){
            var result = g.v([3, 4]).both().emit();
            expect(result.length).to.equal(6);
            expect(result).to.have.deep.property('[0].name', 'marko');
            expect(result).to.have.deep.property('[1].name', 'josh');
        });

        it("should return both vertices from name=josh", function(){
            var result = g.v({'name':{$eq:'josh'}}).both().emit();
            expect(result.length).to.equal(3);
        });

    });

    describe('v.bothE.bothV', function() {
          
        it("should get return bothE", function(){
            var result = g.v().bothE().emit();
            expect(result.length).to.equal(12);
        });

        it("should get all both vertices", function(){
            var result = g.v().bothE().bothV().emit();
            expect(result.length).to.equal(24);
        });

        it("should filter for 'knows'", function(){
            var result = g.v().bothE('knows').bothV().emit();
            expect(result.length).to.equal(8);
        });

        it("should filter for 'knows' as array", function(){
            var result = g.v().bothE(['knows']).bothV().emit();
            expect(result.length).to.equal(8);
       });

        it("should filter for 'knows' & 'created'", function(){
            var result = g.v().bothE('knows', 'created').bothV().emit();
            expect(result.length).to.equal(24);
        });

        it("should filter for 'knows' & 'created' as array", function(){
            var result = g.v().bothE(['knows', 'created']).bothV().emit();
            expect(result.length).to.equal(24);
        });

        it("should get both vertices from id 4", function(){
            expect(g.v(4).bothE().bothV().emit()).to.have.length(6);
        });

        it("should return both vertices from id 1 & 4", function(){
            expect(g.v(1, 4).bothE().bothV().emit()).to.have.length(12);

        });

        it("should return both vertices from id 1 & 4 passed in as array", function(){
            expect(g.v([1, 4]).bothE().bothV().emit()).to.have.length(12);

        });

        it("should return both vertices from name=marko", function(){
            var result = g.v({'name':{$eq:'marko'}}).bothE().bothV().emit();
            expect(result.length).to.equal(6);
        });
    });

     describe('hash', function() {
          
        it("should contain JSON object with keys 1 & 4", function(){
            var result = g.v(1, 4).hash().emit();
            expect(result).to.be.an('object');
            expect(result).to.include.keys('1','4');
        });
    });

});