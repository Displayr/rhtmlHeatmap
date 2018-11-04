import d3 from 'd3'
const heatmapOuter = require('./heatmapOuter')

module.exports = function (element) {
  const instance = {
    lastTheme: null,
    lastValue: null
  }

  // Need dedicated helper function that can be called by both renderValue
  // and resize. resize can't call this.renderValue because that will be
  // routed to the Shiny wrapper method from htmlwidgets, which expects the
  // wrapper data object, not x.
  function doRenderValue (config) {
    instance.lastValue = config

    if (instance.lastTheme && instance.lastTheme !== config.theme) {
      d3.select(document.body).classed('theme-' + instance.lastTheme, false)
    }
    if (config.theme) {
      d3.select(document.body).classed('theme-' + config.theme, true)
    }

    element.innerHTML = ''
    d3.select(document.body).select('.rhtmlHeatmap-tip').remove()

    heatmapOuter(element, config)
  }

  return {
    renderValue (incomingConfig) {
      doRenderValue(incomingConfig)
    },

    resize () {
      if (instance.lastValue) {
        doRenderValue(instance.lastValue)
      }
    }
  }
}
