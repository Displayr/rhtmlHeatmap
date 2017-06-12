#' @import htmlwidgets
#' @importFrom grDevices col2rgb rgb
#' @importFrom stats as.dendrogram dendrapply dist hclust is.leaf order.dendrogram reorder sd
NULL

`%||%` <- function(a, b) {
  if (!is.null(a))
    a
  else
    b
}

#' rhtmlHeatmap widget
#'
#' Creates a D3.js-based heatmap widget. Modified from d3heatmap package.
#'
#' @param x A numeric matrix
#'   Defaults to \code{TRUE} unless \code{x} contains any \code{NA}s.
#' @param theme A custom CSS theme to use. Currently the only valid values are
#'   \code{""} and \code{"dark"}. \code{"dark"} is primarily intended for
#'   standalone visualizations, not R Markdown or Shiny.
#' @param colors Either a colorbrewer2.org palette name (e.g. \code{"YlOrRd"} or
#'   \code{"Blues"}), or a vector of colors to interpolate in hexadecimal
#'   \code{"#RRGGBB"} format, or a color interpolation function like
#'   \code{\link[grDevices]{colorRamp}}.
#' @param width Width in pixels (optional, defaults to automatic sizing).
#' @param height Height in pixels (optional, defaults to automatic sizing).
#'
#' @param xaxis_height Size of axes, in pixels. Default is calculated automatically with axis font size specified.
#' @param yaxis_width Size of axes, in pixels. Default is calculated automatically with axis font size specified.
#' @param xaxis_font_size Font size of axis labels, as a CSS size (e.g. "14px" or "12pt"). Defaults to 12.
#' @param yaxis_font_size Font size of axis labels, as a CSS size (e.g. "14px" or "12pt"). Defaults to 11.
#' @param xaxis_location Location of the x axis, c("bottom", "top"). Defaults to "bottom". "top" only works when dendrogram is "none".
#' @param yaxis_location Location of the y axis, c("right", "left"). Defaults to "right". "left" only works when dendrogram is "none".
#' @param xaxis_title Title text of the x axis.
#' @param yaxis_title Title text of the y axis.
#' @param xaxis_title_font_size Size of axis title text. Defaults to 14.
#' @param yaxis_title_font_size Size of axis title text. Defaults to 14.
#' @param xaxis_hidden Boolean variable to hide x axis. Defaults to FALSE.
#' @param yaxis_hidden Boolean variable to hide y axis. Defaults to FALSE.
#'
#'
#' @param brush_color The base color to be used for the brush. The brush will be
#'   filled with a low-opacity version of this color. \code{"#RRGGBB"} format
#'   expected.
#' @param show_grid \code{TRUE} to show gridlines, \code{FALSE} to hide them, or
#'   a numeric value to specify the gridline thickness in pixels (can be a
#'   non-integer).
#' @param anim_duration Number of milliseconds to animate zooming in and out.
#'   For large \code{x} it may help performance to set this value to \code{0}.
#'
#' @param Rowv determines if and how the row dendrogram should be reordered.	By default, it is TRUE, which implies dendrogram is computed and reordered based on row means. If NULL or FALSE, then no dendrogram is computed and no reordering is done. If a dendrogram, then it is used "as-is", ie without any reordering. If a vector of integers, then dendrogram is computed and reordered based on the order of the vector.
#' @param Colv determines if and how the column dendrogram should be reordered.	Has the options as the Rowv argument above and additionally when x is a square matrix, Colv = "Rowv" means that columns should be treated identically to the rows.
#' @param distfun function used to compute the distance (dissimilarity) between both rows and columns. Defaults to dist.
#' @param hclustfun function used to compute the hierarchical clustering when Rowv or Colv are not dendrograms. Defaults to hclust.
#' @param dendrogram character string indicating whether to draw 'none', 'row', 'column' or 'both' dendrograms. Defaults to 'both'. However, if Rowv (or Colv) is FALSE or NULL and dendrogram is 'both', then a warning is issued and Rowv (or Colv) arguments are honoured.
#' @param reorderfun function(d, w) of dendrogram and weights for reordering the row and column dendrograms. The default uses stats{reorder.dendrogram}
#'
#' @param k_row an integer scalar with the desired number of groups by which to color the dendrogram's branches in the rows (uses \link[dendextend]{color_branches})
#' @param k_col an integer scalar with the desired number of groups by which to color the dendrogram's branches in the columns (uses \link[dendextend]{color_branches})
#'
#' @param symm logical indicating if x should be treated symmetrically; can only be true when x is a square matrix.
#' @param revC logical indicating if the column order should be reversed for plotting.
#' Default (when missing) - is FALSE, unless symm is TRUE.
#' This is useful for cor matrix.
#'
#' @param scale character indicating if the values should be centered and scaled in either the row direction or the column direction, or none. The default is "none".
#' @param na.rm logical indicating whether NA's should be removed.
#'
#' @param digits integer indicating the number of decimal places to be used by \link{round} for 'label'.
#' @param cellnote (optional) matrix of the same dimensions as \code{x} that has the human-readable version of each value, for displaying to the user on hover. If \code{NULL}, then \code{x} will be coerced using \code{\link{as.character}}.
#' If missing, it will use \code{x}, after rounding it based on the \code{digits} parameter.
#' @param cellnote_scale logical (default is FALSE). IF cellnote is missing and x is used,
#' should cellnote be scaled if x is also scaled?
#' @param cellnote_in_cell Overrides cellnote when the user wish to display texts inside the cells that are different from the tooltips.
#' @param show_cellnote_in_cell If \code{TRUE}, print cellnotes in the cells. Defaults to FALSE.
#' @param cell_font_size Sets the maximum font size of cellnotes. Defauls to 11.
#' @param tip_font_size Sets the font size of texts in the tooltip. Defaults to 11.
#' @param extra_tooltip_info A list of matrices that contains extra information to show in the tooltips. Dim of each matrix must equal to \code{x}.
#' @param lower_triangle A logical value to specify if only the lower triangle will be displayed. Defaults to FALSE and will give an error if \code{x} is not a square matrix.
#' @param color_range A vector of length 2 that specifies the range of values that colors get mapped to. The default is computed from \code{x}. If \code{x} is a factor, this argument is ignored.
#' @param cells_to_hide A boolean matrix with the same dimension as \code{x} that specifies which cell to hide. Hidden cells will not trigger tooltips and will be transparent in color.
#'
#' @param cexRow positive numbers. If not missing, it will override \code{xaxis_font_size}
#' and will give it a value cexRow*14
#' @param cexCol positive numbers. If not missing, it will override \code{yaxis_font_size}
#' and will give it a value cexCol*14
#'
#' @param show_legend logical. Defaults to TRUE. However, if \code{scale} is not "none", legend will not be shown.
#' @param legend_font_size positive integer. Sets the font size of the legend. Defaults to 11 (pixcels).
#' @param legend_width positive integer. Sets the desired width of the legend bar. Defaults to 60 (pixcels).
#' @param legend_digits positive integer. Sets the decimal places of the legend texts. Defaults to 1 if the max value of \code{x} is less than 1.0.
#'
#' @param labRow character vectors with row labels to use (from top to bottom); default to rownames(x).
#' @param labCol character vectors with column labels to use (from left to right); default to colnames(x).
#'
#' @param title character. Sets the title of the chart, defaults to NULL. The title is centred.
#' @param title_font_size integer. Font size of the chart title, defaults to 24 pixcels.
#' @param title_font_family character. Font family of the chart title, defaults to "sans-serif".
#' @param title_font_color An RGB character to set the color of the chart title. Defaults to "#000000".
#' @param subtitle character. Sets the subtitle of the chart, defaults to NULL. The subtitle is centred.
#' @param subtitle_font_size integer. Font size of the chart subtitle, defaults to 18 pixcels.
#' @param subtitle_font_family character. Font family of the chart subtitle, defaults to "sans-serif".
#' @param subtitle_font_color An RGB character to set the color of the chart subtitle. Defaults to "#000000".
#' @param footer character. Sets the footer of the chart, defaults to NULL. The footer is left-aligned.
#' @param footer_font_size integer. Font size of the chart footer_font_size, defaults to 11 pixcels.
#' @param footer_font_family character. Font family of the chart footer_font_family, defaults to "sans-serif".
#' @param footer_font_color An RGB character to set the color of the chart footer_font_color. Defaults to "#000000".
#' @param ... currently ignored
#'
#' @import htmlwidgets
#'
#' @export
#' @source
#' The interface was designed based on \link{heatmap} and \link[gplots]{heatmap.2}
#'
#' @seealso
#' \link{heatmap}, \link[gplots]{heatmap.2}
#'
#' @examples
#' library(rhtmlHeatmap)
#' Heatmap(mtcars, scale = "column", colors = "Blues")
#'
#'
Heatmap <- function(x,

  ## dendrogram control
  Rowv = TRUE,
  Colv = if (symm) "Rowv" else TRUE,
  distfun = dist,
  hclustfun = hclust,
  dendrogram = c("both", "row", "column", "none"),
  reorderfun = function(d, w) reorder(d, w),

  k_row,
  k_col,

  symm = FALSE,
  revC,

  ## data scaling
  scale = c("none", "row", "column"),
  na.rm = TRUE,

  labRow = rownames(x),
  labCol = colnames(x),

  cexRow,
  cexCol,

  ## value formatting
  digits = 3L,
  cellnote,
  cellnote_scale = FALSE,
  cellnote_in_cell = NULL,
  show_cellnote_in_cell = FALSE,
  extra_tooltip_info = NULL,
  color_range = NULL,
  lower_triangle = FALSE,
  cells_to_hide = NULL,

  cell_font_size = 11,
  cell_font_family = "sans-serif",

  tip_font_size = 11,
  tip_font_family = "sans-serif",

  show_legend = TRUE,
  legend_font_size = 11,
  legend_font_family = "sans-serif",
  legend_font_color = "#000000",
  legend_width = 60,
  legend_digits = 1,

  ##TODO: decide later which names/conventions to keep
  theme = NULL,
  colors = "RdYlBu",
  width = NULL, height = NULL,

  title = NULL,
  title_font_size = 24,
  title_font_family = "sans-serif",
  title_font_color = "#000000",

  subtitle = NULL,
  subtitle_font_size = 18,
  subtitle_font_family = "sans-serif",
  subtitle_font_color = "#000000",

  footer = NULL,
  footer_font_size = 11,
  footer_font_family = "sans-serif",
  footer_font_color = "#000000",

  xaxis_hidden = FALSE,
  xaxis_height = 80,
  xaxis_font_size = 12,
  xaxis_font_family = "sans-serif",
  xaxis_font_color = "#000000",
  xaxis_location = "bottom",

  xaxis_title = NULL,
  xaxis_title_font_size = 14,
  xaxis_title_font_family = "sans-serif",
  xaxis_title_font_color = "#000000",

  yaxis_hidden = FALSE,
  yaxis_width = 120,
  yaxis_font_size = 11,
  yaxis_font_family = "sans-serif",
  yaxis_font_color = "#000000",
  yaxis_location = "right",

  yaxis_title = NULL,
  yaxis_title_font_size = 14,
  yaxis_title_font_family = "sans-serif",
  yaxis_title_font_color = "#000000",


  left_columns = NULL,
  left_columns_font_size = 11,
  left_columns_font_family = "sans-serif",
  left_columns_font_color = "#000000",
  right_columns = NULL,
  right_columns_font_size = 11,
  right_columns_font_family = "sans-serif",
  right_columns_font_color = "#000000",

  brush_color = "#0000FF",
  show_grid = TRUE,
  anim_duration = 500,
  table_style = FALSE,

  ...
) {

  ## x is a matrix!
  ##====================
  if(!is.matrix(x)) {
    x <- as.matrix(x)
  }
  if(!is.matrix(x)) stop("x must be a matrix")

  nr <- dim(x)[1]
  nc <- dim(x)[2]
  ### TODO: debating if to include this or not:
  #   if(nr <= 1 || nc <= 1)
  #     stop("`x' must have at least 2 rows and 2 columns")

  ## Labels for Row/Column
  ##======================
  rownames(x) <- labRow %||% paste(1:nrow(x))
  colnames(x) <- labCol %||% paste(1:ncol(x))

  if(!missing(cexRow)) {
    if(is.numeric(cexRow)) {
      xaxis_font_size <- cexRow * 14
    } else {
      warning("cexRow is not numeric. It is ignored")
    }
  }
  if(!missing(cexCol)) {
    if(is.numeric(cexCol)) {
      yaxis_font_size <- cexCol * 14
    } else {
      warning("cexCol is not numeric. It is ignored")
    }
  }


  ## Dendrograms for Row/Column
  ##=======================
  dendrogram <- match.arg(dendrogram)

  # Use dendrogram argument to set defaults for Rowv/Colv
  if (missing(Rowv)) {
    Rowv <- dendrogram %in% c("both", "row")
  }
  if (missing(Colv)) {
    Colv <- dendrogram %in% c("both", "column")
  }


  if (isTRUE(Rowv)) {
    Rowv <- rowMeans(x, na.rm = na.rm)
  }
  if (is.numeric(Rowv)) {
    if (sum(is.na(x)) > 0) {
      if (sum(rowSums(is.na(x)) == nc) > 0) {
        stop("Row dendrogram cannot be computed when one or more rows contain missing values only.
             Inspect the data and try to remove these rows or set dendrogram = 'none'.")
      }
    }
    Rowv <- reorderfun(as.dendrogram(hclustfun(distfun(x))), Rowv)
  }
  if (is.dendrogram(Rowv)) {
    Rowv <- rev(Rowv)
    rowInd <- order.dendrogram(Rowv)
    if(nr != length(rowInd))
      stop("Row dendrogram is the wrong size")
  } else {
    if (!is.null(Rowv) && !is.na(Rowv) && !identical(Rowv, FALSE))
      warning("Invalid value for Rowv, ignoring")
    Rowv <- NULL
    rowInd <- 1:nr
  }

  if (identical(Colv, "Rowv")) {
    Colv <- Rowv
  }
  if (isTRUE(Colv)) {
    Colv <- colMeans(x, na.rm = na.rm)
  }
  if (is.numeric(Colv)) {
    if (sum(is.na(x)) > 0) {
      if (sum(colSums(is.na(x)) == nr) > 0) {
        stop("Column dendrogram cannot be computed when one or more columns contain missing values only.
             Inspect the data and try to remove these columns or set dendrogram = 'none'.")
      }
    }
    Colv <- reorderfun(as.dendrogram(hclustfun(distfun(t(x)))), Colv)
  }
  if (is.dendrogram(Colv)) {
    colInd <- order.dendrogram(Colv)
    if (nc != length(colInd))
      stop("Col dendrogram is the wrong size")
  } else {
    if (!is.null(Colv) && !is.na(Colv) && !identical(Colv, FALSE))
      warning("Invalid value for Colv, ignoring")
    Colv <- NULL
    colInd <- 1:nc
  }


  # TODO:  We may wish to change the defaults a bit in the future
  ## revC
  ##=======================
  if(missing(revC)) {
    if (symm) {
      revC <- TRUE
    } else if(is.dendrogram(Colv) & is.dendrogram(Rowv) & identical(Rowv, rev(Colv))) {
      revC <- TRUE
    } else {
      revC <- FALSE
    }
  }
  if(revC) {
    Colv <- rev(Colv)
    colInd <- rev(colInd)
  }

  ## reorder x (and others)
  ##=======================
  x <- x[rowInd, colInd]
  if (!missing(cellnote))
    cellnote <- cellnote[rowInd, colInd]

  if (!is.null(extra_tooltip_info)) {
    if (is.matrix(extra_tooltip_info)) {
      stop("extra_tooltip_info must be a list of matrices")
    }

    extra_tooltip_names = names(extra_tooltip_info)
    if (is.null(extra_tooltip_names)) {
      names(extra_tooltip_info) = paste0("param", 1:length(extra_tooltip_info))
    }

    for (i in 1:length(extra_tooltip_info)) {
      if (!identical(dim(x), dim(extra_tooltip_info[[i]]))) {
        stop("Matrices in extra_tooltip_info must have same dimensions as x")
      } else {
        extra_tooltip_info[[i]] <- as.character(t(extra_tooltip_info[[i]][rowInd, colInd]))
      }
    }
  }

  ## Dendrograms - Update the labels and change to dendToTree
  ##=======================

  # color branches?
  #----------------
    # Due to the internal working of dendextend, in order to use it we first need
      # to populate the dendextend::dendextend_options() space:
  if(!missing(k_row) | !missing(k_col)) dendextend::assign_dendextend_options()

  if(is.dendrogram(Rowv) & !missing(k_row)) {
    Rowv <- dendextend::color_branches(Rowv, k = k_row)
  }
  if(is.dendrogram(Colv) & !missing(k_col)) {
    Colv <- dendextend::color_branches(Colv, k = k_col)
  }

  rowDend <- if(is.dendrogram(Rowv)) dendToTree(Rowv) else NULL
  colDend <- if(is.dendrogram(Colv)) dendToTree(Colv) else NULL


  ## Scale the data?
  ##====================
  scale <- match.arg(scale)

  if(!cellnote_scale) x_unscaled <- x #keeps a backup for cellnote

  if(scale == "row") {
    x <- sweep(x, 1, rowMeans(x, na.rm = na.rm))
    x <- sweep(x, 1, apply(x, 1, sd, na.rm = na.rm), "/")
  }
  else if(scale == "column") {
    x <- sweep(x, 2, colMeans(x, na.rm = na.rm))
    x <- sweep(x, 2, apply(x, 2, sd, na.rm = na.rm), "/")
  }


  ## cellnote
  ##====================
  if(missing(cellnote)) {
    if(cellnote_scale) {
      cellnote <- round(x, digits = digits)
    } else { # default
      cellnote <- round(x_unscaled, digits = digits)
    }
  }

  # Check that cellnote is o.k.:
  if (is.null(dim(cellnote))) {
    if (length(cellnote) != nr*nc) {
      stop("Incorrect number of cellnote values")
    }
    dim(cellnote) <- dim(x)
  }
  if (!identical(dim(x), dim(cellnote))) {
    stop("cellnote matrix must have same dimensions as x")
  }

  # handling NAs
  cellnote[is.na(cellnote)] = "No data"

  # handling cellnote_in_cell
  if (show_cellnote_in_cell) {
    if (!is.null(cellnote_in_cell)) {
      if (!identical(dim(x), dim(cellnote_in_cell)))
        stop("cellnote_in_cell must be a matrix with the same dimension as x!")
      cellnote_in_cell = cellnote_in_cell[rowInd, colInd]
    } else {
      cellnote_in_cell = cellnote
    }
  } else {
    cellnote_in_cell = matrix(rep(NA, nr*nc), nrow = nr)
  }

  ## Final touches before htmlwidgets
  ##=======================

  # cells to hide completely
  if (!is.null(cells_to_hide)) {
    if (!identical(dim(x), dim(cells_to_hide)))
      stop("cells_to_hide must be a matrix with the same dimension as x!")
  } else {
    cells_to_hide = matrix(rep(0, nr*nc), nrow = nr)
  }

  if (lower_triangle) {
    if (nr != nc) stop("x must be a square matrix if lower_triangle = TRUE")
    for (i in 1:nr) {
      for (j in 1:nc) {
        if (j > i) {
          cells_to_hide[i,j] = 1
        }
      }
    }
  }

  # compute_notecolor = matrix(rep(1, nr*nc), nrow = nr)
  # for (i in 1:nr) {
  #   for (j in 1:nc) {
  #     if (is.na(x[i,j]) && cellnote[i,j] != "No data") {
  #       # cellnote is provided but x is NA
  #       compute_notecolor[i,j] = 0
  #     }
  #   }
  # }

  mtx <- list(data = as.character(t(cellnote)),
              dim = dim(x),
              rows = rownames(x),
              cols = colnames(x),
              cells_to_hide = as.numeric(t(cells_to_hide)),
              cellnote_in_cell = as.character(t(cellnote_in_cell))
  )

  legend.colors = NULL
  legend.range = NULL
  x_is_factor = FALSE

  if (show_legend) {
    if (scale == "column" || scale == "row") {
      show_legend = FALSE
    }
  }
  if (is.factor(x)) {
    x_is_factor = TRUE
    colors <- scales::col_factor(colors, x, na.color = "transparent")
    if (show_legend) {
      legend.colors = colors(unique(x))
      legend.range = as.character(unique(x))
    }
  } else {
    if (!is.null(color_range)) {
      if (!is.vector(color_range) || length(color_range) != 2) {
        stop("color_range must be a vector with length 2.")
      }
      if (max(x, na.rm = TRUE) > max(color_range) || min(x, na.rm = TRUE) < min(color_range)) {
        stop("Range of color_range must not be smaller than range of x.
             If this is not the case, make sure scale is set to 'none'")
      }
      colors <- scales::col_numeric(colors, color_range, na.color = "transparent")
      rng <- c(min(color_range), max(color_range))
    } else {
      rng <- range(x, na.rm = TRUE)
      if (scale %in% c("row", "column")) {
        rng <- c(max(abs(rng)), -max(abs(rng)))
      }

      colors <- scales::col_numeric(colors, rng, na.color = "transparent")
    }

    if (show_legend) {
      legend.val = seq(max(rng), min(rng), by = ((min(rng) - max(rng))/49))
      legend.colors = colors(legend.val)
      legend.range = rng
    }
  }

  # colors is now a function that takes a number and returns an #RRGGBB value
  imgUri <- encodeAsPNG(t(x), colors)

  check.extra.columns <- function(input) {
    if (is.null(input)) {
      return(NULL)
    }
    name = deparse(substitute(input))
    output = input

    if (is.list(output)){
      output = unlist(output)
      if (length(output) != nr)
        stop(paste0("Number of rows of ", name," not equal to input data."))

    } else if (is.vector(output)){
      if (length(output) != nr)
        stop(paste0("Number of rows of ", name," not equal to input data."))

    } else if (is.matrix(output) || is.data.frame(output)){
      if (nrow(output) != nr)
        stop(paste0("Number of rows of ", name," not equal to input data."))

    } else {
      stop(paste0(name, "is not a list, vector, matrix or data frame."))
    }

    output[is.na(output)] = "No Data"
    output = as.matrix(output)
    return(t(output))
  }
  left_columns = check.extra.columns(left_columns)
  right_columns = check.extra.columns(right_columns)


  options <- NULL

  options <- c(options, list(
      xaxis_height = xaxis_height,
      xaxis_font_size = xaxis_font_size,
      xaxis_font_family = xaxis_font_family,
      xaxis_font_color = xaxis_font_color,
      xaxis_location = xaxis_location,
      xaxis_hidden = xaxis_hidden,

      yaxis_width = yaxis_width,
      yaxis_font_size = yaxis_font_size,
      yaxis_font_family = yaxis_font_family,
      yaxis_font_color = yaxis_font_color,
      yaxis_location = yaxis_location,
      yaxis_hidden = yaxis_hidden,

      xaxis_title = xaxis_title,
      xaxis_title_font_size = xaxis_title_font_size,
      xaxis_title_font_family = xaxis_title_font_family,
      xaxis_title_font_color = xaxis_title_font_color,

      yaxis_title = yaxis_title,
      yaxis_title_font_size = yaxis_title_font_size,
      yaxis_title_font_family = yaxis_title_font_family,
      yaxis_title_font_color = yaxis_title_font_color,

      title = title,
      title_font_size = title_font_size,
      title_font_family = title_font_family,
      title_font_color = title_font_color,

      subtitle = subtitle,
      subtitle_font_size = subtitle_font_size,
      subtitle_font_family = subtitle_font_family,
      subtitle_font_color = subtitle_font_color,

      footer = footer,
      footer_font_size = footer_font_size,
      footer_font_family = footer_font_family,
      footer_font_color = footer_font_color,

      tip_font_size = tip_font_size,
      tip_font_family = tip_font_family,

      cell_font_size = cell_font_size,
      cell_font_family = cell_font_family,

      legend_font_size = legend_font_size,
      legend_font_family = legend_font_family,
      legend_font_color = legend_font_color,

      left_columns = left_columns,
      left_columns_font_size = left_columns_font_size,
      left_columns_font_family = left_columns_font_family,
      left_columns_font_color = left_columns_font_color,

      right_columns = right_columns,
      right_columns_font_size = right_columns_font_size,
      right_columns_font_family = right_columns_font_family,
      right_columns_font_color = right_columns_font_color,

      brush_color = brush_color,
      show_grid = show_grid,
      x_is_factor = x_is_factor,
      legend_colors = legend.colors,
      legend_range = legend.range,
      legend_width = legend_width,
      legend_digits = legend_digits,
      shownote_in_cell = show_cellnote_in_cell,
      extra_tooltip_info = extra_tooltip_info,
      table_style = table_style,
      anim_duration = anim_duration
  ))

  if (is.null(rowDend)) {
      options <- c(options, list(yclust_width = 0))
  }
  if (is.null(colDend)) {
      options <- c(options, list(xclust_height = 0))
  }

  payload <- list(rows = rowDend, cols = colDend, matrix = mtx, image = imgUri,
    theme = theme, options = options)

  # create widget
  htmlwidgets::createWidget(
    name = 'rhtmlHeatmap',
    payload,
    width = width,
    height = height,
    package = 'rhtmlHeatmap',
    sizingPolicy = htmlwidgets::sizingPolicy(browser.padding = 5,
                                             viewer.padding = 5,
                                             browser.fill = TRUE)
  )
}

#' @import png base64enc
encodeAsPNG <- function(x, colors) {
  colorData <- as.raw(col2rgb(colors(x), alpha = TRUE))
  dim(colorData) <- c(4, ncol(x), nrow(x))
  pngData <- png::writePNG(colorData)
  encoded <- base64enc::base64encode(pngData)
  paste0("data:image/png;base64,", encoded)
}
