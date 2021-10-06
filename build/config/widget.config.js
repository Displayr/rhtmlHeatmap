const cliArgs = require('yargs').argv
const _ = require('lodash')

const config = {
  widgetEntryPoint: 'theSrc/scripts/rhtmlHeatmap.js',
  widgetFactory: 'theSrc/scripts/rhtmlHeatmap.factory.js',
  widgetName: 'rhtmlHeatmap',
  rFunction: 'rhtmlHeatmap::Heatmap',
  visualRegressionSuite: {},
  internalWebSettings: {
    includeDimensionsOnWidgetDiv: true,
    default_border: true,
    css: [
      '/styles/heatmapcore.css',
    ],
    isReadySelector: 'svg[rhtmlwidget-status=ready]',
    singleWidgetSnapshotSelector: '#widget-container',
  },
  snapshotTesting: {
    puppeteer: {
      // headless: false, // if set to false, show the browser while testing
      // slowMo: 500, // delay each step in the browser interaction by X milliseconds
    },
    snapshotDelay: 500,
    pixelmatch: {
      // smaller values -> more sensitive : https://github.com/mapbox/pixelmatch#pixelmatchimg1-img2-output-width-height-options
      customDiffConfig: {
        threshold: 0.0001,
      },
      failureThreshold: 0.0001,
      failureThresholdType: 'percent', // pixel or percent
    },
  },
}

const commandLineOverides = _.omit(cliArgs, ['_', '$0'])
const mergedConfig = _.merge(config, commandLineOverides)

module.exports = mergedConfig
