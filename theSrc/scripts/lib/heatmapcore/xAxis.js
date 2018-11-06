import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'
import _ from 'lodash'
import {CellNames} from "./layout";

// note : top -45
// note : bottom 45

class XAxis {
  constructor ({parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, rotation = -45}) {
    _.assign(this, {parentContainer, labels, fontSize, fontFamily, padding, maxWidth, maxHeight, rotation})
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily, this.rotation))
    return {
      width: _(labelDimensions).map('width').sum(),
      height: _(labelDimensions).map('height').max() + this.padding
    }
  }

  rotatingUp () {
    return this.rotation < 0
  }

  // shared by all components
  buildTransform ({ left, top }) {
    return `translate(${left},${top})`
  }

  draw (bounds) {
    this.parentContainer.append('g').classed('axis xaxis', true).attr('transform', this.buildTransform(bounds))
    const xaxisLabelContainers = this.parentContainer.select('g.xaxis').append('g').selectAll('text').data(this.labels).enter()

    const yOffsetCorrectionForRotation = (this.rotatingUp())
      ? bounds.height - this.padding
      : this.padding * 2 // TODO this is hacky

    const columnWidth = bounds.width / this.labels.length
    xaxisLabelContainers.append('g')
      .attr('transform', (d, i) => `translate(${columnWidth * i + columnWidth / 2 - this.fontSize / 2},${yOffsetCorrectionForRotation})`)
      .append('text')
      .attr('transform', `rotate(${this.rotation}),translate(${this.padding},0)`)
      .attr('x', 0)
      .attr('y', -this.padding)
      .text(d => d)
      .style('text-anchor', 'start')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
  }
}

module.exports = XAxis
