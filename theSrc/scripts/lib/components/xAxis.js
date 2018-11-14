import _ from 'lodash'
import d3 from 'd3'
import BaseComponent from './baseComponent'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'

const DEBUG = false

// TODO preferred dimensions must account for maxes
class XAxis extends BaseComponent {
  constructor ({parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, rotation = -45, controller}) {
    super()
    _.assign(this, {parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, rotation, controller})
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily, this.rotation))
    return {
      width: 0, // NB xaxis width takes what is given, and does not force width on the chart
      height: _(labelDimensions).map('height').max() + this.padding
    }
  }

  rotatingUp () {
    return this.rotation < 0
  }

  draw (bounds) {
    const container = this.parentContainer.append('g').classed('axis xaxis', true).attr('transform', this.buildTransform(bounds))

    const yOffsetCorrectionForRotation = (this.rotatingUp())
      ? bounds.height - this.padding
      : this.padding * 2 // TODO this is hacky
    const columnWidth = bounds.width / this.labels.length

    const cells = container.selectAll('g')
      .data(this.labels)
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(${columnWidth * i},0)`)

    cells.append('rect')
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

    this.textSelection = cells.append('text')
      .classed('axis-text', true)
      .attr('transform', `translate(${columnWidth / 2 - this.fontSize / 2},${yOffsetCorrectionForRotation}),rotate(${this.rotation}),translate(${this.padding},0)`)
      .attr('x', 0)
      .attr('y', -this.padding)
      .text(d => d)
      .style('text-anchor', 'start')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .on('click', (d, i) => {
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })
  }

  updateHighlights ({ rowIndex = null, columnIndex = null } = {}) {
    this.textSelection
      .classed('highlight', (d, i) => (columnIndex === i))
  }
}

module.exports = XAxis
