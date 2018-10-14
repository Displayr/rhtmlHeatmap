// Given a list of widths/heights and a total width/height, provides
// easy access to the absolute top/left/width/height of any individual
// grid cell. Optionally, a single cell can be specified as a "fill"
// cell, meaning it will take up any remaining width/height.
//
// rows and cols are arrays that contain numeric pixel dimensions,
// and up to one "*" value.
function GridSizer (widths, heights, /* optional */ totalWidth, /* optional */ totalHeight) {
  this.widths = widths
  this.heights = heights

  var fillColIndex = null
  var fillRowIndex = null
  var usedWidth = 0
  var usedHeight = 0
  var i
  for (i = 0; i < widths.length; i++) {
    if (widths[i] === '*') {
      if (fillColIndex !== null) {
        throw new Error('Only one column can be designated as fill')
      }
      fillColIndex = i
    } else {
      usedWidth += widths[i]
    }
  }
  if (fillColIndex !== null) {
    widths[fillColIndex] = totalWidth - usedWidth
  } else {
    if (typeof (totalWidth) === 'number' && totalWidth !== usedWidth) {
      throw new Error('Column widths don\'t add up to total width')
    }
  }
  for (i = 0; i < heights.length; i++) {
    if (heights[i] === '*') {
      if (fillRowIndex !== null) {
        throw new Error('Only one row can be designated as fill')
      }
      fillRowIndex = i
    } else {
      usedHeight += heights[i]
    }
  }
  if (fillRowIndex !== null) {
    heights[fillRowIndex] = totalHeight - usedHeight
  } else {
    if (typeof (totalHeight) === 'number' && totalHeight !== usedHeight) {
      throw new Error('Column heights don\'t add up to total height')
    }
  }
}

GridSizer.prototype.getCellBounds = function (x, y) {
  if (x < 0 || x >= this.widths.length || y < 0 || y >= this.heights.length) { throw new Error('Invalid cell bounds') }

  var left = 0
  for (var i = 0; i < x; i++) {
    left += this.widths[i]
  }

  var top = 0
  for (var j = 0; j < y; j++) {
    top += this.heights[j]
  }

  return {
    width: this.widths[x],
    height: this.heights[y],
    top: top,
    left: left
  }
}

module.exports = GridSizer
