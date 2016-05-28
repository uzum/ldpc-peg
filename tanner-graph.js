// author: anil.uzumcuoglu

function TannerGraph(matrix){
  this.matrix = matrix;
  this.checkNodes = matrix.map( (_, index) => {
    return {
      id: index,
      label: 'S' + index,
      connections: []
    };
  });
  this.symbolNodes = matrix[0].map( (_, index) => {
    return {
      id: index + matrix.length,
      label: 'C' + index,
      connections: []
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
}

TannerGraph.prototype.render = function(){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");

  var container = document.querySelector('#tanner-graph');

  var data = {
    nodes: new TannerGraph.vis.DataSet(this.symbolNodes.map((symbolNode, index) => {
      symbolNode.group = 'symbol';
      symbolNode.physics = false;
      symbolNode.x = index * TannerGraph.width / ( this.symbolNodes.length + 1 );
      symbolNode.y = TannerGraph.height * 0.25;
      return symbolNode;
    }).concat(this.checkNodes.map((checkNode, index) => {
      checkNode.group = 'check';
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

TannerGraph.prototype.renderSubGraph = function(root){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");

  var container = document.querySelector('#sub-graph');

  var data = { nodes: [], edges: [] };
  var queue = [root];
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

TannerGraph.prototype.getNode = function(id){
  return this.symbolNodes.concat(this.checkNodes).filter(n => n.id === id)[0] || null;
}

TannerGraph.prototype.subGraph = function(nodeId, depth){
  var rootNode = this.getNode(nodeId);

  var treeRoot = {
    ref: rootNode,
    id: rootNode.id,
    label: rootNode.label,
    group: rootNode.group,
    children: [],
    level: 0
  };

  var level = 0;
  var usedNodes = [treeRoot];
  var queue = [treeRoot];

  while(queue.length && level < depth){
    level++;
    var levelQueue = [];
    queue.forEach((node) => {
      var childrenNodes = node.ref.connections
      .map(connection => this.getNode(connection.id) )
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
  return treeRoot;
};
