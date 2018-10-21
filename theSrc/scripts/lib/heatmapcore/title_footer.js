import wrap_new from './wrap_new'

function draw (svg, bounds, texts, fontFam, fontSize, fontColor, fontWeight, wrapwidth, t_st_f, opts) {
  svg = svg.append('g')
  var this_text = svg.append('text')
    .text(texts)
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', 0)
    .style('font-family', fontFam)
    .style('font-size', fontSize)
    .style('fill', fontColor)
    .call(wrap_new, wrapwidth)
    .style('text-anchor', t_st_f === '3' ? 'start' : 'middle')
    .attr('font-weight', fontWeight ? 'bold' : 'normal')

  var transX = t_st_f === '3' ? opts.footer_margin_X : opts.width / 2
  var transY = (t_st_f === '3' ? opts.footer_margin_Y : t_st_f === '1' ? opts.title_margin_top : opts.subtitle_margin_top) + fontSize
  this_text.attr('transform', 'translate(' + transX + ',' + transY + ')')
}

function compute_height (svg, input, fontFam, fontSize, fontCol, wrapWidth, bold) {
  var dummySvg = svg.append('svg')
  var dummy_g = dummySvg
    .append('g')
    .classed('dummy_g', true)

  var text_el = dummy_g.append('text')
    .text(input)
    .attr('x', 0)
    .attr('y', 0)
    .attr('dy', 0)
    .style('font-family', fontFam)
    .style('font-size', fontSize)
    .style('fill', fontCol)
    .attr('font-weight', bold ? 'bold' : 'normal')
    .call(wrap_new, wrapWidth)

  var output = text_el.node().getBBox().height
  dummySvg.remove()
  return output
}

module.exports = { draw, compute_height }
