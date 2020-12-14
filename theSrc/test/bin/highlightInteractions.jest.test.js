const puppeteer = require('puppeteer')
const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')
const loadWidget = require('../lib/loadWidget.helper')

const {
  configureImageSnapshotMatcher,
  puppeteerSettings,
  testSnapshots,
  jestTimeout,
} = renderExamplePageTestHelper

configureImageSnapshotMatcher({ collectionIdentifier: 'highlight_interaction' })
jest.setTimeout(jestTimeout)

describe('highlight_interaction', () => {
  let browser

  beforeEach(async () => {
    browser = await puppeteer.launch(puppeteerSettings)
  })

  afterEach(async () => {
    await browser.close()
  })

  test('user can highlight a row', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone',
      width: 650,
      height: 650,
    })

    await heatmapPlot.clickRowName(2)
    await testSnapshots({ page, testName: 'highlight_interaction_highlight_row_2' })

    await heatmapPlot.clickRowName(1)
    await testSnapshots({ page, testName: 'highlight_interaction_highlight_row_1' })

    await heatmapPlot.clickRowName(1)
    await testSnapshots({ page, testName: 'highlight_interaction_unhighlight_row' })

    await page.close()
  })

  test('user can highlight a column', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone',
      width: 650,
      height: 650,
    })

    await heatmapPlot.clickColumnName(2)
    await testSnapshots({ page, testName: 'highlight_interaction_highlight_column_2' })

    await heatmapPlot.clickColumnName(1)
    await testSnapshots({ page, testName: 'highlight_interaction_highlight_column_1' })

    await heatmapPlot.clickColumnName(1)
    await testSnapshots({ page, testName: 'highlight_interaction_unhighlight_column' })

    await page.close()
  })

  test('User can highlight a row and a column, and click anywhere to reset', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone|data.minimal_3x3.legend',
      width: 650,
      height: 650,
    })

    await heatmapPlot.clickRowName(1)
    await heatmapPlot.clickColumnName(1)
    await testSnapshots({ page, testName: 'highlight_interaction_highlight_both' })

    await heatmapPlot.clickLegendBar()
    await testSnapshots({ page, testName: 'highlight_interaction_unhighlight_both' })

    await page.close()
  })
})
