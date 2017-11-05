/* global HTMLWidgets */

import 'babel-polyfill'
import widgetFactory from './rhtmlHeatmap.factory'

HTMLWidgets.widget({
  name: 'rhtmlHeatmap',
  type: 'output',
  factory: widgetFactory
})
