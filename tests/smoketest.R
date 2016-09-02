test_root <- "testresults"

serialize <- function(widget) {
  htmlwidgets:::toJSON2(widget, pretty=TRUE, digits = 12)
}

mock_rhtmlHeatmap_record <- function(...) {
  cat(format(sys.call(0)), "\n")
  d <- rhtmlHeatmap::Heatmap(...)
  json <- serialize(d$x)
  cat(json, "\n")
}

with(list(rhtmlHeatmap = mock_rhtmlHeatmap_record), {

  set.seed(1001)

  x <- mtcars[c(2:4,7),1:4]

  # Test colors when dendextend isn't loaded
  Heatmap(x, k_row = 3, k_col = 2)

  suppressPackageStartupMessages(library(dendextend))
  row_dend2 <- x %>% dist %>% hclust %>% as.dendrogram %>%
    color_branches(k = 3)
  col_dend2 <- x %>% t %>% dist %>% hclust %>% as.dendrogram %>%
    color_branches(k = 2)
  library(rhtmlHeatmap)
  Heatmap(x, Rowv = row_dend2, Colv = col_dend2) # Works!
  Heatmap(x)

  Heatmap(x, Rowv = FALSE)
  Heatmap(x, dendrogram = "no", labRow = 1:4)
  Heatmap(x, dendrogram = "no", labCol = 1:4)
  Heatmap(x, labRow = 1:4)


  row_dend2 <- x %>% dist %>% hclust %>% as.dendrogram %>%
    color_branches(k = 3) %>%
    set("branches_lwd", c(4,1)) %>%
    set("branches_lty", c(1,1,3))
  plot(row_dend2)
  # for now, Heatmap still ignores line type and width:
  Heatmap(x) # Works!
  Heatmap(x, digits = 0) # Works!
  Heatmap(x, Colv = col_dend2) # Works!
  Heatmap(x, Rowv = row_dend2, Colv = col_dend2) # Works!
  # str(unclass(row_dend2))


  Heatmap(matrix(rnorm(10), 2,5), digits = 12) # Works!
  Heatmap(matrix(rnorm(10), 2,5), digits = 2) # Works!


  # various examples
  library(rhtmlHeatmap)
  Heatmap(scale(mtcars), colors = "Greens", theme = "dark")
  Heatmap(scale(mtcars), dendrogram = "none")

  Heatmap(scale(mtcars))
  Heatmap(scale(mtcars), dendrogram = "none")
  Heatmap(scale(mtcars), Colv = FALSE)
  Heatmap(scale(mtcars), Rowv = FALSE)
  Heatmap(scale(mtcars), dendrogram = "row")
  Heatmap(scale(mtcars), dendrogram = "col")



  x <- mtcars[c(2:4,7),1:4]
  Heatmap(x)
  Heatmap(x, dendrogram = "none")

  Heatmap(x, scale = "row")
  scale(x)
  Heatmap(scale(x), dendrogram = "none")
  Heatmap(x, scale = "column", dendrogram = "none")
  Heatmap(x, scale = "row", dendrogram = "none")

  Heatmap(x, labRow = 1:4)
  Heatmap(x, labCol = 1:4)

  heatmap(scale(mtcars[1:4,1:4]), Rowv = NA, Colv = NA)


  library(dendextend)
  Heatmap(x)
  # gives the same results - yay:
  row_dend <- x %>% dist %>% hclust %>% as.dendrogram # %>% plot
  Heatmap(x, Rowv = row_dend)
  row_dend2 <- x %>% dist %>% hclust %>% as.dendrogram %>%
    color_branches(k = 2)
  plot(row_dend2)
  rhtmlHeatmap:::dendToTree(row_dend2[[2]][[2]])
  Heatmap(x, Rowv = row_dend2) # Works!


  row_dend <- x %>% dist %>% hclust %>% as.dendrogram # %>% plot
  Heatmap(x, Rowv = row_dend)


  # Next step!
  row_dend3 <- x %>% dist %>% hclust %>% as.dendrogram %>%
    set("branches_lwd", c(4,1)) %>%
    set("branches_lty", c(1,1,3)) %>%
    set("branches_col", c("gold","grey","blue", "red"))
  row_dend3 <- set(row_dend3, "branches_col", c(1,2,3)) # TODO: this doesn't work - needs to be fixed...
  # plot(row_dend3) # line width and line type are still ignored.
  Heatmap(x, Rowv = row_dend3)
  labels(row_dend3) <- 1:4
  Heatmap(x, Rowv = row_dend3)

  Heatmap(x, Rowv = row_dend3, xaxis_font_size = 30)
  Heatmap(x, Rowv = row_dend3, cexRow = 3)



  Heatmap(cor(iris[,2:3]), revC = TRUE)
  Heatmap(cor(iris[,2:3]))
  heatmap(cor(iris[,2:3]))


})
