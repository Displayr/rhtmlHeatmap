import _ from 'lodash'
import BaseComponent from './baseComponent'
import Utils from './utils'
import d3 from 'd3'

const d3Tip = require('d3-tip')
d3Tip(d3)

class Colormap extends BaseComponent {
  constructor ({
    parentContainer,
    matrix,
    yaxisTitle,
    xaxisTitle,
    extraTooltipInfo,
    tipFontSize,
    tipFontFamily,
    cellFontSize,
    cellFontFamily,
    brushColor,
    showGrid,
    animDuration,
    shownoteInCell,
  }) {
    super()
    _.assign(this, {
      parentContainer,
      matrix,
      yaxisTitle,
      xaxisTitle,
      extraTooltipInfo,
      tipFontSize,
      tipFontFamily,
      cellFontSize,
      cellFontFamily,
      brushColor,
      showGrid,
      animDuration,
      shownoteInCell,
    })

    this.counts = {
      row: this.matrix.dim[0],
      column: this.matrix.dim[1],
    }
  }

  draw (bounds) {
    this.bounds = bounds
    const { width, height } = this.bounds

    this.container = this.parentContainer
      .append('g')
      .classed(`colormap-transform`, true)
      .attr('transform', this.buildTransform(bounds))
      .append('svg')
      .classed(`colormap`, true)
      .attr('width', bounds.width)
      .attr('height', bounds.height)

    // Check for no data
    if (this.matrix.length === 0) { return function () {} }

    if (!this.showGrid) {
      this.container.style('shape-rendering', 'crispEdges')
    }

    const cols = this.counts.column
    const rows = this.counts.row
    const merged = this.matrix.merged

    // TODO must finish rename
    this.scales = {
      x: d3.scale.linear().domain([0, this.counts.column]).range([0, width]),
      y: d3.scale.linear().domain([0, this.counts.row]).range([0, height]),
      originalX: d3.scale.linear().domain([0, this.counts.column]).range([0, width]),
      originalY: d3.scale.linear().domain([0, this.counts.row]).range([0, height]),
    }

    this.cellSelection = this.container.selectAll('rect').data(merged)

    // TODO add these to merged ! although on zoom this may change ?
    const rowFrom = (i) => Math.floor(i / this.counts.column)
    const colFrom = (i) => i % this.counts.column
    this.cellSelection.enter().append('rect')
      .classed('data-cell', true)
      .attr('data-index', function (d, i) { return `${rowFrom(i)}x${colFrom(i)}` })
      .attr('data-row', function (d, i) { return rowFrom(i) })
      .attr('data-column', function (d, i) { return colFrom(i) })
      .property('colIndex', function (d, i) { return colFrom(i) })
      .property('rowIndex', function (d, i) { return rowFrom(i) })
      .property('value', function (d, i) { return d.label })
      .attr('fill', function (d) {
        if (d.hide) {
          return 'transparent'
        }
        return d.color
      })
      .on('click', (d, i) => this.controller.colormapCellClick(rowFrom(i), colFrom(i)))
    this.cellSelection.exit().remove()
    this.cellSelection.append('title')
      .text(function (d, i) { return d.label })

    var spacing
    if (typeof (this.showGrid) === 'number') {
      spacing = this.showGrid
    } else if (this.showGrid) {
      spacing = 0.25
    } else {
      spacing = 0
    }
    this.spacing = spacing

    this.sizeCellSelection(this.cellSelection)

    if (this.shownoteInCell) {
      this.cellNoteSelection = this.container.selectAll('text').data(merged)
      this.cellNoteSelection.enter().append('text')
        .text(function (d) {
          return d.cellnote_in_cell
        })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .style('font-family', this.cellFontFamily)
        .style('font-size', Utils.fontSizeInPx(this.cellFontSize))
        .style('fill', function (d) {
          return d.cellnote_color
        })

      this.placeTextSelection(this.cellNoteSelection, this.cellFontSize, this.cellFontFamily)
    }

    const brushStyle = { fill: this.brushColor, stroke: this.brushColor }
    const controller = this.controller
    const brush = d3.svg.brush()
      .x(this.scales.x)
      .y(this.scales.y)
      .clamp([true, true])
      .on('brush', function () {
        const extent = brush.extent()

        // the rounding produces a snap to grid effect, the selection is always in increments of complete cells
        // once the sensitivity has been exceeded, ensure there is a delta of at least one so at least one square has been selected

        const roundedExtent = [[0, 0], [0, 0]]
        const sensitivity = 0.03

        if (Math.abs(extent[0][0] - extent[1][0]) > sensitivity) {
          roundedExtent[0][0] = Math.floor(extent[0][0])
          roundedExtent[1][0] = Math.ceil(extent[1][0])
        }
        if (Math.abs(extent[0][1] - extent[1][1]) > sensitivity) {
          roundedExtent[0][1] = Math.floor(extent[0][1])
          roundedExtent[1][1] = Math.ceil(extent[1][1])
        }

        d3.select(this).call(brush.extent(roundedExtent))
      })
      .on('brushend', function () {
        if (brush.empty()) {
          controller.colormapDragReset({
            scale: [1, 1],
            translate: [0, 0],
            extent: [[0, 0], [cols, rows]],
          })
        } else {
          const extent = brush.extent()
          const scale = [
            cols / (extent[1][0] - extent[0][0]),
            rows / (extent[1][1] - extent[0][1]),
          ]
          const translate = [
            extent[0][0] * (width / cols) * scale[0] * -1,
            extent[0][1] * (height / rows) * scale[1] * -1,
          ]
          controller.colormapDragSelection({ scale, translate, extent })
        }
        brush.clear()
        d3.select(this).call(brush).select('.brush .extent')
          .style(brushStyle)
      })

    this.brushSelection = this.container.append('g')
      .attr('class', 'brush')
      .call(brush)
      .call(brush.event)

    const tipContentGenerator = makeTipContentGenerator({
      rowNames: this.matrix.rows,
      columnNames: this.matrix.cols,
      numCols: this.matrix.cols.length,
      yaxisTitle: this.yaxisTitle,
      xaxisTitle: this.xaxisTitle,
      extraTooltipInfo: this.extraTooltipInfo,
      fontSize: this.tipFontSize,
      fontFamily: this.tipFontFamily,
    })

    this.tip = d3Tip()
      .attr('class', 'rhtmlHeatmap-tip')
      .html(tipContentGenerator)
      .direction('se')
      .style('position', 'fixed')

    this.cellSelection.call(this.tip)

    const showToolTip = this.showToolTip.bind(this)
    this.brushSelection.select('rect.background')
      .on('mouseenter', function () {
        const [mouseX, mouseY] = d3.mouse(this)
        showToolTip(mouseX, mouseY)
      })
      .on('mousemove', function () {
        const [mouseX, mouseY] = d3.mouse(this)
        showToolTip(mouseX, mouseY)
      })
      .on('mouseleave', () => { this.tip.hide() })

    // temp code, move to BDD
    // showLine(this.container, [{ x: 27.54156494140625 / 2, y: 0 }, { x: 27.54156494140625 / 2, y: this.bounds.height }], 'black', 'foo')
  }

  showToolTip (mouseX, mouseY) {
    const col = Math.floor(this.scales.x.invert(mouseX))
    const row = Math.floor(this.scales.y.invert(mouseY))
    const cell = _.get(this, `matrix.merged[${row * this.counts.column + col}]`, {})

    const label = cell.label

    if (cell.hide) {
      this.tip.hide()
      return
    }

    const thisTip = this.tip.show({ col, row, label }).style({
      top: d3.event.clientY + 10 + 'px',
      left: d3.event.clientX + 10 + 'px',
      opacity: 0.9,
    })

    const tipHeight = parseFloat(thisTip.style('height'))
    const tipWidth = parseFloat(thisTip.style('width'))
    const tipLeft = parseFloat(thisTip.style('left'))
    const tipTop = parseFloat(thisTip.style('top'))

    const mouseTop = d3.event.clientY
    const mouseLeft = d3.event.clientX

    if (tipLeft + tipWidth > this.bounds.width) {
      // right edge out of bound
      if (mouseLeft - tipWidth - 10 < 0) {
        // left edge out of bound if adjusted
        if (Math.abs(mouseLeft - tipWidth - 10) > Math.abs(this.bounds.width - tipLeft - tipWidth)) {
          thisTip.style('left', tipLeft + 'px')
        } else {
          thisTip.style('left', mouseLeft - tipWidth - 10 + 'px')
        }
      } else {
        thisTip.style('left', mouseLeft - tipWidth - 10 + 'px')
      }
    }

    if (tipTop + tipHeight > this.bounds.height) {
      if (mouseTop - tipHeight - 10 < 0) {
        if (Math.abs(mouseTop - tipHeight - 10) > Math.abs(this.bounds.height - tipTop - tipHeight)) {
          thisTip.style('top', tipTop + 'px')
        } else {
          thisTip.style('top', mouseTop - tipHeight - 10 + 'px')
        }
      } else {
        thisTip.style('top', mouseTop - tipHeight - 10 + 'px')
      }
    }
  }

  updateZoom ({ scale, translate, extent }) {
    this.scales.x.range([translate[0], this.bounds.width * scale[0] + translate[0]])
    this.scales.y.range([translate[1], this.bounds.height * scale[1] + translate[1]])
    this.sizeCellSelection(this.cellSelection.transition().duration(this.animDuration).ease('linear'))

    if (this.shownoteInCell) {
      this.scales.x.range([translate[0], this.bounds.width * scale[0] + translate[0]])
      this.scales.y.range([translate[1], this.bounds.height * scale[1] + translate[1]])

      this.cellNoteSelection
        .transition()
        .duration(this.animDuration)
        .ease('linear')
        .attr('x', (d, i) => {
          const x = this.scales.x
          return x(i % this.counts.column) + ((x(1) - x(0)) - this.spacing) / 2
        })
        .attr('y', (d, i) => {
          const y = this.scales.y
          return y(Math.floor(i / this.counts.column)) + ((y(1) - y(0)) - this.spacing) / 2
        })
    }
  }

  updateHighlights ({ row = null, column = null } = {}) {
    // TODO clean up all this recalculation stuff
    var cols = this.counts.column
    const rowFrom = (i) => Math.floor(i / cols)
    const colFrom = (i) => i % cols
    this.container.selectAll('rect')
      .classed('highlight', (d, i) => (rowFrom(i) === row) || (colFrom(i) === column))
  }

  sizeCellSelection (rect) {
    rect
      .attr('x', (d, i) => this.scales.x(i % this.counts.column))
      .attr('y', (d, i) => this.scales.y(Math.floor(i / this.counts.column)))
      .attr('width', (this.scales.x(1) - this.scales.x(0)) - this.spacing)
      .attr('height', (this.scales.y(1) - this.scales.y(0)) - this.spacing)
  }

  placeTextSelection (selection, cellFontSize, cellFontFamily) {
    var xScale, yScale
    if (this.scales.originalX && this.scales.originalY) {
      xScale = this.scales.originalX
      yScale = this.scales.originalY
    } else {
      xScale = this.scales.x
      yScale = this.scales.y
    }

    var boxWidth = xScale(1) - xScale(0) - this.spacing
    var boxHeight = yScale(1) - yScale(0) - this.spacing
    var fontSize = Math.min(Math.floor(boxHeight / 1.5), cellFontSize)

    selection
      .attr('x', (d, i) => xScale(i % this.counts.column) + (boxWidth) / 2)
      .attr('y', (d, i) => yScale(Math.floor(i / this.counts.column)) + (boxHeight) / 2)
      .style('font-size', Utils.fontSizeInPx(fontSize))
      .style('font-family', cellFontFamily)

    var isOutOfBounds
    do {
      isOutOfBounds = 0

      selection
        .each(function () {
          if (this.getBBox().width > boxWidth - 4) {
            isOutOfBounds += 1
          }
        })

      if (isOutOfBounds > 0) {
        fontSize -= 1
        console.log(`out of bounds count: ${isOutOfBounds}. Decreased font to ${fontSize}`)
      }

      selection.style('font-size', Utils.fontSizeInPx(fontSize))
    } while (isOutOfBounds > 0 && fontSize > 3)

    return fontSize
  }
}

function makeTipContentGenerator ({ values, rowNames, columnNames, numCols, extraTooltipInfo, yaxisTitle, xaxisTitle, fontSize, fontFamily }) {
  function htmlEscape (str) {
    return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  const commonStyleWithAlign = `text-align:right;font-size:${fontSize}px;font-family:${fontFamily};color:white`
  const commonStyle = `font-size:${fontSize}px;font-family:${fontFamily};color:white`

  return (d, i) => {
    var rowTitle = yaxisTitle || 'Row'
    var colTitle = xaxisTitle || 'Column'

    let extraInfoHtml = ''
    if (extraTooltipInfo) {
      extraInfoHtml = _.map(extraTooltipInfo, (value, key) => {
        return `
          <tr>
            <th style="${commonStyleWithAlign}">${key}</th>
            <td style="${commonStyle}">${htmlEscape(value[d.row * numCols + d.col])}</td>
          </tr>`
      }).join('')
    }

    return `<table class="rhtmlHeatmap-tip-table">
      <tr>
        <th style="${commonStyleWithAlign}">${rowTitle}</th>
        <td style="${commonStyle}">${htmlEscape(rowNames[d.row])}</td>
      </tr>
      <tr>
        <th style="${commonStyleWithAlign}">${colTitle}</th>
        <td style="${commonStyle}">${htmlEscape(columnNames[d.col])}</td>
      </tr>
      <tr>
        <th style="${commonStyleWithAlign}">Value</th>
        <td style="${commonStyle}">${htmlEscape(d.label)}</td>
      </tr>
      ${extraInfoHtml}
    </table>`
  }
}

module.exports = Colormap
