# Progressive Edge Growth Algorithm in Tanner Graphs

Check out the [simulation](https://uzum.github.io/ldpc-peg)

## Introduction

LDPC (Low density parity check) codes are known to be very powerful in terms of capacity-approaching performance and low-complexity iterative decoding. But the main decoding algorithms (belief propagation and sum-product algorithm) for this code family heavily depend on the lack of short cycles in their parity check matrix. In this project, Progressive Edge Growth (PEG) algorithm by Xiao-Yu Hu, Evangelos Eleftheriou and Dieter M. Arnold is implemented and simulated, which is a greedy (sub-optimum) method of constructing Tanner graphs having a large girth i.e the length of the shortest cycle. The relevant paper can be found by the title "Regular and Irregular Progressive Edge-Growth Tanner Graphs" in IEEE Transactions on Information Theory, Vol. 51, No. 1, January 2005.

## Tanner graph representation and the importance of short cycles

The name LDPC comes from the characteristic of the parity check matrix of the code, which contains significantly lower number of 1s compared to the 0s.
The advantages of having such a parity check matrix show up in various ways. First of all, the cost of matrix multiplication operations are decreased and furthermore, they are more suitable for parallelized encoding/decoding methods. These differences in LDPC codes provide a performance which is very close to the capacity boundaries.

Having fewer 1s also helps to devise a graphical representation method for the parity check matrix: Tanner graphs. This graph represents the exact same code structure as the parity check matrix, but it's easier to visualize the decoding algorithm and it provides a useful overview for the code structure for various inspections. The way a Tanner graph is constructed is as follows: We construct two sets of vertices called symbol (a.k.a variable) nodes and check nodes. We end up with n symbol nodes and m check nodes for a parity check matrix with n x m dimensions. A check node C<sub>i</sub> is connected to a symbol node S<sub>j</sub> if and only if <code>H[i][j]</code> is 1. Symbol nodes and check nodes are not connected to each other, so the final graph can be classified as a bipartite graph.

<img src="http://i.imgur.com/Dkv3l8t.png" />

Typically, if you try to decode a codeword using the parity check matrix, the computation complexity would be related to the number of 1s in the matrix, in other words, O(n<sup>2</sup>) asymptotically. In a low density matrix, the number of 1s in the array are assumed to be degree of (n) instead. Traditional decoding algorithms cannot really make use of this difference so even a matrix with a very low density does not yield good performance results when the block length gets very large. But in iterative decoding algorithms where local computations are used in a divide-and-conquer strategy, the sparseness of the matrix helps in several ways. First it helps to keep both the local calculations simple and also reduces the complexity of combining the sub-problems by reducing the number of needed messages to exchange all the information.

## Definitions

## Algorithm and implementation
