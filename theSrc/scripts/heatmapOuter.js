/* global Image */

import _ from 'lodash'
import d3 from 'd3'

import {Footer, Title, Subtitle} from 'rhtmlParts'
const Heatmap = require('./lib/heatmapcore/heatmapcore')

let uniqueInstanceCount = 0
function uniqueId () {
  return uniqueInstanceCount++
}

module.exports = function (element, x) {
  const { options, image, matrix, rows, cols } = x

  const {width, height} = getContainerDimensions(_.has(element, 'length') ? element[0] : element)
  const uniqueClass = `heatmap-${uniqueId()}`

  let titleHeight = 0
  let subtitleHeight = 0
  let footerHeight = 0

  const outerSvg = d3.select(element)
    .append('svg')
    .attr('class', 'svgContent')
    .attr('width', width)
    .attr('height', height)

  if (options.title) {
    const title = new Title({
      text: options.title,
      fontColor: options.title_font_color,
      fontSize: options.title_font_size,
      fontFamily: options.title_font_family,
      topPadding: 0,
      bottomPadding: 10,
      innerPadding: 2
    })
    title.setX(width / 2)
    title.setMaxWidth(width)
    title.drawWith(uniqueClass, outerSvg)
    titleHeight = title.getHeight()
  }

  if (options.subtitle) {
    const subtitle = new Subtitle({
      subtitleText: options.subtitle,
      subtitleFontColor: options.subtitle_font_color,
      subtitleFontSize: options.subtitle_font_size,
      subtitleFontFamily: options.subtitle_font_family,
      yOffset: titleHeight,
      bottomPadding: 10,
      innerPadding: 2
    })
    subtitle.setX(width / 2)
    subtitle.setMaxWidth(width)
    subtitle.drawWith(uniqueClass, outerSvg)
    subtitleHeight = subtitle.getHeight()
  }

  if (options.footer) {
    const footer = new Footer({
      footerText: options.footer,
      footerFontColor: options.footer_font_color,
      footerFontSize: options.footer_font_size,
      footerFontFamily: options.footer_font_family,
      containerHeight: height,
      topPadding: 10,
      bottomPadding: 10,
      innerPadding: 2
    })
    footer.setX(width / 2)
    footer.setMaxWidth(width)
    footer.setContainerHeight(height)
    footer.drawWith(uniqueClass, outerSvg)
    footerHeight = footer.getHeight()
  }

  const plotHeight = height -
    titleHeight -
    subtitleHeight -
    footerHeight

  console.log(`canvas height: ${height}`)
  console.log(`titleHeight: ${titleHeight}`)
  console.log(`subtitleHeight: ${subtitleHeight}`)
  console.log(`footerHeight: ${footerHeight}`)
  console.log(`setting plot width: ${width}`)
  console.log(`setting plot height: ${plotHeight}`)

  const pieGroupYOffset = titleHeight + subtitleHeight
  outerSvg.append('g')
    .attr('class', `heatmap-container ${uniqueClass}`)
    .attr('transform', `translate(0,${pieGroupYOffset})`)

  loadImage(image)
    .then(({imgData, width, height}) => processImageData({imgData, width, height, matrix, shownote_in_cell: options.shownote_in_cell}))
    .then(merged => {
      matrix.merged = merged
      return new Heatmap({
        selector: `.heatmap-container.${uniqueClass}`,
        options,
        matrix,
        dendrogramRows: rows,
        dendrogramColumns: cols,
        width,
        height: plotHeight
      })
    })
    .catch(error => {
      throw error
    })
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

      return resolve({imgData, width, height})
    }
    img.src = uri
  })
}

function processImageData ({imgData, width, height, matrix, shownote_in_cell}) {
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
      if (shownote_in_cell) {
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
      hide: hide
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
