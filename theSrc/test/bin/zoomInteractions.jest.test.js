const puppeteer = require('puppeteer')
const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')
const loadWidget = require('../lib/loadWidget.helper')

const {
  configureImageSnapshotMatcher,
  puppeteerSettings,
  testSnapshots,
  jestTimeout,
} = renderExamplePageTestHelper

configureImageSnapshotMatcher({ collectionIdentifier: 'zoom_interaction' })
jest.setTimeout(jestTimeout)

describe('zoom_interaction', () => {
  let browser

  beforeEach(async () => {
    browser = await puppeteer.launch(puppeteerSettings)
  })

  afterEach(async () => {
    await browser.close()
  })

  test('user can zoom in and out', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone|data.minimal_3x3.left_columns_two_left_align|data.minimal_3x3.right_columns_two_left_align',
      width: 950,
      height: 650,
    })

    await heatmapPlot.zoom(0, 0, 1, 1)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '1_zoomed_on_0x0_to_1x1' })
    await heatmapPlot.clickCell(0, 0)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '2_zoom_back_out' })

    await heatmapPlot.zoom(1, 1, 2, 2)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '3_zoomed_on_1x1_to_2x2' })
    await heatmapPlot.clickCell(1, 1)
    await page.waitFor(1000)

    await heatmapPlot.zoom(0, 0, 0, 2)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '4_zoomed_on_0x0_to_0x2' })
    await heatmapPlot.clickCell(0, 0)
    await page.waitFor(1000)

    await heatmapPlot.zoom(0, 0, 2, 0)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '5_zoomed_on_0x0_to_2x0' })
    await heatmapPlot.clickCell(0, 0)
    await page.waitFor(1000)

    await page.close()
  })

  test('user can zoom in and out - axis variations', async function () {
    const { page, heatmapPlot } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone|data.minimal_3x3.left_columns_two_left_align|data.minimal_3x3.right_columns_two_left_align|config.xaxis_bottom|config.yaxis_right',
      width: 950,
      height: 650,
    })

    await heatmapPlot.zoom(0, 0, 1, 1)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '6_zoomed_on_0x0_to_1x1' })
    await heatmapPlot.clickCell(0, 0)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '7_zoom_back_out' })

    await heatmapPlot.zoom(1, 1, 2, 2)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '8_zoomed_on_1x1_to_2x2' })
    await heatmapPlot.clickCell(1, 1)
    await page.waitFor(1000)

    await heatmapPlot.zoom(0, 0, 0, 2)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '9_zoomed_on_0x0_to_0x2' })
    await heatmapPlot.clickCell(0, 0)
    await page.waitFor(1000)

    await heatmapPlot.zoom(0, 0, 2, 0)
    await page.waitFor(1000)
    await testSnapshots({ page, testName: '10_zoomed_on_0x0_to_2x0' })
    await heatmapPlot.clickCell(0, 0)
    await page.waitFor(1000)

    await page.close()
  })
})
