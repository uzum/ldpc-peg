// author: anil.uzumcuoglu

function TannerGraph(parameters){
  this.symbolNodes = parameters.symbolNodes;
  this.checkNodes = parameters.checkNodes
  this.symbolNodes.forEach(node => node.group = "symbol");
  this.checkNodes.forEach(node => node.group = "check");
  
  this.edges = parameters.checkNodes.reduce(function(edges, checkNode){
    var checkNodeEdges = checkNode.neighbors.map(function(symbol){
      // fill symbolNodes' neighbors lists
      var targetSymbol = parameters.symbolNodes.filter(s => s.id === symbol)[0];
      targetSymbol.neighbors.push(checkNode.id);
      
      return {
        from: checkNode.id,
        to: symbol
      }
    });
    return edges.concat(checkNodeEdges);
  }, []);
}

TannerGraph.prototype.render = function(){
  if(!TannerGraph.vis) throw new Error("You need to define vis.js first");
  
  var container = document.querySelector('#tanner-graph');
  
  var data = {
    nodes: new TannerGraph.vis.DataSet(this.symbolNodes.concat(this.checkNodes)),
    edges: new TannerGraph.vis.DataSet(this.edges)
  };
  var options = {};
  
  var network = new TannerGraph.vis.Network(container, data, options);
};

TannerGraph.prototype.renderSubGraph = function(subGraph){
  
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
    children: [] 
  };
  
  var currentLevel = [treeRoot];
  while(currentLevel.length && depth){
    depth--;
    var node = currentLevel.shift();
    var childrenNodes = node.ref.neighbors
      .map(id => this.getNode(id) )
      .map(c => { return { ref: c, id: c.id, label: c.label, group: c.group, children: [] }; });
    node.children = childrenNodes;
    currentLevel = currentLevel.concat(childrenNodes);
  }
  
  return treeRoot;
};
