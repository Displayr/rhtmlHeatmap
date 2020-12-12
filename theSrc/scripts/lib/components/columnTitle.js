import BaseComponent from './baseComponent'
import _ from 'lodash'
import { enums, getDimensions, addLabel } from 'rhtmlLabelUtils'
import d3 from 'd3'

// TODO preferred dimensions must account for maxes
class ColumnTitle extends BaseComponent {
  constructor ({ parentContainer, text, classNames, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines }) {
    super()
    _.assign(this, { parentContainer, text, classNames, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines })
  }

  computePreferredDimensions () {
    const dimensions = getDimensions({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: this.maxWidth,
      fontSize: this.fontSize,
      maxLines: this.maxLines,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
    })
    return dimensions
  }

  forceWidth (forcedWidth) {
    this.forcedWidth = forcedWidth
  }

  draw (bounds) {
    const adjustedBounds = (this.forcedWidth)
      ? _.merge({}, bounds, { width: this.forcedWidth })
      : bounds

    const titleContainer = this.parentContainer
      .append('g')
      .classed('title', true)
      .classed(this.classNames, true)
      .attr('transform', this.buildTransform(adjustedBounds))

    const textSelection = addLabel({
      parentContainer: titleContainer,
      text: this.text,
      bounds,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      maxLines: this.maxLines,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
    })

    textSelection
      .on('click', (d, i) => {
        this.controller.xaxisClick(i)
        d3.event.stopPropagation()
      })
  }
}

module.exports = ColumnTitle
