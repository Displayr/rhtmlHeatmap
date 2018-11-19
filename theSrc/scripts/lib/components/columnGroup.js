import BaseComponent from './baseComponent'
import _ from 'lodash'
import d3 from 'd3'
import {getLabelDimensionsUsingSvgApproximation} from '../labelUtils';

class ColumnGroup extends BaseComponent {
  constructor ({parentContainer, groupName, labelMatrix, alignments, fontSize, fontColor, fontFamily, padding, maxSingleColumnWidth}) {
    super()
    _.assign(this, {parentContainer, groupName, labelMatrix, alignments, fontSize, fontColor, fontFamily, padding, maxSingleColumnWidth})
  }

  getColumnWidths () {
    return this.columnWidths
  }

  computePreferredDimensions () {
    this.columnWidths = this.labelMatrix.map(columnLabels => {
      const maxTextWidth = _(columnLabels)
        .map(text => getLabelDimensionsUsingSvgApproximation(this.parentContainer, text, this.fontSize, this.fontFamily))
        .map('width')
        .max()
      return _.min([this.maxSingleColumnWidth, maxTextWidth])
    })
    return {
      width: _.sum(this.columnWidths) + this.padding * this.labelMatrix.length - 1,
      height: 0 // accept what height we are given
    }
  }

  draw (columnGroupBounds) {
    let cumulativeWidth = 0
    this.textSelections = []
    this.columnWidths.forEach((individualWidth, columnIndex) => {
      const columnBounds = {
        top: columnGroupBounds.top,
        left: columnGroupBounds.left + cumulativeWidth,
        width: individualWidth,
        height: columnGroupBounds.height
      }
      cumulativeWidth += individualWidth + this.padding

      const columnLabels = this.labelMatrix[columnIndex]
      const rowHeight = columnBounds.height / columnLabels.length

      const columnContainer = this.parentContainer.append('g')
        .classed(`column-${columnIndex}`, true)
        .classed(this.groupName, true)
        .attr('transform', this.buildTransform(columnBounds))

      const textAnchor = {
        l: 'start',
        c: 'middle',
        r: 'end'
      }

      const xOffset = {
        l: 0,
        c: columnBounds.width / 2,
        r: columnBounds.width
      }

      const cells = columnContainer.selectAll('g')
        .data(columnLabels)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0,${rowHeight * i})`)

      const textSelection = cells.append('text')
        .classed('column-text', true)
        .style('font-size', this.fontSize)
        .style('fill', this.fontColor)
        .style('font-family', this.fontFamily)
        .attr('y', rowHeight / 2)
        .attr('x', xOffset[this.alignments[columnIndex]] || xOffset['l'])
        .attr('dominant-baseline', 'middle')
        .style('text-anchor', textAnchor[this.alignments[columnIndex]] || textAnchor['l'])
        .text(d => d)
      this.textSelections.push(textSelection)

      cells.append('rect')
        .classed('click-rect', true)
        .attr('width', columnBounds.width)
        .attr('height', rowHeight)
        .attr('fill', 'transparent')
        .attr('stroke', 'transparent')
        .on('click', (d, i) => {
          console.log('rect click')
          this.controller.columnCellClick(i)
          d3.event.stopPropagation()
        })
    })
  }

  updateHighlights ({ row = null } = {}) {
    this.textSelections.forEach(textSelection => {
      textSelection
        .classed('highlight', (d, i) => (row === i))
    })
  }
}

module.exports = ColumnGroup
