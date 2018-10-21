import d3 from 'd3'
import GridSizer from './gridSizer'
import Controller from './controller'
import buildConfig from './buildConfig'
import dendrogram from './dendrogram'
import colormap from './colormap'
import columns from './columns'
import legend from './legend'
import title_footer from './title_footer'
import axis from './axis'
import wrap_new from './wrap_new'

class Heatmap {
  constructor (selector, data, options) {
    var el = d3.select(selector)
    el.attr(`rhtmlHeatmap-status`, 'loading')

    var bbox = el.node().getBoundingClientRect()

    var controller = new Controller()

    // Set option defaults & copy settings
    var opts = buildConfig(options, bbox.width, bbox.height)

    var inner = el.append('div').classed('inner', true)
    this.inner = inner
    inner.append('div').classed('info', true) // TODO nothing is added to info

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

      opts.xaxis_len = axis.label_length(
        this.inner,
        opts.xlabs_mod,
        true,
        opts.xaxis_font_size,
        opts.xaxis_font_family,
        opts)
      opts.row_element_map['xaxis'] = opts.xaxis_len
    }

    if (data.cols) {
      opts.row_element_names.unshift('col_dendro')
    }

    if (opts.footer) {
      opts.row_element_names.push('footer')
      opts.row_element_map['footer'] =
        title_footer.compute_height(
          inner,
          opts.footer,
          opts.footer_font_family,
          opts.footer_font_size,
          opts.footer_font_color,
          opts.footer_width,
          opts.footer_font_bold) + opts.footer_margin_Y * 2
    }

    if (opts.legend_colors) {
      const legend_text_lengths = legend.compute_lengths(this.inner, opts)
      opts.legend_total_width = opts.legend_left_space + opts.legend_bar_width + opts.legend_x_padding * 2 + d3.max(legend_text_lengths)
    }

    // columns to the left of the main plot data
    opts.larger_columns_subtitles_font_size = opts.left_columns_subtitles_font_size > opts.right_columns_subtitles_font_size ? opts.left_columns_subtitles_font_size : opts.right_columns_subtitles_font_size
    opts.larger_columns_title_font_size = opts.left_columns_title_font_size > opts.right_columns_title_font_size ? opts.left_columns_title_font_size : opts.right_columns_title_font_size
    opts.left_columns_total_width = 0

    if (opts.left_columns) {
      opts.left_columns_width = []
      for (i = 0; i < opts.left_columns.length; i++) {
        opts.col_element_names.unshift('left_col' + i)
      }

      let left_cols_widths = columns.compute_lengths(this.inner, opts.left_columns, opts)

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
      opts.right_columns_width = []
      for (i = 0; i < opts.right_columns.length; i++) {
        opts.col_element_names.push('right_col' + i)
      }

      let right_cols_widths = columns.compute_lengths(this.inner, opts.right_columns, opts)

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
      opts.left_sub_len = axis.label_length(
        this.inner,
        opts.left_columns_subtitles,
        true,
        opts.left_columns_subtitles_font_size,
        opts.left_columns_subtitles_font_family,
        opts
      )
    }

    if (opts.right_columns_subtitles) {
      // compute text width of right column subtitles
      opts.right_sub_len = axis.label_length(
        this.inner,
        opts.right_columns_subtitles,
        true,
        opts.right_columns_subtitles_font_size,
        opts.right_columns_subtitles_font_family,
        opts)
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
        title_footer.compute_height(
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
        title_footer.compute_height(
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

      opts.col_element_map['yaxis'] = axis.label_length(
        this.inner,
        opts.ylabs_mod,
        false,
        opts.yaxis_font_size,
        opts.yaxis_font_family,
        opts)

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
        title_footer.compute_height(
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
        title_footer.compute_height(
          inner,
          opts.title,
          opts.title_font_family,
          opts.title_font_size,
          opts.title_font_color,
          opts.title_width,
          opts.title_font_bold) + opts.title_margin_top + opts.title_margin_bottom
    }

    var row_heights = []
    var col_widths = []
    i = 0
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
        title_footer.compute_height(
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
    if (!opts.xaxis_hidden) { axis.labels(el.select('svg.xaxis'), opts.xlabs_mod, true, xaxisBounds.width0, xaxisBounds.height, opts.axis_padding, opts.xaxis_location, opts, controller, xaxisBounds, yaxisBounds) }
    if (!opts.yaxis_hidden) { axis.labels(el.select('svg.yaxis'), opts.ylabs_mod, false, yaxisBounds.width, yaxisBounds.height, opts.axis_padding, opts.yaxis_location, opts, controller, xaxisBounds, yaxisBounds) }
    if (opts.xaxis_title && !opts.xaxis_hidden) { axis.title(el.select('svg.xtitle'), opts.xaxis_title, false, colormapBounds.width, xtitleBounds.height, opts) }
    if (opts.yaxis_title && !opts.yaxis_hidden) { axis.title(el.select('svg.ytitle'), opts.yaxis_title, true, ytitleBounds.width, colormapBounds.height, opts) }
    if (opts.legend_colors) { legend.draw(el.select('svg.legend'), opts.legend_colors, opts.legend_range, legendBounds, opts) }

    if (opts.title) {
      title_footer.draw(
        el.select('svg.graph_title'),
        titleBounds,
        opts.title,
        opts.title_font_family,
        opts.title_font_size,
        opts.title_font_color,
        opts.title_font_bold,
        opts.title_width,
        '1',
        opts)
    }

    if (opts.subtitle) {
      title_footer.draw(
        el.select('svg.graph_subtitle'),
        subtitleBounds,
        opts.subtitle,
        opts.subtitle_font_family,
        opts.subtitle_font_size,
        opts.subtitle_font_color,
        opts.subtitle_font_bold,
        opts.subtitle_width,
        '2',
        opts)
    }

    if (opts.footer) {
      title_footer.draw(
        el.select('svg.graph_footer'),
        footerBounds,
        opts.footer,
        opts.footer_font_family,
        opts.footer_font_size,
        opts.footer_font_color,
        opts.footer_font_bold,
        opts.footer_width,
        '3',
        opts)
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

module.exports = Heatmap
