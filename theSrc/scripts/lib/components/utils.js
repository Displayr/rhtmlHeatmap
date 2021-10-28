// The font-size style needs to be explicitly specified in px (using d3) on browsers like Firefox
class Utils {
  static fontSizeInPx (fontSize) {
    return fontSize + 'px'
  }
}

module.exports = Utils
