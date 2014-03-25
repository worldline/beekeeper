/*global describe: true, after: true, before: true, it: true*/
var mocha             = require('mocha')
  , should            = require('should')
  , cfg               = require('../lib/config')
  , Node              = require('../lib/models/node')
  , async             = require('async')
  , createHierarchy   = require('./utils/create-hierarchy')
  , dropDatabase      = require('./utils/dropDatabase')

describe('Hierarchy', function() {
  before(function(done) {dropDatabase(Node, done)})
  after(function(done) {dropDatabase(Node, done)})

  before(function(done) {
    var nodes = createHierarchy.genTree(
      { types: ['a'], min: 2, max: 5 },
      { types: ['b', 'c', 'd', 'e', 'f'], min: 2, max: 10 },
      { types: ['g'], min: 1, max: 4 }
    )
    Node.create(nodes, done)
  })

  describe('Root Nodes', function() {
    it('should be found', function(done) {
      Node.roots(function(err, roots) {
        should.not.exist(err)
        roots.should.not.be.empty
        roots.forEach(function(root) {
          root.type.should.equal('a')
        })
        done()
      })
    })
  })

  describe('Node types', function() {
    it('should contain the ones created in the tree', function(done) {
      Node.types(function(err, types) {
        var expectedTypes = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        should.not.exist(err)
        types.sort().should.eql(expectedTypes)
        done()
      })
    })
  })

  describe('Node', function() {
    describe('children', function() {
      before(function(done) {
        var self = this
        Node.roots(function(err, roots) {
          should.not.exist(err)
          roots.should.not.be.empty
          var root = roots[0]
          root.children(function(err, children) {
            should.not.exist(err)
            self.roots = roots
            self.children = children
            done()
          })
        })
      })

      it('should be found', function(done) {
        this.children.should.not.be.empty
        done()
      })
      it('should be well structured', function(done) {
        this.children.forEach(function(child) {
          var expectedTypes = ['b', 'c', 'd', 'e', 'f']
          child.name.should.not.be.empty
          child.type.should.not.be.empty
          child.ancestors.should.not.be.empty
          child.should.not.have.property('disabled')
          child.should.have.property('parent')
          child.parent.toString().should.not.be.empty
          child.ancestors.should.include(child.parent)
          child.updated.should.be.below(Date.now())
          expectedTypes.should.include(child.type)
          child.ancestors.should.include(child.parent)
        })
        done()
      })
      it('should have children as well', function(done) {
        async.forEach(this.children, function(child, callback) {
          child.children(function(err, subchildren) {
            should.not.exist(err)
            subchildren.should.not.be.empty
            subchildren.forEach(function(leaf) {
              leaf.type.should.equal('g')
            })
            callback()
          })
        }, done)
      })
      it('can be disabled', function(done) {
        var lastChild = this.children[this.children.length-1]
        lastChild.disable(function(err) {
          should.not.exist(err)
          Node.findById(lastChild._id, function(err, node) {
            should.not.exist(err)
            node.disabled.should.be.true
            node.children(function(err, children) {
              children.should.be.empty
              done()
            })
          })
        })
      })
      it('should be able to move', function(done) {
        var child = this.children[0]
          , oldParent = child.parent
          , newParent = this.roots[1]._id
        child.changeParent(newParent, function(err) {
          Node.findById(child._id, function(err, newChild) {
            should.not.exist(err)
            newChild.parent.should.eql(newParent)
            newChild.ancestors.should.include(newParent)
            newChild.ancestors.should.not.include(oldParent)
            newChild.children(function(err, newChildren) {
              should.not.exist(err)
              newChildren.should.not.be.empty
              newChildren.forEach(function(child) {
                child.parent.should.eql(newChild._id)
                child.type.should.equal('g')
                newChild.ancestors.forEach(function(ancestor) {
                  child.ancestors.should.include(ancestor)
                  child.ancestors.should.not.include(oldParent)
                })
              })
              done()
            })
          })
        })
      })
      it('should be able to add child', function(done) {
        var child = this.children[0]

        child.addChild({ name: 'john', type: 'doe' }, function(err, newChild) {
          should.not.exist(err)
          newChild.name.should.equal('john')
          newChild.type.should.equal('doe')
          newChild.parent.should.eql(child._id)
          newChild.ancestors.should.include(child._id)
          newChild.ancestors.should.have.length(child.ancestors.length+1)
          child.ancestors.forEach(function(ancestor) {
            newChild.ancestors.should.include(ancestor)
          })
          done()
        })
      })
    })
  })
})
