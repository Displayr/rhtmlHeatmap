import d3 from 'd3'
import GridSizer from './gridSizer'
import Controller from './controller'
import buildConfig from './buildConfig'
import dendrogram from './dendrogram'
import colormap from './colormap'

class Heatmap {
  constructor (selector, data, options) {
    var el = d3.select(selector)
    el.attr(`rhtmlHeatmap-status`, 'loading')

    var bbox = el.node().getBoundingClientRect()

    var controller = new Controller()

    // Set option defaults & copy settings
    var opts = buildConfig(options, bbox.width, bbox.height)

    var compute_title_footer_height = function (svg, input, fontFam, fontSize, fontCol, wrapWidth, bold) {
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
    };

    (function () {
      var inner = el.append('div').classed('inner', true)
      inner.append('div').classed('info', true) // TODO nothing is added to info

      var compute_col_text_widths = function (input, text_widths, left_or_right) {
        var dummySvg = inner.append('svg')
        var dummy_g = dummySvg
          .append('g')
          .classed('dummy_g', true)

        var dummy_cols = dummy_g
          .selectAll('.dummy')
          .data(input)

        var dummy_cols_each = dummy_cols.enter()
          .append('g')
          .attr('data-index', function (d, i) { return i })
          .selectAll('.dummy')
          .data(function (d) { return d })

        dummy_cols_each.enter()
          .append('text')
          .text(function (d) { return d })
          .style('font-family', opts.yaxis_font_family)
          .style('font-size', opts.left_columns_font_size)
          .each(function (d, i) {
            var parent_index = d3.select(this.parentNode).attr('data-index')
            var textLength = this.getComputedTextLength()
            text_widths[parent_index] = text_widths[parent_index] > textLength ? text_widths[parent_index] : textLength
          })

        dummySvg.remove()
      }

      var compute_axis_label_dim = function (input, x_or_y, fontsize, fontfamily, additional) {
        var dummySvg = inner.append('svg')
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

      var compute_legend_text_length = function (text_widths) {
        var dummySvg = inner.append('svg')
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
      }

      var i = 0
      var x_texts
      var y_texts
      opts.xaxis_title_height = 0
      // deal with x axis and its title
      if (!opts.xaxis_hidden) {
        if (data.cols) {
          opts.xaxis_location = 'bottom'
        }

        if (opts.xaxis_location === 'bottom') {
          opts.row_element_names.push('xaxis')
        } else {
          opts.row_element_names.unshift('xaxis')
        }

        if (opts.xaxis_title) {
          if (opts.xaxis_location === 'bottom') {
            opts.row_element_names.push('xtitle')
          } else {
            opts.row_element_names.unshift('xtitle')
          }
          opts.xaxis_title_height = opts.xaxis_font_size * 1.5 + 5
          opts.row_element_map['xtitle'] = opts.xaxis_title_height
        }

        if (data.matrix.cols.length) {
          x_texts = data.matrix.cols
        } else {
          x_texts = [data.matrix.cols]
        }

        for (i = 0; i < x_texts.length; i++) {
          opts.xlabs_raw.push(x_texts[i])
          opts.xlabs_mod.push(x_texts[i])
        }

        opts.xaxis_len = compute_axis_label_dim(opts.xlabs_mod,
          true,
          opts.xaxis_font_size,
          opts.xaxis_font_family)
        opts.row_element_map['xaxis'] = opts.xaxis_len
      }

      if (data.cols) {
        opts.row_element_names.unshift('col_dendro')
      }

      if (opts.footer) {
        opts.row_element_names.push('footer')
        opts.row_element_map['footer'] =
          compute_title_footer_height(
            inner,
            opts.footer,
            opts.footer_font_family,
            opts.footer_font_size,
            opts.footer_font_color,
            opts.footer_width,
            opts.footer_font_bold) + opts.footer_margin_Y * 2
      }

      if (opts.legend_colors) {
        for (i = 0; i < opts.legend_range.length; i++) {
          opts.legend_text_len.push(0)
        }
        compute_legend_text_length(opts.legend_text_len)
        opts.legend_total_width = opts.legend_left_space + opts.legend_bar_width + opts.legend_x_padding * 2 + d3.max(opts.legend_text_len)
      }

      // columns to the left of the main plot data
      opts.larger_columns_subtitles_font_size = opts.left_columns_subtitles_font_size > opts.right_columns_subtitles_font_size ? opts.left_columns_subtitles_font_size : opts.right_columns_subtitles_font_size
      opts.larger_columns_title_font_size = opts.left_columns_title_font_size > opts.right_columns_title_font_size ? opts.left_columns_title_font_size : opts.right_columns_title_font_size
      opts.left_columns_total_width = 0

      if (opts.left_columns) {
        var left_cols_widths = []
        opts.left_columns_width = []
        for (i = 0; i < opts.left_columns.length; i++) {
          left_cols_widths.push(0)
          opts.col_element_names.unshift('left_col' + i)
        }

        // compute mean column width
        compute_col_text_widths(opts.left_columns, left_cols_widths, true)

        for (i = 0; i < opts.left_columns.length; i++) {
          if (left_cols_widths[i] > opts.width * 0.2) {
            left_cols_widths[i] = opts.width * 0.2
          }
          opts.col_element_map['left_col' + i] = left_cols_widths[i] + opts.axis_padding * 2
          opts.left_columns_width.push(left_cols_widths[i] + opts.axis_padding * 2)
          opts.left_columns_total_width = d3.sum(opts.left_columns_width)
        }
      }

      opts.right_columns_total_width = 0
      if (opts.right_columns) {
        var right_cols_widths = []
        opts.right_columns_width = []
        for (i = 0; i < opts.right_columns.length; i++) {
          right_cols_widths.push(0)
          opts.col_element_names.push('right_col' + i)
        }

        // compute mean column width
        compute_col_text_widths(opts.right_columns, right_cols_widths, true)

        for (i = 0; i < opts.right_columns.length; i++) {
          if (right_cols_widths[i] > opts.width * 0.2) {
            right_cols_widths[i] = opts.width * 0.2
          }
          opts.col_element_map['right_col' + i] = right_cols_widths[i] + opts.axis_padding * 2
          opts.right_columns_width.push(right_cols_widths[i] + opts.axis_padding * 2)
        }
        opts.right_columns_total_width = d3.sum(opts.right_columns_width)
      }

      opts.left_columns_subtitles = opts.left_columns ? opts.left_columns_subtitles : undefined
      opts.left_columns_title = opts.left_columns && opts.left_columns_subtitles ? opts.left_columns_title : undefined
      opts.right_columns_subtitles = opts.right_columns ? opts.right_columns_subtitles : undefined
      opts.right_columns_title = opts.right_columns && opts.right_columns_subtitles ? opts.right_columns_title : undefined
      opts.left_sub_len = 0
      opts.right_sub_len = 0

      if (opts.left_columns_subtitles) {
        // compute text width of left column subtitles
        opts.left_sub_len = compute_axis_label_dim(opts.left_columns_subtitles,
          true,
          opts.left_columns_subtitles_font_size,
          opts.left_columns_subtitles_font_family)
      }

      if (opts.right_columns_subtitles) {
        // compute text width of right column subtitles
        opts.right_sub_len = compute_axis_label_dim(opts.right_columns_subtitles,
          true,
          opts.right_columns_subtitles_font_size,
          opts.right_columns_subtitles_font_family)
      }

      // compare text width of left column subtitles, right column subtitles and x axis
      if (opts.xaxis_hidden) {
        opts.xaxis_location = undefined
      }

      if (!opts.xaxis_hidden && opts.xaxis_location === 'top') {
        opts.topaxis_len = Math.max(opts.xaxis_len, opts.left_sub_len, opts.right_sub_len)
        opts.row_element_map['xaxis'] = opts.topaxis_len
      } else {
        opts.topaxis_len = Math.max(opts.left_sub_len, opts.right_sub_len)
        if (opts.topaxis_len > 0) {
          opts.row_element_names.unshift('top_axis_el')
          opts.row_element_map['top_axis_el'] = opts.topaxis_len
        }
      }

      opts.left_col_title_height = 0
      opts.right_col_title_height = 0

      if (opts.left_columns_title) {
        // compute height and wrap of left column title
        opts.left_col_title_height =
          compute_title_footer_height(
            inner,
            opts.left_columns_title,
            opts.left_columns_title_font_family,
            opts.left_columns_title_font_size,
            opts.left_columns_title_font_color,
            opts.left_columns_total_width,
            opts.left_columns_title_bold) + opts.axis_padding * 2
      }

      if (opts.right_columns_title) {
        opts.right_col_title_height =
          compute_title_footer_height(
            inner,
            opts.right_columns_title,
            opts.right_columns_title_font_family,
            opts.right_columns_title_font_size,
            opts.right_columns_title_font_color,
            opts.right_columns_total_width,
            opts.right_columns_title_bold) + opts.axis_padding * 2
      }

      if (!opts.xaxis_hidden && opts.xaxis_location === 'top' && opts.xaxis_title) {
        opts.topaxis_title_height = Math.max(opts.xaxis_title_height, opts.left_col_title_height, opts.right_col_title_height)
        opts.row_element_map['xtitle'] = opts.topaxis_title_height
      } else {
        opts.topaxis_title_height = Math.max(opts.left_col_title_height, opts.right_col_title_height)
        if (opts.topaxis_title_height > 0) {
          opts.row_element_names.unshift('top_axis_title_el')
          opts.row_element_map['top_axis_title_el'] = opts.topaxis_title_height
        }
      }

      if (!opts.yaxis_hidden) {
        if (data.rows) {
          opts.yaxis_location = 'right'
        }

        if (opts.yaxis_location === 'right') {
          opts.col_element_names.push('yaxis')
        } else {
          opts.col_element_names.unshift('yaxis')
        }

        if (data.matrix.rows.length) {
          y_texts = data.matrix.rows
        } else {
          y_texts = [data.matrix.rows]
        }

        for (i = 0; i < y_texts.length; i++) {
          opts.ylabs_raw.push(y_texts[i])
          opts.ylabs_mod.push(y_texts[i])
        }

        opts.col_element_map['yaxis'] = compute_axis_label_dim(opts.ylabs_mod,
          false,
          opts.yaxis_font_size,
          opts.yaxis_font_family)

        if (opts.yaxis_title) {
          if (opts.yaxis_location === 'right') {
            opts.col_element_names.push('ytitle')
          } else {
            opts.col_element_names.unshift('ytitle')
          }
          opts.col_element_map['ytitle'] = opts.yaxis_title_font_size * 1.5 + 5
        }

        if (!opts.xaxis_hidden) {
          var x_texts_net = opts.row_element_map['xaxis']
          var y_width_net = x_texts_net / 1.1

          if (opts.yaxis_location === 'right') {
            if (opts.legend_colors) {
              if (y_width_net > opts.col_element_map['yaxis'] + opts.legend_total_width) {
                opts.col_element_map['yaxis'] = y_width_net - opts.legend_total_width
                opts.col_element_names.push('legend')
                opts.col_element_map['legend'] = opts.legend_total_width
              } else {
                opts.col_element_names.push('legend')
                opts.col_element_map['legend'] = opts.legend_total_width
              }
            } else {
              if (y_width_net > opts.col_element_map['yaxis']) {
                opts.col_element_map['yaxis'] = y_width_net
              }
            }
          } else {
            if (opts.legend_colors) {
              if (opts.legend_total_width < y_width_net) {
                opts.col_element_names.push('yaxis_dummy1')
                opts.col_element_map['yaxis_dummy1'] = (y_width_net - opts.legend_total_width) / 2
                opts.col_element_names.push('legend')
                opts.col_element_map['legend'] = opts.legend_total_width
                opts.col_element_names.push('yaxis_dummy2')
                opts.col_element_map['yaxis_dummy2'] = (y_width_net - opts.legend_total_width) / 2
              } else {
                opts.col_element_names.push('legend')
                opts.col_element_map['legend'] = opts.legend_total_width
              }
            } else {
              opts.col_element_names.push('yaxis_dummy')
              opts.col_element_map['yaxis_dummy'] = y_width_net
            }
          }
        } else {
          if (opts.legend_colors) {
            opts.col_element_names.push('legend')
            opts.col_element_map['legend'] = opts.legend_total_width
          }
        }
      } else {
        if (!opts.xaxis_hidden) {
          // keep the space to mitigate the overflow of x axis label
          x_texts_net = opts.row_element_map['xaxis']
          y_width_net = x_texts_net / 1.1

          if (opts.legend_colors) {
            if (opts.legend_total_width < y_width_net) {
              opts.col_element_names.push('yaxis_dummy1')
              opts.col_element_map['yaxis_dummy1'] = (y_width_net - opts.legend_total_width) / 2
              opts.col_element_names.push('legend')
              opts.col_element_map['legend'] = opts.legend_total_width
              opts.col_element_names.push('yaxis_dummy2')
              opts.col_element_map['yaxis_dummy2'] = (y_width_net - opts.legend_total_width) / 2
            } else {
              opts.col_element_names.push('legend')
              opts.col_element_map['legend'] = opts.legend_total_width
            }
          } else {
            if (opts.right_columns) {
              if (opts.right_sub_len / 1.1 > opts.right_columns_width[opts.right_columns_width.length - 1] / 2) {
                opts.col_element_names.push('yaxis')
                opts.col_element_map['yaxis'] = opts.right_sub_len / 1.1 - opts.right_columns_width[opts.right_columns_width.length - 1] / 2
              }
            } else {
              opts.col_element_names.push('yaxis')
              opts.col_element_map['yaxis'] = y_width_net
            }
          }
        } else {
          if (opts.legend_colors) {
            opts.col_element_names.push('legend')
            opts.col_element_map['legend'] = opts.legend_total_width
          } else {
            if (opts.right_columns && opts.right_sub_len / 1.1 > opts.right_columns_width[opts.right_columns_width.length - 1] / 2) {
              opts.col_element_names.push('yaxis')
              opts.col_element_map['yaxis'] = opts.right_sub_len / 1.1 - opts.right_columns_width[opts.right_columns_width.length - 1] / 2
            }
          }
        }
      }

      // row dendrogram, add one more column
      if (data.rows) {
        opts.col_element_names.unshift('row_dendro')
        opts.col_element_map['row_dendro'] = opts.yclust_width || opts.width * 0.12
      }

      // column dendrogram, add one more row
      if (data.cols) {
        opts.row_element_map['col_dendro'] = opts.xclust_height || opts.height * 0.12
      }

      if (opts.subtitle) {
        opts.row_element_names.unshift('subtitle')
        opts.row_element_map['subtitle'] =
          compute_title_footer_height(
            inner,
            opts.subtitle,
            opts.subtitle_font_family,
            opts.subtitle_font_size,
            opts.subtitle_font_color,
            opts.subtitle_width,
            opts.subtitle_font_bold) + opts.subtitle_margin_top + opts.subtitle_margin_bottom
      }

      if (opts.title) {
        opts.row_element_names.unshift('title')
        opts.row_element_map['title'] =
          compute_title_footer_height(
            inner,
            opts.title,
            opts.title_font_family,
            opts.title_font_size,
            opts.title_font_color,
            opts.title_width,
            opts.title_font_bold) + opts.title_margin_top + opts.title_margin_bottom
      }
    })()

    var row_heights = []
    var col_widths = []
    var i = 0
    for (i = 0; i < opts.col_element_names.length; i++) {
      col_widths.push(opts.col_element_map[opts.col_element_names[i]])
    }

    for (i = 0; i < opts.row_element_names.length; i++) {
      row_heights.push(opts.row_element_map[opts.row_element_names[i]])
    }

    var gridSizer = new GridSizer(
      col_widths,
      row_heights,
      opts.width,
      opts.height
    )

    var colormapBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('*'))

    if (!opts.xaxis_hidden && opts.xaxis_title) {
      var dummydiv = el.append('div')
      opts.xaxis_title_height =
        compute_title_footer_height(
          dummydiv,
          opts.xaxis_title,
          opts.xaxis_title_font_family,
          opts.xaxis_title_font_size,
          opts.xaxis_title_font_color,
          colormapBounds.width,
          opts.xaxis_title_bold) + opts.axis_padding * 2
      opts.row_element_map['xtitle'] = opts.xaxis_title_height
      dummydiv.remove()
    }

    if (!opts.xaxis_hidden && opts.xaxis_location === 'top' && opts.xaxis_title) {
      opts.topaxis_title_height = Math.max(opts.xaxis_title_height, opts.left_col_title_height, opts.right_col_title_height)
      opts.row_element_map['xtitle'] = opts.topaxis_title_height
    }

    // TODO KZ this was just done above ?
    row_heights = []
    col_widths = []
    i = 0
    gridSizer = undefined
    for (i = 0; i < opts.col_element_names.length; i++) {
      col_widths.push(opts.col_element_map[opts.col_element_names[i]])
    }

    for (i = 0; i < opts.row_element_names.length; i++) {
      row_heights.push(opts.row_element_map[opts.row_element_names[i]])
    }

    console.log('col_widths after')
    console.log(JSON.stringify(col_widths, {}, 2))
    console.log('row_heights after')
    console.log(JSON.stringify(row_heights, {}, 2))

    gridSizer = new GridSizer(
      col_widths,
      row_heights,
      opts.width,
      opts.height
    )

    colormapBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('*'))
    var colDendBounds = !data.cols ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('col_dendro'))

    var rowDendBounds = !data.rows ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('row_dendro'), opts.row_element_names.indexOf('*'))

    var xaxisBounds = opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('xaxis'))
    if (xaxisBounds) {
      xaxisBounds.width0 = xaxisBounds.width
    }

    var yaxisBounds = opts.yaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('yaxis'), opts.row_element_names.indexOf('*'))

    var xtitleBounds = !opts.xaxis_title || opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('xtitle'))

    var ytitleBounds = !opts.yaxis_title || opts.yaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('ytitle'), opts.row_element_names.indexOf('*'))

    var legendBounds = !opts.legend_colors ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('legend'), opts.row_element_names.indexOf('*'))

    var titleBounds = !opts.title ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('title'))

    var subtitleBounds = !opts.subtitle ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('subtitle'))

    var footerBounds = !opts.footer ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('footer'))

    var leftColsBounds = !opts.left_columns ? null : []
    var leftTitleBounds = {}
    leftTitleBounds.left = 0
    leftTitleBounds.width = 0
    var topAxisElBounds
    var topAxisTitleElBounds

    if (opts.left_columns) {
      for (i = 0; i < opts.left_columns.length; i++) {
        leftColsBounds.push(gridSizer.getCellBounds(opts.col_element_names.indexOf('left_col' + i), opts.row_element_names.indexOf('*')))
      }

      if (!opts.xaxis_hidden && opts.xaxis_location === 'top') {
        xaxisBounds.left = 0
        xaxisBounds.width = xaxisBounds.width + opts.left_columns_total_width
      } else {
        if (opts.topaxis_len > 0) {
          topAxisElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('top_axis_el'))
          topAxisElBounds.left = 0
          topAxisElBounds.width = opts.width
        }
      }
      if (!opts.xaxis_hidden && opts.xaxis_location === 'top' && opts.xaxis_title) {
        xtitleBounds.left = 0
        xtitleBounds.width = xtitleBounds.width + opts.left_columns_total_width
      } else {
        if (opts.topaxis_title_height > 0) {
          topAxisTitleElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('top_axis_title_el'))
          topAxisTitleElBounds.left = 0
          topAxisTitleElBounds.width = opts.width
        }
      }
    }

    var rightColsBounds = !opts.right_columns ? null : []
    var rightTitleBounds = {}
    rightTitleBounds.width = 0

    if (opts.right_columns) {
      for (i = 0; i < opts.right_columns.length; i++) {
        rightColsBounds.push(gridSizer.getCellBounds(opts.col_element_names.indexOf('right_col' + i), opts.row_element_names.indexOf('*')))
      }

      if (!opts.xaxis_hidden && opts.xaxis_location === 'top') {
        xaxisBounds.width = xaxisBounds.width + opts.right_columns_total_width
      } else {
        if (opts.topaxis_len > 0 && !opts.left_columns_subtitles) {
          topAxisElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('top_axis_el'))
          topAxisElBounds.left = 0
          topAxisElBounds.width = opts.width
        }
      }

      if (!opts.xaxis_hidden && opts.xaxis_location === 'top' && opts.xaxis_title) {
        xtitleBounds.width = xtitleBounds.width + opts.right_columns_total_width
      } else {
        if (opts.topaxis_title_height > 0 && !opts.left_columns_title) {
          topAxisTitleElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('top_axis_title_el'))
          topAxisTitleElBounds.left = 0
          topAxisTitleElBounds.width = opts.width
        }
      }
    }

    if (opts.title) {
      titleBounds.width = opts.width
      titleBounds.left = 0
    }

    if (opts.subtitle) {
      subtitleBounds.width = opts.width
      subtitleBounds.left = 0
    }

    if (opts.footer) {
      footerBounds.width = opts.width
      footerBounds.left = 0
    }

    var modifiedXbounds = opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf('*'), opts.row_element_names.indexOf('xaxis'))

    if (!opts.xaxis_hidden) {
      if (data.rows) {
        opts.yclust_width = opts.yclust_width || opts.width * 0.12
      } else {
        opts.yclust_width = 0
      }
      modifiedXbounds.width = opts.width - opts.yclust_width
      modifiedXbounds.left = 0
    }

    function cssify (styles) {
      return {
        position: 'absolute',
        top: styles.top + 'px',
        left: styles.left + 'px',
        width: styles.width + 'px',
        height: styles.height + 'px'
      }
    }

    // Create DOM structure
    (function () {
      var inner = el.select('.inner')
      if (opts.xaxis_title && !opts.xaxis_hidden) { inner.append('svg').classed('xtitle', true).style(cssify(xtitleBounds)) }
      if (opts.yaxis_title && !opts.yaxis_hidden) { inner.append('svg').classed('ytitle', true).style(cssify(ytitleBounds)) }
      if (data.cols) { inner.append('svg').classed('dendrogram colDend', true).style(cssify(colDendBounds)) }
      if (data.rows) { inner.append('svg').classed('dendrogram rowDend', true).style(cssify(rowDendBounds)) }
      inner.append('svg').classed('colormap', true).style(cssify(colormapBounds))
      if (!opts.xaxis_hidden) { inner.append('svg').classed('axis xaxis', true).style(cssify(modifiedXbounds)) }
      if (!opts.yaxis_hidden) { inner.append('svg').classed('axis yaxis', true).style(cssify(yaxisBounds)) }
      if (opts.legend_colors) { inner.append('svg').classed('legend', true).style(cssify(legendBounds)) }
      if (opts.title) { inner.append('svg').classed('graph_title', true).style(cssify(titleBounds)) }
      if (opts.subtitle) { inner.append('svg').classed('graph_subtitle', true).style(cssify(subtitleBounds)) }
      if (opts.footer) { inner.append('svg').classed('graph_footer', true).style(cssify(footerBounds)) }
      var leftCols = !opts.left_columns ? null : []
      if (opts.left_columns) {
        for (i = 0; i < opts.left_columns.length; i++) {
          leftCols.push(!opts.left_columns ? null : inner.append('svg').classed('graph_leftCols' + i, true).style(cssify(leftColsBounds[i])))
        }
        if (opts.left_columns_subtitles) {
          if (opts.xaxis_hidden || !(opts.xaxis_location === 'top')) { inner.append('svg').classed('graph_topaxis_el', true).style(cssify(topAxisElBounds)) }
          if (opts.left_columns_title) {
            if (opts.xaxis_hidden || !(opts.xaxis_location === 'top') || !opts.xaxis_title) { inner.append('svg').classed('graph_topaxis_title_el', true).style(cssify(topAxisTitleElBounds)) }
          }
        }
      }
      var rightCols = !opts.right_columns ? null : []
      if (opts.right_columns) {
        for (i = 0; i < opts.right_columns.length; i++) {
          rightCols.push(!opts.right_columns ? null : inner.append('svg').classed('graph_rightCols' + i, true).style(cssify(rightColsBounds[i])))
        }
        if (opts.right_columns_subtitles && !opts.left_columns_subtitles) {
          if (opts.xaxis_hidden || !(opts.xaxis_location === 'top')) { inner.append('svg').classed('graph_topaxis_el', true).style(cssify(topAxisElBounds)) }
        }
        if (opts.left_columns_title && opts.right_columns_title) {
          if (opts.xaxis_hidden || !(opts.xaxis_location === 'top') || !opts.xaxis_title) { inner.append('svg').classed('graph_topaxis_title_el', true).style(cssify(topAxisTitleElBounds)) }
        }
      }

      inner.on('click', function () {
        controller.highlight(null, null)
      })
      controller.on('highlight.inner', function (hl) {
        inner.classed('highlighting',
          typeof (hl.x) === 'number' || typeof (hl.y) === 'number')
      })
    })()

    if (data.rows) { dendrogram(el.select('svg.rowDend'), data.rows, false, rowDendBounds.width, rowDendBounds.height, opts.axis_padding, opts.link_color, controller, opts.anim_duration) }
    if (data.cols) { dendrogram(el.select('svg.colDend'), data.cols, true, colDendBounds.width, colDendBounds.height, opts.axis_padding, opts.link_color, controller, opts.anim_duration) }
    colormap(el.select('svg.colormap'), data.matrix, colormapBounds.width, colormapBounds.height, opts, controller)
    if (!opts.xaxis_hidden) { axisLabels(el.select('svg.xaxis'), opts.xlabs_mod, true, xaxisBounds.width0, xaxisBounds.height, opts.axis_padding, opts.xaxis_location) }
    if (!opts.yaxis_hidden) { axisLabels(el.select('svg.yaxis'), opts.ylabs_mod, false, yaxisBounds.width, yaxisBounds.height, opts.axis_padding, opts.yaxis_location) }
    if (opts.xaxis_title && !opts.xaxis_hidden) { axis_title(el.select('svg.xtitle'), opts.xaxis_title, false, colormapBounds.width, xtitleBounds.height) }
    if (opts.yaxis_title && !opts.yaxis_hidden) { axis_title(el.select('svg.ytitle'), opts.yaxis_title, true, ytitleBounds.width, colormapBounds.height) }
    if (opts.legend_colors) { legend(el.select('svg.legend'), opts.legend_colors, opts.legend_range, legendBounds) }

    if (opts.title) {
      title_footer(
        el.select('svg.graph_title'),
        titleBounds,
        opts.title,
        opts.title_font_family,
        opts.title_font_size,
        opts.title_font_color,
        opts.title_font_bold,
        opts.title_width,
        '1')
    }

    if (opts.subtitle) {
      title_footer(
        el.select('svg.graph_subtitle'),
        subtitleBounds,
        opts.subtitle,
        opts.subtitle_font_family,
        opts.subtitle_font_size,
        opts.subtitle_font_color,
        opts.subtitle_font_bold,
        opts.subtitle_width,
        '2')
    }

    if (opts.footer) {
      title_footer(
        el.select('svg.graph_footer'),
        footerBounds,
        opts.footer,
        opts.footer_font_family,
        opts.footer_font_size,
        opts.footer_font_color,
        opts.footer_font_bold,
        opts.footer_width,
        '3')
    }

    if (opts.left_columns) {
      if (!opts.left_columns_align) {
        opts.left_columns_align = []
        for (i = 0; i < opts.left_columns.length; i++) {
          opts.left_columns_align.push('l')
        }
      }
    }

    if (opts.right_columns) {
      if (!opts.right_columns_align) {
        opts.right_columns_align = []
        for (i = 0; i < opts.right_columns.length; i++) {
          opts.right_columns_align.push('l')
        }
      }
    }

    var graph_left_cols = []

    opts.left_columns_axis = []
    opts.left_columns_scales = []
    opts.left_columns_mouseTargets = []
    if (opts.left_columns) {
      for (i = 0; i < opts.left_columns.length; i++) {
        graph_left_cols.push(
          !opts.left_columns ? null : insert_columns(
            el.select('svg.graph_leftCols' + i),
            leftColsBounds[i],
            opts.left_columns[i],
            opts.left_columns_font_family,
            opts.left_columns_font_size,
            opts.left_columns_font_color,
            opts.left_columns_align[i],
            true,
            i))
      }

      if (opts.left_columns_subtitles) {
        if (!opts.xaxis_hidden && opts.xaxis_location === 'top') {
          var this_el = el.select('svg.xaxis')
          var this_bounds = xaxisBounds
          console.log(`xaxis top inserting left subtitles. bounds : ${this_bounds}`)

          var x_offset = 0
          if (!opts.yaxis_hidden && opts.yaxis_location === 'left') {
            var yaxis_width = opts.col_element_map['yaxis']
            var ytitle_width = opts.col_element_map['ytitle'] || 0
            x_offset = yaxis_width + ytitle_width
          }

          insert_column_subtitle(this_el,
            x_offset,
            this_bounds.height,
            opts.left_columns_subtitles,
            opts.left_columns_subtitles_font_family,
            opts.left_columns_subtitles_font_size,
            opts.left_columns_subtitles_font_color,
            opts.left_columns_width,
            true)
        } else {
          this_el = el.select('svg.graph_topaxis_el')
          this_bounds = topAxisElBounds
          console.log(`xaxis !top inserting left subtitles. bounds : ${this_bounds}`)

          x_offset = 0
          if (!opts.yaxis_hidden && opts.yaxis_location === 'left') {
            yaxis_width = opts.col_element_map['yaxis']
            ytitle_width = opts.col_element_map['ytitle'] || 0
            x_offset = yaxis_width + ytitle_width
          }

          insert_column_subtitle(this_el,
            x_offset,
            this_bounds.height,
            opts.left_columns_subtitles,
            opts.left_columns_subtitles_font_family,
            opts.left_columns_subtitles_font_size,
            opts.left_columns_subtitles_font_color,
            opts.left_columns_width,
            true)
        }

        if (opts.left_columns_title) {
          if (!opts.xaxis_hidden && opts.xaxis_location === 'top' && opts.xaxis_title) {
            insert_column_title(
              el.select('svg.xtitle'),
              xtitleBounds,
              opts.left_columns_title,
              opts.left_columns_title_bold,
              opts.left_columns_title_font_family,
              opts.left_columns_title_font_size,
              opts.left_columns_title_font_color,
              opts.left_columns_total_width,
              true)
          } else {
            insert_column_title(
              el.select('svg.graph_topaxis_title_el'),
              topAxisTitleElBounds,
              opts.left_columns_title,
              opts.left_columns_title_bold,
              opts.left_columns_title_font_family,
              opts.left_columns_title_font_size,
              opts.left_columns_title_font_color,
              opts.left_columns_total_width,
              true)
          }
        }
      }
    }

    var graph_right_cols = []
    opts.right_columns_axis = []
    opts.right_columns_scales = []
    opts.right_columns_mouseTargets = []
    if (opts.right_columns) {
      for (i = 0; i < opts.right_columns.length; i++) {
        graph_right_cols.push(
          !opts.right_columns ? null : insert_columns(
            el.select('svg.graph_rightCols' + i),
            rightColsBounds[i],
            opts.right_columns[i],
            opts.right_columns_font_family,
            opts.right_columns_font_size,
            opts.right_columns_font_color,
            opts.right_columns_align[i],
            false,
            i))
      }

      if (opts.right_columns_subtitles) {
        if (!opts.xaxis_hidden && opts.xaxis_location === 'top') {
          insert_column_subtitle(
            el.select('svg.xaxis'),
            0,
            xaxisBounds.height,
            opts.right_columns_subtitles,
            opts.right_columns_subtitles_font_family,
            opts.right_columns_subtitles_font_size,
            opts.right_columns_subtitles_font_color,
            opts.right_columns_width,
            false)
        } else {
          insert_column_subtitle(
            el.select('svg.graph_topaxis_el'),
            0,
            topAxisElBounds.height,
            opts.right_columns_subtitles,
            opts.right_columns_subtitles_font_family,
            opts.right_columns_subtitles_font_size,
            opts.right_columns_subtitles_font_color,
            opts.right_columns_width,
            false)
        }

        if (opts.right_columns_title) {
          if (!opts.xaxis_hidden && opts.xaxis_location === 'top' && opts.xaxis_title) {
            insert_column_title(
              el.select('svg.xtitle'),
              xtitleBounds,
              opts.right_columns_title,
              opts.right_columns_title_bold,
              opts.right_columns_title_font_family,
              opts.right_columns_title_font_size,
              opts.right_columns_title_font_color,
              opts.right_columns_total_width,
              false)
          } else {
            insert_column_title(
              el.select('svg.graph_topaxis_title_el'),
              topAxisTitleElBounds,
              opts.right_columns_title,
              opts.right_columns_title_bold,
              opts.right_columns_title_font_family,
              opts.right_columns_title_font_size,
              opts.right_columns_title_font_color,
              opts.right_columns_total_width,
              false)
          }
        }
      }
    }

    if (opts.left_columns || opts.right_columns) {
      controller.on('highlight.axis-y', function (hl) {
        var selected = hl['y']
        if (opts.left_columns) {
          for (var j = 0; j < opts.left_columns.length; j++) {
            d3.selectAll('.coltickLeft' + j)
              .style('opacity', function (dd, ii) {
                if (typeof (selected) !== 'number') {
                  return 1
                }
                var el_id = d3.select(this).attr('id')
                el_id = parseInt(el_id.substr(1))
                if (selected === el_id) {
                  return 1
                } else {
                  return 0.4
                }
              })
          }
        }
        if (opts.right_columns) {
          for (let j = 0; j < opts.right_columns.length; j++) {
            d3.selectAll('.coltickRight' + j)
              .style('opacity', function (dd, ii) {
                if (typeof (selected) !== 'number') {
                  return 1
                }
                var el_id = d3.select(this).attr('id')
                el_id = parseInt(el_id.substr(1))
                if (selected === el_id) {
                  return 1
                } else {
                  return 0.4
                }
              })
          }
        }
      })

      controller.on('transform.axis-y', function (_) {
        var dim = 1
        if (opts.left_columns) {
          for (var j = 0; j < opts.left_columns.length; j++) {
            var rb = [_.translate[dim], leftColsBounds[j].height * _.scale[dim] + _.translate[dim]]
            opts.left_columns_scales[j].rangeBands(rb)

            var tAxisNodes = d3.select('.axisNodesLeft' + j)
              .transition('1')
              .duration(opts.anim_duration)
              .ease('linear')

            tAxisNodes.call(opts.left_columns_axis[j])

            d3.select('.axisNodesLeft' + j).selectAll('text')
              .style('text-anchor', function () {
                if (opts.left_columns_align[j] === 'l') {
                  return 'start'
                } else if (opts.left_columns_align[j] === 'c') {
                  return 'middle'
                } else if (opts.left_columns_align[j] === 'r') {
                  return 'end'
                }
              })

            tAxisNodes.selectAll('g')
              .style('opacity', function (d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1
                } else {
                  return 0
                }
              })

            tAxisNodes.selectAll('text')
              .style('text-anchor', function () {
                if (opts.left_columns_align[j] === 'l') {
                  return 'start'
                } else if (opts.left_columns_align[j] === 'c') {
                  return 'middle'
                } else if (opts.left_columns_align[j] === 'r') {
                  return 'end'
                }
              })

            // TODO address lint
            function layoutMouseTargetsLocal (selection) { // eslint-disable-line no-inner-declarations
              var _h = opts.left_columns_scales[j].rangeBand()
              var _w = opts.left_columns_width[j]
              selection
                .attr('transform', function (d, i) {
                  var x = 0
                  var y = opts.left_columns_scales[j](i)
                  return 'translate(' + x + ',' + y + ')'
                })
                .selectAll('rect')
                .attr('height', _h)
                .attr('width', _w)
            }

            opts.left_columns_mouseTargets[j].transition().duration(opts.anim_duration).ease('linear')
              .call(layoutMouseTargetsLocal)
              .style('opacity', function (d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1
                } else {
                  return 0
                }
              })
          }
        }

        if (opts.right_columns) {
          for (let j = 0; j < opts.right_columns.length; j++) {
            rb = [_.translate[dim], rightColsBounds[j].height * _.scale[dim] + _.translate[dim]]
            opts.right_columns_scales[j].rangeBands(rb)

            tAxisNodes = d3.select('.axisNodesRight' + j)
              .transition()
              .duration(opts.anim_duration)
              .ease('linear')

            tAxisNodes.call(opts.right_columns_axis[j])

            d3.select('.axisNodesRight' + j).selectAll('text')
              .style('text-anchor', function () {
                if (opts.right_columns_align[j] === 'l') {
                  return 'start'
                } else if (opts.right_columns_align[j] === 'c') {
                  return 'middle'
                } else if (opts.right_columns_align[j] === 'r') {
                  return 'end'
                }
              })

            tAxisNodes.selectAll('g')
              .style('opacity', function (d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1
                } else {
                  return 0
                }
              })

            tAxisNodes.selectAll('text')
              .style('text-anchor', function () {
                if (opts.right_columns_align[j] === 'l') {
                  return 'start'
                } else if (opts.right_columns_align[j] === 'c') {
                  return 'middle'
                } else if (opts.right_columns_align[j] === 'r') {
                  return 'end'
                }
              })

            // TODO address lint
            function layoutMouseTargetsLocal (selection) { // eslint-disable-line no-inner-declarations
              var _h = opts.right_columns_scales[j].rangeBand()
              var _w = opts.right_columns_width[j]
              selection
                .attr('transform', function (d, i) {
                  var x = 0
                  var y = opts.right_columns_scales[j](i)
                  return 'translate(' + x + ',' + y + ')'
                })
                .selectAll('rect')
                .attr('height', _h)
                .attr('width', _w)
            }

            opts.right_columns_mouseTargets[j].transition().duration(opts.anim_duration).ease('linear')
              .call(layoutMouseTargetsLocal)
              .style('opacity', function (d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1
                } else {
                  return 0
                }
              })
          }
        }
      })
    }

    function insert_columns (svg, bounds, data, fontFamily, fontSize, fontColor, align, left_or_right, index) {
      // bounds is an array of columns, data is an array of data columns

      // WHAT THE HELL TODO fix this and see what breaks
      var svg = svg.append('g') // eslint-disable-line no-redeclare
      var thisColData = data
      var thisBounds = bounds
      // set axis options
      var scale = d3.scale.ordinal()
        .domain(d3.range(0, thisColData.length))
        .rangeBands([0, thisBounds.height])

      var axis = d3.svg.axis()
        .scale(scale)
        .orient('left')
        .outerTickSize(0)
        .innerTickSize(0)
        .tickPadding(0)
        .tickFormat(function (d, i) { return thisColData[i] })// hack for repeated values

      var lr = 'Left'
      if (left_or_right) {
        opts.left_columns_axis.push(axis)
        opts.left_columns_scales.push(scale)
      } else {
        opts.right_columns_axis.push(axis)
        opts.right_columns_scales.push(scale)
        lr = 'Right'
      }

      // Create the actual axis
      var axisNodes = svg.append('g')
        .attr('class', 'axisNodes' + lr + index)
        .attr('transform', function () {
          if (align === 'l') {
            return 'translate(0,0)'
          } else if (align === 'c') {
            return 'translate(' + thisBounds.width / 2 + ',0)'
          } else if (align === 'r') {
            return 'translate(' + (thisBounds.width - opts.axis_padding) + ',0)'
          }
        })
        .call(axis)

      axisNodes.selectAll('text')
        .attr('class', 'coltick' + lr + index)
        .attr('id', function (d, i) {
          return 'c' + i
        })
        .style('opacity', 1)
        .style('font-size', fontSize)
        .style('fill', fontColor)
        .style('font-family', fontFamily)

      var mouseTargets = svg.append('g')
        .selectAll('g').data(thisColData)

      mouseTargets
        .enter()
        .append('g').append('rect')
        .style('cursor', 'pointer')
        .attr('transform', '')
        .attr('fill', 'transparent')
        .on('click', function (d, i) {
          var dim = 'y'
          var hl = controller.highlight() || {x: null, y: null}
          if (hl[dim] === i) {
            // If clicked already-highlighted row/col, then unhighlight
            hl[dim] = null
            controller.highlight(hl)
          } else {
            hl[dim] = i
            controller.highlight(hl)
          }
          d3.event.stopPropagation()
        })

      if (left_or_right) {
        opts.left_columns_mouseTargets.push(mouseTargets)
      } else {
        opts.right_columns_mouseTargets.push(mouseTargets)
      }

      function layoutMouseTargets (selection) {
        var _h = scale.rangeBand()
        var _w = bounds.width
        selection
          .attr('transform', function (d, i) {
            var x = 0
            var y = scale(i)
            return 'translate(' + x + ',' + y + ')'
          })
          .selectAll('rect')
          .attr('height', _h)
          .attr('width', _w)
      }

      layoutMouseTargets(mouseTargets)

      axisNodes.selectAll('text')
        .style('text-anchor', 'start')

      if (align === 'c') {
        axisNodes.selectAll('text')
          .style('text-anchor', 'middle')
      } else if (align === 'r') {
        axisNodes.selectAll('text')
          .style('text-anchor', 'end')
      }
    }

    function insert_column_subtitle (svg, x_offset, container_height, subtitle, fontFam, fontSize, fontCol, colWidth, left_or_right) {
      var this_sub = []
      var this_colw = []
      for (var j = 0; j < subtitle.length; j++) {
        this_sub.push(subtitle[j])
        this_colw.push(colWidth[j])
      }
      if (left_or_right) {
        this_sub = this_sub.reverse()
        this_colw = this_colw.reverse()
      }
      var text_el = svg.append('g').selectAll('text').data(this_sub).enter()

      text_el.append('g')
        .attr('transform', function (d, i) {
          var accumu_x = x_offset
          for (var kk = 0; kk < i; kk++) {
            accumu_x = accumu_x + this_colw[kk]
          }
          if (!left_or_right) {
            accumu_x = accumu_x + rightColsBounds[0].left
          }
          console.log(`for subtitle(${i})` + 'translate(' + (accumu_x + this_colw[i] / 2 - fontSize / 2) + ',' + (container_height - opts.axis_padding) + ')')
          return 'translate(' + (accumu_x + this_colw[i] / 2 - fontSize / 2) + ',' + (container_height - opts.axis_padding) + ')'
        })
        .append('text')
        .attr('transform', function () {
          return 'rotate(-45),translate(' + opts.axis_padding + ',' + 0 + ')'
        })
        .attr('x', 0)
        .attr('y', -opts.axis_padding)
        .text(function (d) { return d })
        .style('text-anchor', function () {
          return 'start'
        })
        .style('font-family', fontFam)
        .style('font-size', fontSize)
        .style('fill', fontCol)
    }

    function insert_column_title (svg, bounds, title, titleBold, fontFam, fontSize, fontCol, colWidth, left_or_right) {
      // WHAT THE HELL TODO fix this and see what breaks
      var svg = svg.append('g') // eslint-disable-line no-redeclare
      svg.append('g')
        .attr('transform', function () {
          return 'translate(0,' + fontSize + ')'
        })
        .append('text')
        .attr('transform', function () {
          return 'translate(0,0)'
        })
        .attr('x', function () {
          if (left_or_right) {
            return opts.left_columns_total_width / 2
          } else {
            return opts.left_columns_total_width + colormapBounds.width + opts.right_columns_total_width / 2
          }
        })
        .attr('y', function () {
          return 0
        })
        .attr('dy', 0)
        .text(title)
        .style('text-anchor', function () {
          return 'middle'
        })
        .attr('font-weight', titleBold ? 'bold' : 'normal')
        .style('font-family', fontFam)
        .style('font-size', fontSize)
        .style('fill', fontCol)
        .call(wrap_new, colWidth)
    }

    // TODO extract these : colormap, legend, title_footer, axis_title, axisLabels

    function legend (svg, colors, range, bounds) {
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

      /*    var tickCount, tickVals, step;
          if (!opts.x_is_factor) {
            tickCount = 10;
            step = (opts.legend_range[1]-opts.legend_range[0])/tickCount;
            tickVals = d3.range(opts.legend_range[0], opts.legend_range[1]+step, step);
          }
      */
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

    function title_footer (svg, bounds, texts, fontFam, fontSize, fontColor, fontWeight, wrapwidth, t_st_f) {
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

    function axis_title (svg, data, rotated, width, height) {
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

    function axisLabels (svg, data, rotated, width, height, padding, axis_location) {
      svg = svg.append('g')

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

      var xboundsleft = 0
      if (opts.left_columns && opts.xaxis_location === 'top') {
        xboundsleft = opts.left_columns_total_width - padding

        if (!opts.yaxis_hidden && opts.yaxis_location === 'left') {
          var yaxis_width = opts.col_element_map['yaxis']
          var ytitle_width = opts.col_element_map['ytitle'] || 0
          xboundsleft += yaxis_width + ytitle_width
        }
      }

      // Create the actual axis
      var axisNodes = svg.append('g')
        .attr('transform', function () {
          if (rotated) {
            if (axis_location === 'bottom') {
              return 'translate(' + (xboundsleft + xaxisBounds.left) + ',' + padding + ')'
            } else if (axis_location === 'top') {
              return 'translate(' + (xboundsleft + xaxisBounds.left) + ',' + (xaxisBounds.height - padding) + ')'
            }
          } else {
            if (axis_location === 'right') {
              return 'translate(' + padding + ',0)'
            } else if (axis_location === 'left') {
              return 'translate(' + (yaxisBounds.width - padding) + ',0)'
            }
          }
        })
        .call(axis)

      var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size'] + 'px'
      // var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size']
      //    || Math.min(18, Math.max(9, scale.rangeBand() - (rotated ? 11: 8))) + "px";
      axisNodes.selectAll('text')
        .style('font-size', fontSize)
        .style('fill', rotated ? opts.xaxis_font_color : opts.yaxis_font_color)
        .style('font-family', rotated ? opts.xaxis_font_family : opts.yaxis_font_family)

      var mouseTargets = svg.append('g')
        .selectAll('g').data(leaves)
      mouseTargets
        .enter()
        .append('g').append('rect')
        .attr('transform', rotated ? (axis_location === 'bottom' ? 'rotate(45),translate(0,0)' : 'rotate(-45),translate(0,0)') : '')
        .attr('fill', 'transparent')
        .on('click', function (d, i) {
          var dim = rotated ? 'x' : 'y'
          var hl = controller.highlight() || {x: null, y: null}
          // TODO address eqeqeq after verifying
          if (hl[dim] == i) { // eslint-disable-line eqeqeq
            // If clicked already-highlighted row/col, then unhighlight
            hl[dim] = null
            controller.highlight(hl)
          } else {
            hl[dim] = i
            controller.highlight(hl)
          }
          d3.event.stopPropagation()
        })

      function layoutMouseTargets (selection) {
        var _h = scale.rangeBand() / (rotated ? 1.414 : 1)
        var _w = rotated ? height * 1.414 * 1.2 : width
        selection
          .attr('transform', function (d, i) {
            var x = rotated ? (axis_location === 'bottom' ? scale(i) + scale.rangeBand() / 2 + xaxisBounds.left + xboundsleft : scale(i) + xaxisBounds.left + xboundsleft) : 0
            var y = rotated ? (axis_location === 'bottom' ? padding + 6 : height - _h / 1.414 - padding - 6) : scale(i)
            return 'translate(' + x + ',' + y + ')'
          })
          .selectAll('rect')
          .attr('height', _h)
          .attr('width', _w)
      }

      layoutMouseTargets(mouseTargets)
      // workout what this mouseTarget is

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

      controller.on('highlight.axis-' + (rotated ? 'x' : 'y'), function (hl) {
        var ticks = axisNodes.selectAll('.tick')
        var selected = hl[rotated ? 'x' : 'y']
        if (typeof (selected) !== 'number') {
          ticks.style('opacity', function (d, i) {
            if (rotated) {
              var ttt = d3.transform(d3.select(this).attr('transform'))
              if (ttt.translate[0] < 0 || ttt.translate[0] > width) {
                return 0
              } else {
                return 1
              }
            }
          })
          return
        }
        ticks.style('opacity', function (d, i) {
          if (i !== selected) {
            return 0.4
          } else {
            return 1
          }
        })
        ticks.each(function (d, i) {
          if (rotated) {
            var ttt = d3.transform(d3.select(this).attr('transform'))
            if (ttt.translate[0] < 0 || ttt.translate[0] > width) {
              d3.select(this).style('opacity', 0)
            }
          }
        })
      })

      controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function (_) {
        var dim = rotated ? 0 : 1
        // scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
        var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]]
        scale.rangeBands(rb)
        var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear')
        tAxisNodes.call(axis)
        // Set text-anchor on the non-transitioned node to prevent jumpiness
        // in RStudio Viewer pane
        // if (opts.table_style) {
        //   axisNodes.selectAll("text").style("text-anchor", "start");
        // } else {
        axisNodes.selectAll('text').style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
        // }

        tAxisNodes.selectAll('g')
          .style('opacity', function (d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1
            } else {
              return 0
            }
          })
        // if (opts.table_style) {
        //   tAxisNodes.selectAll("text")
        //     .style("text-anchor", "start");

        // } else {
        tAxisNodes.selectAll('text')
          .style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
        // }

        mouseTargets.transition().duration(opts.anim_duration).ease('linear')
          .call(layoutMouseTargets)
          .style('opacity', function (d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1
            } else {
              return 0
            }
          })
      })
    }

    var dispatcher = d3.dispatch('hover', 'click')
    this.dispatcher = dispatcher

    controller.on('datapoint_hover', function (_) {
      dispatcher.hover({data: _})
    })

    // TODO audit if these are ever used once we have interaction regression in place
    function on_col_label_mouseenter (e) { // eslint-disable-line no-unused-vars
      controller.highlight(+d3.select(this).attr('index'), null)
    }

    function on_col_label_mouseleave (e) { // eslint-disable-line no-unused-vars
      controller.highlight(null, null)
    }

    function on_row_label_mouseenter (e) { // eslint-disable-line no-unused-vars
      controller.highlight(null, +d3.select(this).attr('index'))
    }

    function on_row_label_mouseleave (e) { // eslint-disable-line no-unused-vars
      controller.highlight(null, null)
    }

    el.attr(`rhtmlHeatmap-status`, 'ready')
  }

  on (type, listener) {
    this.dispatcher.on(type, listener)
    return this
  }
}

function wrap_new (text, width) {
  var separators = {'-': 1, ' ': 1}
  var lineNumbers = []
  text.each(function () {
    var text = d3.select(this)
    var chars = text.text().split('').reverse()
    var nextchar
    var sep
    var newline = []
    var lineTemp = []
    var lineNumber = 0
    var lineHeight = 1.1 // ems
    var x = text.attr('x')
    var y = text.attr('y')
    var dy = parseFloat(text.attr('dy'))
    var tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em')
    var c
    while (c = chars.pop()) { // eslint-disable-line no-cond-assign
      // remove leading space
      if (lineTemp.length === 0 && c === ' ') {
        continue
      }
      lineTemp.push(c)
      tspan.text(lineTemp.join(''))
      if (tspan.node().getComputedTextLength() > width) {
        // if no separator detected before c, wait until there is one
        // otherwise, wrap texts
        if (sep === undefined) {
          if (c in separators) {
            if (c === ' ') {
              lineTemp.pop()
            }
            // make new line
            sep = undefined
            tspan.text(lineTemp.join(''))
            tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text('')
            lineTemp = []
            newline = []
          }
        } else {
          // pop out chars until reaching sep
          if (c in separators) {
            newline.push(lineTemp.pop())
          }
          nextchar = lineTemp.pop()
          while (nextchar !== sep && lineTemp.length > 0) {
            newline.push(nextchar)
            nextchar = lineTemp.pop()
          }
          newline.reverse()
          while (nextchar = newline.pop()) { // eslint-disable-line no-cond-assign
            chars.push(nextchar)
          }

          if (sep !== ' ') {
            lineTemp.push(sep)
          }
          // make new line
          sep = undefined
          tspan.text(lineTemp.join(''))
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text('')
          lineTemp = []
          newline = []
        }
      } else {
        if (c in separators) {
          sep = c
        }
      }
    }
    lineNumbers.push(lineNumber + 1)
  })
}

module.exports = Heatmap
