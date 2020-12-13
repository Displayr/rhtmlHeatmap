import _ from 'lodash'
import d3 from 'd3'
import Controller from './controller'
import buildConfig from './buildConfig'
import Title from '../components/title'
import ColumnGroup from '../components/columnGroup'
import ColumnSubtitles from '../components/columnSubtitles'
import ColumnTitle from '../components/columnTitle'
import Colormap from '../components/colormap'
import Dendrogram from '../components/dendrogram'
import Legend from '../components/legend'
import XAxis from '../components/xAxis'
import YAxis from '../components/yAxis'
import YTitle from '../components/yTitle'
import { Layout, CellNames } from './layout'

class Heatmap {
  constructor ({
    selector,
    matrix,
    dendrogramRows,
    dendrogramColumns,
    options,
    width,
    height }) {
    const el = d3.select(selector)
    el.classed('rhtmlHeatmap', true)
    el.attr(`rhtmlHeatmap-status`, 'loading')

    let controller = new Controller()
    this.controller = controller

    // Set option defaults & copy settings
    var opts = buildConfig(options, width, height)
    this.options = opts
    this.components = {}

    this.matrix = this.normalizeMatrix(matrix)
    this.dendrogramData = {
      rows: dendrogramRows,
      columns: dendrogramColumns,
    }

    // rename to this.container
    var inner = el.append('g')
      .classed('inner', true)
      .style({ position: 'relative' })
    this.inner = inner

    this.buildLayout()
    this.wireupController()

    const cellsRequiringSpecialDrawInstructions = [
      CellNames.TOP_LEFT_COLUMN_SUBTITLE,
      CellNames.BOTTOM_LEFT_COLUMN_SUBTITLE,
      CellNames.TOP_RIGHT_COLUMN_SUBTITLE,
      CellNames.BOTTOM_RIGHT_COLUMN_SUBTITLE,
      CellNames.RIGHT_COLUMN_TITLE,
      CellNames.TITLE,
      CellNames.SUBTITLE,
      CellNames.FOOTER,
      CellNames.RIGHT_MARGIN, // NB do not draw the margin - it just holds space
    ]
    const simpleCells = _.omit(CellNames, cellsRequiringSpecialDrawInstructions)
    _(simpleCells).each(cellName => {
      if (this.layout.enabled(cellName)) {
        this.components[cellName].draw(this.layout.getCellBounds(cellName))
      }
    })

    // NB title/subtitle/footer : we want to center align with the colormap midpoint,
    // but we want to wrap using the canvas boundaries, not the colormap boundaries
    // we cannot currently express this in the layout component, so we need to do a bit of manual work here
    _([CellNames.TITLE, CellNames.SUBTITLE, CellNames.FOOTER]).each(cellName => {
      if (this.layout.enabled(cellName)) {
        const bounds = this.layout.getCellBounds(cellName)
        const midpoint = bounds.left + 0.5 * bounds.width
        const canvasWidth = this.options.width
        const shorterSide = Math.min(midpoint, canvasWidth - midpoint)
        bounds.left = midpoint - shorterSide
        bounds.width = 2 * shorterSide
        this.components[cellName].draw(bounds)
      }
    })

    if (this.layout.enabled(CellNames.TOP_LEFT_COLUMN_SUBTITLE)) {
      this.components[CellNames.TOP_LEFT_COLUMN_SUBTITLE].setColumnWidths(this.components[CellNames.LEFT_COLUMN].getColumnWidths())
      this.components[CellNames.TOP_LEFT_COLUMN_SUBTITLE].draw(this.layout.getCellBounds(CellNames.TOP_LEFT_COLUMN_SUBTITLE))
    }

    if (this.layout.enabled(CellNames.BOTTOM_LEFT_COLUMN_SUBTITLE)) {
      this.components[CellNames.BOTTOM_LEFT_COLUMN_SUBTITLE].setColumnWidths(this.components[CellNames.LEFT_COLUMN].getColumnWidths())
      this.components[CellNames.BOTTOM_LEFT_COLUMN_SUBTITLE].draw(this.layout.getCellBounds(CellNames.BOTTOM_LEFT_COLUMN_SUBTITLE))
    }

    if (this.layout.enabled(CellNames.TOP_RIGHT_COLUMN_SUBTITLE)) {
      this.components[CellNames.TOP_RIGHT_COLUMN_SUBTITLE].setColumnWidths(this.components[CellNames.RIGHT_COLUMN].getColumnWidths())
      this.components[CellNames.TOP_RIGHT_COLUMN_SUBTITLE].draw(this.layout.getCellBounds(CellNames.TOP_RIGHT_COLUMN_SUBTITLE))
    }

    if (this.layout.enabled(CellNames.BOTTOM_RIGHT_COLUMN_SUBTITLE)) {
      this.components[CellNames.BOTTOM_RIGHT_COLUMN_SUBTITLE].setColumnWidths(this.components[CellNames.RIGHT_COLUMN].getColumnWidths())
      this.components[CellNames.BOTTOM_RIGHT_COLUMN_SUBTITLE].draw(this.layout.getCellBounds(CellNames.BOTTOM_RIGHT_COLUMN_SUBTITLE))
    }

    // NB the right column subtitle sometimes extends it's width to accomodate long diagonal labels
    // the title centers in the middle of the width, but if the width has been extended, then
    // the title will be off to the right. So force the width of the title to be the sum of the columns, not the potentially
    // expanded width
    if (this.layout.enabled(CellNames.RIGHT_COLUMN_TITLE)) {
      this.components[CellNames.RIGHT_COLUMN_TITLE].forceWidth(_(this.components[CellNames.RIGHT_COLUMN].getColumnWidths()).sum())
      this.components[CellNames.RIGHT_COLUMN_TITLE].draw(this.layout.getCellBounds(CellNames.RIGHT_COLUMN_TITLE))
    }

    el.attr(`rhtmlHeatmap-status`, 'ready')
  }

  wireupController () {
    _(this.components).each(component => component.setController(this.controller))
    this.controller.addComponents(this.components)
    this.controller.addOuter(this.inner)
  }

  buildLayout () {
    this.layout = new Layout(this.options.width, this.options.height, this.options.padding)
    const { options, inner } = this
    if (this.dendrogramData.columns) { options.xaxis_location = 'bottom' }

    this.components[CellNames.COLORMAP] = new Colormap({
      parentContainer: inner,
      matrix: this.matrix,
      yaxisTitle: options.yaxis_title,
      xaxisTitle: options.xaxis_title,
      extraTooltipInfo: options.extra_tooltip_info,
      tipFontSize: options.tip_font_size,
      tipFontFamily: options.tip_font_family,
      cellFontSize: options.cell_font_size,
      cellFontFamily: options.cell_font_family,
      brushColor: options.brush_color,
      animDuration: options.anim_duration,
      showGrid: options.show_grid,
      shownoteInCell: options.shownote_in_cell,
      controller: this.controller,
    })
    this.layout.enable(CellNames.COLORMAP)
    this.layout.setFillCell(CellNames.COLORMAP)

    if (options.left_columns) {
      this.components[CellNames.LEFT_COLUMN] = new ColumnGroup({
        parentContainer: inner,
        classNames: CellNames.LEFT_COLUMN.toLowerCase(),
        labelMatrix: _.reverse(options.left_columns),
        alignments: options.left_columns_align,
        fontSize: options.left_columns_font_size,
        fontColor: options.left_columns_font_color,
        fontFamily: options.left_columns_font_family,
        padding: options.axis_padding,
        maxSingleColumnWidth: parseFloat(options.row_label_max_width) * options.width,
        maxHeight: Math.min(1, parseFloat(options.heatmap_max_height)) * options.height,
      })

      const dimensions = this.components[CellNames.LEFT_COLUMN].computePreferredDimensions()
      this.layout.enable(CellNames.LEFT_COLUMN)
      this.layout.setPreferredDimensions(CellNames.LEFT_COLUMN, dimensions)
    }

    if (!_.isEmpty(options.left_columns_subtitles)) {
      const columnSubtitleCellName = (options.xaxis_location === 'bottom')
        ? CellNames.BOTTOM_LEFT_COLUMN_SUBTITLE
        : CellNames.TOP_LEFT_COLUMN_SUBTITLE

      this.components[columnSubtitleCellName] = new ColumnSubtitles({
        parentContainer: inner,
        classNames: CellNames.TOP_LEFT_COLUMN_SUBTITLE.toLowerCase(),
        labels: _.reverse(options.left_columns_subtitles),
        fontSize: options.left_columns_subtitles_font_size,
        fontFamily: options.left_columns_subtitles_font_family,
        fontColor: options.left_columns_subtitles_font_color,
        padding: this.options.axis_padding,
        maxHeight: parseFloat(options.column_label_max_height) * this.options.height,
        orientation: options.column_label_orientation,
        verticalPlacement: options.xaxis_location,
        horizontalPlacement: 'left',
      })

      const dimensions = this.components[columnSubtitleCellName].computePreferredDimensions(this.components[CellNames.LEFT_COLUMN].getColumnWidths())
      this.layout.enable(columnSubtitleCellName)
      this.layout.setPreferredDimensions(columnSubtitleCellName, dimensions)
    }

    if (!_.isEmpty(options.left_columns_title)) {
      // NB need available width to perform wrapping, which influences required height
      const { width: availableWidth } = this.layout.getCellBounds(CellNames.LEFT_COLUMN)

      this.components[CellNames.LEFT_COLUMN_TITLE] = new ColumnTitle({
        parentContainer: inner,
        classNames: CellNames.LEFT_COLUMN_TITLE.toLowerCase(),
        text: options.left_columns_title,
        fontFamily: options.left_columns_title_font_family,
        fontSize: options.left_columns_title_font_size,
        fontColor: options.left_columns_title_font_color,
        maxWidth: availableWidth,
        maxLines: 3,
        bold: options.left_columns_title_bold,
      })

      const dimensions = this.components[CellNames.LEFT_COLUMN_TITLE].computePreferredDimensions()
      this.layout.enable(CellNames.LEFT_COLUMN_TITLE)
      this.layout.setPreferredDimensions(CellNames.LEFT_COLUMN_TITLE, dimensions)
    }

    if (options.right_columns) {
      this.components[CellNames.RIGHT_COLUMN] = new ColumnGroup({
        parentContainer: inner,
        classNames: CellNames.RIGHT_COLUMN.toLowerCase(),
        labelMatrix: options.right_columns,
        alignments: options.right_columns_align,
        fontSize: options.right_columns_font_size,
        fontColor: options.right_columns_font_color,
        fontFamily: options.right_columns_font_family,
        padding: options.axis_padding,
        maxSingleColumnWidth: parseFloat(options.row_label_max_width) * this.options.width,
        maxHeight: Math.min(1, parseFloat(options.heatmap_max_height)) * options.height,
      })

      const dimensions = this.components[CellNames.RIGHT_COLUMN].computePreferredDimensions(this.components[CellNames.RIGHT_COLUMN].getColumnWidths())
      this.layout.enable(CellNames.RIGHT_COLUMN)
      this.layout.setPreferredDimensions(CellNames.RIGHT_COLUMN, dimensions)
    }

    if (!_.isEmpty(options.right_columns_subtitles)) {
      const columnSubtitleCellName = (options.xaxis_location === 'bottom')
        ? CellNames.BOTTOM_RIGHT_COLUMN_SUBTITLE
        : CellNames.TOP_RIGHT_COLUMN_SUBTITLE

      this.components[columnSubtitleCellName] = new ColumnSubtitles({
        parentContainer: inner,
        classNames: CellNames.TOP_RIGHT_COLUMN_SUBTITLE.toLowerCase(),
        labels: options.right_columns_subtitles,
        fontSize: options.right_columns_subtitles_font_size,
        fontFamily: options.right_columns_subtitles_font_family,
        fontColor: options.right_columns_subtitles_font_color,
        padding: this.options.axis_padding,
        maxHeight: parseFloat(options.column_label_max_height) * this.options.height,
        orientation: options.column_label_orientation,
        verticalPlacement: options.xaxis_location,
        horizontalPlacement: 'right',
      })

      this.components[columnSubtitleCellName].setColumnWidths(this.components[CellNames.RIGHT_COLUMN].getColumnWidths())
      const dimensions = this.components[columnSubtitleCellName].computePreferredDimensions(this.components[CellNames.RIGHT_COLUMN].getColumnWidths())
      this.layout.enable(columnSubtitleCellName)
      this.layout.setPreferredDimensions(columnSubtitleCellName, dimensions)
    }

    if (!_.isEmpty(options.right_columns_title)) {
      // NB need available width to perform wrapping, which influences required height
      const { width: availableWidth } = this.layout.getCellBounds(CellNames.RIGHT_COLUMN)

      this.components[CellNames.RIGHT_COLUMN_TITLE] = new ColumnTitle({
        parentContainer: inner,
        classNames: CellNames.RIGHT_COLUMN_TITLE.toLowerCase(),
        text: options.right_columns_title,
        fontFamily: options.right_columns_title_font_family,
        fontSize: options.right_columns_title_font_size,
        fontColor: options.right_columns_title_font_color,
        maxWidth: availableWidth,
        maxLines: 3,
        bold: options.right_columns_title_bold,
      })

      const dimensions = this.components[CellNames.RIGHT_COLUMN_TITLE].computePreferredDimensions()
      this.layout.enable(CellNames.RIGHT_COLUMN_TITLE)
      this.layout.setPreferredDimensions(CellNames.RIGHT_COLUMN_TITLE, dimensions)
    }

    if (this.dendrogramData.columns) {
      this.components[CellNames.TOP_DENDROGRAM] = new Dendrogram({
        parentContainer: inner,
        data: this.dendrogramData.columns,
        type: CellNames.TOP_DENDROGRAM,
        height: options.xclust_height || options.height * 0.12,
        linkColor: this.options.link_color,
        animDuration: this.options.anim_duration,
      })

      const dimensions = this.components[CellNames.TOP_DENDROGRAM].computePreferredDimensions()
      this.layout.enable(CellNames.TOP_DENDROGRAM)
      this.layout.setPreferredDimensions(CellNames.TOP_DENDROGRAM, dimensions)
    }

    if (this.dendrogramData.rows) {
      this.components[CellNames.LEFT_DENDROGRAM] = new Dendrogram({
        parentContainer: inner,
        data: this.dendrogramData.rows,
        type: CellNames.LEFT_DENDROGRAM,
        width: options.yclust_width || options.width * 0.12,
        linkColor: this.options.link_color,
        animDuration: this.options.anim_duration,
      })

      const dimensions = this.components[CellNames.LEFT_DENDROGRAM].computePreferredDimensions()
      this.layout.enable(CellNames.LEFT_DENDROGRAM)
      this.layout.setPreferredDimensions(CellNames.LEFT_DENDROGRAM, dimensions)
    }

    if (options.legend_colors) {
      this.components[CellNames.COLOR_LEGEND] = new Legend({
        parentContainer: inner,
        colors: options.legend_colors,
        range: options.legend_range,
        digits: options.legend_digits,
        fontSize: options.legend_font_size,
        fontFamily: options.legend_font_family,
        fontColor: options.legend_font_color,
        leftSpace: options.legend_left_space,
        barWidth: options.legend_bar_width,
        xPadding: options.legend_x_padding,
        labelFormat: options.legend_label_format,
      })

      const dimensions = this.components[CellNames.COLOR_LEGEND].computePreferredDimensions()
      this.layout.enable(CellNames.COLOR_LEGEND)
      this.layout.setPreferredDimensions(CellNames.COLOR_LEGEND, dimensions)
    }

    if (!options.yaxis_hidden) {
      if (this.dendrogramData.rows) { options.yaxis_location = 'right' }
      const yaxisCellName = (options.yaxis_location === 'right')
        ? CellNames.RIGHT_YAXIS
        : CellNames.LEFT_YAXIS

      this.components[yaxisCellName] = new YAxis({
        parentContainer: inner,
        placement: (yaxisCellName === CellNames.LEFT_YAXIS) ? 'left' : 'right',
        type: yaxisCellName,
        labels: this.matrix.rows,
        fontSize: options.yaxis_font_size,
        fontFamily: options.yaxis_font_family,
        fontColor: options.yaxis_font_color,
        maxWidth: parseFloat(options.row_label_max_width) * options.width,
        maxHeight: Math.min(1, parseFloat(options.heatmap_max_height)) * options.height,
      })

      const dimensions = this.components[yaxisCellName].computePreferredDimensions()
      this.layout.enable(yaxisCellName)
      this.layout.setPreferredDimensions(yaxisCellName, dimensions)
    }

    // NB Xaxis, title, subtitle, and footer complication: wrapping.
    // To know the required height (due to wrapping),
    // we need to know the available width. (this is why it is done near end)

    // NB title/subtitle/footer : we want to center align with the colormap midpoint,
    // but we want to wrap using the canvas boundaries, not the colormap boundaries.
    // we cannot currently express this in the layout component, so we need to do a bit of manual work here
    if (!_.isEmpty(options.xaxis_title)) {
      const xaxisTitleCellName = (options.xaxis_location === 'bottom')
        ? CellNames.BOTTOM_XAXIS_TITLE
        : CellNames.TOP_XAXIS_TITLE
      const { width: estimatedWidth } = this.layout.getEstimatedCellBounds(xaxisTitleCellName)

      this.components[xaxisTitleCellName] = new Title({
        parentContainer: inner,
        text: options.xaxis_title,
        fontFamily: options.xaxis_title_font_family,
        fontSize: options.xaxis_title_font_size,
        fontColor: options.xaxis_title_font_color,
        maxLines: 3,
        bold: options.xaxis_title_bold,
      })

      const dimensions = this.components[xaxisTitleCellName].computePreferredDimensions(estimatedWidth)
      this.layout.enable(xaxisTitleCellName)
      this.layout.setPreferredDimensions(xaxisTitleCellName, dimensions)
    }

    if (!options.xaxis_hidden) {
      const xaxisCellName = (options.xaxis_location === 'bottom')
        ? CellNames.BOTTOM_XAXIS
        : CellNames.TOP_XAXIS

      const { width: estimatedWidth } = this.layout.getEstimatedCellBounds(xaxisCellName)
      const estimatedColormapColumnWidth = estimatedWidth / this.matrix.cols.length

      // TODO NB estimateColumnWidth < MAGIC NUMBER - expose as advanced param
      // TODO NB Should this be pushed into xaxis class ?
      // proposed logic (deferred for now)
      // let rotation = 0
      // if (xaxisCellName === CellNames.BOTTOM_XAXIS) { rotation = 45 }
      // if (xaxisCellName === CellNames.TOP_XAXIS) {
      //   if (options.left_columns_subtitles || options.right_columns_subtitles) { rotation = -45 }
      //   if (estimatedColumnWidth < 100) { rotation = -45 }
      // }

      this.components[xaxisCellName] = new XAxis({
        parentContainer: inner,
        labels: this.matrix.cols,
        fontSize: options.xaxis_font_size,
        fontFamily: options.xaxis_font_family,
        fontColor: options.xaxis_font_color,
        maxHeight: parseFloat(options.column_label_max_height) * this.options.height,
        orientation: options.column_label_orientation,
        placement: (xaxisCellName === CellNames.BOTTOM_XAXIS) ? 'bottom' : 'top',
      })

      const dimensions = this.components[xaxisCellName].computePreferredDimensions(estimatedColormapColumnWidth)
      this.layout.enable(xaxisCellName)
      this.layout.setPreferredDimensions(xaxisCellName, dimensions)
    }

    if (!_.isEmpty(options.title)) {
      const { width: estimatedWidth, left: estimatedLeftBound } = this.layout.getEstimatedCellBounds(CellNames.TITLE)

      this.components[CellNames.TITLE] = new Title({
        parentContainer: inner,
        text: options.title,
        fontColor: options.title_font_color,
        fontSize: options.title_font_size,
        fontFamily: options.title_font_family,
        bold: false,
      })

      const midpoint = estimatedLeftBound + 0.5 * estimatedWidth
      const shorterSide = Math.min(midpoint, this.options.width - midpoint)

      const dimensions = this.components[CellNames.TITLE].computePreferredDimensions(2 * shorterSide)
      this.layout.enable(CellNames.TITLE)
      this.layout.setPreferredDimensions(CellNames.TITLE, dimensions)
    }

    if (!_.isEmpty(options.subtitle)) {
      const { width: estimatedWidth, left: estimatedLeftBound } = this.layout.getEstimatedCellBounds(CellNames.SUBTITLE)

      this.components[CellNames.SUBTITLE] = new Title({
        parentContainer: inner,
        text: options.subtitle,
        fontColor: options.subtitle_font_color,
        fontSize: options.subtitle_font_size,
        fontFamily: options.subtitle_font_family,
        bold: false,
      })

      const midpoint = estimatedLeftBound + 0.5 * estimatedWidth
      const shorterSide = Math.min(midpoint, this.options.width - midpoint)

      const dimensions = this.components[CellNames.SUBTITLE].computePreferredDimensions(2 * shorterSide)
      this.layout.enable(CellNames.SUBTITLE)
      this.layout.setPreferredDimensions(CellNames.SUBTITLE, dimensions)
    }

    if (!_.isEmpty(options.footer)) {
      const { width: estimatedWidth, left: estimatedLeftBound } = this.layout.getEstimatedCellBounds(CellNames.FOOTER)

      this.components[CellNames.FOOTER] = new Title({
        parentContainer: inner,
        text: options.footer,
        fontColor: options.footer_font_color,
        fontSize: options.footer_font_size,
        fontFamily: options.footer_font_family,
        bold: false,
      })

      const midpoint = estimatedLeftBound + 0.5 * estimatedWidth
      const shorterSide = Math.min(midpoint, this.options.width - midpoint)

      const dimensions = this.components[CellNames.FOOTER].computePreferredDimensions(2 * shorterSide)
      this.layout.enable(CellNames.FOOTER)
      this.layout.setPreferredDimensions(CellNames.FOOTER, dimensions)
    }

    if (!_.isEmpty(options.yaxis_title)) {
      // NB Ytitle complication: wrapping.
      // To know the required width (due to wrapping),
      // we need to know the available height. (this is why it is done at end)

      // doing this after the Xaxis, title, subtitle, and footer may invalidate some of their math, this is a tradeoff
      // that is not yet properly addressed in this library
      // by placing this last we are favoring yaxis title wrapping

      const yaxisTitleCellName = this.layout.enabled(CellNames.RIGHT_YAXIS)
        ? CellNames.RIGHT_YAXIS_TITLE
        : CellNames.LEFT_YAXIS_TITLE

      const estimatedHeight = _([
        options.heatmap_max_height * options.height,
        this.layout.getEstimatedCellBounds(yaxisTitleCellName).height,
      ]).min()

      this.components[yaxisTitleCellName] = new YTitle({
        parentContainer: inner,
        text: options.yaxis_title,
        type: yaxisTitleCellName,
        fontFamily: options.yaxis_title_font_family,
        fontSize: options.yaxis_title_font_size,
        fontColor: options.yaxis_title_font_color,
        maxLines: 3,
        maxHeight: estimatedHeight,
        bold: options.yaxis_title_bold,
      })

      const dimensions = this.components[yaxisTitleCellName].computePreferredDimensions()
      this.layout.enable(yaxisTitleCellName)
      this.layout.setPreferredDimensions(yaxisTitleCellName, dimensions)
    }

    this.layout.allComponentsRegistered()
  }

  normalizeMatrix (matrix) {
    if (!_.isArray(matrix.cols)) { matrix.cols = [matrix.cols] }
    if (!_.isArray(matrix.rows)) { matrix.rows = [matrix.rows] }
    return matrix
  }
}

module.exports = Heatmap
