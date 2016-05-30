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
* **a subgraph of a node of length l** is defined by expanding the graph as a tree starting from the given node with a breadth first search method, until depth of the tree reaches l. The nodes already included in the tree does not have to be added again as we are only dealing with the first occurrences of nodes. So if all the nodes are included before the depth reaches l, the tree expansion stops. For instance given the following Tanner graph in the figure below, you can see the subgraph of <code>S2</code> of length 3. Also note that all the nodes are included in this specific subgraph, so it will not get any deeper.

<img src="http://i.imgur.com/fUCLful.png" />

* **covered nodes by a subgraph** are the nodes which are included in the given subgraph. **Uncovered nodes** on the other hand corresponds to the nodes that are in the Tanner graph but not in the given subgraph. For instance if the depth of the subgraph above was one lower, then S3 would be an uncovered node.

## Algorithm and implementation
