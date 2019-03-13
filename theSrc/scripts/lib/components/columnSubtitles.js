import BaseComponent from './baseComponent'
import _ from 'lodash'

import HorizontalWrappedLabel from './parts/horizontalWrappedLabel'
import VerticalBottomToTopWrappedLabel from './parts/verticalBottomToTopWrappedLabel'
import VerticalTopToBottomWrappedLabel from './parts/verticalTopToBottomWrappedLabel'
import DiagonalUpWrappedLabel from './parts/diagonalUpWrappedLabel'
import DiagonalDownWrappedLabel from './parts/diagonalDownWrappedLabel'

// TODO preferred dimensions must account for maxes
class ColumnSubtitles extends BaseComponent {
  constructor ({
    fontColor,
    fontFamily,
    fontSize,
    labels,
    maxHeight,
    classNames,
    orientation,
    padding,
    parentContainer,
    verticalPlacement,
    horizontalPlacement
  }) {
    super()
    _.assign(this, {
      fontColor,
      fontFamily,
      fontSize,
      labels,
      maxHeight,
      classNames,
      orientation,
      padding,
      parentContainer,
      verticalPlacement,
      horizontalPlacement
    })

    if (this.orientation === 'horizontal') {
      this.LabelFactory = HorizontalWrappedLabel
    } else if (this.orientation === 'vertical' && this.verticalPlacement === 'top') {
      this.LabelFactory = VerticalBottomToTopWrappedLabel
    } else if (this.orientation === 'vertical' && this.verticalPlacement === 'bottom') {
      this.LabelFactory = VerticalTopToBottomWrappedLabel
    } else if (this.orientation === 'diagonal' && this.verticalPlacement === 'top') {
      this.LabelFactory = DiagonalUpWrappedLabel
    } else if (this.orientation === 'diagonal' && this.verticalPlacement === 'bottom') {
      this.LabelFactory = DiagonalDownWrappedLabel
    } else {
      throw new Error(`could not determine LabelFactory: orientation: '${this.orientation}', placement: ${this.verticalPlacement}`)
    }
  }

  computePreferredDimensions (estimatedColumnWidths) {
    this.labelObjects = this.labels.map((text, i) => {
      return new this.LabelFactory({
        classNames: 'column-subtitle',
        fontColor: this.fontColor,
        fontFamily: this.fontFamily,
        fontSize: this.fontSize,
        maxHeight: this.maxHeight,
        maxWidth: estimatedColumnWidths[i],
        parentContainer: this.parentContainer,
        text: text,
        verticalAlignment: this.verticalPlacement === 'top' ? 'bottom' : 'top'
      })
    })
    let labelDimensions = this.labelObjects.map(labelObject => labelObject.computePreferredDimensions())

    const preferredDimensions = {
      width: 0, // NB accept column width
      height: _(labelDimensions).map('height').max()
    }

    // NB The intent of the conditional.rightmost addition to dimensions:
    // if Im diagonal labels, and Im the furthest component on the right, then the diagonal label on the rightmost column
    // will be badly truncated unless extra space is reserved by the layout algorithm, so let it know we want more space
    // TODO using classNames here is bad, should be an explicit signal to enable this behaviour
    if (this.horizontalPlacement === 'right' && this.orientation === 'diagonal') {
      const rightmostLabelWidth = _.last(labelDimensions).width
      const rightmostColumnWidth = _.last(estimatedColumnWidths)

      const currentColumnGroupWidth = _.sum(estimatedColumnWidths) + (estimatedColumnWidths.length - 1) * this.padding
      const extraConditionalWidthOnRightSide = Math.max(0, rightmostLabelWidth - 0.5 * rightmostColumnWidth)

      preferredDimensions.conditional = {
        rightmost: currentColumnGroupWidth + extraConditionalWidthOnRightSide
      }
    }

    return preferredDimensions
  }

  // currently called after computePreferred and before draw
  setColumnWidths (widths) {
    this.columnWidths = widths
  }

  draw (bounds) {
    const container = this.parentContainer.append('g')
      .classed(`column-subtitles ${this.classNames}`, true)
      .attr('transform', this.buildTransform(bounds))

    const extraSpaceAvailable = (this.horizontalPlacement === 'right' && this.orientation === 'diagonal')
      ? bounds.width - _(this.columnWidths).sum()
      : 0

    this.labelObjects.map((labelObject, i) => {
      // TODO instead of checking for existence of fn, really we should be checking that LabelFactory = DiagonalDownWrappedLabel OR DiagonalDownWrappedLabel
      if (_.isFunction(labelObject.setAvailableSpaceToTheRight)) {
        const widthOfColumnsToTheRight = _(this.columnWidths.slice(i + 1)).sum() + (this.columnWidths.length - 1 - i) * this.padding
        const widthOfComponentsToTheRight = bounds.canvasWidth - (bounds.left + bounds.width)
        labelObject.setAvailableSpaceToTheRight(widthOfColumnsToTheRight + extraSpaceAvailable + widthOfComponentsToTheRight)
      }
      const previousColumnsWidth = _(this.columnWidths.slice(0, i)).sum() + i * this.padding
      labelObject.draw({
        container, // this is odd given we already supply parentContainer to constructor
        bounds: {
          top: 0,
          left: previousColumnsWidth,
          height: bounds.height,
          width: this.columnWidths[i]
        },
        onClick: (d, i) => {},
        classNames: 'column-title'
      })
    })
  }
}

module.exports = ColumnSubtitles
