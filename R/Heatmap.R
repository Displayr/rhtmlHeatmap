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
#' @param show_cellnote_in_cell If \code{TRUE}, print cellnotes in the cells. Defaults to FALSE.
#' @param cell_font_size Sets the maximum font size of cellnotes. Defauls to 11.
#' @param tip_font_size Sets the font size of texts in the tooltip. Defaults to 11.
#' @param extra_tooltip_info A list of matrices that contains extra information to show in the tooltips. Dim of each matrix must equal to \code{x}.
#'
#' @param cexRow positive numbers. If not missing, it will override \code{xaxis_font_size}
#' and will give it a value cexRow*14
#' @param cexCol positive numbers. If not missing, it will override \code{yaxis_font_size}
#' and will give it a value cexCol*14
#'
#' @param labRow character vectors with row labels to use (from top to bottom); default to rownames(x).
#' @param labCol character vectors with column labels to use (from left to right); default to colnames(x).
#'
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

  left_columns = NULL,
  left_columns_font_size = 11,
  right_columns = NULL,
  right_columns_font_size = 11,

  ## value formatting
  digits = 3L,
  cellnote,
  cellnote_scale = FALSE,
  show_cellnote_in_cell = FALSE,
  cell_font_size = 11,
  tip_font_size = 11,
  extra_tooltip_info = NULL,

  ##TODO: decide later which names/conventions to keep
  theme = NULL,
  colors = "RdYlBu",
  width = NULL, height = NULL,

  xaxis_hidden = FALSE,
  xaxis_height = 80,
  xaxis_font_size = 12,
  xaxis_title = NULL,
  xaxis_title_font_size = 14,
  xaxis_location = "bottom",

  yaxis_hidden = FALSE,
  yaxis_width = 120,
  yaxis_font_size = 11,
  yaxis_location = "right",
  yaxis_title = NULL,
  yaxis_title_font_size = 14,

  brush_color = "#0000FF",
  show_grid = TRUE,
  anim_duration = 500,

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


  ## Final touches before htmlwidgets
  ##=======================

  mtx <- list(data = as.character(t(cellnote)),
              dim = dim(x),
              rows = rownames(x),
              cols = colnames(x)
  )


  if (is.factor(x)) {
    colors <- scales::col_factor(colors, x, na.color = "transparent")
  } else {
    rng <- range(x, na.rm = TRUE)
    if (scale %in% c("row", "column")) {
      rng <- c(max(abs(rng)), -max(abs(rng)))
    }

    colors <- scales::col_numeric(colors, rng, na.color = "transparent")
  }

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
      yaxis_width = yaxis_width,
      xaxis_font_size = xaxis_font_size,
      yaxis_font_size = yaxis_font_size,
      xaxis_location = xaxis_location,
      yaxis_location = yaxis_location,
      xaxis_title = xaxis_title,
      yaxis_title = yaxis_title,
      xaxis_title_font_size = xaxis_title_font_size,
      yaxis_title_font_size = yaxis_title_font_size,
      xaxis_hidden = xaxis_hidden,
      yaxis_hidden = yaxis_hidden,
      tip_font_size = tip_font_size,
      brush_color = brush_color,
      show_grid = show_grid,
      shownote_in_cell = show_cellnote_in_cell,
      cell_font_size = cell_font_size,
      left_columns = left_columns,
      left_columns_font_size = left_columns_font_size,
      right_columns = right_columns,
      right_columns_font_size = right_columns_font_size,
      extra_tooltip_info = extra_tooltip_info,
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
    sizingPolicy = htmlwidgets::sizingPolicy(browser.fill = TRUE)
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
