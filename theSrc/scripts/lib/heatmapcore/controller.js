import d3 from 'd3'

class Controller {
  constructor () {
    this._events = d3.dispatch('highlight', 'datapoint_hover', 'transform')
    this._highlight = {x: null, y: null}
    this._datapoint_hover = {x: null, y: null, value: null}
    this._transform = null
  }

  highlight (x, y) {
    // Copy for safety
    if (!arguments.length) return {x: this._highlight.x, y: this._highlight.y}

    if (arguments.length === 1) {
      this._highlight = x
    } else {
      this._highlight = {x: x, y: y}
    }
    this._events.highlight.call(this, this._highlight)
  }

  datapoint_hover (_) { // eslint-disable-line camelcase
    if (!arguments.length) return this._datapoint_hover
    this._datapoint_hover = _
    this._events.datapoint_hover.call(this, _)
  }

  transform (_) {
    if (!arguments.length) return this._transform
    this._transform = _
    this._events.transform.call(this, _)
  }

  on (evt, callback) {
    this._events.on(evt, callback)
  }
}

module.exports = Controller
