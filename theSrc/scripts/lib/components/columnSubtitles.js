import BaseComponent from '../heatmapcore/baseComponent'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils'
import _ from 'lodash'

// TODO preferred dimensions must account for maxes
class ColumnSubtitles extends BaseComponent {
  constructor ({parentContainer, name, labels, fontSize, fontColor, fontFamily, padding, rotation = -45}) {
    super()
    _.assign(this, {parentContainer, name, labels, fontSize, fontColor, fontFamily, padding, rotation})
  }

  setColumnWidths (widths) {
    this.columnWidths = widths
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily, this.rotation))
    return {
      width: 0, // NB accept column width
      height: _(labelDimensions).map('height').max() + this.padding
    }
  }

  rotatingUp () {
    return this.rotation < 0
  }

  draw (bounds) {
    const container = this.parentContainer
      .append('g')
      .classed(`column-subtitles ${this.name}`, true)
      .attr('transform', this.buildTransform(bounds))
      .selectAll('g')
      .data(this.labels)
      .enter()

    const yOffsetCorrectionForRotation = (this.rotatingUp())
      ? bounds.height - this.padding
      : this.padding * 2 // TODO this is hacky

    container.append('g')
      .attr('transform', (d, i) => {
        const previousColumnsWidth = _(this.columnWidths.slice(0, i)).sum()
        return `translate(${previousColumnsWidth + this.columnWidths[i] / 2 - this.fontSize / 2},${yOffsetCorrectionForRotation})`
      })
      .append('text')
      .attr('transform', `rotate(${this.rotation}),translate(${this.padding},0)`)
      .attr('x', 0)
      .attr('y', -this.padding)
      .text(d => d)
      .style('text-anchor', 'start')
      .style('font-family', this.fontFamily)
      .style('font-size', this.fontSize)
      .style('fill', this.fontColor)
  }
}

module.exports = ColumnSubtitles
