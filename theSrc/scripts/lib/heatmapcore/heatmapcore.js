import _ from 'lodash'
import d3 from 'd3'
import Controller from './controller'
import buildConfig from './buildConfig'
import dendrogram from './dendrogram'
import colormap from './colormap'
import columns from './columns'
import legend from './legend'
import title_footer from './title_footer'
import axis from './axis'
import wrap_new from './wrap_new'
import { HeatmapLayout, CellNames } from './layout'

class Heatmap {
  constructor (selector, data, options, width, height) {
    var el = d3.select(selector)
    el.classed('rhtmlHeatmap', true)
    el.attr(`rhtmlHeatmap-status`, 'loading')

    // var bbox = el.node().getBoundingClientRect()
    // console.log('bbox')
    // console.log(JSON.stringify(bbox, {}, 2))

    var controller = new Controller()

    // Set option defaults & copy settings
    var opts = buildConfig(options, width, height)
    this.options = opts

    this.data = this.normalizeData(data)

    var inner = el.append('g').classed('inner', true)
    this.inner = inner

    this.buildLayout()

    function buildTransform ({ left, top }) {
      return `translate(${left},${top})`
    }

    // TODO NB unpick axis.labels later (its all f*cked)
    const xaxisBounds = this.layout.getCellBounds(this.layout.enabled(CellNames.TOP_XAXIS) ? CellNames.TOP_XAXIS : CellNames.BOTTOM_XAXIS)
    const yaxisBounds = this.layout.getCellBounds(this.layout.enabled(CellNames.LEFT_YAXIS) ? CellNames.LEFT_YAXIS : CellNames.RIGHT_YAXIS)
    if (this.layout.enabled('TOP_XAXIS')) {
      inner.append('g').classed('axis xaxis', true).attr('transform', buildTransform(xaxisBounds))

      const text_el = el.select('g.xaxis').append('g').selectAll('text').data(this.data.matrix.cols).enter()

      const columnWidth = this.layout.getCellBounds(CellNames.COLORMAP).width / this.data.matrix.cols.length
      const fontSize = this.options.xaxis_font_size
      const fontFam = this.options.xaxis_font_family
      const axisPadding = this.options.axis_padding
      const containerHeight = xaxisBounds.height
      // const fontColor = this.options.xaxis_font_color

      text_el.append('g')
        .attr('transform', function (d, i) {
          const x = columnWidth * i
          const translateString = 'translate(' + (x + columnWidth / 2 - fontSize / 2) + ',' + (containerHeight - axisPadding) + ')'
          console.log(`for xaxis(${i}): ${translateString}`)
          return translateString
        })
        .append('text')
        .attr('transform', function () {
          return 'rotate(-45),translate(' + axisPadding + ',' + 0 + ')'
        })
        .attr('x', 0)
        .attr('y', -axisPadding)
        .text(function (d) { return d })
        .style('text-anchor', 'start')
        .style('font-family', fontFam)
        .style('font-size', fontSize)
        // .style('fill', fontColor)

      // axis.labels(el.select('g.xaxis'), this.data.matrix.cols, true, xaxisBounds.width, xaxisBounds.height, this.options.axis_padding, 'bottom', this.options, controller, xaxisBounds, yaxisBounds)
    }

    if (this.layout.enabled('BOTTOM_XAXIS')) {
      inner.append('g').classed('axis xaxis', true).attr('transform', buildTransform(xaxisBounds))
      // axis.labels(el.select('g.xaxis'), this.data.matrix.cols, true, xaxisBounds.width, xaxisBounds.height, this.options.axis_padding, this.options.axis_location, this.options, controller, xaxisBounds, yaxisBounds)

      const text_el = el.select('g.xaxis').append('g').selectAll('text').data(this.data.matrix.cols).enter()

      const columnWidth = this.layout.getCellBounds(CellNames.COLORMAP).width / this.data.matrix.cols.length
      const fontSize = this.options.xaxis_font_size
      const fontFam = this.options.xaxis_font_family
      const axisPadding = this.options.axis_padding
      // const fontColor = this.options.xaxis_font_color

      text_el.append('g')
        .attr('transform', function (d, i) {
          const x = columnWidth * i
          const translateString = 'translate(' + (x + columnWidth / 2 - fontSize) + ',' + 2 * axisPadding + ')'
          console.log(`for xaxis(${i}): ${translateString}`)
          return translateString
        })
        .append('text')
        .attr('transform', function () {
          return 'rotate(45),translate(' + axisPadding + ',' + 0 + ')'
        })
        .attr('x', 0)
        .attr('y', -axisPadding)
        .text(function (d) { return d })
        .style('text-anchor', 'start')
        .style('font-family', fontFam)
        .style('font-size', fontSize)
      // .style('fill', fontColor)
    }

    if (this.layout.enabled('LEFT_YAXIS')) {
      inner.append('g').classed('axis yaxis', true).attr('transform', buildTransform(yaxisBounds))
      // axis.labels(el.select('g.yaxis'), this.data.matrix.rows, false, yaxisBounds.width, yaxisBounds.height, this.options.axis_padding, this.options.yaxis_location, this.options, controller, xaxisBounds, yaxisBounds)

      insert_columns(
        el.select('g.yaxis'),
        yaxisBounds,
        this.data.matrix.rows,
        this.options.yaxis_font_family,
        this.options.yaxis_font_size,
        'black',
        'l' /* this.options.left_columns_align[index] */, // TODO account for alignment
        true,
        0
      )
    }

    if (this.layout.enabled('RIGHT_YAXIS')) {
      inner.append('g').classed('axis yaxis', true).attr('transform', buildTransform(yaxisBounds))
      // axis.labels(el.select('g.yaxis'), this.data.matrix.rows, false, yaxisBounds.width, yaxisBounds.height, this.options.axis_padding, this.options.yaxis_location, this.options, controller, xaxisBounds, yaxisBounds)

      insert_columns(
        el.select('g.yaxis'),
        yaxisBounds,
        this.data.matrix.rows,
        this.options.yaxis_font_family,
        this.options.yaxis_font_size,
        'black',
        'l' /* this.options.left_columns_align[index] */, // TODO account for alignment
        true,
        0
      )
    }

    if (this.layout.enabled('XAXIS_TITLE')) {
      const xtitleBounds = this.layout.getCellBounds(this.layout.enabled(CellNames.TOP_XAXIS_TITLE) ? CellNames.TOP_XAXIS_TITLE : CellNames.BOTTOM_XAXIS_TITLE)
      inner.append('g').classed('xtitle', true).attr('transform', buildTransform(xtitleBounds))
      axis.title(el.select('g.xtitle'), this.options.xaxis_title, false, xtitleBounds.width, xtitleBounds.height, this.options)
    }

    if (this.layout.enabled('YAXIS_TITLE')) {
      const ytitleBounds = this.layout.getCellBounds(this.layout.enabled(CellNames.RIGHT_YAXIS_TITLE) ? CellNames.RIGHT_YAXIS_TITLE : CellNames.LEFT_YAXIS_TITLE)
      inner.append('g').classed('ytitle', true).attr('transform', buildTransform(ytitleBounds))
      console.log('ytitleBounds')
      console.log(JSON.stringify(ytitleBounds, {}, 2))

      axis.title(el.select('g.ytitle'), this.options.yaxis_title, true, ytitleBounds.width, ytitleBounds.height, this.options)
    }

    if (this.layout.enabled(CellNames.TOP_DENDROGRAM)) {
      const colDendBounds = this.layout.getCellBounds(CellNames.TOP_DENDROGRAM)
      inner.append('g').classed('dendrogram colDend', true).attr('transform', buildTransform(colDendBounds))
      dendrogram(el.select('g.colDend'), data.cols, true, colDendBounds.width, colDendBounds.height, this.options.axis_padding, this.options.link_color, controller, this.options.anim_duration)
    }

    if (this.layout.enabled(CellNames.LEFT_DENDROGRAM)) {
      const rowDendBounds = this.layout.getCellBounds(CellNames.LEFT_DENDROGRAM)
      inner.append('g').classed('dendrogram rowDend', true).attr('transform', buildTransform(rowDendBounds))
      dendrogram(el.select('g.rowDend'), data.rows, false, rowDendBounds.width, rowDendBounds.height, this.options.axis_padding, this.options.link_color, controller, this.options.anim_duration)
    }

    if (this.layout.enabled(CellNames.COLORMAP)) {
      let colormapBounds = this.layout.getCellBounds(CellNames.COLORMAP)
      // inner.append('g').classed('colormap', true).attr('transform', buildTransform(colormapBounds))
      inner.append('g').classed('colormap', true).attr('transform', buildTransform(colormapBounds))
      colormap(el.select('g.colormap'), data.matrix, colormapBounds.width, colormapBounds.height, this.options, controller)
    }

    if (this.layout.enabled(CellNames.COLOR_LEGEND)) {
      var legendBounds = this.layout.getCellBounds(CellNames.COLOR_LEGEND)
      inner.append('g').classed('legend', true).attr('transform', buildTransform(legendBounds))
      legend.draw(el.select('g.legend'), this.options.legend_colors, this.options.legend_range, legendBounds, this.options)
    }

    if (this.layout.enabled(CellNames.LEFT_COLUMN)) {
      const leftColsBounds = this.layout.getCellBounds(CellNames.LEFT_COLUMN)
      const leftColIndividualWidths = this.layout.getCellMeta(CellNames.LEFT_COLUMN).widths

      let cumulativeWidth = 0
      leftColIndividualWidths.forEach((leftColIndividualWidth, index) => {
        const bounds = {
          top: leftColsBounds.top,
          left: leftColsBounds.left + cumulativeWidth,
          width: leftColIndividualWidth,
          height: leftColsBounds.height
        }
        inner.append('g').classed('graph_leftCols' + index, true).attr('transform', buildTransform(bounds))

        insert_columns(
          el.select('g.graph_leftCols' + index),
          bounds,
          this.options.left_columns[index],
          this.options.left_columns_font_family,
          this.options.left_columns_font_size,
          this.options.left_columns_font_color,
          'l' /* this.options.left_columns_align[index] */, // TODO account for alignment
          true,
          index
        )

        cumulativeWidth += leftColIndividualWidth
      })
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
      const leftSubtitleBounds = this.layout.getCellBounds(CellNames.LEFT_COLUMN_SUBTITLE)
      const leftSubtitleWidths = this.layout.getCellMeta(CellNames.LEFT_COLUMN).widths
      inner.append('g').classed('graph_leftCols_subtitle', true).attr('transform', buildTransform(leftSubtitleBounds))

      insert_column_subtitle(
        el.select('g.graph_leftCols_subtitle'),
        leftSubtitleBounds.height,
        _.reverse(this.options.left_columns_subtitles),
        this.options.left_columns_subtitles_font_family,
        this.options.left_columns_subtitles_font_size,
        this.options.left_columns_subtitles_font_color,
        _.reverse(leftSubtitleWidths),
        true,
        this.options.axis_padding
      )
    }

    if (this.layout.enabled(CellNames.RIGHT_COLUMN)) {
      const rightColsBounds = this.layout.getCellBounds(CellNames.RIGHT_COLUMN)
      const rightColIndividualWidths = this.layout.getCellMeta(CellNames.RIGHT_COLUMN).widths

      let cumulativeWidth = 0
      rightColIndividualWidths.forEach((rightColIndividualWidth, index) => {
        const bounds = {
          top: rightColsBounds.top,
          left: rightColsBounds.left + cumulativeWidth,
          width: rightColIndividualWidth,
          height: rightColsBounds.height
        }
        inner.append('g').classed('graph_rightCols' + index, true).attr('transform', buildTransform(bounds))

        insert_columns(
          el.select('g.graph_rightCols' + index),
          bounds,
          this.options.right_columns[index],
          this.options.right_columns_font_family,
          this.options.right_columns_font_size,
          this.options.right_columns_font_color,
          'l' /* this.options.right_columns_align[index] */, // TODO account for alignment,
          false,
          index
        )

        cumulativeWidth += rightColIndividualWidth
      })
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
      const rightSubtitleBounds = this.layout.getCellBounds(CellNames.RIGHT_COLUMN_SUBTITLE)
      const rightSubtitleWidths = this.layout.getCellMeta(CellNames.RIGHT_COLUMN).widths
      inner.append('g').classed('graph_rightCols_subtitle', true).attr('transform', buildTransform(rightSubtitleBounds))
      insert_column_subtitle(
        el.select('g.graph_rightCols_subtitle'),
        rightSubtitleBounds.height,
        this.options.right_columns_subtitles,
        this.options.right_columns_subtitles_font_family,
        this.options.right_columns_subtitles_font_size,
        this.options.right_columns_subtitles_font_color,
        rightSubtitleWidths,
        false,
        this.options.axis_padding
      )
    }

    inner.on('click', function () {
      controller.highlight(null, null)
    })
    controller.on('highlight.inner', function (hl) {
      inner.classed('highlighting',
        typeof (hl.x) === 'number' || typeof (hl.y) === 'number')
    })

    function insert_columns (svg, bounds, data, fontFamily, fontSize, fontColor, align, left_or_right, index) {
      // bounds is an array of columns, data is an array of data columns

      // WHAT THE HELL TODO fix this and see what breaks
      var svg = svg.append('g') // eslint-disable-line no-redeclare
      var thisColData = data
      var thisBounds = bounds
      // set axis options
      var scale = d3.scale.ordinal()
        .domain(d3.range(0, thisColData.length))
        .rangeBands([0, thisBounds.height])

      var axis = d3.svg.axis()
        .scale(scale)
        .orient('left')
        .outerTickSize(0)
        .innerTickSize(0)
        .tickPadding(0)
        .tickFormat(function (d, i) { return thisColData[i] })// hack for repeated values

      var lr = 'Left'
      if (left_or_right) {
        // opts.left_columns_axis.push(axis)
        // opts.left_columns_scales.push(scale)
      } else {
        // opts.right_columns_axis.push(axis)
        // opts.right_columns_scales.push(scale)
        lr = 'Right'
      }

      // Create the actual axis
      var axisNodes = svg.append('g')
        .attr('class', 'axisNodes' + lr + index)
        .attr('transform', function () {
          if (align === 'l') {
            return 'translate(0,0)'
          } else if (align === 'c') {
            return 'translate(' + thisBounds.width / 2 + ',0)'
          } else if (align === 'r') {
            return 'translate(' + (thisBounds.width - opts.axis_padding) + ',0)'
          }
        })
        .call(axis)

      axisNodes.selectAll('text')
        .attr('class', 'coltick' + lr + index)
        .attr('id', function (d, i) {
          return 'c' + i
        })
        .style('opacity', 1)
        .style('font-size', fontSize)
        .style('fill', fontColor)
        .style('font-family', fontFamily)

      var mouseTargets = svg.append('g')
        .selectAll('g').data(thisColData)

      mouseTargets
        .enter()
        .append('g').append('rect')
        .style('cursor', 'pointer')
        .attr('transform', '')
        .attr('fill', 'transparent')
        .on('click', function (d, i) {
          var dim = 'y'
          var hl = controller.highlight() || {x: null, y: null}
          if (hl[dim] === i) {
            // If clicked already-highlighted row/col, then unhighlight
            hl[dim] = null
            controller.highlight(hl)
          } else {
            hl[dim] = i
            controller.highlight(hl)
          }
          d3.event.stopPropagation()
        })

      if (left_or_right) {
        // opts.left_columns_mouseTargets.push(mouseTargets)
      } else {
        // opts.right_columns_mouseTargets.push(mouseTargets)
      }

      function layoutMouseTargets (selection) {
        var _h = scale.rangeBand()
        var _w = bounds.width
        selection
          .attr('transform', function (d, i) {
            var x = 0
            var y = scale(i)
            return 'translate(' + x + ',' + y + ')'
          })
          .selectAll('rect')
          .attr('height', _h)
          .attr('width', _w)
      }

      layoutMouseTargets(mouseTargets)

      axisNodes.selectAll('text')
        .style('text-anchor', 'start')

      if (align === 'c') {
        axisNodes.selectAll('text')
          .style('text-anchor', 'middle')
      } else if (align === 'r') {
        axisNodes.selectAll('text')
          .style('text-anchor', 'end')
      }
    }

    function insert_column_subtitle (svg, container_height, subtitles, fontFam, fontSize, fontColor, columnWidths, left_or_right, axisPadding) {
      const text_el = svg.append('g').selectAll('text').data(subtitles).enter()

      text_el.append('g')
        .attr('transform', function (d, i) {
          let accumu_x = 0
          for (let kk = 0; kk < i; kk++) {
            accumu_x = accumu_x + columnWidths[kk]
          }
          const translateString = 'translate(' + (accumu_x + columnWidths[i] / 2 - fontSize / 2) + ',' + (container_height - axisPadding) + ')'
          console.log(`for subtitle(${i}): ${translateString}`)
          return translateString
        })
        .append('text')
        .attr('transform', function () {
          return 'rotate(-45),translate(' + axisPadding + ',' + 0 + ')'
        })
        .attr('x', 0)
        .attr('y', -axisPadding)
        .text(function (d) { return d })
        .style('text-anchor', 'start')
        .style('font-family', fontFam)
        .style('font-size', fontSize)
        .style('fill', fontColor)
    }

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
    this.layout = new HeatmapLayout()
    const {options, data, inner} = this

    if (!options.xaxis_hidden) {
      if (data.cols) { options.xaxis_location = 'bottom' }
      const xaxisCellName = (options.xaxis_location === 'bottom')
        ? CellNames.BOTTOM_XAXIS
        : CellNames.TOP_XAXIS

      const xaxisWidth = axis.label_length(
        inner,
        data.matrix.cols,
        true,
        options.xaxis_font_size,
        options.xaxis_font_family,
        options)

      this.layout.enable(xaxisCellName)
      this.layout.setCellWidth(xaxisCellName, xaxisWidth)

      // NB TODO must fix
      this.layout.setCellHeight(xaxisCellName, 60)
    }

    if (!options.yaxis_hidden) {
      if (data.rows) { options.yaxis_location = 'right' }
      const yaxisCellName = (options.yaxis_location === 'right')
        ? CellNames.RIGHT_YAXIS
        : CellNames.LEFT_YAXIS

      const yaxisWidth = axis.label_length(
        inner,
        data.matrix.rows,
        false,
        options.yaxis_font_size,
        options.yaxis_font_family,
        options)

      this.layout.enable(yaxisCellName)
      this.layout.setCellWidth(yaxisCellName, yaxisWidth)
    }

    if (options.xaxis_title) {
      const { width, height } = title_footer.computeDimensions(
          inner,
          options.xaxis_title,
          options.xaxis_title_font_family,
          options.xaxis_title_font_size,
          options.xaxis_title_font_color,
          options.width * 0.7, // NB TODO just making numbers up here (need the max xaxis title width here)
          options.xaxis_title_bold)

      const xaxisTitleCellName = this.layout.enabled(CellNames.BOTTOM_XAXIS)
        ? CellNames.BOTTOM_XAXIS_TITLE
        : CellNames.TOP_XAXIS_TITLE

      this.layout.enable(xaxisTitleCellName)
      this.layout.setCellDimensions(
        xaxisTitleCellName,
        width + options.axis_padding * 2,
        height)
    }

    if (options.yaxis_title) {
      const { width, height } = title_footer.computeDimensions(
        inner,
        options.yaxis_title,
        options.yaxis_title_font_family,
        options.yaxis_title_font_size,
        options.yaxis_title_font_color,
        options.width * 0.3, // NB TODO just making numbers up here (need the max yaxis title width here)
        options.yaxis_title_bold)

      const yaxisTitleCellName = this.layout.enabled(CellNames.RIGHT_YAXIS)
        ? CellNames.RIGHT_YAXIS_TITLE
        : CellNames.LEFT_YAXIS_TITLE

      this.layout.enable(yaxisTitleCellName)
      // Y axis is rotated, so width / height are swapped
      this.layout.setCellDimensions(
        yaxisTitleCellName,
        height,
        width)
    }

    if (options.left_columns) {
      this.layout.enable(CellNames.LEFT_COLUMN)

      const maxColumnWidth = options.width * 0.2
      const unboundedColumnWidths = columns.compute_lengths(this.inner, options.left_columns, options)
      const columnWidths = unboundedColumnWidths.map(unboundedWidth => Math.min(unboundedWidth, maxColumnWidth))
      const totalWidth = d3.sum(columnWidths) + columnWidths.length * 2 * options.axis_padding
      this.layout.setCellWidth(CellNames.LEFT_COLUMN, totalWidth)
      this.layout.addCellMeta(CellNames.LEFT_COLUMN, { widths: columnWidths })
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
      this.layout.enable(CellNames.LEFT_COLUMN_SUBTITLE)
      // compute text width of left column subtitles
      const height = axis.label_length(
        this.inner,
        options.left_columns_subtitles,
        true,
        options.left_columns_subtitles_font_size,
        options.left_columns_subtitles_font_family,
        options
      )
      this.layout.setCellHeight(CellNames.LEFT_COLUMN_SUBTITLE, height)
    }

    if (options.right_columns) {
      this.layout.enable(CellNames.RIGHT_COLUMN)

      const maxColumnWidth = options.width * 0.2
      const unboundedColumnWidths = columns.compute_lengths(this.inner, options.right_columns, options)
      const columnWidths = unboundedColumnWidths.map(unboundedWidth => Math.min(unboundedWidth, maxColumnWidth))
      const totalWidth = d3.sum(columnWidths) + columnWidths.length * 2 * options.axis_padding
      this.layout.setCellWidth(CellNames.RIGHT_COLUMN, totalWidth)
      this.layout.addCellMeta(CellNames.RIGHT_COLUMN, { widths: columnWidths })
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
      this.layout.enable(CellNames.RIGHT_COLUMN_SUBTITLE)
      // compute text width of right column subtitles
      const height = axis.label_length(
        this.inner,
        options.right_columns_subtitles,
        true,
        options.right_columns_subtitles_font_size,
        options.right_columns_subtitles_font_family,
        options
      )
      this.layout.setCellHeight(CellNames.RIGHT_COLUMN_SUBTITLE, height)
    }

    if (data.cols) {
      this.layout.enable(CellNames.TOP_DENDROGRAM)
      this.layout.setCellHeight(CellNames.TOP_DENDROGRAM, options.xclust_height || options.height * 0.12)
    }

    if (data.rows) {
      this.layout.enable(CellNames.LEFT_DENDROGRAM)
      this.layout.setCellWidth(CellNames.LEFT_DENDROGRAM, options.yclust_width || options.width * 0.12)
    }

    if (options.legend_colors) {
      this.layout.enable(CellNames.COLOR_LEGEND)
      const legendTextWidths = legend.compute_lengths(inner, options)
      const legendTotalWidth = options.legend_left_space +
        options.legend_bar_width +
        options.legend_x_padding * 2 +
        d3.max(legendTextWidths)
      this.layout.setCellWidth(CellNames.COLOR_LEGEND, legendTotalWidth)
    }

    this.layout.enable(CellNames.COLORMAP)
    this.layout.setFillCell(CellNames.COLORMAP)
  }

  normalizeData (data) {
    if (!data.matrix.cols.length) { data.matrix.cols = [data.matrix.cols] }
    if (!data.matrix.rows.length) { data.matrix.rows = [data.matrix.rows] }
    return data
  }

  on (type, listener) {
    this.dispatcher.on(type, listener)
    return this
  }
}

module.exports = Heatmap
