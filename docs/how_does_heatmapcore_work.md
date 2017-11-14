2500 lines of awesome, all summarized here.

Shared State:
  el:
  bbox:
  controller:
  opts:
    row_element_names: contains the relative placement of all the elements of the vis: * xaxis, xtitle
    col_element_names: contains the relative placement of all the elements of the vis: * yaxis, ytitle
    row_element_map: appears to contain heights of rows ?


entry point is the exported `heatmap(selector, data, options)` function.

A Controller instance is created that exposes several functions:

* hilight
* datapoint_hover
* transform
* on (d3 dispatcher)

line 215- 315 : opts is created by referencing config from the incoming config and assigning defaults

line 350 - 880 : process options computing layout and sizes of things
  * basically populate row_element_{names,map} and col_element_{names,map}

lines 880 -  1066
  * now that we know size and placement, compute and ordered list of row and col heights
  * then compute boundaries of each section
  * initiate a gridsized and get colorMapBounds
  * line 921 - 945 are duplicated ?
   
line 1068 - 1344
  * begin to create svg areas and append to DOM
  
line 1346 - 1527
  * hilighting code some interaction between y axis and columns
  
  
Glossary of Terms / Sections
  * colormap : the main heatmap grid
  * legend : vertical bar showing color spectrum
  * xaxis : can be top or bottom
  * yaxis : can be left or right
  * graph_leftColsX
  * graph_rightColsX
  
  