const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')

const {
  getExampleUrl,
  waitForWidgetToLoad,
} = renderExamplePageTestHelper

const HeatmapPlotPage = require('./heatmapPlotPage')

// TODO the 'data.bdd.three_point_brand' default is questionable but serves this suite ...
const loadWidget = async ({
  browser,
  configName = 'data.minimal_3x3.data_standalone',
  stateName,
  width = 1000,
  rerenderControls,
  height = 600,
}) => {
  const page = await browser.newPage()
  const url = getExampleUrl({ configName, stateName, rerenderControls, width, height })
  const heatmapPlot = new HeatmapPlotPage(page)

  await page.goto(url)
  await waitForWidgetToLoad({ page })

  return { page, heatmapPlot }
}

module.exports = loadWidget
