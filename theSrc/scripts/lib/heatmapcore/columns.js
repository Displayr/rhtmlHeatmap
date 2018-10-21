import d3 from 'd3'

function compute_lengths (svg, columnTexts, opts) {
  var dummySvg = svg.append('svg')
  var dummy_g = dummySvg
    .append('g')
    .classed('dummy_g', true)

  var dummy_cols = dummy_g
    .selectAll('.dummy')
    .data(columnTexts)

  var dummy_cols_each = dummy_cols.enter()
    .append('g')
    .attr('data-index', function (d, i) { return i })
    .selectAll('.dummy')
    .data(function (d) { return d })

  const text_widths = []
  dummy_cols_each.enter()
    .append('text')
    .text(function (d) { return d })
    .style('font-family', opts.yaxis_font_family)
    .style('font-size', opts.left_columns_font_size)
    .each(function (d, i) {
      var parent_index = d3.select(this.parentNode).attr('data-index')
      console.log('parent_index')
      console.log(JSON.stringify(parent_index, {}, 2))

      var textLength = this.getComputedTextLength()
      text_widths[parent_index] = text_widths[parent_index] > textLength ? text_widths[parent_index] : textLength
    })

  dummySvg.remove()
  return text_widths
}

module.exports = { compute_lengths }
