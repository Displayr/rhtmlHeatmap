/* global setTimeout, clearTimeout */

const _ = require('lodash')

const FONT_FAMILY_OPTION_SUFFIX = '_font_family'

// The font size is irrelevant to which font file is loaded, but the CSS font shorthand needs one
const FONT_VARIANTS_TO_LOAD = ['12px', 'bold 12px']

// Quoting the family keeps the shorthand parseable whatever the family is named. A generic
// family such as sans-serif then reads as a name and matches nothing, which is harmless
const fontToLoad = (fontVariant, fontFamily) => `${fontVariant} "${fontFamily}"`

// A font we cannot load must delay the chart, not prevent it
const FONT_LOAD_TIMEOUT_IN_MILLISECONDS = 3000

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

function waitForFonts (options) {
  const fontSet = (typeof document === 'undefined') ? null : document.fonts
  if (!fontSet) {
    return Promise.resolve()
  }

  const fontsToLoad = _.flatMap(fontFamiliesInUse(options),
    fontFamily => FONT_VARIANTS_TO_LOAD.map(fontVariant => fontToLoad(fontVariant, fontFamily)))

  // A font that cannot be loaded must be ignored, not allowed to stop the chart rendering.
  // Blink throws instead of rejecting when it cannot parse the shorthand, and this runs before
  // the caller has anywhere to catch, so the synchronous path needs a guard of its own
  fontsToLoad.forEach(font => {
    try {
      fontSet.load(font).catch(() => {})
    } catch (error) {
      // Deliberately ignored: a font we cannot even ask for is one we render without
    }
  })

  // fontSet.ready also waits on stylesheets that are still loading, which is how a font that
  // arrives via an @import (as it does in the Displayr export page) gets waited on at all
  let timeoutId = null
  const givenUpWaiting = new Promise(resolve => {
    timeoutId = setTimeout(resolve, FONT_LOAD_TIMEOUT_IN_MILLISECONDS)
  })

  return Promise.race([Promise.resolve(fontSet.ready), givenUpWaiting])
    .then(() => { clearTimeout(timeoutId) })
}

module.exports = {
  fontFamiliesInUse,
  waitForFonts,
}
