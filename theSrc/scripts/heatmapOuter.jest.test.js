jest.mock('./lib/heatmapcore/heatmapcore', () => function Heatmap () {})

const heatmapOuter = require('./heatmapOuter')

// The real Image decodes a data uri asynchronously. This stands in for it so that a test decides
// when, and whether, the load succeeds
class ControllableImage {
  constructor () {
    ControllableImage.instances.push(this)
    this.onload = null
    this.onerror = null
  }

  set src (uri) { this._src = uri }

  static get latest () { return ControllableImage.instances[ControllableImage.instances.length - 1] }
}
ControllableImage.instances = []

const config = () => ({
  options: { logLevel: 'silent' },
  image: 'data:image/png;base64,notarealimage',
  matrix: { dim: [1, 1], data: [], cells_to_hide: [], cellnote_in_cell: [] },
  rows: null,
  cols: null,
})

const statusOf = element => element.getAttribute('rhtmlwidget-status')

describe('heatmapOuter', () => {
  let element = null

  beforeEach(() => {
    ControllableImage.instances = []
    global.Image = ControllableImage
    element = document.createElement('div')
    document.body.appendChild(element)
  })

  afterEach(() => {
    document.body.removeChild(element)
    delete global.Image
  })

  test('claims loading before any of the asynchronous work', () => {
    heatmapOuter(element, config())

    expect(statusOf(element)).toEqual('loading')
  })

  test('reports ready when the image cannot be loaded', async () => {
    const rendering = heatmapOuter(element, config())
    ControllableImage.latest.onerror()

    await expect(rendering).rejects.toThrow('failed to load the heatmap colour image')
    expect(statusOf(element)).toEqual('ready')
  })

  test('leaves the status alone when the render it belongs to has been superseded', async () => {
    const rendering = heatmapOuter(element, config())
    const supersededImage = ControllableImage.latest

    // What the factory does on a resize: discard the markup and render again from scratch
    element.innerHTML = ''
    heatmapOuter(element, config())

    supersededImage.onerror()

    await expect(rendering).rejects.toThrow('failed to load the heatmap colour image')
    expect(statusOf(element)).toEqual('loading')
  })

  test('reports ready when the render fails synchronously', () => {
    element.appendChild = () => { throw new Error('cannot append') }

    expect(() => heatmapOuter(element, config())).toThrow('cannot append')
    expect(statusOf(element)).toEqual('ready')
  })
})
