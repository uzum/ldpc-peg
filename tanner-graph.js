// author: anil.uzumcuoglu

// the constructor for tanner-graph
// it needs the parity check matrix for creating the graph
// it decomposes the matrix and create symbol/check nodes along with edges
var TannerGraph = function(matrix){
  this.matrix = matrix;

  // create symbol nodes array
  this.symbolNodes = matrix[0].map( (_, index) => {
    return {
      matrixIdx: index,
      id: index,
      label: 'S' + index,
      connections: [],
      group: 'symbol'
    };
  });

  // create check nodes array
  // we can't have identical ids in the graph visualization, so keep ids incremental
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

  // by looking at the 1s in the parity check matrix, calculate the edges.
  // the edges array is filled with { from, to } pairs.
  // connections arrays in the each node is also filled with relevant nodes,
  // this double representation is redundant, but helps greatly in calculations
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

// the constructor for a sub-graph representing a tanner-graph expansion with the given node and depth
// a typical user is not meant to be use this constructor
// it is safer to call TannerGraph.prototype.getSubGraph instead
var SubGraph = function(tannerGraph, rootNodeId, depth){
  if(depth < 0) throw new Error("depth cannot be negative!");

  this.rootNode = tannerGraph.getNode(rootNodeId);
  this._tannerGraph = tannerGraph;

  this.treeRoot = {
    ref: this.rootNode, // keep a reference to the actual node
    id: this.rootNode.id,
    label: this.rootNode.label,
    group: this.rootNode.group,
    children: [],
    level: 0
  };

  var level = 0;
  var usedNodes = [this.treeRoot];
  var queue = [this.treeRoot];

  // a simple breadth-first-search algorithm to create the expansion tree
  while(queue.length && level < depth){
    level++;
    // we want to create the BFS tree level by level
    // so the queue should be updated in a level basis
    // therefore we use a new queue for each level, whose elements will be
    // transferred to the queue at the end of each iteration
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

      // add new children to the BFS queue only if they are not used already
      node.children = childrenNodes.filter(function(child){
        return usedNodes.every(usedNode => usedNode.id !== child.id);
      });

      // keep used nodes because in this version of BFS, we do not want duplicate nodes
      usedNodes = usedNodes.concat(node.children);
      levelQueue = levelQueue.concat(node.children);
    });

    // update the queue with what we have collected in this iteration
    // after all of its elements are processed
    queue = levelQueue;
  }

  // save actual level because PEG will need it
  // it needs to know whether the loop stopped because we reached the desired length
  // or it stopped because the BFS ended with no elements in the queue
  this.level = level;
};

// returns the node with the given id
TannerGraph.prototype.getNode = function(id){
  return this.symbolNodes.concat(this.checkNodes).filter(n => n.id === id)[0] || null;
};

// clones the internal matrix of the tanner-graph
// which can be used to clone the tanner-graph completely
TannerGraph.prototype.getClone = function(){
  var cloneMatrix = this.matrix.reduce(function(clone, row){
    clone.push(row.slice(0));
    return clone;
  }, []);
  return new TannerGraph(cloneMatrix);
};

// creates a new edge on the tanner-graph between the given symbol and check nodes
// this method is meant to be called by the PEG algorithm
TannerGraph.prototype.createEdge = function(symbolNodeId, checkNodeId){
  var symbolNode = this.getNode(symbolNodeId);
  var checkNode = this.getNode(checkNodeId);

  symbolNode.connections.push(checkNode);
  checkNode.connections.push(symbolNode);
  this.edges.push({ from: checkNode.id, to: symbolNode.id });
  this.matrix[checkNode.matrixIdx][symbolNode.matrixIdx] = 1;
};

// returns the check node with the lowest degree (the one with the least number of connections)
TannerGraph.prototype.getCheckNodeWithLowestDegree = function(){
  return this.checkNodes.reduce((lowest, current) => {
    if(current.connections.length < lowest.connections.length)
      return current;
    return lowest;
  }, this.checkNodes[0]);
};

// returns the symbol node with the lowest degree (the one with the least number of connections)
TannerGraph.prototype.getSymbolNodeWithLowestDegree = function(){
  return this.symbolNodes.reduce((lowest, current) => {
    if(current.connections.length < lowest.connections.length)
      return current;
    return lowest;
  }, this.symbolNodes[0]);
};

// creates a sub-graph for this tanner-graph expanding from the given node with the given depth
TannerGraph.prototype.getSubGraph = function(nodeId, depth){
  return new SubGraph(this, nodeId, depth);
};

// returns a list of check nodes which are covered by this sub-graph
// it uses a simple breadth-first-search algorithm to iterate over its nodes
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

// compares the covered check nodes with the all check nodes in the origin tanner-graph
// and return if all the check nodes in the tanner-graph are covered by this specific sub-graph
SubGraph.prototype.allCheckNodesCovered = function(){
  return this.coveredCheckNodes().length === this._tannerGraph.checkNodes.length;
};

// returns the check node with the lowest degree from the origin tanner-graph
// which is NOT covered by this sub-graph
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

TannerGraph.prototype.render = function(container, onClick){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");

  var data = {
    nodes: new TannerGraph.vis.DataSet(this.symbolNodes.map((symbolNode, index) => {
      symbolNode.physics = false;
      symbolNode.x = index * container.offsetWidth / ( this.symbolNodes.length + 1 );
      symbolNode.y = container.offsetHeight * 0.25;
      return symbolNode;
    }).concat(this.checkNodes.map((checkNode, index) => {
      checkNode.physics = false;
      checkNode.x = index * container.offsetWidth / ( this.checkNodes.length + 1 );
      checkNode.y = container.offsetHeight * 0.75;
      return checkNode;
    }))),
    edges: new TannerGraph.vis.DataSet(this.edges)
  };
  var options = {
    interaction: {
      zoomView: false
    }
  };

  var network = new TannerGraph.vis.Network(container, data, options);

  if(onClick)
    network.on('doubleClick', onClick);
};

SubGraph.prototype.render = function(container){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");

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
    interaction: { zoomView: false },
    layout: { hierarchical: true }
  });
};
