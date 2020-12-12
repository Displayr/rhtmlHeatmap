import BaseComponent from './baseComponent'
import _ from 'lodash'
import { enums, getDimensions, addLabel } from 'rhtmlLabelUtils'

// TODO preferred dimensions must account for maxes
class Title extends BaseComponent {
  constructor ({ parentContainer, text, fontSize, fontFamily, fontColor, bold = false, maxWidth, maxLines, innerPadding }) {
    super()
    _.assign(this, { parentContainer, text, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines, innerPadding })
  }

  computePreferredDimensions (estimatedWidth) {
    const dimensions = getDimensions({
      parentContainer: this.parentContainer,
      text: this.text,
      maxWidth: estimatedWidth,
      fontSize: this.fontSize,
      maxLines: this.maxLines,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.HORIZONTAL,
    })
    return {
      width: 0, // NB title width takes what is given, and does not force width on the chart
      height: dimensions.height,
    }
  }

  draw (bounds) {
    const titleContainer = this.parentContainer.append('g')
      .classed('title', true)
      .attr('transform', this.buildTransform(bounds))

    addLabel({
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
  }
}

module.exports = Title
