jest.mock('./heatmapOuter', () => jest.fn())

const heatmapOuter = require('./heatmapOuter')
const widgetFactory = require('./rhtmlHeatmap.factory')

// A font set holds one FontFace per declared @font-face, each with a family and a status, and
// announces every completed batch of loads with a loadingdone event
const fontSetOf = (faces) => {
  const listeners = []
  return {
    faces,
    forEach: (fn) => faces.forEach(fn),
    load: () => Promise.resolve([]),
    ready: Promise.resolve(),
    addEventListener: (name, listener) => { if (name === 'loadingdone') { listeners.push(listener) } },
    removeEventListener: (name, listener) => {
      const at = listeners.indexOf(listener)
      if (at !== -1) { listeners.splice(at, 1) }
    },
    listenerCount: () => listeners.length,
    announceLoadingDone: () => listeners.slice().forEach(listener => listener()),
  }
}

const config = () => ({ options: { title_font_family: 'Circular' } })

describe('the widget factory', () => {
  let element = null
  let originalFontSet = null

  beforeEach(() => {
    heatmapOuter.mockClear()
    originalFontSet = document.fonts
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.fonts = originalFontSet
    document.body.removeChild(element)
  })

  test('renders once when the font is already loaded, and waits for nothing', () => {
    const fontSet = fontSetOf([{ family: 'Circular', status: 'loaded' }])
    document.fonts = fontSet

    widgetFactory(element).renderValue(config())

    expect(heatmapOuter).toHaveBeenCalledTimes(1)
    expect(fontSet.listenerCount()).toEqual(0)
  })

  test('redraws once the font the chart is missing arrives', () => {
    const fontSet = fontSetOf([])
    document.fonts = fontSet

    widgetFactory(element).renderValue(config())
    expect(heatmapOuter).toHaveBeenCalledTimes(1)

    fontSet.faces.push({ family: 'Circular', status: 'loaded' })
    fontSet.announceLoadingDone()

    expect(heatmapOuter).toHaveBeenCalledTimes(2)
  })

  test('does not redraw while the font is still missing', () => {
    const fontSet = fontSetOf([])
    document.fonts = fontSet

    widgetFactory(element).renderValue(config())
    fontSet.faces.push({ family: 'Circular', status: 'loading' })
    fontSet.announceLoadingDone()

    expect(heatmapOuter).toHaveBeenCalledTimes(1)
  })

  test('redraws at most once for one arrival, leaving no listener behind', () => {
    const fontSet = fontSetOf([])
    document.fonts = fontSet

    widgetFactory(element).renderValue(config())
    fontSet.faces.push({ family: 'Circular', status: 'loaded' })
    fontSet.announceLoadingDone()
    fontSet.announceLoadingDone()

    expect(heatmapOuter).toHaveBeenCalledTimes(2)
    expect(fontSet.listenerCount()).toEqual(0)
  })

  test('keeps one listener at most across repeated renders', () => {
    const fontSet = fontSetOf([])
    document.fonts = fontSet

    const widget = widgetFactory(element)
    widget.renderValue(config())
    widget.resize()
    widget.resize()

    expect(heatmapOuter).toHaveBeenCalledTimes(3)
    expect(fontSet.listenerCount()).toEqual(1)
  })

  test('renders without a font set', () => {
    document.fonts = undefined

    widgetFactory(element).renderValue(config())

    expect(heatmapOuter).toHaveBeenCalledTimes(1)
  })
})
