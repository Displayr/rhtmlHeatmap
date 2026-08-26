/* global setTimeout, clearTimeout, setInterval, clearInterval */

const _ = require('lodash')

const FONT_FAMILY_OPTION_SUFFIX = '_font_family'
const BOLD_OPTION_SUFFIX = '_bold'

// The font size is irrelevant to which font file is loaded, but the CSS font shorthand needs one
const NORMAL_VARIANT = '12px'
const BOLD_VARIANT = 'bold 12px'

// A font we cannot load must delay the chart, not prevent it. Long enough to outlast Chrome's
// own block period, after which it paints the fallback face and the chart is measured wrong
const FONT_LOAD_TIMEOUT_IN_MILLISECONDS = 15000

const FONT_POLL_INTERVAL_IN_MILLISECONDS = 100

// Quoting the family keeps the shorthand parseable whatever the family is named. A generic
// family such as sans-serif then reads as a name and matches nothing, which is harmless
const fontToLoad = (fontVariant, fontFamily) => `${fontVariant} "${fontFamily}"`

function fontFamiliesInUse (options) {
  return _(options)
    .pickBy((value, key) => _.endsWith(key, FONT_FAMILY_OPTION_SUFFIX))
    .values()
    .filter(_.isString)
    .map(_.trim)
    .reject(_.isEmpty)
    .uniq()
    .value()
}

// Only titles are ever drawn bold, and only when their own option says so. Loading a bold face
// the chart will not draw costs a request per render, which an export pays many times over
function usesBoldFonts (options) {
  return _.some(options, (value, key) => _.endsWith(key, BOLD_OPTION_SUFFIX) && Boolean(value))
}

function fontsInUse (options, fontFamilies = fontFamiliesInUse(options)) {
  const fontVariants = usesBoldFonts(options) ? [NORMAL_VARIANT, BOLD_VARIANT] : [NORMAL_VARIANT]

  return _.flatMap(fontFamilies,
    fontFamily => fontVariants.map(fontVariant => fontToLoad(fontVariant, fontFamily)))
}

// fontSet.check answers whether text would render, not whether the font we asked for is there: a
// family the set has never heard of counts as available, on the assumption it is a system font.
// That is exactly what a stylesheet still in flight looks like, so registration is what we ask about
const facesFor = (fontSet, fontFamily) => {
  const faces = []
  try {
    fontSet.forEach(face => {
      if (_.isString(face.family) && face.family.replace(/["']/g, '').toLowerCase() === fontFamily.toLowerCase()) {
        faces.push(face)
      }
    })
  } catch (error) {
    // A font set we cannot enumerate is one we treat as knowing nothing
  }
  return faces
}

const isLoaded = (fontSet, fontFamily) => _.some(facesFor(fontSet, fontFamily), face => face.status === 'loaded')

const fontSetOrNull = () => (typeof document === 'undefined') ? null : (document.fonts || null)

const requestLoad = (fontSet, font) => {
  try {
    return fontSet.load(font).catch(() => {})
  } catch (error) {
    return Promise.resolve()
  }
}

// The families the chart will draw with that the browser cannot yet use
function unloadedFamilies (options) {
  const fontSet = fontSetOrNull()
  if (!fontSet) {
    return []
  }
  return fontFamiliesInUse(options).filter(fontFamily => !isLoaded(fontSet, fontFamily))
}

const hasFailed = (fontSet, fontFamily) => {
  const faces = facesFor(fontSet, fontFamily)
  return !_.isEmpty(faces) && _.every(faces, face => face.status === 'error')
}

// A family whose stylesheet has not arrived has no face to load yet, so asking once is not enough:
// keep asking until every family has either loaded, failed, or run out of hope. The font set's
// ready promise is what marks the last of those: it waits on pending stylesheets, so a family with
// no face by then is one this document does not have, and waiting longer would only stall the chart
function untilSettled (fontSet, options, fontFamilies) {
  let documentHasFinishedLoadingFonts = false
  Promise.resolve(fontSet.ready).then(
    () => { documentHasFinishedLoadingFonts = true },
    () => { documentHasFinishedLoadingFonts = true }
  )

  const isSettled = (fontFamily) => isLoaded(fontSet, fontFamily) ||
    hasFailed(fontSet, fontFamily) ||
    (documentHasFinishedLoadingFonts && _.isEmpty(facesFor(fontSet, fontFamily)))

  const unsettled = () => fontFamilies.filter(fontFamily => !isSettled(fontFamily))

  return new Promise(resolve => {
    let pollId = null

    const askAndCheck = () => {
      const waitingOn = unsettled()
      if (_.isEmpty(waitingOn)) {
        clearInterval(pollId)
        resolve()
        return
      }
      fontsInUse(options, waitingOn.filter(fontFamily => !_.isEmpty(facesFor(fontSet, fontFamily))))
        .forEach(font => requestLoad(fontSet, font))
    }

    pollId = setInterval(askAndCheck, FONT_POLL_INTERVAL_IN_MILLISECONDS)
    askAndCheck()
  })
}

function waitForFonts (options) {
  const fontSet = fontSetOrNull()
  if (!fontSet) {
    return Promise.resolve()
  }

  const fontFamilies = unloadedFamilies(options)
  if (_.isEmpty(fontFamilies)) {
    return Promise.resolve()
  }

  let timeoutId = null
  const givenUpWaiting = new Promise(resolve => {
    timeoutId = setTimeout(resolve, FONT_LOAD_TIMEOUT_IN_MILLISECONDS)
  })

  // Passed as both handlers so that a font set which rejects, against the spec, still stops the
  // timer and still lets the chart render with whatever metrics are available
  const stopWaiting = () => { clearTimeout(timeoutId) }

  // eslint-disable-next-line promise/no-nesting

  return Promise.race([untilSettled(fontSet, options, fontFamilies), givenUpWaiting])
    .then(stopWaiting, stopWaiting)
}

module.exports = {
  fontFamiliesInUse,
  fontsInUse,
  unloadedFamilies,
  waitForFonts,
}
