const HeatmapPlot = require('../pageObjects/heatmapPlot')

module.exports = function () {
  this.Before(function () {
    this.context.heatmapPlot = new HeatmapPlot()
  })
}
