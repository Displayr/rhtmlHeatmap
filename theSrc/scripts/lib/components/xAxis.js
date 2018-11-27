import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'
import {getLabelDimensionsUsingSvgApproximation, splitIntoLinesByCharacter, splitIntoLinesByWord} from '../labelUtils'

const DEBUG = false

// TODO preferred dimensions must account for maxes
// TODO NB we only handle wrapping when rotation = 0
class XAxis extends BaseComponent {
  constructor ({parentContainer, labels, fontSize, fontFamily, fontColor, rotation = -45, controller, maxLines, maxHeight}) {
    super()
    _.assign(this, {parentContainer, labels, fontSize, fontFamily, fontColor, rotation, controller, maxLines, maxHeight})

    // to deal with superflous zoom calls at beginning of render
    this.amIZoomed = false
    this.innerLinePadding = 1 // TODO move up
  }

  computePreferredDimensions (estimatedColumnWidth) {
    let labelDimensions = null
    if (this.rotation === 0) {
      labelDimensions = this.labels.map(text => {
        const lines = splitIntoLinesByWord({
          parentContainer: this.parentContainer,
          text: text,
          maxWidth: estimatedColumnWidth,
          maxHeight: this.maxHeight,
          maxLines: this.maxLines,
          fontSize: this.fontSize,
          fontFamily: this.fontFamily
        })
        const lineDimensions = lines.map(text => getLabelDimensionsUsingSvgApproximation({
          text,
          parentContainer: this.parentContainer,
          fontSize: this.fontSize,
          fontFamily: this.fontFamily,
          rotation: this.rotation
        }))

        return {
          width: _(lineDimensions).map('width').max(),
          height: _(lineDimensions).map('height').sum() + (lines.length - 1) * this.innerLinePadding
        }
      })
    } else {
      // NB only allow 1 line of rotated text for now
      labelDimensions = this.labels.map(text => {
        const lines = splitIntoLinesByCharacter({
          parentContainer: this.parentContainer,
          text: text,
          maxHeight: this.maxHeight,
          maxLines: 1,
          fontSize: this.fontSize,
          fontFamily: this.fontFamily,
          rotation: this.rotation
        })
        return getLabelDimensionsUsingSvgApproximation({
          text: lines[0],
          parentContainer: this.parentContainer,
          fontSize: this.fontSize,
          fontFamily: this.fontFamily,
          rotation: this.rotation
        })
      })
    }
    return {
      width: 0, // NB xaxis width takes what is given, and does not force width on the chart
      height: _(labelDimensions).map('height').max()
    }
  }

  draw (bounds) {
    this.bounds = bounds
    const container = this.parentContainer.append('g').classed('axis xaxis', true).attr('transform', this.buildTransform(bounds))
    const columnWidth = bounds.width / this.labels.length

    this.cellSelection = container.selectAll('g')
      .data(this.labels)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${columnWidth * i},0)`)

    this.rectSelection = this.cellSelection.append('rect')
      .classed('click-rect', true)
      .attr('width', columnWidth)
      .attr('height', bounds.height)
      .attr('fill', 'transparent')
      .attr('stroke', (DEBUG) ? 'lightgrey' : 'transparent')
      .on('click', (d, i) => {
        console.log('rect click')
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })

    const { fontFamily, fontSize, parentContainer, maxLines, innerLinePadding } = this
    if (this.rotation === 0) {
      this.textSelection = this.cellSelection.append('text')
        .attr('class', (d, i) => `tick-${i}`)
        .classed('axis-text', true)
        .attr('transform', `translate(${columnWidth / 2}, 0)`)
        .attr('x', 0)
        .attr('y', 0)
        .attr('dy', 0)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'text-before-edge')
        .style('font-family', this.fontFamily)
        .style('font-size', this.fontSize)
        .style('fill', this.fontColor)
        .on('click', (d, i) => {
          this.controller.xaxisClick(i)
          d3.event.stopPropagation()
        })
        .each(function (d) {
          const lines = splitIntoLinesByWord({
            parentContainer: parentContainer,
            text: d,
            maxWidth: columnWidth,
            maxHeight: this.maxHeight,
            maxLines: maxLines,
            fontSize: fontSize,
            fontFamily: fontFamily
          })
          const textGroup = d3.select(this)
          _(lines).each((lineText, i) => {
            textGroup.append('tspan')
              .attr('x', 0)
              .attr('y', i * (fontSize + innerLinePadding))
              .text(lineText)
          })
        })
    } else {
      this.textSelection = this.cellSelection.append('text')
        .attr('class', (d, i) => `tick-${i}`)
        .classed('axis-text', true)
        .attr('transform', `translate(${columnWidth / 2 - this.fontSize / 2},${this.yOffsetCorrectionForRotation()}),rotate(${this.rotation})`)
        .attr('x', 0)
        .text(d => {
          const lines = splitIntoLinesByCharacter({
            parentContainer: this.parentContainer,
            text: d,
            maxHeight: this.maxHeight,
            maxLines: this.maxLines,
            fontSize: this.fontSize,
            fontFamily: this.fontFamily,
            rotation: this.rotation
          })
          return lines[0]
        })
        .style('text-anchor', 'start')
        .style('font-family', this.fontFamily)
        .style('font-size', this.fontSize)
        .style('fill', this.fontColor)
        .on('click', (d, i) => {
          this.controller.xaxisClick(i)
          d3.event.stopPropagation()
        })
    }
  }

  updateHighlights ({ column = null } = {}) {
    this.textSelection
      .classed('highlight', (d, i) => (column === i))
  }

// Example call, upon selecting row [0,0]: column [1,2]
// {
//   "scale": [ 2, 7 ],
//   "translate": [ -450.1803455352783, 0 ],
//   "extent": [ [ 1, 0 ], [ 3, 1 ] ]
// }
  // TODO better field for 'zoom'
  updateZoom ({ scale, translate, extent, zoom }) {
    if (!zoom && !this.amIZoomed) {
      return
    }
    if (zoom && this.amIZoomed) {
      return
    }
    this.amIZoomed = zoom
    if (this.amIZoomed) {
      return this.applyZoom({scale, translate, extent})
    } else {
      return this.resetZoom()
    }
  }

  rotatingUp () {
    return this.rotation < 0
  }

  rotatingDown () {
    return this.rotation > 0
  }

  yOffsetCorrectionForRotation () {
    if (this.rotatingUp()) { return this.bounds.height }
    if (this.rotatingDown()) { return 12 } // TODO this is hacky
    return 0
  }

  applyZoom ({scale, translate, extent}) {
    const columnsInZoom = _.range(extent[0][0], extent[1][0])
    const inFocusExtent = columnsInZoom.length
    const numberCellsToLeftOutOfFocus = extent[0][0]
    const newCellWidth = this.bounds.width / inFocusExtent
    const newStartingPoint = -1 * numberCellsToLeftOutOfFocus * newCellWidth

    this.cellSelection
      .attr('transform', (d, i) => `translate(${newStartingPoint + newCellWidth * i},0)`)

    this.rectSelection
      .attr('width', newCellWidth)

    this.textSelection
      .attr('transform', `translate(${newCellWidth / 2},${this.yOffsetCorrectionForRotation()}),rotate(${this.rotation})`)
      .classed('in-zoom', (d, i) => _.includes(columnsInZoom, i))
  }

  resetZoom () {
    const columnWidth = this.bounds.width / this.labels.length
    this.cellSelection
      .attr('transform', (d, i) => `translate(${columnWidth * i},0)`)

    this.rectSelection
      .attr('width', columnWidth)

    this.textSelection
      .attr('transform', `translate(${columnWidth / 2},${this.yOffsetCorrectionForRotation()}),rotate(${this.rotation})`)
      .classed('in-zoom', false)
  }
}

module.exports = XAxis

//
//
// controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function (_) {
//   console.log(`axis controller.on(transform.axis-${(rotated ? 'x' : 'y')})`)
//   var dim = rotated ? 0 : 1
//   // scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
//   var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]]
//   scale.rangeBands(rb)
//   var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear')
//   tAxisNodes.call(axis)
//   // Set text-anchor on the non-transitioned node to prevent jumpiness
//   // in RStudio Viewer pane
//   // if (opts.table_style) {
//   //   axisNodes.selectAll("text").style("text-anchor", "start");
//   // } else {
//   axisNodes.selectAll('text').style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
//   // }
//
//   tAxisNodes.selectAll('g')
//     .style('opacity', function (d, i) {
//       if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
//         return 1
//       } else {
//         return 0
//       }
//     })
//   // if (opts.table_style) {
//   //   tAxisNodes.selectAll("text")
//   //     .style("text-anchor", "start");
//
//   // } else {
//   tAxisNodes.selectAll('text')
//     .style('text-anchor', rotated ? 'start' : axis_location === 'right' ? 'start' : 'end')
//   // }
//
//   mouseTargets.transition().duration(opts.anim_duration).ease('linear')
//     .call(layoutMouseTargets)
//     .style('opacity', function (d, i) {
//       if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
//         return 1
//       } else {
//         return 0
//       }
//     })
// })
