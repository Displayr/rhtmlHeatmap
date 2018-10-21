import wrap_new from './wrap_new'

function title_footer (svg, bounds, texts, fontFam, fontSize, fontColor, fontWeight, wrapwidth, t_st_f, opts) {
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

module.exports = title_footer
