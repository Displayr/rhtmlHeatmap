import _ from 'lodash'

const defaultConfig = {
  anim_duration: 500,
  axis_padding: 6,
  brush_color: '#0000FF',
  cell_font_size: 15,
  column_label_max_height: 0.25,
  column_label_orientation: 'diagonal', // ['horizontal', 'vertical', 'diagonal'],
  row_label_max_width: 0.25,
  heatmap_max_height: 1,
  heatmap_max_width: 1,
  extra_tooltip_info: null,
  footer_font_color: '#000000',
  footer_font_family: 'sans-serif',
  footer_font_size: 11,
  footer_margin_X: 10,
  footer_margin_Y: 5,
  left_columns: null,
  left_columns_align: [],
  left_columns_subtitles: null,
  left_columns_subtitles_font_color: '#000000',
  left_columns_subtitles_font_family: 'sans-serif',
  left_columns_subtitles_font_size: 15,
  legend_colors: null,
  legend_digits: null,
  legend_font_size: 15,
  legend_label_format: 'normal', // 'normal' || 'percentage',
  legend_left_space: 26,
  legend_range: null,
  legend_width: null,
  legend_x_padding: 4,
  link_color: '#AAA',
  right_columns: null,
  right_columns_align: [],
  right_columns_font_size: 15,
  right_columns_subtitles: null,
  right_columns_subtitles_font_color: '#000000',
  right_columns_subtitles_font_family: 'sans-serif',
  right_columns_subtitles_font_size: 15,
  row_element_map: { '*': '*' },
  row_element_names: ['*'],
  show_grid: true,
  shownote_in_cell: null,
  subtitle_font_color: '#000000',
  subtitle_font_family: 'sans-serif',
  subtitle_font_size: 18,
  subtitle_margin_bottom: 10,
  subtitle_margin_X: 10,
  tip_font_family: 'sans-serif',
  tip_font_size: 11,
  title_font_color: '#000000',
  title_font_family: 'sans-serif',
  title_font_size: 24,
  title_margin_top: 5,
  title_margin_X: 10,
  xaxis_font_color: 'black',
  xaxis_font_family: 'sans-serif',
  xaxis_font_size: 15,
  xaxis_hidden: false,
  xaxis_location: 'top',
  xaxis_offset: 20,
  xaxis_title: null,
  xaxis_title_font_color: '#000000',
  xaxis_title_font_family: 'sans-serif',
  xaxis_title_font_size: 15,
  yaxis_font_color: 'black',
  yaxis_font_family: 'sans-serif',
  yaxis_font_size: 15,
  yaxis_hidden: false,
  yaxis_location: null,
  yaxis_offset: 20,
  yaxis_title: null,
  yaxis_title_font_size: 15
}

function buildConfig (userConfig, width, height) {
  const config = _.merge({}, defaultConfig, userConfig, { width, height })

  // NB some the following adjustments correct issues in the callee (which we cannot control)

  config.legend_bar_width = (config.legend_width - config.legend_x_padding * 2) / 2

  config.title_margin_bottom = config.subtitle ? 5 : 10
  config.title_width = config.width - config.title_margin_X * 2

  config.subtitle_margin_top = config.title ? 0 : 5
  config.subtitle_width = config.width - config.subtitle_margin_X * 2

  config.footer_width = config.width - config.footer_margin_X * 2

  config.table_style = !!((config.left_columns || config.right_columns))

  config.padding = config.axis_padding

  if (!config.left_columns_subtitles) {
    // NB this seems really odd
    config.left_columns_title = undefined
  }

  if (!config.right_columns_subtitles) {
    // NB this seems really odd
    config.right_columns_title = undefined
  }

  if (_.isNull(config.left_columns_align)) { config.left_columns_align = [] }
  if (_.isNull(config.right_columns_align)) { config.right_columns_align = [] }

  return config
}

module.exports = buildConfig
