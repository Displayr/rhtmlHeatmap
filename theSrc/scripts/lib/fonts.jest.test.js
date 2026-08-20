const { fontFamiliesInUse, waitForFonts } = require('./fonts.js')

describe('fontFamiliesInUse', () => {
  test('collects every font family option', () => {
    expect(fontFamiliesInUse({
      title_font_family: 'Circular',
      xaxis_font_family: 'Open Sans',
      xaxis_font_size: 15,
      yaxis_hidden: false,
    })).toEqual(['Circular', 'Open Sans'])
  })

  test('deduplicates, trims, and drops values that are not usable font families', () => {
    expect(fontFamiliesInUse({
      title_font_family: 'Circular',
      subtitle_font_family: ' Circular ',
      footer_font_family: '',
      legend_font_family: null,
      cell_font_family: 12,
    })).toEqual(['Circular'])
  })

  test('returns nothing when no font families are configured', () => {
    expect(fontFamiliesInUse({ xaxis_font_size: 15 })).toEqual([])
    expect(fontFamiliesInUse({})).toEqual([])
  })
})

describe('waitForFonts', () => {
  // NB document cannot be replaced wholesale under jsdom, so only the font set is stubbed, and
  // a document is only invented when the test environment provides none
  const documentWasInvented = (typeof document === 'undefined')
  const originalFontSet = documentWasInvented ? undefined : document.fonts

  const withFontSet = (fontSet) => {
    if (documentWasInvented) {
      global.document = {}
    }
    document.fonts = fontSet
  }

  afterEach(() => {
    if (documentWasInvented) {
      delete global.document
    } else {
      document.fonts = originalFontSet
    }
  })

  test('requests each configured family in normal and bold, then waits on the font set', async () => {
    const requested = []
    let readyHasResolved = false
    withFontSet({
      load: (fontSpecification) => { requested.push(fontSpecification); return Promise.resolve([]) },
      ready: Promise.resolve().then(() => { readyHasResolved = true }),
    })

    await waitForFonts({ title_font_family: 'Circular', xaxis_font_family: 'Circular' })

    expect(requested).toEqual(['12px Circular', 'bold 12px Circular'])
    expect(readyHasResolved).toBe(true)
  })

  test('resolves when a font cannot be loaded', async () => {
    withFontSet({
      load: () => Promise.reject(new Error('no such font')),
      ready: Promise.resolve(),
    })

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves when loading a font throws synchronously', async () => {
    withFontSet({
      load: () => { throw new Error('invalid font shorthand') },
      ready: Promise.resolve(),
    })

    await expect(waitForFonts({ title_font_family: '!invalid' })).resolves.toBeUndefined()
  })

  test('resolves without waiting for a font set the browser does not provide', async () => {
    withFontSet(undefined)

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('stops waiting on a font set that never becomes ready', async () => {
    jest.useFakeTimers()
    try {
      withFontSet({ load: () => Promise.resolve([]), ready: new Promise(() => {}) })

      const waiting = waitForFonts({ title_font_family: 'Circular' })
      jest.advanceTimersByTime(3000)

      await expect(waiting).resolves.toBeUndefined()
    } finally {
      jest.useRealTimers()
    }
  })
})
