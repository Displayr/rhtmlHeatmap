const puppeteer = require('puppeteer')
const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')
const loadWidget = require('../lib/loadWidget.helper')

const {
  configureImageSnapshotMatcher,
  puppeteerSettings,
  testSnapshots,
  jestTimeout,
} = renderExamplePageTestHelper

configureImageSnapshotMatcher({ collectionIdentifier: 'tooltip_interaction' })
jest.setTimeout(jestTimeout)

describe('tooltip_interaction', () => {
  let browser

  beforeEach(async () => {
    browser = await puppeteer.launch(puppeteerSettings)
  })

  afterEach(async () => {
    await browser.close()
  })

  test('user can hover over the cells and see tooltips', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone',
      width: 650,
      height: 650,
    })

    await heatmapPlot.hoverCell(0, 0)
    await page.waitFor(2000)
    await testSnapshots({ page, testName: 'tooltip_interaction_hover_on_cell' })

    await page.close()
  })

  test('tooltip font settings can be customised', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone|config.large_tooltips',
      width: 650,
      height: 650,
    })

    await heatmapPlot.hoverCell(0, 0)
    await page.waitFor(2000)
    await testSnapshots({ page, testName: 'tooltip_interaction_custom_font' })

    await page.close()
  })

  test('extra data can be added to the tooltip', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.displayr_regression.correlation_matrix',
      width: 1000,
      height: 1000,
    })

    await heatmapPlot.hoverCell(5, 0)
    await page.waitFor(2000)
    await testSnapshots({ page, testName: 'tooltip_interaction_extra_info' })

    await page.close()
  })
})
