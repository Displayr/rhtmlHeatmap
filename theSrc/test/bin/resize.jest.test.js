const puppeteer = require('puppeteer')
const { snapshotTesting: { renderExamplePageTestHelper } } = require('rhtmlBuildUtils')
const loadWidget = require('../lib/loadWidget.helper')

const {
  configureImageSnapshotMatcher,
  puppeteerSettings,
  testSnapshots,
  jestTimeout,
} = renderExamplePageTestHelper

configureImageSnapshotMatcher({ collectionIdentifier: 'resize' })
jest.setTimeout(jestTimeout)

describe('resize', () => {
  let browser

  beforeEach(async () => {
    browser = await puppeteer.launch(puppeteerSettings)
  })

  afterEach(async () => {
    await browser.close()
  })

  test('basic resize', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone',
      width: 300,
      height: 200,
    })

    await testSnapshots({ page, testName: '1A_basic_initial' })

    const sizesToSnapshot = [
      { width: 275, height: 200 },
      { width: 275, height: 200 },
      { width: 250, height: 200 },
      { width: 225, height: 200 },
      { width: 225, height: 200 },
      { width: 400, height: 300 },
      { width: 500, height: 400 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `1B_basic_after_resize_${width}x${height}` })
    }
    await page.close()
  })

  test('resize with wrapped titles, subtitles, and footer', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.minimal_3x3.data_standalone|config.long_title_with_forced_breaks',
      width: 800,
      height: 800,
    })

    await testSnapshots({ page, testName: '2A_with_title_initial' })

    const sizesToSnapshot = [
      { width: 400, height: 600 },
      { width: 250, height: 600 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `2B_with_title_after_resize_${width}x${height}` })
    }
    await page.close()
  })

  test('resize with dendrogram', async function () {
    const { page } = await loadWidget({
      browser,
      configName: 'data.displayr_regression.dendrogram',
      width: 800,
      height: 800,
    })

    await testSnapshots({ page, testName: '3A_with_dendrogram_initial' })

    const sizesToSnapshot = [
      { width: 400, height: 600 },
      { width: 250, height: 600 },
    ]

    for (const size of sizesToSnapshot) {
      const { width, height } = size
      await page.evaluate((width, height) => {
        window.resizeHook(width, height)
      }, width, height)

      await page.waitFor(1000)

      await testSnapshots({ page, testName: `3B_with_dendrogram_after_resize_${width}x${height}` })
    }
    await page.close()
  })
})
