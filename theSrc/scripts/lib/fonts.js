/* global setTimeout, clearTimeout */

const _ = require('lodash')

// NB labels are laid out by measuring them in the DOM (see rhtmlLabelUtils), so every font the
// chart draws with must be loaded before layout starts. When the chart is rendered for an image
// export it is drawn once, with no resize to trigger a re-layout, so a font that arrives after
// layout leaves the labels positioned and truncated for the metrics of the fallback font.

const FONT_FAMILY_OPTION_SUFFIX = '_font_family'

// NB the font size is irrelevant to which font file is loaded, but the CSS font shorthand needs one
const FONT_VARIANTS_TO_LOAD = ['12px', 'bold 12px']

// NB a font we cannot load must delay the chart, not prevent it
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

  _(fontFamiliesInUse(options)).each(fontFamily => {
    _(FONT_VARIANTS_TO_LOAD).each(fontVariant => {
      try {
        fontSet.load(`${fontVariant} ${fontFamily}`).catch(() => {})
      } catch (error) {
        // NB an unusable font family in the config throws synchronously, and must be ignored
      }
    })
  })

  // NB fontSet.ready also waits on stylesheets that are still loading, which is how a font that
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
  FONT_LOAD_TIMEOUT_IN_MILLISECONDS,
}
