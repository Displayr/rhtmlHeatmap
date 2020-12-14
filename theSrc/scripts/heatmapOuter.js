/* global Image */

import _ from 'lodash'
import d3 from 'd3'
import * as rootLog from 'loglevel'

const Heatmap = require('./lib/heatmapcore/heatmapcore')

let uniqueInstanceCount = 0
function uniqueId () {
  return uniqueInstanceCount++
}

module.exports = function (element, config) {
  const { options, image, matrix, rows, cols } = config

  _initLogger(options.logLevel)

  const { width, height } = getContainerDimensions(_.has(element, 'length') ? element[0] : element)
  const uniqueClass = `heatmap-${uniqueId()}`

  d3.select(element)
    .append('svg')
    .attr('class', `svgContent ${uniqueClass}`)
    .attr('width', width)
    .attr('height', height)

  loadImage(image)
    .then(({ imgData, width, height }) => processImageData({ imgData, width, height, matrix, cellNotes: options.shownote_in_cell }))
    .then(merged => {
      matrix.merged = merged
      return new Heatmap({
        selector: `.svgContent.${uniqueClass}`,
        options,
        matrix,
        dendrogramRows: rows,
        dendrogramColumns: cols,
        width,
        height,
      })
    })
    .catch(error => {
      throw error
    })
}

function _initLogger (loggerSettings = 'info') {
  if (_.isNull(loggerSettings)) {
    return
  }
  if (_.isString(loggerSettings)) {
    rootLog.setLevel(loggerSettings)
    _(getLoggerNames()).each((loggerName) => { rootLog.getLogger(loggerName).setLevel(loggerSettings) })
    return
  }
  _(loggerSettings).each((loggerLevel, loggerName) => {
    if (loggerName === 'default') {
      rootLog.setLevel(loggerLevel)
    } else {
      rootLog.getLogger(loggerName).setLevel(loggerLevel)
    }
  })
}

function getLoggerNames () {
  return ['layout']
}

function loadImage (uri) {
  // TODO add better img load fail -> reject wiring here
  return new Promise((resolve, reject) => {
    var img = new Image()
    img.onload = function () {
      // Save size
      const width = img.width
      const height = img.height

      // Create a dummy canvas to extract the image data
      var imgDataCanvas = document.createElement('canvas')
      imgDataCanvas.width = width
      imgDataCanvas.height = height
      imgDataCanvas.style.display = 'none'
      document.body.appendChild(imgDataCanvas)

      var imgDataCtx = imgDataCanvas.getContext('2d')
      imgDataCtx.drawImage(img, 0, 0)

      // Save the image data.
      const imgData = imgDataCtx.getImageData(0, 0, width, height).data

      // Done with the canvas, remove it from the page so it can be gc'd.
      document.body.removeChild(imgDataCanvas)

      return resolve({ imgData, width, height })
    }
    img.src = uri
  })
}

function processImageData ({ imgData, width, height, matrix, cellNotes }) {
  if (width !== matrix.dim[0] || height !== matrix.dim[1]) {
    throw new Error('Color dimensions didn\'t match data dimensions')
  }

  var merged = []
  for (var i = 0; i < matrix.data.length; i++) {
    var r = imgData[i * 4]
    var g = imgData[i * 4 + 1]
    var b = imgData[i * 4 + 2]
    var a = imgData[i * 4 + 3]
    // calculate color contrast
    // http://stackoverflow.com/questions/11867545/change-text-color-based-on-brightness-of-the-covered-background-area
    var o = Math.round(((r * 299) + (g * 587) + (b * 114)) / 1000)
    var cellnoteColor
    var hide = 0
    var color = 'rgba(' + [r, g, b, a / 255].join(',') + ')'
    if (matrix.cells_to_hide[i] !== 0) {
      hide = 1
      cellnoteColor = 'transparent'
    } else {
      if (cellNotes) {
        if (matrix.cellnote_in_cell[i] === 'No data') {
          cellnoteColor = 'transparent'
        } else {
          if (a === 0) {
            cellnoteColor = 'black'
          } else {
            cellnoteColor = (o > 125) ? 'black' : 'white'
          }
        }
      } else {
        cellnoteColor = 'transparent'
      }
    }
    merged.push({
      label: matrix.data[i],
      color: color,
      cellnote_in_cell: matrix.cellnote_in_cell[i],
      cellnote_color: cellnoteColor,
      hide: hide,
    })
  }

  return merged
}

// TODO to utils
function getContainerDimensions (rootElement) {
  try {
    return rootElement.getBoundingClientRect()
  } catch (err) {
    err.message = `fail in getContainerDimensions: ${err.message}`
    throw err
  }
}
