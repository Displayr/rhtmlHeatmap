import _ from 'lodash'
import * as rootLog from 'loglevel'
const layoutLogger = rootLog.getLogger('layout')

const cells = {
  TITLE: 'TITLE',
  SUBTITLE: 'SUBTITLE',
  FOOTER: 'FOOTER',
  LEFT_COLUMN_TITLE: 'LEFT_COLUMN_TITLE',
  TOP_LEFT_COLUMN_SUBTITLE: 'TOP_LEFT_COLUMN_SUBTITLE',
  BOTTOM_LEFT_COLUMN_SUBTITLE: 'BOTTOM_LEFT_COLUMN_SUBTITLE',
  LEFT_COLUMN: 'LEFT_COLUMN',
  RIGHT_COLUMN_TITLE: 'RIGHT_COLUMN_TITLE',
  TOP_RIGHT_COLUMN_SUBTITLE: 'TOP_RIGHT_COLUMN_SUBTITLE',
  BOTTOM_RIGHT_COLUMN_SUBTITLE: 'BOTTOM_RIGHT_COLUMN_SUBTITLE',
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
  COLORMAP: 'COLORMAP',
  RIGHT_MARGIN: 'RIGHT_MARGIN', // only enabled when requested by another cell
}

const LayoutColumns = [
  { name: 'LEFT_DENDROGRAM', cells: [cells.LEFT_DENDROGRAM] },
  { name: 'LEFT_YAXIS_TITLE', cells: [cells.LEFT_YAXIS_TITLE] },
  { name: 'LEFT_YAXIS', cells: [cells.LEFT_YAXIS] },
  { name: 'LEFT_COLUMN', cells: [cells.LEFT_COLUMN_TITLE, cells.TOP_LEFT_COLUMN_SUBTITLE, cells.LEFT_COLUMN, cells.BOTTOM_LEFT_COLUMN_SUBTITLE] },
  { name: 'COLORMAP', cells: [cells.TITLE, cells.SUBTITLE, cells.TOP_XAXIS_TITLE, cells.TOP_XAXIS, cells.TOP_DENDROGRAM, cells.COLORMAP, cells.BOTTOM_XAXIS, cells.BOTTOM_XAXIS_TITLE, cells.FOOTER] },
  { name: 'RIGHT_COLUMN', cells: [cells.RIGHT_COLUMN_TITLE, cells.TOP_RIGHT_COLUMN_SUBTITLE, cells.RIGHT_COLUMN, cells.BOTTOM_RIGHT_COLUMN_SUBTITLE] },
  { name: 'RIGHT_YAXIS', cells: [cells.RIGHT_YAXIS] },
  { name: 'RIGHT_YAXIS_TITLE', cells: [cells.RIGHT_YAXIS_TITLE] },
  { name: 'COLOR_LEGEND', cells: [cells.COLOR_LEGEND] },
  { name: 'RIGHT_MARGIN', cells: [cells.RIGHT_MARGIN], margin: true },
]

const LayoutRows = [
  { name: 'TITLE', cells: [cells.TITLE] },
  { name: 'SUBTITLE', cells: [cells.SUBTITLE] },
  { name: 'TOP_DENDROGRAM', cells: [cells.TOP_DENDROGRAM] },
  { name: 'TOP_COLUMN_TITLES', cells: [cells.LEFT_COLUMN_TITLE, cells.TOP_XAXIS_TITLE, cells.RIGHT_COLUMN_TITLE] },
  { name: 'TOP_COLUMN_LABELS', cells: [cells.TOP_LEFT_COLUMN_SUBTITLE, cells.TOP_XAXIS, cells.TOP_RIGHT_COLUMN_SUBTITLE] },
  { name: 'COLORMAP', cells: [cells.LEFT_DENDROGRAM, cells.LEFT_YAXIS_TITLE, cells.LEFT_YAXIS, cells.LEFT_COLUMN, cells.COLORMAP, cells.RIGHT_COLUMN, cells.RIGHT_YAXIS, cells.RIGHT_YAXIS_TITLE, cells.COLOR_LEGEND, cells.RIGHT_MARGIN] },
  { name: 'BOTTOM_COLUMN_LABELS', cells: [cells.BOTTOM_LEFT_COLUMN_SUBTITLE, cells.BOTTOM_XAXIS, cells.BOTTOM_RIGHT_COLUMN_SUBTITLE] },
  { name: 'BOTTOM_COLUMN_TITLES', cells: [cells.BOTTOM_XAXIS_TITLE] },
  { name: 'FOOTER', cells: [cells.FOOTER] },
]

class Layout {
  constructor (canvasWidth, canvasHeight, padding = 0) {
    this.cellInfo = _.transform(_.keys(cells), (result, key) => {
      result[key] = {
        name: key,
        enabled: false,
        fill: false,
        width: 0,
        height: 0,
        meta: {},
      }
    }, {})

    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.padding = padding
    this.outerPadding = 2

    // non-standard / cant be modelled exceptions, that are run once all components are registered
    //   contains things where one cell depends on presence or absence of other cells
    this.specialRules = [
      this.applyConditionRightmostMargins.bind(this),
    ]
  }

  enable (cell) {
    this._throwIfNotValidCell(cell)
    this.cellInfo[cell].enabled = true
  }

  disable (cell) {
    this._throwIfNotValidCell(cell)
    this.cellInfo[cell].enabled = false
  }

  enabled (cell) {
    // TODO NB make these 'virtual cell lookups' better :
    if (cell === 'XAXIS') { return this.enabled(cells.TOP_XAXIS) || this.enabled(cells.BOTTOM_XAXIS) }
    if (cell === 'XAXIS_TITLE') { return this.enabled(cells.TOP_XAXIS_TITLE) || this.enabled(cells.BOTTOM_XAXIS_TITLE) }
    if (cell === 'YAXIS') { return this.enabled(cells.LEFT_YAXIS) || this.enabled(cells.RIGHT_YAXIS) }
    if (cell === 'YAXIS_TITLE') { return this.enabled(cells.LEFT_YAXIS_TITLE) || this.enabled(cells.RIGHT_YAXIS_TITLE) }

    this._throwIfNotValidCell(cell)
    return this.cellInfo[cell].enabled
  }

  isRightmost (cell) {
    const columnName = this._findColumnFromCell(cell)
    const enabledColumnsToRight = this._getEnabledColumnsAfterColumn(columnName, { includeMargins: false })
    return enabledColumnsToRight.length === 0
  }

  getSpaceToTheRightOf (cell) {
    const columnName = this._findColumnFromCell(cell)
    const enabledColumnsToRight = this._getEnabledColumnsAfterColumn(columnName, { includeMargins: false })
    return _(enabledColumnsToRight).map(this._getColumnWidth.bind(this)).sum()
  }

  setFillCell (cell) {
    this._throwIfNotValidCell(cell)
    const existingFillCell = _.find(this.cellInfo, { fill: true }, null)
    if (existingFillCell) { throw new Error('Can only have one fill cell') }
    this.cellInfo[cell].fill = true
  }

  setPreferredDimensions (cell, dimensions) {
    this._throwIfNotValidCell(cell)
    this.cellInfo[cell].width = dimensions.width
    this.cellInfo[cell].height = dimensions.height
    this.cellInfo[cell].conditional = (_.has(dimensions, 'conditional')) ? dimensions.conditional : null
  }

  getCellBounds (cellName) {
    this._throwIfNotEnabled(cellName)
    return this._getCellBounds(cellName)
  }

  getEstimatedCellBounds (cellName) {
    return this._getCellBounds(cellName)
  }

  _getCellBounds (cellName) {
    layoutLogger.debug(`enter layout.getCellBounds(${cellName})`)
    const rowName = this._findRowFromCell(cellName)
    const columnName = this._findColumnFromCell(cellName)
    const rowsAbove = this._getEnabledRowsBeforeRow(rowName)
    const columnsBefore = this._getEnabledColumnsBeforeColumn(columnName)

    let left = this.outerPadding + _(columnsBefore)
      .map(columnName => this._getColumnWidth(columnName) + this.padding)
      .sum()

    let top = this.outerPadding + _(rowsAbove)
      .map(rowName => this._getRowHeight(rowName) + this.padding)
      .sum()

    const width = this._getColumnWidth(columnName)
    const height = this._getRowHeight(rowName)

    if (width === 0) { console.warn(`returning zero width for getCellBounds(${cellName})`) }
    if (height === 0) { console.warn(`returning zero height for getCellBounds(${cellName})`) }

    layoutLogger.debug(`layout.getCellBounds(${cellName}) ->`, { width, height, top, left })
    return { width, height, top, left, canvasWidth: this.canvasWidth, canvasHeight: this.canvasHeight }
  }

  _getRow (rowName) {
    const match = _.find(LayoutRows, { name: rowName })
    if (!match) { throw new Error(`Invalid row: ${rowName}`) }
    return match
  }

  _getColumn (columnName) {
    const match = _.find(LayoutColumns, { name: columnName })
    if (!match) { throw new Error(`Invalid column: ${columnName}`) }
    return match
  }

  _getRowHeight (rowName) {
    const row = this._getRow(rowName)
    const rowHeight = _(row.cells)
      .map(cellName => this.cellInfo[cellName])
      .filter({ enabled: true })
      .map(cellInfo => (cellInfo.fill) ? this._getHeightOfFillCell(cellInfo.name, rowName) : cellInfo.height)
      .max()
    layoutLogger.debug(`layout._getRowHeight(${rowName}) ->`, rowHeight || 0)
    return rowHeight || 0
  }

  _getColumnWidth (columnName) {
    const column = this._getColumn(columnName)
    const columnWidth = _(column.cells)
      .map(cellName => this.cellInfo[cellName])
      .filter({ enabled: true })
      .map(cellInfo => (cellInfo.fill) ? this._getWidthOfFillCell(cellInfo.name, columnName) : this._getWidthOfFixedCell(cellInfo.name))
      .max()
    layoutLogger.debug(`layout._getColumnWidth(${columnName}) ->`, columnWidth || 0)
    return columnWidth || 0
  }

  _getWidthOfFillCell (cellName, columnName) {
    const otherColumns = _.filter(LayoutColumns, (column) => column.name !== columnName && this._columnEnabled(column.name))
    const allocatedWidth = _(otherColumns)
      .map(otherColumn => this._getColumnWidth(otherColumn.name))
      .sum() + otherColumns.length * this.padding + 2 * this.outerPadding
    layoutLogger.debug(`layout._getWidthOfFillCell(${cellName}, ${columnName}) ->`, this.canvasWidth - allocatedWidth)
    return this.canvasWidth - allocatedWidth
  }

  _getHeightOfFillCell (cellName, rowName) {
    const otherRows = _.filter(LayoutRows, (row) => row.name !== rowName && this._rowEnabled(row.name))
    const allocatedHeight = _(otherRows)
      .map(otherRow => this._getRowHeight(otherRow.name))
      .sum() + otherRows.length * this.padding + 2 * this.outerPadding
    layoutLogger.debug(`layout._getHeightOfFillCell(${cellName}, ${rowName}) ->`, this.canvasHeight - allocatedHeight)
    return this.canvasHeight - allocatedHeight
  }

  _getWidthOfFixedCell (cellName) {
    return this.cellInfo[cellName].width
  }

  // TODO for symmetry add _getHeightOfFixedCell

  _rowEnabled (rowName) {
    const row = this._getRow(rowName)
    return _.some(row.cells, (cellName) => this.cellInfo[cellName].enabled)
  }

  _columnEnabled (columnName) {
    const column = this._getColumn(columnName)
    return _.some(column.cells, (cellName) => this.cellInfo[cellName].enabled)
  }

  _findRowFromCell (cellName) {
    const match = _.find(LayoutRows, ({ cells }) => cells.includes(cellName))
    if (match) { return match.name }
    throw new Error(`Invalid cell name ${cellName} : not in any rows`)
  }

  _findColumnFromCell (cellName) {
    const match = _.find(LayoutColumns, ({ cells }) => cells.includes(cellName))
    if (match) { return match.name }
    throw new Error(`Invalid cell name ${cellName} : not in any columns`)
  }

  _getEnabledRowsBeforeRow (rowName, { includeMargins = true } = {}) {
    let foundRowName = false
    return _(LayoutRows)
      .filter(({ name }) => {
        if (name === rowName) { foundRowName = true }
        return !foundRowName
      })
      .filter(({ type }) => includeMargins || type !== 'margin')
      .map('name')
      .filter(rowName => this._rowEnabled(rowName))
      .value()
  }

  _getEnabledColumnsBeforeColumn (columnName, { includeMargins = true } = {}) {
    let foundColumnName = false
    return _(LayoutColumns)
      .filter(({ name }) => {
        if (name === columnName) { foundColumnName = true }
        return !foundColumnName
      })
      .filter(({ type }) => includeMargins || type !== 'margin')
      .map('name')
      .filter(columnName => this._columnEnabled(columnName))
      .value()
  }

  _getEnabledColumnsAfterColumn (columnName, { includeMargins = true } = {}) {
    let foundColumnName = false
    return _(LayoutColumns)
      .filter(({ name }) => {
        if (name === columnName) { foundColumnName = true }
        return foundColumnName && name !== columnName
      })
      .filter(({ type }) => includeMargins || type !== 'margin')
      .map('name')
      .filter(columnName => this._columnEnabled(columnName))
      .value()
  }

  allComponentsRegistered () {
    this.applySpecialRules()
    layoutLogger.debug(`allComponentsRegistered. Cell info:`)
    layoutLogger.debug(JSON.stringify(this.cellInfo, {}, 2))
  }

  applySpecialRules () {
    this.specialRules.forEach(rule => rule())
  }

  applyConditionRightmostMargins () {
    _.forEach(this.cellInfo, (celldata, cellName) => {
      if (this.enabled(cellName) && this.isRightmost(cellName) && _.has(celldata, 'conditional.rightmostMargin')) {
        layoutLogger.info(`cellName ${cellName} is rightmost and has rightmostMargin, adding right margin of ${celldata.conditional.rightmostMargin}`)
        this.enable(cells.RIGHT_MARGIN)

        // the "subtract" this.padding is corny but keeps things a lot simpler in other areas of the code
        const existingRightMarginWidth = _.get(this.cellInfo[cells.RIGHT_MARGIN], 'width', 0)
        this.setPreferredDimensions(cells.RIGHT_MARGIN, {
          width: Math.max(existingRightMarginWidth, celldata.conditional.rightmostMargin - this.padding),
          height: 0,
        })
      }
    })
  }

  _throwIfNotValidCell (cell) {
    if (!_.has(cells, cell)) { throw new Error(`Invalid cell: ${cell}`) }
  }

  _throwIfNotEnabled (cell) {
    this._throwIfNotValidCell(cell)
    if (!this.cellInfo[cell].enabled) { throw new Error(`Cannot getCellBounds(${cell}): not enabled`) }
  }
}

module.exports = { Layout, CellNames: cells }
