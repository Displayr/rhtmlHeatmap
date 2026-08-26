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

function fontsInUse (options) {
  const fontVariants = usesBoldFonts(options) ? [NORMAL_VARIANT, BOLD_VARIANT] : [NORMAL_VARIANT]

  return _.flatMap(fontFamiliesInUse(options),
    fontFamily => fontVariants.map(fontVariant => fontToLoad(fontVariant, fontFamily)))
}

// Blink throws instead of rejecting when it cannot parse the shorthand, so both calls need a
// synchronous guard as well as a rejection handler. An unusable font is one we render without
const canUse = (fontSet, font) => {
  try {
    return Boolean(fontSet.check(font))
  } catch (error) {
    return false
  }
}

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

  const fontsToLoad = fontsInUse(options).filter(font => !canUse(fontSet, font))
  if (_.isEmpty(fontsToLoad)) {
    return Promise.resolve()
  }

  const loaded = Promise.all(fontsToLoad.map(font => requestLoad(fontSet, font)))
    .then(() => {
      // A face that is still unusable is one whose stylesheet has not arrived, which the font set
      // knows nothing about yet. Only then is its ready promise worth waiting on, since that also
      // waits on pending stylesheets, and waits on every other font the page happens to be loading
      return _.every(fontsToLoad, font => canUse(fontSet, font))
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
