import BaseComponent from './baseComponent'
import _ from 'lodash'
import { enums } from 'rhtmlLabelUtils'
import VerticalBottomToTopWrappedLabel from './parts/verticalBottomToTopWrappedLabel'

class YTitle extends BaseComponent {
  constructor ({ parentContainer, text, type, fontSize, fontFamily, fontColor, bold, maxHeight, maxLines }) {
    super()
    _.assign(this, { parentContainer })
    this.label = new VerticalBottomToTopWrappedLabel({
      classNames: 'ytitle',
      fontColor: fontColor,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: (bold) ? 'bold' : 'normal',
      maxLines: maxLines,
      maxHeight: maxHeight,
      canvas: parentContainer,
      text: text,
      verticalAlignment: enums.verticalAlignment.CENTER,
      horizontalAlignment: enums.horizontalAlignment.LEFT,
    })
  }

  computePreferredDimensions () {
    const dimensions = this.label.computePreferredDimensions()
    return {
      width: dimensions.width,
      height: 0, // NB title takes what height is given, and does not force height on the chart
    }
  }

  draw (bounds) {
    this.label.draw({
      container: this.parentContainer,
      bounds,
    })
  }
}

module.exports = YTitle
