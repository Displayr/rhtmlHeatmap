import d3 from 'd3'

function legend (svg, colors, range, bounds, opts) {
  var legendAxisG = svg.append('g')
  svg = svg.append('g')

  var legendRects = svg.selectAll('rect')
    .data(colors)

  var boundsPaddingX = 4 + opts.legend_left_space
  var boundsPaddingY = 20
  var rectWidth = opts.legend_bar_width
  var rectHeight = (bounds.height - boundsPaddingY * 2) / colors.length

  legendRects.enter()
    .append('rect')
    .attr('width', rectWidth)
    .attr('height', rectHeight)
    .attr('transform', function (d, i) {
      return 'translate(' + (boundsPaddingX) + ',' + (rectHeight * i + boundsPaddingY) + ')'
    })
    .style('fill', function (d) { return d })
    .style('stroke', function (d) { return d })
    .style('stroke-width', '1px')

  // append axis
  legendAxisG.attr('transform', 'translate(' + (boundsPaddingX + rectWidth) + ',' + boundsPaddingY + ')')
  var legendScale
  if (opts.x_is_factor) {
    legendScale = d3.scale.ordinal().rangeBands([colors.length * rectHeight, 0]).nice()
  } else {
    legendScale = d3.scale.linear().range([colors.length * rectHeight, 0]).nice()
  }

  legendScale.domain(opts.legend_range)

  var legendAxis = d3.svg.axis()
    .scale(legendScale)
    .orient('right')
    .tickSize(0)
    .tickFormat(opts.legend_format)

  legendAxisG.call(legendAxis)
  legendAxisG.selectAll('text')
    .style('font-size', opts.legend_font_size + 'px')
    .style('font-family', opts.legend_font_family)
    .style('fill', opts.legend_font_color)
}

module.exports = legend
