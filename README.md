# Progressive Edge Growth Algorithm in Tanner Graphs

Check out the [simulation](https://uzum.github.io/ldpc-peg)

## Summary

LDPC (Low density parity check) codes are known to be very powerful in terms of capacity-approaching performance and low-complexity iterative decoding. But the main decoding algorithms (belief propagation and sum-product algorithm) for this code family heavily depend on the lack of short cycles in their parity check matrix. In this project, Progressive Edge Growth (PEG) algorithm by Xiao-Yu Hu, Evangelos Eleftheriou and Dieter M. Arnold is implemented and simulated, which is a greedy (sub-optimum) method of constructing Tanner graphs having a large girth i.e the length of the shortest cycle. The relevant paper can be found by the title "Regular and Irregular Progressive Edge-Growth Tanner Graphs" in IEEE Transactions on Information Theory, Vol. 51, No. 1, January 2005.

## Tanner graph representation and the importance of short cycles

The name LDPC comes from the characteristic of the parity check matrix of the code, which contains significantly lower number of 1s compared to the 0s.
The advantages of having such a parity check matrix show up in various ways. First of all, the cost of matrix multiplication operations are decreased and furthermore, they are more suitable for parallelized encoding/decoding methods. These differences in LDPC codes provide a performance which is very close to the capacity boundaries.

Having fewer 1s also helps to devise a graphical representation method for the parity check matrix: Tanner graphs. This graph represents the exact same code structure as the parity check matrix, but it's easier to visualize the decoding algorithm and it provides a useful overview for the code structure for various inspections. The way a Tanner graph is constructed is as follows: We construct two sets of vertices called symbol (a.k.a variable) nodes and check nodes. We end up with n symbol nodes and m check nodes for a parity check matrix with n x m dimensions. A check node C<sub>i</sub> is connected to a symbol node S<sub>j</sub> if and only if <code>H[i][j]</code> is 1. Symbol nodes and check nodes are not connected to each other, so the final graph can be classified as a bipartite graph.

<img src="http://i.imgur.com/7gjNwl5.png" />

Typically, if you try to decode a codeword using the parity check matrix, the computation complexity would be related to the number of 1s in the matrix, in other words, O(n<sup>2</sup>) asymptotically. In a low density matrix, the number of 1s in the array are assumed to be degree of (n) instead. Traditional decoding algorithms cannot really make use of this difference so even a matrix with a very low density does not yield good performance results when the block length gets very large. But in iterative decoding algorithms where local computations are used in a divide-and-conquer strategy, the sparseness of the matrix helps in several ways. First it helps to keep both the local calculations simple and also reduces the complexity of combining the sub-problems by reducing the number of needed messages to exchange all the information.

Iterative decoding algorithms such as belief propagation or message passing, rely on the local estimations not highly depending on each other. For instance in the message passing algorithm, each symbol node sends its value to the check node. Then each check node perform an internal calculation and sends feedback for each symbol node. This loop continues until a global consensus is reached for every node. If the Tanner graph of the parity check matrix contains cycles of short length, these messages passing back and forth will be dependent on each other and the estimations will skid into incorrect decisions. C1 - S2 - C2 - S5 is an example cycle of length 4 in the figure above.

## Definitions

In our approach to provide a method to create short-cycle free Tanner graphs, we will need some clarification on the terminology.

* **symbol node degree** is the number of edges connected to a symbol node, i.e. the number of 1s in the column of the parity check matrix corresponding to that symbol node
* **check node degree** is the number of edges connected to a check node, i.e. the number of 1s in the row of the parity check matrix corresponding to that check node
* **symbol degree sequence** is a list containing the symbol node degrees of all symbol nodes
* **check degree sequence** is a list containing the check node degrees of all check nodes
* **girth** is the length of the shortest cycle in the Tanner graph
* **the subgraph of a node of length <code>l</code>** is defined by expanding the graph as a tree starting from the given node with a breadth first search method, until depth of the tree reaches <code>l</code>. The nodes already included in the tree does not have to be added again as we are only dealing with the first occurrences of nodes. So if all the nodes are included before the depth reaches <code>l</code>, the tree expansion stops. For instance given the following Tanner graph in the figure below, you can see the subgraph of <code>S2</code> of length 3. Also note that all the nodes are included in this specific subgraph, so it will not get any deeper.

<img src="http://i.imgur.com/fUCLful.png" />

* **covered nodes by a subgraph** are the nodes which are included in the given subgraph. **Uncovered nodes** on the other hand corresponds to the nodes that are in the Tanner graph but not in the given subgraph. For instance if the depth of the subgraph above was one lower, then S3 would be an uncovered node.

## Algorithm and implementation
Finding the absolute solution to this problem; in other words, constructing the Tanner graph with the lowest possible girth with the given parameters is quite difficult in terms of algorithmic complexity. The Progressive Edge Growth algorithm on the other hand does not try to find the absolute best solution, it rather creates a suboptimum solution with a relatively large girth, which is considered feasible and useful as well. The algorithm starts with only nodes (no edges) and add new edges to the graph one by one in such a way that each edge addition has as small impact in the girth of the graph as possible. It only considers the current state and greedily only moves forward. It does not have the ability to backtrack to previous states even if they would be better alternatives.

The algorithm starts with 3 parameters: number of check nodes, number of symbol nodes and the symbol degree sequence. So the number of nodes and edges in the graph is known beforehand and the algorithm is responsible for finding the best connections and it grows edge by edge in each iteration. The algorithm goes over the symbol nodes one by one and it starts working on another node only after all the edges required by that node's degree is established. Each edge addition is handled in such a way that always the best option with the least impact for the girth in the current state is selected. If this is the first edge of the current symbol node, then it's obvious that it cannot create a short cycle because a cycle means there are at least 2 edges passing through that node. So the algorithm picks the check node with the lowest check node degree, i.e the node with the least number of edges in the graph's current setting. This selection is not strictly better than the others since there is no effect on the girth in any case but it's the best candidate because it leaves the most space for future actions. If this is not the first edge for that symbol node, then there are 2 scenarios:

1. There are nodes which are not covered by the subgraph expanded from the current symbol node. This could be either because of the current Tanner graph does not cover all the nodes, which is usually the case at the beginning or, all the nodes in the Tanner graph is not connected to each other yet, which means the current Tanner graph can be divided into multiple subgraphs. In this case, the algorithm selects the node with the lowest check node number from the set of nodes which are not covered by the subgraph expanded from the current symbol node.

2. The subgraph expanded from the current symbol node already covers all the check nodes in the system. In this case, we need to find the check nodes which are at the farthest distance from that symbol node. In order to find them, the algorithm looks at the previous depth of the expansion tree, just before all check nodes are covered. The check nodes which are uncovered by this previous subgraph are the ones that are added last. Then the algorithm again chooses the one with the lowest check node degree from this set.

When the algorithm creates enough edges for every symbol node, it terminates.

## Usage example

An HTML file that computes and renders the tanner graph created by PEG for parameters <code>n = 8</code>, <code>m = 4</code> and symbol node degrees are all 2.
```html
<html>
  <body>
    <div id="container" style="width: 800px; height: 600px;"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.16.1/vis.min.js"></script>
    <script src="./tanner-graph.js"></script>
    <script src="./peg.js"></script>
    <script type="text/javascript">
      document.addEventListener("DOMContentLoaded", function(){
        // define the rendering engine reference for TannerGraph class
        TannerGraph.vis = window.vis;

        // PEG.create returns the constructed Tanner graph for the given parameters
        var graph = PEG.create({
          checkNodeNumber: 4,
          symbolNodeNumber: 8,
          symbolNodeDegrees: [2, 2, 2, 2, 2, 2, 2, 2]
        });

        // render the graph in the given parent element
        graph.render(document.querySelector('#container'));
      });
    </script>
  </body>
</html>
```

<code>peg.js</code> also allows hooking into the edge creation step to inspect intermediate states while the algorithm is running. You can pass a callback function to the <code>PEG.hook</code> which will be called each time an edge has just been added. For instance this code prints the current parity check matrix to the console each time an edge is added by the PEG algorithm:

```javascript
  // the hook should be defined before PEG.create, it does not work retroactively
  PEG.hook(function(intermediateGraph){
    var matrixAsString = intermediateGraph.map(row => row.slice(0).join(' ')).join('\n');
    console.log(matrixAsString);
  });

  var graph = PEG.create({
    checkNodeNumber: 4,
    symbolNodeNumber: 8,
    symbolNodeDegrees: [2, 2, 2, 2, 2, 2, 2, 2]
  });
```
