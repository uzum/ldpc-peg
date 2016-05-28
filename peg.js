// author: anil.uzumcuoglu

var PEG = (function(){
  var arrayOf = function(size, value){
    if(!value) value = 0;
    var array = [];
    while(size--) array.push(value);
    return array;
  };

  var checkNodeNumber = 0;
  var symbolNodeNumber = 0;
  var symbolNodeDegrees = [];
  var tannerGraph;

  // this is the most critical part of the progressive edge growth algorithm
  var calculateEdges = function(){
    var parityCheckMatrix = arrayOf(checkNodeNumber)
      .map(_ => arrayOf(symbolNodeNumber));
    tannerGraph = new TannerGraph(parityCheckMatrix);

    symbolNodeDegrees.forEach((degree, index) => {
      var symbolNode = tannerGraph.getNode(index);
      for(i = 0; i < degree; i++){
        // if this is the first edge coming out from that symbol-node
        if(i === 0){
          // find the check node with the lowest check node degree
          // in current graph configuration
          var lowest = tannerGraph.getCheckNodeWithLowestDegree();
          tannerGraph.createEdge(symbolNode.id, lowest.id);
        // we need to look at the subgraph from this symbol node to decide edge
        }else{
          // we will gradually deepen the subgraph expanding from this symbol node
          // two conditions to end this process:
          //   1. the subgraph stopped expanding while there are still unreached check nodes
          //   2. all the check nodes are reached. In this case, we need the subgraph from the previous iteration
          var depth = 0;
          var currentSubGraph = tannerGraph.getSubGraph(symbolNode.id, depth);
          while(true){
            // this means second condition is satisfied
            if(currentSubGraph.allCheckNodesCovered()){
              // we need to select the candidate check node from the previous iteration
              var previousSubGraph = tannerGraph.getSubGraph(symbolNode.id, depth - 1);
              // select the check node with the lowest degree
              // which is uncovered in the previous subgraph, but covered in this one
              var lowest = previousSubGraph.getUCCheckNodeWithLowestDegree();
              tannerGraph.createEdge(symbolNode.id, lowest.id);
              break;
            }

            // increase the depth one more and create a new subgraph
            depth++;
            var nextSubGraph = tannerGraph.getSubGraph(symbolNode.id, depth);

            // this means level stopped increasing: first condition is satisfied
            if(nextSubGraph.level === currentSubGraph.level){
              // select the check node with the lowest degree among the nodes not covered by this subgraph
              var lowest = currentSubGraph.getUCCheckNodeWithLowestDegree();
              tannerGraph.createEdge(symbolNode.id, lowest.id);
              break;
            }
            currentSubGraph = nextSubGraph;
          }
        }
      }
    });
  };

  return {
    create: function(options){
      checkNodeNumber = options.checkNodeNumber;
      symbolNodeNumber = options.symbolNodeNumber;
      symbolNodeDegrees = options.symbolNodeDegrees;

      calculateEdges();
    },
    debug: function(){
      console.log(tannerGraph.matrix);
      console.log(tannerGraph.getCheckNodeWithLowestDegree());
      tannerGraph.render();
    }
  }
})();
