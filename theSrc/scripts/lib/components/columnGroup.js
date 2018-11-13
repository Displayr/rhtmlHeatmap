import BaseComponent from './baseComponent'
import _ from 'lodash'
import d3 from "d3";


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
      const textWidths = []

      const dummy_g = this.parentContainer.append('g')
      dummy_g
        .selectAll('.dummy_column')
        .data(columnLabels)
        .enter()
        .append('text')
        .text(function (d) { return d })
        .style('font-family', this.fontFamily)
        .style('font-size', this.fontSize)
        .each(function (d, i) { textWidths.push(this.getComputedTextLength()) })

      dummy_g.remove()
      return _.min([this.maxSingleColumnWidth, _.max(textWidths)])
    })
    console.log('this.columnWidths')
    console.log(JSON.stringify(this.columnWidths, {}, 2))

    return { width: _.sum(this.columnWidths), height: 0 } // accept what height we are given
  }

  draw (columnGroupBounds) {
    let cumulativeWidth = 0
    this.columnWidths.forEach((individualWidth, columnIndex) => {
      const columnBounds = {
        top: columnGroupBounds.top,
        left: columnGroupBounds.left + cumulativeWidth,
        width: individualWidth,
        height: columnGroupBounds.height
      }
      cumulativeWidth += individualWidth

      const columnLabels = this.labelMatrix[columnIndex]
      const rowHeight = columnBounds.height / columnLabels.length

      const columnContainer = this.parentContainer.append('g')
        .classed(`column-${columnIndex}`, true)
        .classed(this.groupName, true)
        .attr('transform', this.buildTransform(columnBounds))

      // TODO handle l,c,r alignment
      // const axisOffsets = {
      //   l: 'translate(0,0)',
      //   c: 'translate(' + columnBounds.width / 2 + ',0)',
      //   r: 'translate(' + (columnBounds.width - this.padding) + ',0)'
      // }

      const textAnchor = {
        l: 'start',
        c: 'middle',
        r: 'end'
      }

      const cells = columnContainer.selectAll('g')
        .data(columnLabels)
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(0,${rowHeight * i})`)

      cells.append('text')
        .style('opacity', 1)
        .style('font-size', this.fontSize)
        .style('fill', this.fontColor)
        .style('font-family', this.fontFamily)
        .attr('y', rowHeight / 2)
        .attr('dominant-baseline', 'middle')
        .style('text-anchor', textAnchor[this.alignments[columnIndex]] || textAnchor['l'])
        .text(d => d)

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
}

module.exports = ColumnGroup
