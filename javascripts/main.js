// author: anil.uzumcuoglu
// main script for github home page simulations

document.addEventListener('DOMContentLoaded', function(){
  TannerGraph.vis = window.vis;

  var createButton = document.querySelector('#create-button');
  var nextButton = document.querySelector('#next-button');
  var prevButton = document.querySelector('#prev-button');
  var depthInput = document.querySelector('#depth-input');
  var finalGraphContainer = document.querySelector('#final-graph');
  var intermediateGraphContainer = document.querySelector('#intermediate-graph');
  var subGraphContainer = document.querySelector('#sub-graph');
  var finalMatrix = document.querySelector('#final-matrix');
  var intermediateMatrix = document.querySelector('#intermediate-matrix');

  var graphProgress = [];
  var graphProgressIndex = 0;

  createButton.addEventListener('click', function(event){
    event.preventDefault();
    var checkNodeNumber = document.querySelector('#check-node-number').value;
    var symbolNodeNumber = document.querySelector('#symbol-node-number').value;
    var symbolNodeDegrees = document.querySelector('#symbol-node-degrees').value.split(',').map(Number);

    PEG.hook(function(intermediateGraph){
      graphProgress.push(intermediateGraph.getClone());
    });

    graphProgress = [];
    graphProgressIndex = 0;
    var tannerGraph = PEG.create({
      checkNodeNumber: checkNodeNumber,
      symbolNodeNumber: symbolNodeNumber,
      symbolNodeDegrees: symbolNodeDegrees
    });

    tannerGraph.render(finalGraphContainer);
    finalMatrix.innerText = tannerGraph.matrix.map(a => a.join(' ')).join('\n');

    graphProgress[0].render(intermediateGraphContainer);
    intermediateMatrix.innerText = "";
  });

  nextButton.addEventListener('click', function(event){
    event.preventDefault();
    graphProgressIndex++;
    if(graphProgressIndex >= graphProgress.length) graphProgressIndex = graphProgress.length - 1;

    var intermediateGraph = graphProgress[graphProgressIndex];
    intermediateGraph.render(intermediateGraphContainer, function(data){
      var subGraph = intermediateGraph.getSubGraph(data.nodes[0], 0);
      subGraph.render(subGraphContainer);
      
      depthInput.value = 0;
      depthInput.addEventListener('change', function(event){
        var newSubGraph = intermediateGraph.getSubGraph(data.nodes[0], depthInput.value);
        newSubGraph.render(subGraphContainer);
      });
    });
    intermediateMatrix.innerText = intermediateGraph.matrix.map(a => a.join(' ')).join('\n');
  });

  prevButton.addEventListener('click', function(event){
    event.preventDefault();
    graphProgressIndex--;
    if(graphProgressIndex < 0) graphProgressIndex = 0;

    var intermediateGraph = graphProgress[graphProgressIndex];
    intermediateGraph.render(intermediateGraphContainer, function(data){
      var subGraph = intermediateGraph.getSubGraph(data.nodes[0], 0);
      subGraph.render(subGraphContainer);

      depthInput.value = 0;
      depthInput.addEventListener('change', function(event){
        var newSubGraph = intermediateGraph.getSubGraph(data.nodes[0], depthInput.value);
        newSubGraph.render(subGraphContainer);
      });
    });
    intermediateMatrix.innerText = intermediateGraph.matrix.map(a => a.join(' ')).join('\n');
  });
});
