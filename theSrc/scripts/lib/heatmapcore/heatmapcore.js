import _ from 'lodash'
import d3 from 'd3'
import Controller from './controller'
import buildConfig from './buildConfig'
import dendrogram from './dendrogram'
import colormap from './colormap'
import ColumnGroup from '../components/columnGroup'
import ColumnSubtitles from '../components/columnSubtitles'
import Legend from '../components/legend'
import title_footer from './title_footer'
import axis from './axis'
import XAxis from '../components/xAxis'
import YAxis from '../components/yAxis'
import XTitle from '../components/xTitle'
import YTitle from '../components/yTitle'
import wrap_new from './wrap_new'
import { HeatmapLayout, CellNames } from './layout'

class Heatmap {
  constructor ({
    selector,
    matrix,
    dendrogramRows,
    dendrogramColumns,
    options,
    width,
    height}) {
    const el = d3.select(selector)
    el.classed('rhtmlHeatmap', true)
    el.attr(`rhtmlHeatmap-status`, 'loading')

    var controller = new Controller()

    // Set option defaults & copy settings
    var opts = buildConfig(options, width, height)
    this.options = opts
    this.components = {}

    this.matrix = this.normalizeMatrix(matrix)
    this.dendrogramData = {
      rows: dendrogramRows,
      columns: dendrogramColumns
    }

    var inner = el.append('g').classed('inner', true)
    this.inner = inner

    this.buildLayout()

    function buildTransform ({ left, top }) {
      return `translate(${left},${top})`
    }

    // TODO NB unpick axis.labels later (its all f*cked)
    const xaxisBounds = this.layout.getCellBounds(this.layout.enabled(CellNames.TOP_XAXIS) ? CellNames.TOP_XAXIS : CellNames.BOTTOM_XAXIS)
    const yaxisBounds = this.layout.getCellBounds(this.layout.enabled(CellNames.LEFT_YAXIS) ? CellNames.LEFT_YAXIS : CellNames.RIGHT_YAXIS)
    if (this.layout.enabled(CellNames.TOP_XAXIS)) {
      this.components[CellNames.TOP_XAXIS].draw(xaxisBounds)
    }

    if (this.layout.enabled(CellNames.BOTTOM_XAXIS)) {
      this.components[CellNames.BOTTOM_XAXIS].draw(xaxisBounds)
    }

    if (this.layout.enabled(CellNames.LEFT_YAXIS)) {
      this.components[CellNames.LEFT_YAXIS].draw(yaxisBounds)
    }

    if (this.layout.enabled(CellNames.RIGHT_YAXIS)) {
      this.components[CellNames.RIGHT_YAXIS].draw(yaxisBounds)
    }

    if (this.layout.enabled(CellNames.TOP_XAXIS_TITLE)) {
      this.components[CellNames.TOP_XAXIS_TITLE].draw(this.layout.getCellBounds(CellNames.TOP_XAXIS_TITLE))
    }

    if (this.layout.enabled(CellNames.BOTTOM_XAXIS_TITLE)) {
      this.components[CellNames.BOTTOM_XAXIS_TITLE].draw(this.layout.getCellBounds(CellNames.BOTTOM_XAXIS_TITLE))
    }

    if (this.layout.enabled(CellNames.LEFT_YAXIS_TITLE)) {
      this.components[CellNames.LEFT_YAXIS_TITLE].draw(this.layout.getCellBounds(CellNames.LEFT_YAXIS_TITLE))
    }

    if (this.layout.enabled(CellNames.RIGHT_YAXIS_TITLE)) {
      this.components[CellNames.RIGHT_YAXIS_TITLE].draw(this.layout.getCellBounds(CellNames.RIGHT_YAXIS_TITLE))
    }

    if (this.layout.enabled(CellNames.TOP_DENDROGRAM)) {
      const colDendBounds = this.layout.getCellBounds(CellNames.TOP_DENDROGRAM)
      inner.append('g').classed('dendrogram colDend', true).attr('transform', buildTransform(colDendBounds))
      dendrogram(el.select('g.colDend'), this.dendrogramData.columns, true, colDendBounds.width, colDendBounds.height, this.options.axis_padding, this.options.link_color, controller, this.options.anim_duration)
    }

    if (this.layout.enabled(CellNames.LEFT_DENDROGRAM)) {
      const rowDendBounds = this.layout.getCellBounds(CellNames.LEFT_DENDROGRAM)
      inner.append('g').classed('dendrogram rowDend', true).attr('transform', buildTransform(rowDendBounds))
      dendrogram(el.select('g.rowDend'), this.dendrogramData.rows, false, rowDendBounds.width, rowDendBounds.height, this.options.axis_padding, this.options.link_color, controller, this.options.anim_duration)
    }

    if (this.layout.enabled(CellNames.COLORMAP)) {
      let colormapBounds = this.layout.getCellBounds(CellNames.COLORMAP)
      // inner.append('g').classed('colormap', true).attr('transform', buildTransform(colormapBounds))
      inner.append('g').classed('colormap', true).attr('transform', buildTransform(colormapBounds))
      colormap(el.select('g.colormap'), this.matrix, colormapBounds.width, colormapBounds.height, this.options, controller)
    }

    if (this.layout.enabled(CellNames.COLOR_LEGEND)) {
      this.components[CellNames.COLOR_LEGEND].draw(this.layout.getCellBounds(CellNames.COLOR_LEGEND))
    }

    if (this.layout.enabled(CellNames.LEFT_COLUMN)) {
      this.components[CellNames.LEFT_COLUMN].draw(this.layout.getCellBounds(CellNames.LEFT_COLUMN))
    }

    if (this.layout.enabled(CellNames.LEFT_COLUMN_TITLE)) {
      var leftTitleBounds = this.layout.getCellBounds(CellNames.LEFT_COLUMN_TITLE)
      inner.append('g').classed('graph_leftCols_title', true).attr('transform', buildTransform(leftTitleBounds))
      insert_column_title(
        el.select('g.graph_leftCols_title'),
        leftTitleBounds,
        this.options.left_columns_title,
        this.options.left_columns_title_bold,
        this.options.left_columns_title_font_family,
        this.options.left_columns_title_font_size,
        this.options.left_columns_title_font_color,
        this.options.left_columns_total_width,
        true
      )
    }

    if (this.layout.enabled(CellNames.LEFT_COLUMN_SUBTITLE)) {
      this.components[CellNames.LEFT_COLUMN_SUBTITLE].setColumnWidths(this.components[CellNames.LEFT_COLUMN].getColumnWidths())
      this.components[CellNames.LEFT_COLUMN_SUBTITLE].draw(this.layout.getCellBounds(CellNames.LEFT_COLUMN_SUBTITLE))
    }

    if (this.layout.enabled(CellNames.RIGHT_COLUMN)) {
      this.components[CellNames.RIGHT_COLUMN].draw(this.layout.getCellBounds(CellNames.RIGHT_COLUMN))
    }

    if (this.layout.enabled(CellNames.RIGHT_COLUMN_TITLE)) {
      var rightTitleBounds = this.layout.getCellBounds(CellNames.RIGHT_COLUMN_TITLE)
      inner.append('g').classed('graph_rightCols_title', true).attr('transform', buildTransform(rightTitleBounds))
      insert_column_title(
        el.select('g.graph_rightCols_title'),
        rightTitleBounds,
        this.options.right_columns_title,
        this.options.right_columns_title_bold,
        this.options.right_columns_title_font_family,
        this.options.right_columns_title_font_size,
        this.options.right_columns_title_font_color,
        this.options.right_columns_total_width,
        true
      )
    }

    if (this.layout.enabled(CellNames.RIGHT_COLUMN_SUBTITLE)) {
      this.components[CellNames.RIGHT_COLUMN_SUBTITLE].setColumnWidths(this.components[CellNames.RIGHT_COLUMN].getColumnWidths())
      this.components[CellNames.RIGHT_COLUMN_SUBTITLE].draw(this.layout.getCellBounds(CellNames.RIGHT_COLUMN_SUBTITLE))
    }

    inner.on('click', function () {
      controller.highlight(null, null)
    })
    controller.on('highlight.inner', function (hl) {
      inner.classed('highlighting',
        typeof (hl.x) === 'number' || typeof (hl.y) === 'number')
    })

    function insert_column_title (svg, bounds, title, titleBold, fontFam, fontSize, fontCol, colWidth) {
      const text_el = svg.append('g')

      text_el.append('g')
        .attr('transform', function () {
          return 'translate(0,' + fontSize + ')'
        })
        .append('text')
        .attr('transform', function () {
          return 'translate(0,0)'
        })
        .attr('x', bounds.width / 2)
        .attr('y', 0)
        .attr('dy', 0)
        .text(title)
        .style('text-anchor', 'middle')
        .attr('font-weight', titleBold ? 'bold' : 'normal')
        .style('font-family', fontFam)
        .style('font-size', fontSize)
        .style('fill', fontCol)
        .call(wrap_new, colWidth)
    }

    var dispatcher = d3.dispatch('hover', 'click')
    this.dispatcher = dispatcher

    controller.on('datapoint_hover', function (_) {
      dispatcher.hover({data: _})
    })

    // TODO audit if these are ever used once we have interaction regression in place
    function on_col_label_mouseenter (e) { // eslint-disable-line no-unused-vars
      controller.highlight(+d3.select(this).attr('index'), null)
    }

    function on_col_label_mouseleave (e) { // eslint-disable-line no-unused-vars
      controller.highlight(null, null)
    }

    function on_row_label_mouseenter (e) { // eslint-disable-line no-unused-vars
      controller.highlight(null, +d3.select(this).attr('index'))
    }

    function on_row_label_mouseleave (e) { // eslint-disable-line no-unused-vars
      controller.highlight(null, null)
    }

    el.attr(`rhtmlHeatmap-status`, 'ready')
  }

  buildLayout () {
    this.layout = new HeatmapLayout(this.options.width, this.options.height)
    const {options, inner} = this

    if (!options.xaxis_hidden) {
      if (this.dendrogramData.columns) { options.xaxis_location = 'bottom' }
      const xaxisCellName = (options.xaxis_location === 'bottom')
        ? CellNames.BOTTOM_XAXIS
        : CellNames.TOP_XAXIS

      this.components[xaxisCellName] = new XAxis({
        parentContainer: inner,
        labels: this.matrix.cols,
        padding: this.options.axis_padding,
        fontSize: options.xaxis_font_size,
        fontFamily: options.xaxis_font_family,
        maxWidth: 0.33 * options.width, // TODO make configurable
        maxHeight: 0.33 * options.height, // TODO make configurable
        rotation: (xaxisCellName === CellNames.TOP_XAXIS) ? -45 : 45
      })

      const dimensions = this.components[xaxisCellName].computePreferredDimensions()
      this.layout.enable(xaxisCellName)
      this.layout.setCellDimensions(xaxisCellName, dimensions)
    }

    if (!options.yaxis_hidden) {
      if (this.dendrogramData.rows) { options.yaxis_location = 'right' }
      const yaxisCellName = (options.yaxis_location === 'right')
        ? CellNames.RIGHT_YAXIS
        : CellNames.LEFT_YAXIS

      this.components[yaxisCellName] = new YAxis({
        parentContainer: inner,
        labels: this.matrix.rows,
        padding: this.options.axis_padding,
        fontSize: options.yaxis_font_size,
        fontFamily: options.yaxis_font_family,
        maxWidth: 0.33 * options.width, // TODO make configurable
        maxHeight: 0.33 * options.height // TODO make configurable
      })

      const dimensions = this.components[yaxisCellName].computePreferredDimensions()
      this.layout.enable(yaxisCellName)
      this.layout.setCellDimensions(yaxisCellName, dimensions)
    }

    if (options.xaxis_title) {
      const xaxisTitleCellName = this.layout.enabled(CellNames.BOTTOM_XAXIS)
        ? CellNames.BOTTOM_XAXIS_TITLE
        : CellNames.TOP_XAXIS_TITLE

      this.components[xaxisTitleCellName] = new XTitle({
        parentContainer: inner,
        text: options.xaxis_title,
        fontFamily: options.xaxis_title_font_family,
        fontSize: options.xaxis_title_font_size,
        fontColor: options.xaxis_title_font_color,
        maxWidth: options.width * 0.7, // NB TODO just making numbers up here (need the max xaxis title width here)
        bold: options.xaxis_title_bold
      })

      const dimensions = this.components[xaxisTitleCellName].computePreferredDimensions()
      this.layout.enable(xaxisTitleCellName)
      this.layout.setCellDimensions(xaxisTitleCellName, dimensions)
    }

    if (options.yaxis_title) {
      const yaxisTitleCellName = this.layout.enabled(CellNames.RIGHT_YAXIS)
        ? CellNames.RIGHT_YAXIS_TITLE
        : CellNames.LEFT_YAXIS_TITLE

      this.components[yaxisTitleCellName] = new YTitle({
        parentContainer: inner,
        text: options.yaxis_title,
        fontFamily: options.yaxis_title_font_family,
        fontSize: options.yaxis_title_font_size,
        fontColor: options.yaxis_title_font_color,
        maxHeight: options.height * 0.7, // NB TODO just making numbers up here (need the max yaxis title height here)
        bold: options.yaxis_title_bold
      })

      const dimensions = this.components[yaxisTitleCellName].computePreferredDimensions()
      this.layout.enable(yaxisTitleCellName)
      this.layout.setCellDimensions(yaxisTitleCellName, dimensions)
    }

    if (options.left_columns) {
      this.components[CellNames.LEFT_COLUMN] = new ColumnGroup({
        parentContainer: inner,
        groupName: 'left',
        labelMatrix: _.reverse(options.left_columns),
        alignments: options.left_columns_align,
        fontSize: options.left_columns_font_size,
        fontColor: options.left_columns_font_color,
        fontFamily: options.left_columns_font_family,
        padding: options.axis_padding,
        maxSingleColumnWidth: options.width * 0.2
      })

      const dimensions = this.components[CellNames.LEFT_COLUMN].computePreferredDimensions()
      this.layout.enable(CellNames.LEFT_COLUMN)
      this.layout.setCellDimensions(CellNames.LEFT_COLUMN, dimensions)
    }

    if (options.left_columns_title) {
      this.layout.enable(CellNames.LEFT_COLUMN_TITLE)
      const { width, height } = title_footer.computeDimensions(
          inner,
          options.left_columns_title,
          options.left_columns_title_font_family,
          options.left_columns_title_font_size,
          options.left_columns_title_font_color,
          options.left_columns_total_width,
          options.left_columns_title_bold)
      this.layout.setCellDimensions(CellNames.LEFT_COLUMN_TITLE,
        width + options.axis_padding * 2,
        height)
    }

    if (options.left_columns_subtitles) {
      this.components[CellNames.LEFT_COLUMN_SUBTITLE] = new ColumnSubtitles({
        parentContainer: inner,
        name: 'left',
        labels: _.reverse(options.left_columns_subtitles),
        fontSize: options.left_columns_subtitles_font_size,
        fontFamily: options.left_columns_subtitles_font_family,
        fontColor: options.left_columns_subtitles_font_color,
        padding: this.options.axis_padding
      })

      const dimensions = this.components[CellNames.LEFT_COLUMN_SUBTITLE].computePreferredDimensions()
      this.layout.enable(CellNames.LEFT_COLUMN_SUBTITLE)
      this.layout.setCellDimensions(CellNames.LEFT_COLUMN_SUBTITLE, dimensions)
    }

    if (options.right_columns) {
      this.components[CellNames.RIGHT_COLUMN] = new ColumnGroup({
        parentContainer: inner,
        groupName: 'right',
        labelMatrix: options.right_columns,
        alignments: options.right_columns_align,
        fontSize: options.right_columns_font_size,
        fontColor: options.right_columns_font_color,
        fontFamily: options.right_columns_font_family,
        padding: options.axis_padding,
        maxSingleColumnWidth: options.width * 0.2
      })

      const dimensions = this.components[CellNames.RIGHT_COLUMN].computePreferredDimensions()
      this.layout.enable(CellNames.RIGHT_COLUMN)
      this.layout.setCellDimensions(CellNames.RIGHT_COLUMN, dimensions)
    }

    if (options.right_columns_title) {
      this.layout.enable(CellNames.RIGHT_COLUMN_TITLE)
      const { width, height } = title_footer.computeDimensions(
        inner,
        options.right_columns_title,
        options.right_columns_title_font_family,
        options.right_columns_title_font_size,
        options.right_columns_title_font_color,
        options.right_columns_total_width,
        options.right_columns_title_bold)
      this.layout.setCellDimensions(
        CellNames.RIGHT_COLUMN_TITLE,
        width + options.axis_padding * 2,
        height)
    }

    if (options.right_columns_subtitles) {
      this.components[CellNames.RIGHT_COLUMN_SUBTITLE] = new ColumnSubtitles({
        parentContainer: inner,
        name: 'right',
        labels: options.right_columns_subtitles,
        fontSize: options.right_columns_subtitles_font_size,
        fontFamily: options.right_columns_subtitles_font_family,
        fontColor: options.right_columns_subtitles_font_color,
        padding: this.options.axis_padding
      })

      const dimensions = this.components[CellNames.RIGHT_COLUMN_SUBTITLE].computePreferredDimensions()
      this.layout.enable(CellNames.RIGHT_COLUMN_SUBTITLE)
      this.layout.setCellDimensions(CellNames.RIGHT_COLUMN_SUBTITLE, dimensions)
    }

    if (this.dendrogramData.columns) {
      this.layout.enable(CellNames.TOP_DENDROGRAM)
      this.layout.setCellHeight(CellNames.TOP_DENDROGRAM, options.xclust_height || options.height * 0.12)
    }

    if (this.dendrogramData.rows) {
      this.layout.enable(CellNames.LEFT_DENDROGRAM)
      this.layout.setCellWidth(CellNames.LEFT_DENDROGRAM, options.yclust_width || options.width * 0.12)
    }

    if (options.legend_colors) {
      this.components[CellNames.COLOR_LEGEND] = new Legend({
        parentContainer: inner,
        colors: options.legend_colors,
        x_is_factor: options.x_is_factor,
        range: options.legend_range,
        digits: options.legend_digits,
        fontSize: options.legend_font_size,
        fontFamily: options.legend_font_family,
        fontColor: options.legend_font_color,
        leftSpace: options.legend_left_space,
        barWidth: options.legend_bar_width,
        xPadding: options.legend_x_padding
      })

      const dimensions = this.components[CellNames.COLOR_LEGEND].computePreferredDimensions()
      this.layout.enable(CellNames.COLOR_LEGEND)
      this.layout.setCellDimensions(CellNames.COLOR_LEGEND, dimensions)
    }

    this.layout.enable(CellNames.COLORMAP)
    this.layout.setFillCell(CellNames.COLORMAP)
  }

  normalizeMatrix (matrix) {
    if (!matrix.cols.length) { matrix.cols = [matrix.cols] }
    if (!matrix.rows.length) { matrix.rows = [matrix.rows] }
    return matrix
  }

  on (type, listener) {
    this.dispatcher.on(type, listener)
    return this
  }
}

module.exports = Heatmap
