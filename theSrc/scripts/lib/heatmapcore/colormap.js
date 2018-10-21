import d3 from 'd3'
const d3Tip = require('d3-tip')
d3Tip(d3)

function htmlEscape (str) {
  return (str + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function colormap (svg, data, width, height, opts, controller) {
  // Check for no data
  if (data.length === 0) { return function () {} }

  if (!opts.show_grid) {
    svg.style('shape-rendering', 'crispEdges')
  }

  var cols = data.dim[1]
  var rows = data.dim[0]

  var merged = data.merged

  var x = d3.scale.linear().domain([0, cols]).range([0, width])
  var y = d3.scale.linear().domain([0, rows]).range([0, height])
  var old_x = d3.scale.linear().domain([0, cols]).range([0, width])
  var old_y = d3.scale.linear().domain([0, rows]).range([0, height])
  var tip = d3Tip()
    .attr('class', 'rhtmlHeatmap-tip')
    .html(function (d, i) {
      var rowTitle = opts.yaxis_title ? opts.yaxis_title : 'Row'
      var colTitle = opts.xaxis_title ? opts.xaxis_title : 'Column'
      var txt = ''
      if (opts.extra_tooltip_info) {
        var tt_info = opts.extra_tooltip_info
        var tt_names = Object.keys(opts.extra_tooltip_info)
        for (var j = 0; j < tt_names.length; j++) {
          txt = txt + '<tr><th style=\'text-align:right;font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + tt_names[j] + '</th><td style=\'font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + htmlEscape(tt_info[tt_names[j]][d.row * cols + d.col]) + '</td></tr>'
        }
      }

      return '<table class=\'rhtmlHeatmap-tip-table\'>' +
        '<tr><th style=\'text-align:right;font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + rowTitle + '</th><td style=\'font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + htmlEscape(data.rows[d.row]) + '</td></tr>' +
        '<tr><th style=\'text-align:right;font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + colTitle + '</th><td style=\'font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + htmlEscape(data.cols[d.col]) + '</td></tr>' +
        '<tr><th style=\'text-align:right;font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>Value</th><td style=\'font-size:' + opts.tip_font_size + 'px;font-family:' + opts.tip_font_family + ';color:white\'>' + htmlEscape(d.label) + '</td></tr>' + txt +
        '</table>'
    })
    .direction('se')
    .style('position', 'fixed')

  var brush = d3.svg.brush()
    .x(x)
    .y(y)
    .clamp([true, true])
    .on('brush', function () {
      var extent = brush.extent()
      extent[0][0] = Math.round(extent[0][0])
      extent[0][1] = Math.round(extent[0][1])
      extent[1][0] = Math.round(extent[1][0])
      extent[1][1] = Math.round(extent[1][1])
      d3.select(this).call(brush.extent(extent))
    })
    .on('brushend', function () {
      if (brush.empty()) {
        controller.transform({
          scale: [1, 1],
          translate: [0, 0],
          extent: [[0, 0], [cols, rows]]
        })
      } else {
        controller.transform()
        var ex = brush.extent()
        var scale = [
          cols / (ex[1][0] - ex[0][0]),
          rows / (ex[1][1] - ex[0][1])
        ]
        var translate = [
          ex[0][0] * (width / cols) * scale[0] * -1,
          ex[0][1] * (height / rows) * scale[1] * -1
        ]
        controller.transform({scale: scale, translate: translate, extent: ex})
      }
      brush.clear()
      d3.select(this).call(brush).select('.brush .extent')
        .style({fill: opts.brush_color, stroke: opts.brush_color})
    })

  svg = svg
    .attr('width', width)
    .attr('height', height)
  var rect = svg.selectAll('rect').data(merged)
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
  rect.call(tip)

  var spacing
  if (typeof (opts.show_grid) === 'number') {
    spacing = opts.show_grid
  } else if (opts.show_grid) {
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

  function draw_text (selection, old_x, old_y) {
    var x_scale, y_scale
    if (arguments.length === 3) {
      x_scale = old_x
      y_scale = old_y
    } else {
      x_scale = x
      y_scale = y
    }

    var box_w = x_scale(1) - x_scale(0) - spacing
    var box_h = y_scale(1) - y_scale(0) - spacing
    var ft_size = Math.min(Math.floor(box_h / 1.5), opts.cell_font_size)

    selection
      .attr('x', function (d, i) {
        return x_scale(i % cols) + (box_w) / 2
      })
      .attr('y', function (d, i) {
        return y_scale(Math.floor(i / cols)) + (box_h) / 2
      })
      .style('font-size', ft_size)
      .style('font-family', opts.cell_font_family)

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

  if (opts.shownote_in_cell) {
    var cellnote_incell = svg.selectAll('text').data(merged)
    cellnote_incell.enter().append('text')
      .text(function (d) {
        return d.cellnote_in_cell
      })
      .attr('text-anchor', 'middle')
      .attr('alignment-baseline', 'central')
      .style('font-family', opts.cell_font_family)
      .style('font-size', opts.cell_font_size)
      .style('fill', function (d) {
        return d.cellnote_color
      })

    new_ft_size = draw_text(cellnote_incell)
  }

  controller.on('transform.colormap', function (_) {
    x.range([_.translate[0], width * _.scale[0] + _.translate[0]])
    y.range([_.translate[1], height * _.scale[1] + _.translate[1]])
    draw(rect.transition().duration(opts.anim_duration).ease('linear'))

    if (opts.shownote_in_cell) {
      new_ft_size = draw_text(cellnote_incell)
      draw_text(cellnote_incell, old_x, old_y)

      old_x.range([_.translate[0], width * _.scale[0] + _.translate[0]])
      old_y.range([_.translate[1], height * _.scale[1] + _.translate[1]])

      cellnote_incell
        .transition()
        .duration(opts.anim_duration)
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

  var brushG = svg.append('g')
    .attr('class', 'brush')
    .call(brush)
    .call(brush.event)
  brushG.select('rect.background')
    .on('mouseenter', function () {
      var e = d3.event
      var offsetX = d3.event.offsetX
      var offsetY = d3.event.offsetY
      if (typeof (offsetX) === 'undefined') {
        // Firefox 38 and earlier
        var target = e.target || e.srcElement
        var rect = target.getBoundingClientRect()
        offsetX = e.clientX - rect.left
        offsetY = e.clientY - rect.top
      }

      var col = Math.floor(x.invert(offsetX))
      var row = Math.floor(y.invert(offsetY))
      if (merged[row * cols + col].hide) {
        return
      }
      var label = merged[row * cols + col].label
      var this_tip = tip.show({col: col, row: row, label: label}).style({
        top: d3.event.clientY + 10 + 'px',
        left: d3.event.clientX + 10 + 'px',
        opacity: 0.9
      })

      // height of the tip
      var tipHeight = parseFloat(this_tip.style('height'))
      // width of the tip
      var tipWidth = parseFloat(this_tip.style('width'))
      var mouseTop = d3.event.clientY
      var mouseLeft = d3.event.clientX

      var tipLeft = parseFloat(this_tip.style('left'))
      var tipTop = parseFloat(this_tip.style('top'))

      if (tipLeft + tipWidth > opts.width) {
        // right edge out of bound
        if (mouseLeft - tipWidth - 10 < 0) {
          // left edge out of bound if adjusted
          if (Math.abs(mouseLeft - tipWidth - 10) > Math.abs(opts.width - tipLeft - tipWidth)) {
            this_tip.style('left', tipLeft + 'px')
          } else {
            this_tip.style('left', mouseLeft - tipWidth - 10 + 'px')
          }
        } else {
          this_tip.style('left', mouseLeft - tipWidth - 10 + 'px')
        }
      }

      if (tipTop + tipHeight > opts.height) {
        if (mouseTop - tipHeight - 10 < 0) {
          if (Math.abs(mouseTop - tipHeight - 10) > Math.abs(opts.height - tipTop - tipHeight)) {
            this_tip.style('top', tipTop + 'px')
          } else {
            this_tip.style('top', mouseTop - tipHeight - 10 + 'px')
          }
        } else {
          this_tip.style('top', mouseTop - tipHeight - 10 + 'px')
        }
      }
    })
    .on('mousemove', function () {
      var e = d3.event
      var offsetX = d3.event.offsetX
      var offsetY = d3.event.offsetY
      if (typeof (offsetX) === 'undefined') {
        // Firefox 38 and earlier
        var target = e.target || e.srcElement
        var rect = target.getBoundingClientRect()
        offsetX = e.clientX - rect.left
        offsetY = e.clientY - rect.top
      }

      var col = Math.floor(x.invert(offsetX))
      var row = Math.floor(y.invert(offsetY))
      if (merged[row * cols + col].hide) {
        tip.hide()
        return
      }
      var label = merged[row * cols + col].label
      var this_tip = tip.show({col: col, row: row, label: label}).style({
        top: d3.event.clientY + 10 + 'px',
        left: d3.event.clientX + 10 + 'px',
        opacity: 0.9
      })

      // height of the tip
      var tipHeight = parseFloat(this_tip.style('height'))
      // width of the tip
      var tipWidth = parseFloat(this_tip.style('width'))
      var mouseTop = d3.event.clientY
      var mouseLeft = d3.event.clientX

      var tipLeft = parseFloat(this_tip.style('left'))
      var tipTop = parseFloat(this_tip.style('top'))

      if (tipLeft + tipWidth > opts.width) {
        // right edge out of bound
        if (mouseLeft - tipWidth - 10 < 0) {
          // left edge out of bound if adjusted
          if (Math.abs(mouseLeft - tipWidth - 10) > Math.abs(opts.width - tipLeft - tipWidth)) {
            this_tip.style('left', tipLeft + 'px')
          } else {
            this_tip.style('left', mouseLeft - tipWidth - 10 + 'px')
          }
        } else {
          this_tip.style('left', mouseLeft - tipWidth - 10 + 'px')
        }
      }

      if (tipTop + tipHeight > opts.height) {
        if (mouseTop - tipHeight - 10 < 0) {
          if (Math.abs(mouseTop - tipHeight - 10) > Math.abs(opts.height - tipTop - tipHeight)) {
            this_tip.style('top', tipTop + 'px')
          } else {
            this_tip.style('top', mouseTop - tipHeight - 10 + 'px')
          }
        } else {
          this_tip.style('top', mouseTop - tipHeight - 10 + 'px')
        }
      }

      controller.datapoint_hover({col: col, row: row, label: label})
    })
    .on('mouseleave', function () {
      tip.hide()
      controller.datapoint_hover(null)
    })

  controller.on('highlight.datapt', function (hl) {
    rect.classed('highlight', function (d, i) {
      return (this.rowIndex === hl.y) || (this.colIndex === hl.x)
    })
  })
}

module.exports = colormap
