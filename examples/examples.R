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

# left and right columns
x = mtcars
carnames = rownames(mtcars)
carbrands = strsplit(carnames, " ")
carbrands = sapply(carbrands, function(x){x[1]})
ids = 1:nrow(mtcars)
left_cols3 = data.frame(as.character(ids), carbrands, rownames(mtcars), stringsAsFactors = FALSE)
left_cols3_align1 = c("c", "c", "c")
left_cols3_subtitle = c("No.", "Make", "Model")
left_cols3_title = "Parameters"

Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE,
        cellnote = mtcars, yaxis_hidden = TRUE, xaxis_hidden = FALSE, yaxis_title = "ytitle",
        title = "Title", subtitle = "Subtitle",footer = "footer",
        xaxis_location = "top",
        left_columns = left_cols3,
        left_columns_align = left_cols3_align1,
        left_columns_subtitles = c("No.", "Make", "Model"),
        left_columns_title =  "Column Title")

Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE,
        cellnote = mtcars, yaxis_hidden = TRUE, xaxis_hidden = FALSE,
        title = "Title", subtitle = "Subtitle",footer = "footer",
        table_style = TRUE,
        xaxis_title = "axis title",
        xaxis_location = "top",
        left_columns = left_cols3,
        left_columns_align = c("c", "r", "l"),
        left_columns_subtitles = c("No.", "Make", "Model"),
        left_columns_title =  "Column Title")

Heatmap(x, scale = "column", dendrogram = "none",  colors = "Blues", show_cellnote_in_cell = TRUE,
        cellnote = mtcars, yaxis_hidden = TRUE, xaxis_hidden = FALSE,
        table_style = TRUE,
        xaxis_location = "top", xaxis_title = "Axis Title",
        left_columns = left_cols3,
        left_columns_align = c("r","r","r"),
        left_columns_title = "Left Col Title",
        left_columns_subtitles = c("No.", "Make", "Car Model"),
        right_columns_title =  "Right Column Title",
        right_columns_subtitles = c("No.", "Make", "Model"),
        right_columns = left_cols3,
        right_columns_align = c("c","c","c"))

{{mat <- matrix(seq(1:25), nrow = 5, ncol = 5)
rownames(mat) <- colnames(mat) <- c("A", "B", "C", "D", "E")
hm <- rhtmlHeatmap::Heatmap(mat,
                            dendrogram = "none",
                            colors = "Blues",
                            title = "TITLE",
                            show_cellnote_in_cell = TRUE,
                            cell_font_family = "Impact",
                            tip_font_family = "Impact",
                            xaxis_title = "X-AXIS",
                            yaxis_hidden = TRUE,
                            footer = "FOOTER",
                            title_font_family = "Impact",
                            xaxis_font_family = "Impact",
                            yaxis_font_family = "Impact",
                            xaxis_title_font_family = "Impact",
                            yaxis_title_font_family = "Impact",
                            legend_font_family = "Impact",
                            legend_font_color = "red",
                            left_columns = matrix(c("A", "B", "C", "D", "E"), nrow=5),
                            left_columns_font_family = "Impact",
                            left_columns_font_color = "Red",
                            footer_font_family = "Impact",
                            title_font_color = "red",
                            xaxis_font_color = "red",
                            yaxis_font_color = "red",
                            xaxis_title_font_color = "red",
                            yaxis_title_font_color = "red",
                            footer_font_color = "red")}}
hm
