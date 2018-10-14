import _ from 'lodash'

const defaultConfig = {
  anim_duration: 500,
  axis_padding: 6,
  brush_color: '#0000FF',
  cell_font_size: 15,
  col_element_map: { '*': '*' },
  col_element_names: ['*'],
  extra_tooltip_info: null,
  footer_margin_X: 10,
  footer_margin_Y: 5,
  left_columns: null,
  left_columns_font_size: 15,
  legend_colors: null,
  legend_digits: null,
  legend_font_size: 15,
  legend_format: null,
  legend_left_space: 26,
  legend_range: null,
  legend_text_len: [],
  legend_width: null,
  legend_x_padding: 4,
  link_color: '#AAA',
  right_columns: null,
  row_element_map: { '*': '*' },
  row_element_names: ['*'],
  show_grid: true,
  shownote_in_cell: null,
  subtitle_margin_bottom: 10,
  subtitle_margin_X: 10,
  tip_font_family: 'sans-serif',
  tip_font_size: 11,
  title_margin_top: 5,
  title_margin_X: 10,
  x_is_factor: null,
  xaxis_font_size: 15,
  xaxis_hidden: false,
  xaxis_location: null,
  xaxis_offset: 20,
  xaxis_title: null,
  xaxis_title_font_size: 15,
  xlabs_mod: [],
  xlabs_raw: [],
  yaxis_font_size: 15,
  yaxis_hidden: false,
  yaxis_location: null,
  yaxis_offset: 20,
  yaxis_title: null,
  yaxis_title_font_size: 15,
  ylabs_mod: [],
  ylabs_raw: []
}

function buildConfig (userConfig, width, height) {
  const config = _.merge({}, defaultConfig, userConfig, { width, height })
  config.legend_bar_width = (config.legend_width - config.legend_x_padding * 2) / 2

  config.title_margin_bottom = config.subtitle ? 5 : 10
  config.title_width = config.width - config.title_margin_X * 2

  config.subtitle_margin_top = config.title ? 0 : 5
  config.subtitle_width = config.width - config.subtitle_margin_X * 2

  config.footer_width = config.width - config.footer_margin_X * 2

  config.table_style = !!((config.left_columns || config.right_columns))

  if (!config.left_columns_subtitles) {
    // NB this seems really odd
    config.left_columns_title = undefined
  }

  if (!config.right_columns_subtitles) {
    // NB this seems really odd
    config.right_columns_title = undefined
  }

  return config
}

module.exports = buildConfig
