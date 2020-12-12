import BaseComponent from './baseComponent'
import _ from 'lodash'
import { enums, getDimensions, addLabel } from 'rhtmlLabelUtils'

class YTitle extends BaseComponent {
  constructor ({ parentContainer, text, type, fontSize, fontFamily, fontColor, bold, maxHeight, maxLines }) {
    super()
    _.assign(this, { parentContainer, text, type, fontSize, fontFamily, fontColor, bold, maxHeight, maxLines })
  }

  computePreferredDimensions () {
    const dimensions = getDimensions({
      parentContainer: this.parentContainer,
      text: this.text,
      maxHeight: this.maxHeight,
      maxLines: this.maxLines,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.BOTTOM_TO_TOP,
    })

    return {
      width: dimensions.width,
      height: 0, // NB title takes what height is given, and does not force height on the chart
    }
  }

  draw (bounds) {
    const titleContainer = this.parentContainer.append('g')
      .classed('ytitle', true)
      .attr('transform', this.buildTransform(bounds))

    addLabel({
      parentContainer: titleContainer,
      text: this.text,
      bounds,
      maxLines: this.maxLines,
      fontColor: this.fontColor,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: (this.bold) ? 'bold' : 'normal',
      orientation: enums.orientation.BOTTOM_TO_TOP,
      verticalAlignment: enums.verticalAlignment.CENTER,
      horizontalAlignment: enums.horizontalAlignment.LEFT,
    })
  }
}

module.exports = YTitle
