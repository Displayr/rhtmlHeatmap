const _ = require('lodash')
const d3 = require('d3')
const heatmapOuter = require('./heatmapOuter')
const { unloadedFamilies } = require('./lib/fonts')

module.exports = function (element) {
  const instance = {
    lastValue: null,
    fontListener: null,
  }

  // Need dedicated helper function that can be called by both renderValue
  // and resize. resize can't call this.renderValue because that will be
  // routed to the Shiny wrapper method from htmlwidgets, which expects the
  // wrapper data object, not x.
  function doRenderValue (config) {
    instance.lastValue = config
    element.innerHTML = ''
    d3.select(document.body).select('.rhtmlHeatmap-tip').remove()

    heatmapOuter(element, config)
    redrawWhenPendingFontsArrive(config)
  }

  // The chart lays out by measuring text, so one drawn before its font arrived is measured for the
  // wrong font. Waiting is bounded, and on screen nothing else would correct it until a resize, so
  // redraw as soon as the font the chart is missing turns up
  function redrawWhenPendingFontsArrive (config) {
    const fontSet = (typeof document === 'undefined') ? null : document.fonts
    if (!fontSet || !_.isFunction(fontSet.addEventListener)) {
      return
    }

    stopWaitingForFonts(fontSet)

    if (_.isEmpty(unloadedFamilies(config.options))) {
      return
    }

    instance.fontListener = () => {
      // Only this render's own config matters: a resize in the meantime has already redrawn
      if (config !== instance.lastValue || !_.isEmpty(unloadedFamilies(config.options))) {
        return
      }
      stopWaitingForFonts(fontSet)
      doRenderValue(config)
    }

    fontSet.addEventListener('loadingdone', instance.fontListener)
  }

  function stopWaitingForFonts (fontSet) {
    if (instance.fontListener) {
      fontSet.removeEventListener('loadingdone', instance.fontListener)
      instance.fontListener = null
    }
  }

  return {
    renderValue (incomingConfig) {
      doRenderValue(incomingConfig)
    },

    resize () {
      if (instance.lastValue) {
        doRenderValue(instance.lastValue)
      }
    },
  }
}
