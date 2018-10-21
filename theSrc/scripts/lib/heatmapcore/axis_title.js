import wrap_new from './wrap_new'

function axis_title (svg, data, rotated, width, height, opts) {
  // rotated is y, unrotated is x

  svg = svg.append('g')
  var fontsize = rotated ? opts.yaxis_title_font_size : opts.xaxis_title_font_size
  var fontBold = rotated ? opts.yaxis_title_bold : opts.xaxis_title_bold
  var fontColor = rotated ? opts.yaxis_title_font_color : opts.xaxis_title_font_color
  var fontFam = rotated ? opts.yaxis_title_font_family : opts.xaxis_title_font_family

  var this_title = svg.append('text')
    .text(data)
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', 0)
    .attr('transform', function () {
      if (rotated) {
        return 'translate(' + (width / 2) + ',' + (height / 2) + '),rotate(-90)'
      } else {
        if (opts.xaxis_location === 'top') {
          return 'translate(' + (width / 2 + opts.left_columns_total_width) + ',' + (fontsize) + ')'
        } else {
          return 'translate(' + (width / 2) + ',' + (fontsize) + ')'
        }
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

module.exports = axis_title
