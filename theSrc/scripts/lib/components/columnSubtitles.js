import BaseComponent from './baseComponent'
import {getLabelDimensionsUsingSvgApproximation, splitIntoLinesByCharacter} from '../labelUtils'
import _ from 'lodash'
import {CellNames} from '../heatmapcore/layout'

// TODO preferred dimensions must account for maxes
class ColumnSubtitles extends BaseComponent {
  constructor ({parentContainer, name, labels, fontSize, fontColor, fontFamily, padding, rotation = -45, maxLines, maxHeight}) {
    super()
    _.assign(this, {parentContainer, name, labels, fontSize, fontColor, fontFamily, padding, rotation, maxLines, maxHeight})
  }

  setColumnWidths (widths) {
    this.columnWidths = widths
  }

  computePreferredDimensions () {
    const labelDimensions = this.labels.map(text => {
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

    const preferredDimensions = {
      width: 0, // NB accept column width
      height: _(labelDimensions).map('height').max()
    }

    if (this.name === CellNames.RIGHT_COLUMN_SUBTITLE) {
      const rightmostLabelWidth = _.last(labelDimensions).width
      const rightmostColumnWidth = _.last(this.columnWidths)

      const currentColumnGroupWidth = _.sum(this.columnWidths) + (this.columnWidths.length - 1) * this.padding
      const extraConditionalWidthOnRightSide = Math.max(0, rightmostLabelWidth - 0.5 * rightmostColumnWidth)

      preferredDimensions.conditional = {
        rightmost: currentColumnGroupWidth + extraConditionalWidthOnRightSide // if Im furthest on the right i need an extra pixels to account for labels pushing outside of SVG
      }
    }

    return preferredDimensions
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
      ? bounds.height
      : 12 // TODO this is hacky

    container.append('g')
      .attr('transform', (d, i) => {
        const previousColumnsWidth = _(this.columnWidths.slice(0, i)).sum() + i * this.padding
        return `translate(${previousColumnsWidth + this.columnWidths[i] / 2},${yOffsetCorrectionForRotation})`
      })
      .append('text')
      .attr('transform', `rotate(${this.rotation})`)
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
  }
}

module.exports = ColumnSubtitles
