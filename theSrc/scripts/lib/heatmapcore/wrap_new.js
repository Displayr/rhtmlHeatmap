import d3 from 'd3'

function wrap_new (text, width) {
  var separators = {'-': 1, ' ': 1}
  var lineNumbers = []
  text.each(function () {
    var text = d3.select(this)
    var chars = text.text().split('').reverse()
    var nextchar
    var sep
    var newline = []
    var lineTemp = []
    var lineNumber = 0
    var lineHeight = 1.1 // ems
    var x = text.attr('x')
    var y = text.attr('y')
    var dy = parseFloat(text.attr('dy'))
    var tspan = text.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em')
    var c
    while (c = chars.pop()) { // eslint-disable-line no-cond-assign
      // remove leading space
      if (lineTemp.length === 0 && c === ' ') {
        continue
      }
      lineTemp.push(c)
      tspan.text(lineTemp.join(''))
      if (tspan.node().getComputedTextLength() > width) {
        // if no separator detected before c, wait until there is one
        // otherwise, wrap texts
        if (sep === undefined) {
          if (c in separators) {
            if (c === ' ') {
              lineTemp.pop()
            }
            // make new line
            sep = undefined
            tspan.text(lineTemp.join(''))
            tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text('')
            lineTemp = []
            newline = []
          }
        } else {
          // pop out chars until reaching sep
          if (c in separators) {
            newline.push(lineTemp.pop())
          }
          nextchar = lineTemp.pop()
          while (nextchar !== sep && lineTemp.length > 0) {
            newline.push(nextchar)
            nextchar = lineTemp.pop()
          }
          newline.reverse()
          while (nextchar = newline.pop()) { // eslint-disable-line no-cond-assign
            chars.push(nextchar)
          }

          if (sep !== ' ') {
            lineTemp.push(sep)
          }
          // make new line
          sep = undefined
          tspan.text(lineTemp.join(''))
          tspan = text.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text('')
          lineTemp = []
          newline = []
        }
      } else {
        if (c in separators) {
          sep = c
        }
      }
    }
    lineNumbers.push(lineNumber + 1)
  })
}

module.exports = wrap_new
