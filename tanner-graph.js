// author: anil.uzumcuoglu

var TannerGraph = function(matrix){
  this.matrix = matrix;

  this.symbolNodes = matrix[0].map( (_, index) => {
    return {
      matrixIdx: index,
      id: index,
      label: 'S' + index,
      connections: [],
      group: 'symbol'
    };
  });

  this.checkNodes = matrix.map( (_, index) => {
    return {
      matrixIdx: index,
      id: index + matrix[0].length,
      label: 'C' + index,
      connections: [],
      group: 'check'
    };
  });
  this.edges = [];

  for(var i = 0; i < matrix.length; i++){
    for(var j = 0; j < matrix[i].length; j++){
      if(matrix[i][j] === 1){
        this.checkNodes[i].connections.push(this.symbolNodes[j]);
        this.symbolNodes[j].connections.push(this.checkNodes[i]);
        this.edges.push({ from: this.checkNodes[i].id, to: this.symbolNodes[j].id });
      }
    }
  }
};

var SubGraph = function(tannerGraph, rootNodeId, depth){
  if(depth < 0) throw new Error("depth cannot be negative!");

  this.rootNode = tannerGraph.getNode(rootNodeId);
  this._tannerGraph = tannerGraph;

  this.treeRoot = {
    ref: this.rootNode,
    id: this.rootNode.id,
    label: this.rootNode.label,
    group: this.rootNode.group,
    children: [],
    level: 0
  };

  var level = 0;
  var usedNodes = [this.treeRoot];
  var queue = [this.treeRoot];

  while(queue.length && level < depth){
    level++;
    var levelQueue = [];
    queue.forEach((node) => {
      var childrenNodes = node.ref.connections
      .map(connection => tannerGraph.getNode(connection.id) )
      .map(c => {
        return {
          ref: c,
          id: c.id,
          label: c.label,
          level: level,
          group: c.group,
          children: []
        };
      });
      node.children = childrenNodes.filter(function(child){
        return usedNodes.every(usedNode => usedNode.id !== child.id);
      });
      usedNodes = usedNodes.concat(node.children);
      levelQueue = levelQueue.concat(node.children);
    });
    queue = levelQueue;
  }

  // save actual level because PEG will need it
  this.level = level;
};

TannerGraph.prototype.getNode = function(id){
  return this.symbolNodes.concat(this.checkNodes).filter(n => n.id === id)[0] || null;
};

TannerGraph.prototype.createEdge = function(symbolNodeId, checkNodeId){
  var symbolNode = this.getNode(symbolNodeId);
  var checkNode = this.getNode(checkNodeId);

  symbolNode.connections.push(checkNode);
  checkNode.connections.push(symbolNode);
  this.edges.push({ from: checkNode.id, to: symbolNode.id });
  this.matrix[checkNode.matrixIdx][symbolNode.matrixIdx] = 1;
};

TannerGraph.prototype.getCheckNodeWithLowestDegree = function(){
  return this.checkNodes.reduce((lowest, current) => {
    if(current.connections.length < lowest.connections.length)
      return current;
    return lowest;
  }, this.checkNodes[0]);
};

TannerGraph.prototype.getSymbolNodeWithLowestDegree = function(){
  return this.symbolNodes.reduce((lowest, current) => {
    if(current.connections.length < lowest.connections.length)
      return current;
    return lowest;
  }, this.symbolNodes[0]);
};

TannerGraph.prototype.getSubGraph = function(nodeId, depth){
  return new SubGraph(this, nodeId, depth);
};

SubGraph.prototype.coveredCheckNodes = function(){
  var coveredCheckNodes = [];
  var queue = [this.treeRoot];
  while(queue.length){
    var node = queue.shift();
    if(node.group === 'check')
      coveredCheckNodes.push(node);

    node.children.forEach(child => { queue.push(child); });
  }
  return coveredCheckNodes;
};

SubGraph.prototype.allCheckNodesCovered = function(){
  return this.coveredCheckNodes().length === this._tannerGraph.checkNodes.length;
};

SubGraph.prototype.getUCCheckNodeWithLowestDegree = function(){
  var coveredCheckNodes = this.coveredCheckNodes();
  var uncoveredCheckNodes = this._tannerGraph.checkNodes.filter(node => {
    return coveredCheckNodes.every(cnode => cnode.id !== node.id);
  });

  return uncoveredCheckNodes.reduce((lowest, current) => {
    if(current.connections.length < lowest.connections.length)
      return current;
    return lowest;
  }, uncoveredCheckNodes[0]);
};

/*
  Rendering algorithms using vis.js library
*/

TannerGraph.prototype.render = function(){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");

  var container = document.querySelector('#tanner-graph');

  var data = {
    nodes: new TannerGraph.vis.DataSet(this.symbolNodes.map((symbolNode, index) => {
      symbolNode.physics = false;
      symbolNode.x = index * TannerGraph.width / ( this.symbolNodes.length + 1 );
      symbolNode.y = TannerGraph.height * 0.25;
      return symbolNode;
    }).concat(this.checkNodes.map((checkNode, index) => {
      checkNode.physics = false;
      checkNode.x = index * TannerGraph.width / ( this.checkNodes.length + 1 );
      checkNode.y = TannerGraph.height * 0.75;
      return checkNode;
    }))),
    edges: new TannerGraph.vis.DataSet(this.edges)
  };
  var options = {};

  var network = new TannerGraph.vis.Network(container, data, options);
};

SubGraph.prototype.render = function(){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");

  var container = document.querySelector('#sub-graph');

  var data = { nodes: [], edges: [] };
  var queue = [this.treeRoot];
  while(queue.length){
    var node = queue.shift();
    data.nodes.push(node);
    node.children.forEach(function(child){
      queue.push(child);
      data.edges.push({
        from: node.id,
        to: child.id
      });
    });
  }

  var network = new TannerGraph.vis.Network(container, data, {
    layout: { hierarchical: true }
  });
};
