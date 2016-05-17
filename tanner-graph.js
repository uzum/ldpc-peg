// author: anil.uzumcuoglu

function TannerGraph(parameters){
  this.symbolNodes = parameters.symbolNodes;
  this.checkNodes = parameters.checkNodes;
  this.links = parameters.links;
}

TannerGraph.prototype.render = function(){
  if(!TannerGraph.d3) throw new Error("You need to define d3.js first");
  
  var width = 1080;
  var height = 720;
  var symbolNodes = this.symbolNodes.map( node => { return { index: node, class: "symbol" } } );
  var checkNodes = this.checkNodes.map( node => { return { index: node, class: "check" } } );
  
  var nodes = symbolNodes.concat(checkNodes);
  
  var links = this.links.map( link => { return { source: link[0], target: link[1] } } );
  
  var svg = TannerGraph.d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
    
  var graph = TannerGraph.d3.layout.force()
    .size([width, height])
    .nodes(nodes)
    .links(links)
    .charge(-200)
    .chargeDistance(200)
    .linkDistance(300);
    
  var link = svg.selectAll(".link")
    .data(links)
    .enter().append("line")
    .attr("class", "link");
    
  var node = svg.selectAll(".node")
    .data(nodes)
    .enter().append("circle")
    .attr("r", 5)
    .attr("class", d => "node " + d.class)
    .call(graph.drag);
   
  graph.on("tick", function(){
    node.attr("r", width / 25)
      .attr("cx", d => d.x )
      .attr("cy", d => d.y );
      
    link.attr("x1", d => d.source.x )
      .attr("y1", d => d.source.y )
      .attr("x2", d => d.target.x )
      .attr("y2", d => d.target.y )
  });
  
  graph.start();
}
