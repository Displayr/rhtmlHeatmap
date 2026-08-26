/* global setTimeout, clearTimeout */

const _ = require('lodash')

const FONT_FAMILY_OPTION_SUFFIX = '_font_family'
const BOLD_OPTION_SUFFIX = '_bold'

// The font size is irrelevant to which font file is loaded, but the CSS font shorthand needs one
const NORMAL_VARIANT = '12px'
const BOLD_VARIANT = 'bold 12px'

// A font we cannot load must delay the chart, not prevent it
const FONT_LOAD_TIMEOUT_IN_MILLISECONDS = 3000

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

const isRegistered = (fontSet, fontFamily) => !_.isEmpty(facesFor(fontSet, fontFamily))

const isLoaded = (fontSet, fontFamily) => _.some(facesFor(fontSet, fontFamily), face => face.status === 'loaded')

const requestLoad = (fontSet, font) => {
  try {
    return fontSet.load(font).catch(() => {})
  } catch (error) {
    return Promise.resolve()
  }
}

function waitForFonts (options) {
  const fontSet = (typeof document === 'undefined') ? null : document.fonts
  if (!fontSet) {
    return Promise.resolve()
  }

  const fontFamilies = fontFamiliesInUse(options).filter(fontFamily => !isLoaded(fontSet, fontFamily))
  if (_.isEmpty(fontFamilies)) {
    return Promise.resolve()
  }

  const loaded = Promise.all(fontsInUse(options, fontFamilies).map(font => requestLoad(fontSet, font)))
    .then(() => {
      // A family the set still has no face for is one whose stylesheet has not arrived. Only then is
      // the set's ready promise worth waiting on, since that also waits on pending stylesheets, and
      // on every other font the page happens to be loading
      return _.every(fontFamilies, fontFamily => isRegistered(fontSet, fontFamily))
        ? undefined
        : Promise.resolve(fontSet.ready)
    })

  let timeoutId = null
  const givenUpWaiting = new Promise(resolve => {
    timeoutId = setTimeout(resolve, FONT_LOAD_TIMEOUT_IN_MILLISECONDS)
  })

  // Passed as both handlers so that a font set which rejects, against the spec, still stops the
  // timer and still lets the chart render with whatever metrics are available
  const stopWaiting = () => { clearTimeout(timeoutId) }

  return Promise.race([loaded, givenUpWaiting]).then(stopWaiting, stopWaiting)
}

module.exports = {
  fontFamiliesInUse,
  fontsInUse,
  waitForFonts,
}
