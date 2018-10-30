/* global Image */

import _ from 'lodash'
import d3 from 'd3'
import {Footer, Title, Subtitle} from 'rhtmlParts'
const Heatmap = require('./lib/heatmapcore/heatmapcore')

module.exports = function (element) {
  const instance = {
    lastTheme: null,
    lastValue: null
  }

  // Need dedicated helper function that can be called by both renderValue
  // and resize. resize can't call this.renderValue because that will be
  // routed to the Shiny wrapper method from htmlwidgets, which expects the
  // wrapper data object, not x.
  function doRenderValue (x) {
    instance.lastValue = x

    if (instance.lastTheme && instance.lastTheme !== x.theme) {
      d3.select(document.body).classed('theme-' + instance.lastTheme, false)
    }
    if (x.theme) {
      d3.select(document.body).classed('theme-' + x.theme, true)
    }

    element.innerHTML = ''
    d3.select(document.body).select('.rhtmlHeatmap-tip').remove()

    const {width, height} = getContainerDimensions(_.has(element, 'length') ? element[0] : element)
    const uniqueCssPrefix = 'foo-banana'
    let titleHeight = 0
    let subtitleHeight = 0
    let footerHeight = 0

    const outerSvg = d3.select(element)
      .append('svg')
      .attr('class', 'svgContent')
      .attr('width', width)
      .attr('height', height)

    if (x.options.title) {
      const title = new Title({
        text: x.options.title,
        fontColor: x.options.title_font_color,
        fontSize: x.options.title_font_size,
        fontFamily: x.options.title_font_family,
        topPadding: 0,
        bottomPadding: 10,
        innerPadding: 2
      })
      title.setX(width / 2)
      title.setMaxWidth(width)
      title.drawWith(uniqueCssPrefix, outerSvg)
      titleHeight = title.getHeight()
    }

    if (x.options.subtitle) {
      const subtitle = new Subtitle({
        subtitleText: x.options.subtitle,
        subtitleFontColor: x.options.subtitle_font_color,
        subtitleFontSize: x.options.subtitle_font_size,
        subtitleFontFamily: x.options.subtitle_font_family,
        yOffset: titleHeight,
        bottomPadding: 10,
        innerPadding: 2
      })
      subtitle.setX(width / 2)
      subtitle.setMaxWidth(width)
      subtitle.drawWith(uniqueCssPrefix, outerSvg)
      subtitleHeight = subtitle.getHeight()
    }

    if (x.options.footer) {
      const footer = new Footer({
        footerText: x.options.footer,
        footerFontColor: x.options.footer_font_color,
        footerFontSize: x.options.footer_font_size,
        footerFontFamily: x.options.footer_font_family,
        containerHeight: height,
        topPadding: 10,
        bottomPadding: 10,
        innerPadding: 2
      })
      footer.setX(width / 2)
      footer.setMaxWidth(width)
      footer.setContainerHeight(height)
      footer.drawWith(uniqueCssPrefix, outerSvg)
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
      .attr('class', 'heatmap-container')
      .attr('transform', `translate(0,${pieGroupYOffset})`)

    loadImage(x.image)
      .then(({imgData, width, height}) => processImageData({imgData, width, height, x}))
      .then(merged => {
        x.matrix.merged = merged
        return new Heatmap('.heatmap-container', x, x.options, width, plotHeight)
      })
      .catch(error => { throw error })
  }

  function loadImage (uri) {
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

  function processImageData ({imgData, width, height, x}) {
    if (width !== x.matrix.dim[0] || height !== x.matrix.dim[1]) {
      throw new Error('Color dimensions didn\'t match data dimensions')
    }

    var merged = []
    for (var i = 0; i < x.matrix.data.length; i++) {
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
      if (x.matrix.cells_to_hide[i] !== 0) {
        hide = 1
        cellnoteColor = 'transparent'
      } else {
        if (x.options.shownote_in_cell) {
          if (x.matrix.cellnote_in_cell[i] === 'No data') {
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
        label: x.matrix.data[i],
        color: color,
        cellnote_in_cell: x.matrix.cellnote_in_cell[i],
        cellnote_color: cellnoteColor,
        hide: hide
      })
    }

    return merged
  }

  return {
    renderValue (incomingConfig) {
      doRenderValue(incomingConfig)
    },

    resize () {
      if (instance.lastValue) {
        doRenderValue(instance.lastValue)
      }
    }
  }
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
