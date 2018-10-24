import d3 from 'd3'

function draw (svg, colors, range, bounds, opts) {
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

function compute_lengths (svg, opts) {
  let text_widths = []
  var dummySvg = svg.append('svg')
  var legendAxisG = dummySvg.append('g')

  dummySvg.selectAll('rect').data(opts.legend_colors)

  var rectHeight = 10

  // append axis
  var legendScale
  if (opts.x_is_factor) {
    legendScale = d3.scale.ordinal().rangeBands([opts.legend_colors.length * rectHeight, 0]).nice()
  } else {
    legendScale = d3.scale.linear().range([opts.legend_colors.length * rectHeight, 0]).nice()
  }

  legendScale.domain(opts.legend_range)

  var legendAxis = d3.svg.axis()
    .scale(legendScale)
    .orient('right')
    .tickSize(0)

  legendAxisG.call(legendAxis)
  var legendTicksCount = legendAxisG.selectAll('text')[0].length

  if (opts.legend_colors && !opts.x_is_factor) {
    if (opts.legend_digits) {
      opts.legend_format = d3.format(',.' + opts.legend_digits + 'f')
    } else {
      var legend_step = (d3.max(opts.legend_range) - d3.min(opts.legend_range)) / (legendTicksCount - 1)
      console.log(opts.legend_range + ' ' + legendTicksCount)
      var legend_dig
      if (legend_step < 0.1) {
        legend_dig = -Math.floor(Math.log(legend_step) / Math.log(10) + 1) + 1
      } else if (legend_step >= 0.1 && legend_step < 1) {
        legend_dig = 1
      } else {
        legend_dig = 0
      }
      opts.legend_format = d3.format(',.' + legend_dig + 'f')
    }
  }

  legendAxis.tickFormat(opts.legend_format)
  legendAxisG.call(legendAxis)

  legendAxisG.selectAll('text')
    .style('font-size', opts.legend_font_size + 'px')
    .style('font-family', opts.legend_font_family)
    .style('fill', opts.legend_font_color)
    .each(function (d, i) {
      text_widths[i] = this.getComputedTextLength()
    })

  dummySvg.remove()
  return text_widths
}

module.exports = { draw, compute_lengths }
