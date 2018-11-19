const _ = require('lodash')

const cells = {
  LEFT_COLUMN_TITLE: 'LEFT_COLUMN_TITLE',
  LEFT_COLUMN_SUBTITLE: 'LEFT_COLUMN_SUBTITLE',
  LEFT_COLUMN: 'LEFT_COLUMN',
  RIGHT_COLUMN_TITLE: 'RIGHT_COLUMN_TITLE',
  RIGHT_COLUMN_SUBTITLE: 'RIGHT_COLUMN_SUBTITLE',
  RIGHT_COLUMN: 'RIGHT_COLUMN',
  TOP_XAXIS: 'TOP_XAXIS',
  TOP_XAXIS_TITLE: 'TOP_XAXIS_TITLE',
  BOTTOM_XAXIS: 'BOTTOM_XAXIS',
  BOTTOM_XAXIS_TITLE: 'BOTTOM_XAXIS_TITLE',
  LEFT_YAXIS: 'LEFT_YAXIS',
  LEFT_YAXIS_TITLE: 'LEFT_YAXIS_TITLE',
  RIGHT_YAXIS: 'RIGHT_YAXIS',
  RIGHT_YAXIS_TITLE: 'RIGHT_YAXIS_TITLE',
  TOP_DENDROGRAM: 'TOP_DENDROGRAM',
  LEFT_DENDROGRAM: 'LEFT_DENDROGRAM',
  COLOR_LEGEND: 'COLOR_LEGEND',
  COLORMAP: 'COLORMAP'
}

const HeatmapColumns = [
  { name: 'LEFT_DENDROGRAM', cells: [cells.LEFT_DENDROGRAM] },
  { name: 'LEFT_YAXIS_TITLE', cells: [cells.LEFT_YAXIS_TITLE] },
  { name: 'LEFT_YAXIS', cells: [cells.LEFT_YAXIS] },
  { name: 'LEFT_COLUMN', cells: [cells.LEFT_COLUMN_TITLE, cells.LEFT_COLUMN_SUBTITLE, cells.LEFT_COLUMN] },
  { name: 'COLORMAP', cells: [cells.TOP_XAXIS_TITLE, cells.TOP_XAXIS, cells.TOP_DENDROGRAM, cells.COLORMAP, cells.BOTTOM_XAXIS, cells.BOTTOM_XAXIS_TITLE] },
  { name: 'RIGHT_COLUMN', cells: [cells.RIGHT_COLUMN_TITLE, cells.RIGHT_COLUMN_SUBTITLE, cells.RIGHT_COLUMN] },
  { name: 'RIGHT_YAXIS', cells: [cells.RIGHT_YAXIS] },
  { name: 'RIGHT_YAXIS_TITLE', cells: [cells.RIGHT_YAXIS_TITLE] },
  { name: 'COLOR_LEGEND', cells: [cells.COLOR_LEGEND] }
]

const HeatmapRows = [
  { name: 'TOP_DENDROGRAM', cells: [cells.TOP_DENDROGRAM] },
  { name: 'TOP_COLUMN_TITLES', cells: [cells.LEFT_COLUMN_TITLE, cells.TOP_XAXIS_TITLE, cells.RIGHT_COLUMN_TITLE] },
  { name: 'TOP_COLUMN_LABELS', cells: [cells.LEFT_COLUMN_SUBTITLE, cells.TOP_XAXIS, cells.RIGHT_COLUMN_SUBTITLE] },
  { name: 'COLORMAP', cells: [cells.LEFT_DENDROGRAM, cells.LEFT_YAXIS_TITLE, cells.LEFT_YAXIS, cells.LEFT_COLUMN, cells.COLORMAP, cells.RIGHT_COLUMN, cells.RIGHT_YAXIS, cells.RIGHT_YAXIS_TITLE, cells.COLOR_LEGEND] },
  { name: 'BOTTOM_COLUMN_LABELS', cells: [cells.BOTTOM_XAXIS] },
  { name: 'BOTTOM_COLUMN_TITLES', cells: [cells.BOTTOM_XAXIS_TITLE] }
]

class HeatmapLayout {
  constructor (canvasWidth, canvasHeight, padding = 0) {
    this.cellInfo = _.transform(_.keys(cells), (result, key) => {
      result[key] = {
        name: key,
        enabled: false,
        fill: false,
        width: 0,
        height: 0,
        meta: {}
      }
    }, {})

    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.padding = padding
    this.outerPadding = 2
  }

  enable (cell) {
    this.throwIfNotValidCell(cell)
    this.cellInfo[cell].enabled = true
  }

  disable (cell) {
    this.throwIfNotValidCell(cell)
    this.cellInfo[cell].enabled = false
  }

  enabled (cell) {
    // TODO NB make these 'virtual cell lookups' better :
    if (cell === 'XAXIS') { return this.enabled(cells.TOP_XAXIS) || this.enabled(cells.BOTTOM_XAXIS) }
    if (cell === 'XAXIS_TITLE') { return this.enabled(cells.TOP_XAXIS_TITLE) || this.enabled(cells.BOTTOM_XAXIS_TITLE) }
    if (cell === 'YAXIS') { return this.enabled(cells.LEFT_YAXIS) || this.enabled(cells.RIGHT_YAXIS) }
    if (cell === 'YAXIS_TITLE') { return this.enabled(cells.LEFT_YAXIS_TITLE) || this.enabled(cells.RIGHT_YAXIS_TITLE) }

    this.throwIfNotValidCell(cell)
    return this.cellInfo[cell].enabled
  }

  setFillCell (cell) {
    this.throwIfNotValidCell(cell)
    const existingFillCell = _.find(this.cellInfo, {fill: true}, null)
    if (existingFillCell) { throw new Error('Can only have one fill cell') }
    this.cellInfo[cell].fill = true
  }

  setCellDimensions (cell, dimensions, maybeHeight) {
    this.throwIfNotValidCell(cell)
    this.cellInfo[cell].width = (typeof dimensions === 'object') ? dimensions.width : dimensions
    this.cellInfo[cell].height = (typeof dimensions === 'object') ? dimensions.height : maybeHeight
  }

  setCellWidth (cell, width) {
    this.throwIfNotValidCell(cell)
    this.cellInfo[cell].width = width
  }

  setCellHeight (cell, height) {
    this.throwIfNotValidCell(cell)
    this.cellInfo[cell].height = height
  }

  addCellMeta (cell, meta) {
    this.throwIfNotValidCell(cell)
    this.cellInfo[cell].meta = _.merge(this.cellInfo[cell].meta, meta)
  }

  getCellMeta (cell) {
    this.throwIfNotValidCell(cell)
    return this.cellInfo[cell].meta
  }

  getRow (row) {
    const match = _.find(HeatmapRows, {name: row})
    if (!match) { throw new Error(`Invalid heatmap row: ${row}`) }
    return match
  }

  getColumn (column) {
    const match = _.find(HeatmapColumns, {name: column})
    if (!match) { throw new Error(`Invalid heatmap column: ${column}`) }
    return match
  }

  getRowHeight (rowName) {
    const row = this.getRow(rowName)

    return _(row.cells)
      .map(cellName => this.cellInfo[cellName])
      .filter({ enabled: true })
      .map(cellInfo => (cellInfo.fill) ? this.getHeightOfFillCell(cellInfo.name, rowName) : cellInfo.height)
      .max()
  }

  getColumnWidth (columnName) {
    const column = this.getColumn(columnName)
    return _(column.cells)
      .map(cellName => this.cellInfo[cellName])
      .filter({ enabled: true })
      .map(cellInfo => (cellInfo.fill) ? this.getWidthOfFillCell(cellInfo.name, columnName) : cellInfo.width)
      .max()
  }

  getWidthOfFillCell (cellName, columnName) {
    const otherColumns = _.filter(HeatmapColumns, (column) => column.name !== columnName)
    const allocatedWidth = _(otherColumns)
      .map(otherColumn => this.getColumnWidth(otherColumn.name))
      .sum() + (otherColumns.length - 1) * this.padding + 2 * this.outerPadding
    return this.canvasWidth - allocatedWidth
  }

  getHeightOfFillCell (cellName, rowName) {
    const otherRows = _.filter(HeatmapRows, (row) => row.name !== rowName)
    const allocatedHeight = _(otherRows)
      .map(otherRow => this.getRowHeight(otherRow.name))
      .sum() + (otherRows.length - 1) * this.padding + 2 * this.outerPadding
    return this.canvasHeight - allocatedHeight
  }

  rowEnabled (rowName) {
    const row = this.getRow(rowName)
    return _.some(row.cells, (cellName) => this.cellInfo[cellName].enabled)
  }

  columnEnabled (columnName) {
    const column = this.getColumn(columnName)
    return _.some(column.cells, (cellName) => this.cellInfo[cellName].enabled)
  }

  findRowFromCell (cellName) {
    const match = _.find(HeatmapRows, ({ cells }) => cells.includes(cellName))
    if (match) { return match.name }
    throw new Error(`Invalid cell name ${cellName} : not in any rows`)
  }

  getCellBounds (cellName) {
    this.throwIfNotEnabled(cellName)
    const rowName = this.findRowFromCell(cellName)
    const columnName = this.findColumnFromCell(cellName)
    const rowsAbove = this.getEnabledRowsBeforeRow(rowName)
    const columnsBefore = this.getEnabledColumnsBeforeColumn(columnName)

    let left = this.outerPadding + _(columnsBefore)
      .map(columnName => this.getColumnWidth(columnName) + this.padding)
      .sum()

    let top = this.outerPadding + _(rowsAbove)
      .map(rowName => this.getRowHeight(rowName) + this.padding)
      .sum()

    const width = this.getColumnWidth(columnName)
    const height = this.getRowHeight(rowName)

    if (width === 0) { console.warn(`returning zero width for getCellBounds(${cellName})`) }
    if (height === 0) { console.warn(`returning zero height for getCellBounds(${cellName})`) }

    console.log(`getCellBounds(${cellName}) -> w: ${width}, h: ${height}, t: ${top.toFixed(2)}, l: ${left.toFixed(2)}`)
    return {width, height, top, left}
  }

  findColumnFromCell (cellName) {
    const match = _.find(HeatmapColumns, ({ cells }) => cells.includes(cellName))
    if (match) { return match.name }
    throw new Error(`Invalid cell name ${cellName} : not in any columns`)
  }

  getEnabledRowsBeforeRow (rowName) {
    let foundRowName = false
    return _(HeatmapRows)
      .filter(({name}) => {
        if (name === rowName) { foundRowName = true }
        return !foundRowName
      })
      .map('name')
      .filter(rowName => this.rowEnabled(rowName))
      .value()
  }

  getEnabledColumnsBeforeColumn (columnName) {
    let foundColumnName = false
    return _(HeatmapColumns)
      .filter(({name}) => {
        if (name === columnName) { foundColumnName = true }
        return !foundColumnName
      })
      .map('name')
      .filter(columnName => this.columnEnabled(columnName))
      .value()
  }

  throwIfNotValidCell (cell) {
    if (!_.has(cells, cell)) { throw new Error(`Invalid heatmap cell: ${cell}`) }
  }

  throwIfNotEnabled (cell) {
    this.throwIfNotValidCell(cell)
    if (!this.cellInfo[cell].enabled) { throw new Error(`Cannot getCellBounds(${cell}): not enabled`) }
  }
}

module.exports = { HeatmapLayout, CellNames: cells }
