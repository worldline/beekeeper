/*global describe: true, after: true, before: true, it: true*/
var mocha             = require('mocha')
  , should            = require('should')
  , cfg               = require('../lib/config')
  , Node              = require('../lib/models/node')
  , async             = require('async')
  , resolver          = require('../lib/hierarchyResolver')

describe('Hierarchy Resolver', function() {
  describe('parsing a valid complex metric request', function() {
    var req = "sum(cpu(free).childOf([[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}],[{id:'aa4745475'}]]).gt(free,10)) / sum(cpu(free|user).childOf( [[{id:'aa4745475'}]])) * 100"
      , expectedExprs = [
            [[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}],[{id:'aa4745475'}]]
          , [[{id:'aa4745475'}]]
          ]
      , childOf1 = ['h1','h2','h3','h4']
      , childOf2 = ['h11','h12','h13']
      , expectedExplose = "sum(cpu(free).in(host,[\"h1\",\"h2\",\"h3\",\"h4\"]).gt(free,10))/sum(cpu(free|user).in(host,[\"h11\",\"h12\",\"h13\"]))*100"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw(childOf1, childOf2);
    })

    it('should explode childOfs correctly', function(){
      result.explode(childOf1, childOf2).should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial metric request with only a number', function() {
    var req = "100"
      , expectedExprs = []
      , expectedExplose = "100"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial math metric request with only numbers', function() {
    var req = "100+5"
      , expectedExprs = []
      , expectedExplose = "105"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial math metric request with only numbers but a unary -', function() {
    var req = "-100+5"
      , expectedExprs = []
      , expectedExplose = "-95"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial math metric request with only numbers but multiple unary -', function() {
    var req = "-- - 100+5"
      , expectedExprs = []
      , expectedExplose = "-95"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial math metric request with only numbers but an odd number of consecutive unary -', function() {
    var req = "- -100+5"
      , expectedExprs = []
      , expectedExplose = "105"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial math metric request with only numbers and parentheses', function() {
    var req = "(100+6) / 2"
      , expectedExprs = []
      , expectedExplose = "53"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid metric request with some spaces', function() {
    var req = "avg(memory( free))"
      , expectedExprs = []
      , expectedExplose = "avg(memory(free))"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid simple metric request without childOf', function() {
    var req = "min(memory(used))"
      , expectedExprs = []
      , expectedExplose = "min(memory(used))"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid trivial math metric request with numbers and metric request without childOf', function() {
    var req = "1024*1024 * avg(memory(free))"
      , expectedExprs = []
      , expectedExplose = "1048576*avg(memory(free))"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid metric request involving multiple operators and parentheses without childOf', function() {
    var req = "min(memory(used)) / (avg(memory(used)) + avg(memory(free)) + avg(memory(cached)) + avg(memory(buffered)))"
      , expectedExprs = []
      , expectedExplose = "min(memory(used))/(avg(memory(used))+avg(memory(free))+avg(memory(cached))+avg(memory(buffered)))"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid metric request involving multiple operators and parentheses without childOf', function() {
    var req = "min(memory(used)) / (avg(memory(used)) + avg(memory(free)) + avg(memory(cached)) + avg(memory(buffered)))"
      , expectedExprs = []
      , expectedExplose = "min(memory(used))/(avg(memory(used))+avg(memory(free))+avg(memory(cached))+avg(memory(buffered)))"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid metric request involving multiple operators, parentheses and literals without childOf', function() {
    var req = "(avg(memory(used)))/(1024*1024)"
      , expectedExprs = []
      , expectedExplose = "(avg(memory(used)))/1048576"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw();
    })

    it('should explode childOfs correctly', function(){
      result.explode().should.eql(expectedExplose);
    })
  })

  describe('parsing a valid metric request involving multiple operators and parentheses using childOf', function() {
    var req = "max(memory(used).childOf([[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}],[{id:'aa4745475'}]])) / (avg(memory(used)) + avg(memory(free)) + avg(memory(cached)) + avg(memory(buffered)))"
      , expectedExprs = [[[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}],[{id:'aa4745475'}]]]
      , childOf1 = ['h1','h2','h3','h4']
      , expectedExplose = "max(memory(used).in(host,[\"h1\",\"h2\",\"h3\",\"h4\"]))/(avg(memory(used))+avg(memory(free))+avg(memory(cached))+avg(memory(buffered)))"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw(childOf1);
    })

    it('should explode childOfs correctly', function(){
      result.explode(childOf1).should.eql(expectedExplose);
    })
  })


  describe('parsing a valid complex event request using childOf', function() {
    var req = "cpu(*).childOf([[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}]]).gt(free, 0)"
      , expectedExprs = [[[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}]]]
      , childOf1 = ['h1','h2','h3','h4']
      , expectedExplose = "cpu(*).in(host,[\"h1\",\"h2\",\"h3\",\"h4\"]).gt(free,0)"
      , result;

    it('should throw no error', function(){
      resolver.parse.should.not.throw(req);
      result = resolver.parse(req);
    })

    it('should extract correctly the hierarchy expressions', function(){
      result.exprs.should.eql(expectedExprs);
    })

    it('should explode childOfs with no error', function(){
      result.explode.should.not.throw(childOf1);
    })

    it('should explode childOfs correctly', function(){
      result.explode(childOf1).should.eql(expectedExplose);
    })

  })

//cpu(free| user).childOf([[{id:'a15e2e35e1e'}, {id:'74f57ff4s5s'}]]).gt(free, 0)
})