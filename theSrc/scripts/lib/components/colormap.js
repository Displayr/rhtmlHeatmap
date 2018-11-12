import _ from 'lodash'
import BaseComponent from '../heatmapcore/baseComponent'
import d3 from 'd3'
const d3Tip = require('d3-tip')
d3Tip(d3)

class Colormap extends BaseComponent {
  constructor({
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
    controller
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
      controller
    })
  }

  draw (bounds) {
    const { width, height } = bounds

    const container = this.parentContainer
      .append('g')
      .classed(`colormap`, true)
      .attr('transform', this.buildTransform(bounds))

    // Check for no data
    if (this.matrix.length === 0) { return function () {} }

    if (!this.showGrid) {
      container.style('shape-rendering', 'crispEdges')
    }

    var cols = this.matrix.dim[1]
    var rows = this.matrix.dim[0]

    var merged = this.matrix.merged

    var x = d3.scale.linear().domain([0, cols]).range([0, width])
    var y = d3.scale.linear().domain([0, rows]).range([0, height])
    var old_x = d3.scale.linear().domain([0, cols]).range([0, width])
    var old_y = d3.scale.linear().domain([0, rows]).range([0, height])

    var rect = container.selectAll('rect').data(merged)
    rect.enter().append('rect')
      .classed('datapt', true)
      .attr('data-index', function (d, i) { return `${Math.floor(i / cols)}x${i % cols}` })
      .attr('data-row', function (d, i) { return Math.floor(i / cols) })
      .attr('data-column', function (d, i) { return i % cols })
      .property('colIndex', function (d, i) { return i % cols })
      .property('rowIndex', function (d, i) { return Math.floor(i / cols) })
      .property('value', function (d, i) { return d.label })
      .attr('fill', function (d) {
        if (d.hide) {
          return 'transparent'
        }
        return d.color
      })
    rect.exit().remove()
    rect.append('title')
      .text(function (d, i) { return d.label })

    var spacing
    if (typeof (this.showGrid) === 'number') {
      spacing = this.showGrid
    } else if (this.showGrid) {
      spacing = 0.25
    } else {
      spacing = 0
    }

    function draw (selection) {
      selection
        .attr('x', function (d, i) {
          return x(i % cols)
        })
        .attr('y', function (d, i) {
          return y(Math.floor(i / cols))
        })
        .attr('width', (x(1) - x(0)) - spacing)
        .attr('height', (y(1) - y(0)) - spacing)
    }

    draw(rect)

    var new_ft_size

    function draw_text (selection, old_x, old_y, cellFontSize, cellFontFamily) {
      var x_scale, y_scale
      if (old_x && old_y) {
        x_scale = old_x
        y_scale = old_y
      } else {
        x_scale = x
        y_scale = y
      }

      var box_w = x_scale(1) - x_scale(0) - spacing
      var box_h = y_scale(1) - y_scale(0) - spacing
      var ft_size = Math.min(Math.floor(box_h / 1.5), cellFontSize)

      selection
        .attr('x', function (d, i) {
          return x_scale(i % cols) + (box_w) / 2
        })
        .attr('y', function (d, i) {
          return y_scale(Math.floor(i / cols)) + (box_h) / 2
        })
        .style('font-size', ft_size)
        .style('font-family', cellFontFamily)

      var out_of_bounds
      do {
        out_of_bounds = 0

        selection
          .each(function () {
            if (this.getBBox().width > box_w - 4) {
              out_of_bounds += 1
            }
          })

        if (out_of_bounds > 0) {
          ft_size -= 1
        }

        selection.style('font-size', ft_size)
      } while (out_of_bounds > 0 && ft_size > 3)

      return ft_size
    }

    if (this.shownoteInCell) {
      var cellnote_incell = container.selectAll('text').data(merged)
      cellnote_incell.enter().append('text')
        .text(function (d) {
          return d.cellnote_in_cell
        })
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .style('font-family', this.cellFontFamily)
        .style('font-size', this.cellFontSize)
        .style('fill', function (d) {
          return d.cellnote_color
        })

      new_ft_size = draw_text(cellnote_incell, null, null, this.cellFontSize, this.cellFontFamily)
    }

    this.controller.on('transform.colormap', function (_) {
      x.range([_.translate[0], width * _.scale[0] + _.translate[0]])
      y.range([_.translate[1], height * _.scale[1] + _.translate[1]])
      draw(rect.transition().duration(this.animDuration).ease('linear'))

      if (this.shownoteInCell) {
        new_ft_size = draw_text(cellnote_incell, null, null, this.cellFontSize, this.cellFontFamily)
        draw_text(cellnote_incell, old_x, old_y, this.cellFontSize, this.cellFontFamily)

        old_x.range([_.translate[0], width * _.scale[0] + _.translate[0]])
        old_y.range([_.translate[1], height * _.scale[1] + _.translate[1]])

        cellnote_incell
          .transition()
          .duration(this.animDuration)
          .ease('linear')
          .attr('x', function (d, i) {
            return x(i % cols) + ((x(1) - x(0)) - spacing) / 2
          })
          .attr('y', function (d, i) {
            return y(Math.floor(i / cols)) + ((y(1) - y(0)) - spacing) / 2
          })
          .style('font-size', new_ft_size)
      }
    })
  }
}


module.exports = Colormap
