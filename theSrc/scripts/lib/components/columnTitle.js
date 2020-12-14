import BaseComponent from './baseComponent'
import _ from 'lodash'
import HorizontalWrappedLabel from './parts/horizontalWrappedLabel'
import d3 from 'd3'

// TODO preferred dimensions must account for maxes
class ColumnTitle extends BaseComponent {
  constructor ({ parentContainer, text, classNames, fontSize, fontFamily, fontColor, bold, maxWidth, maxLines }) {
    super()
    _.assign(this, { parentContainer })
    this.label = new HorizontalWrappedLabel({
      classNames: `title ${classNames}`,
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

  computePreferredDimensions () {
    return this.label.computePreferredDimensions()
  }

  forceWidth (forcedWidth) {
    this.forcedWidth = forcedWidth
  }

  draw (bounds) {
    const adjustedBounds = (this.forcedWidth)
      ? _.merge({}, bounds, { width: this.forcedWidth })
      : bounds

    this.label.draw({
      container: this.parentContainer,
      bounds: adjustedBounds,
      onClick: (d, i) => {
        this.controller.xaxisClick(i) // TODO this is an odd action for clicking on a column title, and i is always 0
        d3.event.stopPropagation()
      },
    })
  }
}

module.exports = ColumnTitle
