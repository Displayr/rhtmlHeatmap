library(rhtmlHeatmap)
x = mtcars

# axis locations
Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE, cellnote = mtcars, xaxis_location = "top")
Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", yaxis_location = "left")
Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", show_legend = TRUE)
Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", show_legend = TRUE)

# legend
Heatmap(x, scale = "none",  dendrogram = "none",  colors = "Blues", show_legend = TRUE, show_cellnote_in_cell = TRUE)
Heatmap(x, scale = "none",  dendrogram = "none",  show_legend = TRUE, show_cellnote_in_cell = TRUE)

# title & footer
Heatmap(x, scale = "none",  dendrogram = "none",  colors = "Blues", show_legend = TRUE, show_cellnote_in_cell = TRUE,yaxis_location = "left",
        title = "Sample Heatmap", footer = "A heatmap generated from built-in sample data")

###
Heatmap(x*100, scale = "none",  dendrogram = "none",  colors = "Blues", show_legend = TRUE, show_cellnote_in_cell = TRUE, legend_digits = 3)
Heatmap(x/100, scale = "none",  dendrogram = "none",  colors = "Blues", show_legend = TRUE, show_cellnote_in_cell = TRUE, legend_digits = 3)

### lower_triangle
Heatmap(x[1:11,1:11], scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE, cellnote = mtcars[1:11,1:11], cellnote_in_cell = mtcars[1:11,1:11]*2, lower_triangle = TRUE)
Heatmap(x[1:11,1:11], scale = "none", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE, cellnote = mtcars[1:11,1:11], lower_triangle = TRUE)

### cells_to_hide
cells_to_hide = matrix(rep(0,121), nrow=11)
cells_to_hide[6:10] = 1
Heatmap(x[1:11,1:11], scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE, cellnote = mtcars[1:11,1:11], cellnote_in_cell = mtcars[1:11,1:11]*2, lower_triangle = TRUE, cells_to_hide = cells_to_hide)
Heatmap(x[1:11,1:11], scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE, cellnote = mtcars[1:11,1:11], cellnote_in_cell = mtcars[1:11,1:11]*2, lower_triangle = FALSE, cells_to_hide = cells_to_hide)

## color range
x = matrix(sort(runif(25)), nrow = 5)*2 - 1
Heatmap(x, colors = "PuOr", color_range = c(-1,1), dendrogram = "none")
