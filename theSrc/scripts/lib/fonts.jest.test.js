const { fontFamiliesInUse, fontsInUse, waitForFonts } = require('./fonts.js')

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

describe('fontsInUse', () => {
  test('pairs every family with the normal variant', () => {
    expect(fontsInUse({ title_font_family: 'Circular', xaxis_font_family: 'Open Sans' }))
      .toEqual(['12px "Circular"', '12px "Open Sans"'])
  })

  test('adds the bold variant when any bold option is set', () => {
    expect(fontsInUse({ title_font_family: 'Circular', xaxis_title_bold: true }))
      .toEqual(['12px "Circular"', 'bold 12px "Circular"'])
  })

  test('ignores a bold option that is turned off', () => {
    expect(fontsInUse({ title_font_family: 'Circular', xaxis_title_bold: false }))
      .toEqual(['12px "Circular"'])
  })
})

describe('waitForFonts', () => {
  // document cannot be replaced wholesale under jsdom, so only the font set is stubbed, and
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

  test('requests each configured family, then waits on the font set', async () => {
    const requested = []
    let readyHasResolved = false
    withFontSet({
      load: (fontSpecification) => { requested.push(fontSpecification); return Promise.resolve([]) },
      ready: Promise.resolve().then(() => { readyHasResolved = true }),
    })

    await waitForFonts({ title_font_family: 'Circular', xaxis_font_family: 'Circular' })

    expect(requested).toEqual(['12px "Circular"'])
    expect(readyHasResolved).toBe(true)
  })

  test('quotes the family so a multi word name stays a parseable font shorthand', async () => {
    const requested = []
    withFontSet({
      load: (fontSpecification) => { requested.push(fontSpecification); return Promise.resolve([]) },
      ready: Promise.resolve(),
    })

    await waitForFonts({ title_font_family: 'Open Sans' })

    expect(requested).toEqual(['12px "Open Sans"'])
  })

  test('resolves when a font cannot be loaded', async () => {
    withFontSet({
      load: () => Promise.reject(new Error('no such font')),
      ready: Promise.resolve(),
    })

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves when loading a font throws synchronously, as Blink does on an unparseable shorthand', async () => {
    withFontSet({
      load: () => { throw new Error('Could not resolve as a font') },
      ready: Promise.resolve(),
    })

    await expect(waitForFonts({ title_font_family: 'a "quoted" name' })).resolves.toBeUndefined()
  })

  test('resolves when the font set has no load method', async () => {
    withFontSet({ ready: Promise.resolve() })

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves when the font set rejects, which the spec forbids but a shim may do', async () => {
    withFontSet({
      load: () => Promise.resolve([]),
      ready: Promise.reject(new Error('not a conforming font set')),
    })

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves without waiting for a font set the browser does not provide', async () => {
    withFontSet(undefined)

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('requests the bold face only when the chart draws one', async () => {
    const requested = []
    withFontSet({
      load: (fontSpecification) => { requested.push(fontSpecification); return Promise.resolve([]) },
      ready: Promise.resolve(),
    })

    await waitForFonts({ title_font_family: 'Circular', yaxis_title_bold: true })

    expect(requested).toEqual(['12px "Circular"', 'bold 12px "Circular"'])
  })

  // Fake timers, never advanced, so nothing can resolve through the timeout. A font set whose
  // ready never settles then proves the wait ended at the loads rather than falling through to it
  // A font set holds FontFace objects, one per declared @font-face, each with a family and a status
  const fontSetOf = (faces, rest) => Object.assign({ forEach: (fn) => faces.forEach(fn) }, rest)

  test('does not request a face the font set has already loaded', async () => {
    jest.useFakeTimers()
    try {
      const requested = []
      withFontSet(fontSetOf([{ family: 'Circular', status: 'loaded' }], {
        load: (fontSpecification) => { requested.push(fontSpecification); return Promise.resolve([]) },
        ready: new Promise(() => {}),
      }))

      await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
      expect(requested).toEqual([])
    } finally {
      jest.useRealTimers()
    }
  })

  test('matches a declared family regardless of quoting and case', async () => {
    jest.useFakeTimers()
    try {
      const requested = []
      withFontSet(fontSetOf([{ family: '"circular"', status: 'loaded' }], {
        load: (fontSpecification) => { requested.push(fontSpecification); return Promise.resolve([]) },
        ready: new Promise(() => {}),
      }))

      await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
      expect(requested).toEqual([])
    } finally {
      jest.useRealTimers()
    }
  })

  test('stops at the loads once the family is registered', async () => {
    jest.useFakeTimers()
    try {
      const faces = []
      withFontSet(fontSetOf(faces, {
        load: () => { faces.push({ family: 'Circular', status: 'loaded' }); return Promise.resolve([]) },
        ready: new Promise(() => {}),
      }))

      await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
    } finally {
      jest.useRealTimers()
    }
  })

  // The case that matters in an export: the stylesheet declaring the family has not arrived, so the
  // set has no face for it and load resolves having done nothing. check would call that available
  test('waits on the font set when the family is not declared yet', async () => {
    let readyWasConsulted = false
    withFontSet({
      forEach: () => {},
      // What Chrome answers for a family it has never heard of, which is why check is not the test
      check: () => true,
      load: () => Promise.resolve([]),
      get ready () { readyWasConsulted = true; return Promise.resolve() },
    })

    await waitForFonts({ title_font_family: 'Circular' })

    expect(readyWasConsulted).toBe(true)
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
