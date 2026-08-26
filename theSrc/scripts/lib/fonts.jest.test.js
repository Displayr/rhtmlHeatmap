const { fontFamiliesInUse, fontsInUse, unloadedFamilies, waitForFonts } = require('./fonts.js')

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

  // A font set holds one FontFace per declared @font-face, each with a family and a status
  const fontSetOf = (faces, rest) => Object.assign({ forEach: (fn) => faces.forEach(fn) }, rest)

  // Lets every already resolved promise chain run, without letting the poll interval tick
  const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve))

  afterEach(() => {
    if (documentWasInvented) {
      delete global.document
    } else {
      document.fonts = originalFontSet
    }
  })

  test('does not wait for a family the font set has already loaded', async () => {
    const requested = []
    withFontSet(fontSetOf([{ family: 'Circular', status: 'loaded' }], {
      load: (font) => { requested.push(font); return Promise.resolve([]) },
      ready: new Promise(() => {}),
    }))

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
    expect(requested).toEqual([])
  })

  test('matches a declared family regardless of quoting and case', async () => {
    withFontSet(fontSetOf([{ family: '"circular"', status: 'loaded' }], {
      load: () => Promise.resolve([]),
      ready: new Promise(() => {}),
    }))

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('requests the faces it is waiting on, in normal only unless a title is bold', () => {
    jest.useFakeTimers()
    try {
      const requested = []
      withFontSet(fontSetOf([{ family: 'Circular', status: 'loading' }], {
        load: (font) => { requested.push(font); return Promise.resolve([]) },
        ready: Promise.resolve(),
      }))

      waitForFonts({ title_font_family: 'Circular' })
      expect(requested).toEqual(['12px "Circular"'])

      requested.length = 0
      waitForFonts({ title_font_family: 'Circular', yaxis_title_bold: true })
      expect(requested).toEqual(['12px "Circular"', 'bold 12px "Circular"'])
    } finally {
      jest.useRealTimers()
    }
  })

  test('waits until the face reports loaded', async () => {
    const face = { family: 'Circular', status: 'loading' }
    withFontSet(fontSetOf([face], {
      load: () => Promise.resolve([]),
      ready: new Promise(() => {}),
    }))

    let hasResolved = false
    const waiting = waitForFonts({ title_font_family: 'Circular' }).then(() => { hasResolved = true })

    await flushMicrotasks()
    expect(hasResolved).toBe(false)

    face.status = 'loaded'
    await waiting
    expect(hasResolved).toBe(true)
  })

  // The case that matters in an export: the stylesheet declaring the family arrives late, so the
  // set has no face for it at first and the chart must keep waiting rather than draw without it
  test('waits for a family whose stylesheet has not arrived, then for its face', async () => {
    const faces = []
    withFontSet(fontSetOf(faces, {
      load: () => Promise.resolve([]),
      ready: new Promise(() => {}),
    }))

    let hasResolved = false
    const waiting = waitForFonts({ title_font_family: 'Circular' }).then(() => { hasResolved = true })

    await flushMicrotasks()
    expect(hasResolved).toBe(false)

    faces.push({ family: 'Circular', status: 'loaded' })
    await waiting
    expect(hasResolved).toBe(true)
  })

  test('stops waiting for a family the document turns out not to have', async () => {
    withFontSet(fontSetOf([], {
      // What Chrome answers for a family it has never heard of, which is why check is not the test
      check: () => true,
      load: () => Promise.resolve([]),
      ready: Promise.resolve(),
    }))

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('stops waiting for a face that failed to load', async () => {
    withFontSet(fontSetOf([{ family: 'Circular', status: 'error' }], {
      load: () => Promise.reject(new Error('no such font')),
      ready: new Promise(() => {}),
    }))

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves when loading a font throws synchronously, as Blink does on an unparseable shorthand', async () => {
    withFontSet(fontSetOf([], {
      load: () => { throw new Error('Could not resolve as a font') },
      ready: Promise.resolve(),
    }))

    await expect(waitForFonts({ title_font_family: 'a "quoted" name' })).resolves.toBeUndefined()
  })

  test('resolves when the font set has no load method', async () => {
    withFontSet(fontSetOf([], { ready: Promise.resolve() }))

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves when the font set rejects, which the spec forbids but a shim may do', async () => {
    withFontSet(fontSetOf([], {
      load: () => Promise.resolve([]),
      ready: Promise.reject(new Error('not a conforming font set')),
    }))

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('resolves without waiting for a font set the browser does not provide', async () => {
    withFontSet(undefined)

    await expect(waitForFonts({ title_font_family: 'Circular' })).resolves.toBeUndefined()
  })

  test('gives up on a font that never settles', async () => {
    jest.useFakeTimers()
    try {
      withFontSet(fontSetOf([{ family: 'Circular', status: 'loading' }], {
        load: () => Promise.resolve([]),
        ready: new Promise(() => {}),
      }))

      const waiting = waitForFonts({ title_font_family: 'Circular' })
      jest.advanceTimersByTime(15000)

      await expect(waiting).resolves.toBeUndefined()
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('unloadedFamilies', () => {
  const originalFontSet = document.fonts

  afterEach(() => { document.fonts = originalFontSet })

  test('names the families the browser cannot use yet', () => {
    document.fonts = {
      forEach: (fn) => [
        { family: 'Circular', status: 'loaded' },
        { family: 'Open Sans', status: 'loading' },
      ].forEach(fn),
    }

    expect(unloadedFamilies({ title_font_family: 'Circular', xaxis_font_family: 'Open Sans' }))
      .toEqual(['Open Sans'])
  })

  test('names nothing when the browser has no font set', () => {
    document.fonts = undefined

    expect(unloadedFamilies({ title_font_family: 'Circular' })).toEqual([])
  })
})
