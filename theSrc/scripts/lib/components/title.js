import BaseComponent from './baseComponent'
import _ from 'lodash'
import HorizontalWrappedLabel from './parts/horizontalWrappedLabel'

// TODO preferred dimensions must account for maxes
class Title extends BaseComponent {
  constructor ({ parentContainer, text, fontSize, fontFamily, fontColor, bold = false, maxWidth, maxLines }) {
    super()
    _.assign(this, { parentContainer })
    this.label = new HorizontalWrappedLabel({
      classNames: 'title',
      fontColor: fontColor,
      fontFamily: fontFamily,
      fontSize: fontSize,
      fontWeight: (bold) ? 'bold' : 'normal',
      maxLines: maxLines,
      maxWidth: maxWidth,
      canvas: parentContainer,
      text: text,
    })
  }

  computePreferredDimensions (estimatedWidth) {
    if (estimatedWidth) { this.label.setMaxWidth(estimatedWidth) }
    const dimensions = this.label.computePreferredDimensions()
    return {
      width: 0, // NB title width takes what is given, and does not force width on the chart
      height: dimensions.height,
    }
  }

  draw (bounds) {
    this.label.draw({
      container: this.parentContainer,
      bounds,
    })
  }
}

module.exports = Title
