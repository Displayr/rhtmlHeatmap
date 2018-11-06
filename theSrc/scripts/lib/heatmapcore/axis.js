import d3 from 'd3'
import wrap_new from './wrap_new'

function title (svg, title, rotated, width, height, opts) {
  // rotated is y, unrotated is x

  const titleContainer = svg.append('g')
  var fontsize = rotated ? opts.yaxis_title_font_size : opts.xaxis_title_font_size
  var fontBold = rotated ? opts.yaxis_title_bold : opts.xaxis_title_bold
  var fontColor = rotated ? opts.yaxis_title_font_color : opts.xaxis_title_font_color
  var fontFam = rotated ? opts.yaxis_title_font_family : opts.xaxis_title_font_family

  var this_title = titleContainer.append('text')
    .text(title)
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', 0)
    .attr('transform', function () {
      if (rotated) {
        return 'translate(' + (width / 2) + ',' + (height / 2) + '),rotate(-90)'
      } else {
        return 'translate(' + (width / 2) + ',' + (fontsize) + ')'
      }
    })
    .style('font-weight', fontBold ? 'bold' : 'normal')
    .style('font-size', fontsize)
    .style('fill', fontColor)
    .style('font-family', fontFam)
    .style('text-anchor', 'middle')

  if (!rotated) {
    this_title.call(wrap_new, width)
  }
}

function labels (svg, data, rotated, width, height, padding, axis_location, opts, controller, xaxisBounds, yaxisBounds) {
  const axisContainer = svg.append('g')

  // The data variable is either cluster info, or a flat list of names.
  // If the former, transform it to simply a list of names.
  var leaves
  if (data.children) {
    leaves = d3.layout.cluster().nodes(data)
      .filter(function (x) { return !x.children })
      .map(function (x) { return x.label + '' })
  } else if (data.length) {
    leaves = data
  }

  // Define scale, axis

  // set axis options
  var scale = d3.scale.ordinal()
    .domain(d3.range(0, leaves.length))
    .rangeBands([0, rotated ? width : height])
  var axis = d3.svg.axis()
    .scale(scale)
    .orient(axis_location)
    .outerTickSize(0)
    .tickPadding(padding)
    .tickFormat(function (d, i) { return leaves[i] })// hack for repeated values

  if (opts.table_style) {
    axis.innerTickSize(0)
  }

  // Create the actual axis
  var axisNodes = axisContainer.append('g')
    .call(axis)

  var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size'] + 'px'
  axisNodes.selectAll('text')
    .style('font-size', fontSize)
    .style('fill', rotated ? opts.xaxis_font_color : opts.yaxis_font_color)
    .style('font-family', rotated ? opts.xaxis_font_family : opts.yaxis_font_family)

  // var mouseTargets = axisContainer.append('g')
  //   .selectAll('g').data(leaves)
  // mouseTargets
  //   .enter()
  //   .append('g').append('rect')
  //   .attr('transform', rotated ? (axis_location === 'bottom' ? 'rotate(45),translate(0,0)' : 'rotate(-45),translate(0,0)') : '')
  //   .attr('fill', 'transparent')
  //   .on('click', function (d, i) {
  //     var dim = rotated ? 'x' : 'y'
  //     var hl = controller.highlight() || {x: null, y: null}
  //     // TODO address eqeqeq after verifying
  //     if (hl[dim] == i) { // eslint-disable-line eqeqeq
  //       // If clicked already-highlighted row/col, then unhighlight
  //       hl[dim] = null
  //       controller.highlight(hl)
  //     } else {
  //       hl[dim] = i
  //       controller.highlight(hl)
  //     }
  //     d3.event.stopPropagation()
  //   })

  // function layoutMouseTargets (selection) {
  //   var _h = scale.rangeBand() / (rotated ? 1.414 : 1)
  //   var _w = rotated ? height * 1.414 * 1.2 : width
  //   selection
  //     .attr('transform', function (d, i) {
  //       var x = rotated ? (axis_location === 'bottom' ? scale(i) + scale.rangeBand() / 2 + xaxisBounds.left + xboundsleft : scale(i) + xaxisBounds.left + xboundsleft) : 0
  //       var y = rotated ? (axis_location === 'bottom' ? padding + 6 : height - _h / 1.414 - padding - 6) : scale(i)
  //       return 'translate(' + x + ',' + y + ')'
  //     })
  //     .selectAll('rect')
  //     .attr('height', _h)
  //     .attr('width', _w)
  // }
  //
  // layoutMouseTargets(mouseTargets)
  // // workout what this mouseTarget is

  if (rotated) {
    axisNodes.selectAll('text')
      .attr('transform', function () {
        if (axis_location === 'bottom') {
          return 'rotate(45),translate(' + padding + ', 0)'
        } else if (axis_location === 'top') {
          return 'rotate(-45),translate(' + (padding) + ', 0)'
        }
      })
      .style('text-anchor', 'start')
  }
  //  else {
  //   if (opts.table_style) {
  //     axisNodes.selectAll("text").style("text-anchor", "start");
  //   }
  // }
  //
  // controller.on('highlight.axis-' + (rotated ? 'x' : 'y'), function (hl) {
  //   var ticks = axisNodes.selectAll('.tick')
  //   var selected = hl[rotated ? 'x' : 'y']
  //   if (typeof (selected) !== 'number') {
  //     ticks.style('opacity', function (d, i) {
  //       if (rotated) {
  //         var ttt = d3.transform(d3.select(this).attr('transform'))
  //         if (ttt.translate[0] < 0 || ttt.translate[0] > width) {
  //           return 0
  //         } else {
  //           return 1
  //         }
  //       }
  //     })
  //     return
  //   }
  //   ticks.style('opacity', function (d, i) {
  //     if (i !== selected) {
  //       return 0.4
  //     } else {
  //       return 1
  //     }
  //   })
  //   ticks.each(function (d, i) {
  //     if (rotated) {
  //       var ttt = d3.transform(d3.select(this).attr('transform'))
  //       if (ttt.translate[0] < 0 || ttt.translate[0] > width) {
  //         d3.select(this).style('opacity', 0)
  //       }
  //     }
  //   })
  // })
  //
  // controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function (_) {
  //   var dim = rotated ? 0 : 1
  //   // scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
  //   var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]]
  //   scale.rangeBands(rb)
  //   var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear')
  //   tAxisNodes.call(axis)
  //   // Set text-anchor on the non-transitioned node to prevent jumpiness
  //   // in RStudio Viewer pane
  //   // if (opts.table_style) {
  //   //   axisNodes.selectAll("text").style("text-anchor", "start");
  //   // } else {
  //   axisNodes.selectAll('text').style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
  //   // }
  //
  //   tAxisNodes.selectAll('g')
  //     .style('opacity', function (d, i) {
  //       if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
  //         return 1
  //       } else {
  //         return 0
  //       }
  //     })
  //   // if (opts.table_style) {
  //   //   tAxisNodes.selectAll("text")
  //   //     .style("text-anchor", "start");
  //
  //   // } else {
  //   tAxisNodes.selectAll('text')
  //     .style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
  //   // }
  //
  //   mouseTargets.transition().duration(opts.anim_duration).ease('linear')
  //     .call(layoutMouseTargets)
  //     .style('opacity', function (d, i) {
  //       if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
  //         return 1
  //       } else {
  //         return 0
  //       }
  //     })
  // })
}

function label_length (svg, input, x_or_y, fontsize, fontfamily, opts) {
  var dummySvg = svg.append('svg')
  var dummy_g = dummySvg
    .append('g')
    .attr('class', 'axis')

  var texts = dummy_g
    .selectAll('text')
    .data(input)

  texts.enter()
    .append('text')
    .text(function (d) { return d })
    .style('font-size', fontsize)
    .style('font-family', fontfamily)

  var text_length = 0
  var text_lengths = []
  var text_hash = {}

  texts.each(function (d, i) {
    var current_len = this.getBBox().width
    current_len = x_or_y
      ? current_len / 1.4 + opts.xaxis_offset + opts.axis_padding
      : current_len + opts.yaxis_offset + opts.axis_padding
    text_lengths.push(current_len)
    text_length = text_length < current_len ? current_len : text_length
  })

  var output

  if (x_or_y) {
    output = text_length > opts.height / 3 ? opts.height / 3 : text_length
  } else {
    output = text_length > opts.width / 3 ? opts.width / 3 : text_length
  }

  texts.each(function (d, i) {
    var text_array = input[i].split('')
    var new_text = input[i]
    var modified_text = input[i]
    var new_length
    var c = 0

    while (text_lengths[i] > output && text_array.length > 1) {
      text_array.pop()
      new_text = text_array.join('')

      if (text_hash[new_text]) {
        text_hash[new_text] += 1
        modified_text = new_text + '...'
      } else {
        text_hash[new_text] = 1
        modified_text = new_text + '...'
      }

      new_length = d3.select(this).text(modified_text).node().getBBox().width
      new_length = x_or_y
        ? new_length / 1.4 + opts.xaxis_offset + opts.axis_padding
        : new_length + opts.yaxis_offset + opts.axis_padding
      text_lengths[i] = new_length
      c++
    }

    if (c > 0) {
      input[i] = modified_text
    }
  })

  dummySvg.remove()
  return output
}

module.exports = { labels, title, label_length }
