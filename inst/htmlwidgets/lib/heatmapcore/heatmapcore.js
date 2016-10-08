function heatmap(selector, data, options) {

  // ==== BEGIN HELPERS =================================

  function htmlEscape(str) {
    return (str+"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Given a list of widths/heights and a total width/height, provides
  // easy access to the absolute top/left/width/height of any individual
  // grid cell. Optionally, a single cell can be specified as a "fill"
  // cell, meaning it will take up any remaining width/height.
  //
  // rows and cols are arrays that contain numeric pixel dimensions,
  // and up to one "*" value.
  function GridSizer(widths, heights, /*optional*/ totalWidth, /*optional*/ totalHeight) {
    this.widths = widths;
    this.heights = heights;

    var fillColIndex = null;
    var fillRowIndex = null;
    var usedWidth = 0;
    var usedHeight = 0;
    var i;
    for (i = 0; i < widths.length; i++) {
      if (widths[i] === "*") {
        if (fillColIndex !== null) {
          throw new Error("Only one column can be designated as fill");
        }
        fillColIndex = i;
      } else {
        usedWidth += widths[i];
      }
    }
    if (fillColIndex !== null) {
      widths[fillColIndex] = totalWidth - usedWidth;
    } else {
      if (typeof(totalWidth) === "number" && totalWidth !== usedWidth) {
        throw new Error("Column widths don't add up to total width");
      }
    }
    for (i = 0; i < heights.length; i++) {
      if (heights[i] === "*") {
        if (fillRowIndex !== null) {
          throw new Error("Only one row can be designated as fill");
        }
        fillRowIndex = i;
      } else {
        usedHeight += heights[i];
      }
    }
    if (fillRowIndex !== null) {
      heights[fillRowIndex] = totalHeight - usedHeight;
    } else {
      if (typeof(totalHeight) === "number" && totalHeight !== usedHeight) {
        throw new Error("Column heights don't add up to total height");
      }
    }
  }

  GridSizer.prototype.getCellBounds = function(x, y) {
    if (x < 0 || x >= this.widths.length || y < 0 || y >= this.heights.length)
      throw new Error("Invalid cell bounds");

    var left = 0;
    for (var i = 0; i < x; i++) {
      left += this.widths[i];
    }

    var top = 0;
    for (var j = 0; j < y; j++) {
      top += this.heights[j];
    }

    return {
      width: this.widths[x],
      height: this.heights[y],
      top: top,
      left: left
    }
  }

  // ==== END HELPERS ===================================


  var el = d3.select(selector);

  var bbox = el.node().getBoundingClientRect();

  var Controller = function() {
    this._events = d3.dispatch("highlight", "datapoint_hover", "transform");
    this._highlight = {x: null, y: null};
    this._datapoint_hover = {x: null, y: null, value: null};
    this._transform = null;
  };
  (function() {
    this.highlight = function(x, y) {
      // Copy for safety
      if (!arguments.length) return {x: this._highlight.x, y: this._highlight.y};

      if (arguments.length == 1) {
        this._highlight = x;
      } else {
        this._highlight = {x: x, y: y};
      }
      this._events.highlight.call(this, this._highlight);
    };

    this.datapoint_hover = function(_) {
      if (!arguments.length) return this._datapoint_hover;

      this._datapoint_hover = _;
      this._events.datapoint_hover.call(this, _);
    };

    this.transform = function(_) {
      if (!arguments.length) return this._transform;
      this._transform = _;
      this._events.transform.call(this, _);
    };

    this.on = function(evt, callback) {
      this._events.on(evt, callback);
    };
  }).call(Controller.prototype);

  var controller = new Controller();

  // Set option defaults & copy settings
  var opts = {};
  options = options || {};
  opts.shownote_in_cell = options.shownote_in_cell;

  opts.width = options.width || bbox.width;
  opts.height = options.height || bbox.height;
  opts.link_color = opts.link_color || "#AAA";
  opts.axis_padding = options.axis_padding || 6;
  opts.show_grid = options.show_grid;
  if (typeof(opts.show_grid) === 'undefined') {
    opts.show_grid = true;
  }
  opts.brush_color = options.brush_color || "#0000FF";

  opts.extra_tooltip_info = options.extra_tooltip_info;
  opts.tip_font_size = options.tip_font_size || 11;
  opts.cell_font_size = options.cell_font_size || 15;
  opts.xaxis_offset = options.xaxis_offset || 20;
  opts.yaxis_offset = options.yaxis_offset || 20;
  opts.xaxis_font_size = options.xaxis_font_size;
  opts.yaxis_font_size = options.yaxis_font_size;
  opts.xaxis_location = options.xaxis_location;
  opts.yaxis_location = options.yaxis_location;
  opts.xaxis_title = options.xaxis_title;
  opts.yaxis_title = options.yaxis_title;
  opts.xaxis_title_font_size = options.xaxis_title_font_size;
  opts.yaxis_title_font_size = options.yaxis_title_font_size;
  opts.anim_duration = options.anim_duration;
  if (typeof(opts.anim_duration) === 'undefined') {
    opts.anim_duration = 500;
  }

  opts.left_columns = options.left_columns;
  opts.left_columns_font_size = options.left_columns_font_size;
  opts.right_columns = options.right_columns;
  opts.right_columns_font_size = options.right_columns_font_size;
  opts.xaxis_hidden = options.xaxis_hidden;
  opts.yaxis_hidden = options.yaxis_hidden;

  opts.row_element_names = ["*"];
  opts.col_element_names = ["*"];
  opts.row_element_map = {};
  opts.col_element_map = {};
  opts.row_element_map["*"] = "*";
  opts.col_element_map["*"] = "*";

  opts.xlabs_raw = [];
  opts.xlabs_mod = [];
  opts.ylabs_raw = [];
  opts.ylabs_mod = [];

  // get the number of rows and columns for the GridSizer

  (function() {
    var inner = el.append("div").classed("inner", true);
    var info = inner.append("div").classed("info", true);


    var compute_col_text_widths = function(input, text_widths, left_or_right) {
      var dummySvg = inner.append("svg");
      var dummy_g = dummySvg
        .append("g")
        .classed("dummy_g", true);

      var dummy_cols = dummy_g
        .selectAll(".dummy")
        .data(input);

      var dummy_cols_each = dummy_cols.enter()
        .append("g")
        .attr("data-index", function(d,i) { return i;})
        .selectAll(".dummy")
        .data(function(d) {return d;});

      dummy_cols_each.enter()
        .append("text")
        .text(function(d){return d;})
        .style("font-family", "sans-serif")
        .style("font-size", left_or_right ? opts.left_columns_font_size : opts.right_columns_font_size)
        .each(function(d,i) {
          var parent_index = this.parentNode.attr("data-index");
          text_widths[parent_index] += this.getComputedTextLength();
        });

      dummySvg.remove();
    };

    var compute_axis_label_dim = function(input, x_or_y) {
      var dummySvg = inner.append("svg");
      var dummy_g = dummySvg
        .append("g")
        .attr("class", "axis");

      var texts = dummy_g
        .selectAll("text")
        .data(input);

      texts.enter()
        .append("text")
        .text(function(d) { return d;})
        .style("font-size", x_or_y ? opts.xaxis_font_size : opts.yaxis_font_size);

      var text_length = 0, text_lengths = [], text_hash = {};

      texts.each(function(d, i) {

        var current_len = this.getBBox().width;
        current_len = x_or_y ?
          current_len / 1.4 + opts.xaxis_offset + opts.axis_padding :
          current_len + opts.yaxis_offset + opts.axis_padding;
        text_lengths.push(current_len);
        text_length = text_length < current_len ? current_len : text_length;
      });

      var output;

      if (x_or_y) {
        output = text_length > opts.height / 3 ? opts.height / 3 : text_length;
      } else {
        output = text_length > opts.width / 3 ? opts.width / 3 : text_length;
      }

      texts.each(function(d,i) {
        var text_array = input[i].split(""),
            new_text = input[i],
            modified_text = input[i],
            new_length,
            c = 0,
            ch;
        while (text_lengths[i] > output && text_array.length > 1) {
          ch = text_array.pop();
          new_text = text_array.join("");

          if (text_hash[new_text]) {
            text_hash[new_text] += 1;
            modified_text = new_text + "...-" + text_hash[new_text]; // make it unique
          } else {
            text_hash[new_text] = 1;
            modified_text = new_text + "...";
          }

          new_length = d3.select(this).text(modified_text).node().getBBox().width;
          new_length = x_or_y ?
            new_length / 1.4 + opts.xaxis_offset + opts.axis_padding :
            new_length + opts.yaxis_offset + opts.axis_padding;
          text_lengths[i] = new_length;
          c++;
        }

        if (c > 0) {
          input[i] = modified_text;
        }
      });

      dummySvg.remove();
      return output;
    };

    var i = 0, j = 0, x_texts, y_texts;
    // deal with x axis and its title
    if (!opts.xaxis_hidden) {
      if (data.cols) {
        opts.xaxis_location = "bottom";
      }

      if (opts.xaxis_location === "bottom") {
        opts.row_element_names.push("xaxis");
      } else {
        opts.row_element_names.unshift("xaxis");
      }

      if (opts.xaxis_title) {
        if (opts.xaxis_location === "bottom") {
          opts.row_element_names.push("xtitle");
        } else {
          opts.row_element_names.unshift("xtitle");
        }
        opts.row_element_map["xtitle"] = opts.xaxis_title_font_size * 1.5 + 5;
      }

      if (data.matrix.cols.length) {
        x_texts = data.matrix.cols;
      } else {
        x_texts = [data.matrix.cols];
      }

      for (i = 0; i < x_texts.length; i++) {
        opts.xlabs_raw.push(x_texts[i]);
        opts.xlabs_mod.push(x_texts[i]);
      }

      opts.row_element_map["xaxis"] = compute_axis_label_dim(opts.xlabs_mod, true);

    }

    if (!opts.yaxis_hidden) {
      if (data.rows) {
        opts.yaxis_location = "right";
      }

      if (opts.yaxis_location === "right") {
        opts.col_element_names.push("yaxis");
      } else {
        opts.col_element_names.unshift("yaxis");
      }

      if (data.matrix.rows.length) {
        y_texts = data.matrix.rows;
      } else {
        y_texts = [data.matrix.rows];
      }

      for (i = 0; i < y_texts.length; i++) {
        opts.ylabs_raw.push(y_texts[i]);
        opts.ylabs_mod.push(y_texts[i]);
      }

      opts.col_element_map["yaxis"] = compute_axis_label_dim(opts.ylabs_mod, false);
      if (!opts.xaxis_hidden) {
        if (opts.yaxis_location === "right") {
          if (opts.row_element_map["xaxis"]/2 > opts.col_element_map["yaxis"]) {
            opts.col_element_map["yaxis"] = opts.row_element_map["xaxis"]/2;
          }
        } else {
          opts.col_element_names.push("yaxis_dummy");
          opts.col_element_map["yaxis_dummy"] = opts.row_element_map["xaxis"]/2;
        }
      }
    } else if (!opts.xaxis_hidden) {
      // keep the space to mitigate the overflow of x axis label
      opts.col_element_names.push("yaxis");
      opts.col_element_map["yaxis"] = opts.row_element_map["xaxis"]/2;
    }

    // row dendrogram, add one more column
    if (data.rows) {
      opts.col_element_names.unshift("row_dendro");
      opts.col_element_map["row_dendro"] = options.yclust_width || opts.width * 0.12;
    }

    // column dendrogram, add one more row
    if (data.cols) {
      opts.row_element_names.unshift("col_dendro");
      opts.row_element_map["col_dendro"] = options.xclust_height || opts.height * 0.12;
    }

    // columns to the left of the main plot data
    if (opts.left_columns) {

      var left_cols_widths = [];
      for (i = 0;i < opts.left_columns.length; i++) {
        left_cols_widths.push(0);
        opts.col_element_names.unshift("left_col" + i);
      }

      // compute mean column width
      compute_col_text_widths(opts.left_columns, left_cols_widths, true);

      for (i = 0;i < opts.left_columns.length; i++) {
        left_cols_widths[i] = left_cols_widths[i] / opts.left_columns[0].length;
        if (left_cols_widths[i] > opts.width * 0.25) {
          left_cols_widths[i] = opts.width * 0.25;
          opts.col_element_map["left_col" + i] = left_cols_widths[i];
        }
      }
    }

    // columns to the right of the main plot data
    if (opts.right_columns) {

      var right_cols_widths = [];
      for (i = 0;i < opts.right_columns.length; i++) {
        right_cols_widths.push(0);
        opts.col_element_names.push("right_col" + i);
      }

      // compute mean column width
      compute_col_text_widths(opts.right_columns, right_cols_widths, false);

      for (i = 0;i < opts.right_columns.length; i++) {
        right_cols_widths[i] = right_cols_widths[i] / opts.right_columns[0].length;
        if (right_cols_widths[i] > opts.width * 0.25) {
          right_cols_widths[i] = opts.width * 0.25;
          opts.col_element_map["right_col" + i] = right_cols_widths[i];
        }
      }
    }

    if (!opts.yaxis_hidden) {
      if (opts.yaxis_title) {
        if (opts.yaxis_location === "right") {
          opts.col_element_names.push("ytitle");
        } else {
          opts.col_element_names.unshift("ytitle");
        }
        opts.col_element_map["ytitle"] = opts.yaxis_title_font_size * 1.5 + 5;
      }
    }

  })();

  /*opts.yclust_width = options.yclust_width || opts.width * 0.12;
  opts.xclust_height = options.xclust_height || opts.height * 0.12;
  opts.topEl_height = opts.xclust_height;
  opts.leftEl_width = opts.yclust_width;*/

  // estimate proper x axis height and y axis width
  /*(function() {
    var inner = el.select(".inner");
    var info = inner.select(".info");
    var dummySvg = inner.append("svg");

    var dummyXAxis = dummySvg.append("g").attr("class", "axis");
    var dummyYAxis = dummySvg.append("g").attr("class", "axis");

    // The data variable is either cluster info, or a flat list of names.
    // If the former, transform it to simply a list of names.
    var xlabels, ylabels;
    if (data.matrix.cols.length) {
      xlabels = data.matrix.cols;
    } else {
      // is a number not an array
      xlabels = [data.matrix.cols];
    }

    if (data.matrix.rows.length) {
      ylabels = data.matrix.rows;
    }

    var xText = dummyXAxis.selectAll("text").data(xlabels);
    xText.enter().append("text").text(function(d) { return d;}).style("font-size", opts.xaxis_font_size + "px");
    var yText = dummyYAxis.selectAll("text").data(ylabels);
    yText.enter().append("text").text(function(d) { return d;}).style("font-size", opts.yaxis_font_size + "px");

    var xlength = 0, ylength = 0;
    xText.each(function() {
      xlength = xlength < this.getBBox().width ? this.getBBox().width : xlength;
    });
    yText.each(function() {
      ylength = ylength < this.getBBox().width ? this.getBBox().width : ylength;
    });

    opts.xaxis_height = xlength / 1.41 + opts.xaxis_offset + opts.axis_padding;
    opts.yaxis_width = ylength + opts.yaxis_offset + opts.axis_padding;

    opts.xaxis_height = opts.xaxis_height > opts.height / 3 ? opts.height / 3 : opts.xaxis_height;
    opts.yaxis_width = opts.yaxis_width > opts.width / 3 ? opts.width / 3 : opts.yaxis_width;
    dummySvg.remove();

  })();*/

  // opts.bottomEl_height = opts.xaxis_height || 80;
  // opts.rightEl_width = opts.yaxis_width || 120;

  /*if (!data.rows) {
    opts.yclust_width = 0;
    opts.leftEl_width = 0;
    if (opts.yaxis_location === "left") {
      opts.leftEl_width = opts.yaxis_width || 120;
      opts.rightEl_width = 0;
    }
  } else {
    opts.yaxis_location = "right";
  }

  if (!data.cols) {
    opts.xclust_height = 0;
    opts.topEl_height = 0;
    if (opts.xaxis_location === "top") {
      opts.topEl_height = opts.xaxis_height || 80;
      opts.bottomEl_height = 0;
    }
  } else {
    opts.xaxis_location = "bottom";
  }*/


  /*opts.leftTitle_width = 0;
  opts.rightTitle_width = opts.yaxis_title ? opts.yaxis_title_font_size * 1.5 + 5 : 0;
  if (opts.yaxis_location === "left" && !data.rows) {
    opts.rightTitle_width = 0;
    opts.leftTitle_width = opts.yaxis_title ? opts.yaxis_title_font_size * 1.5 + 5 : 0;
  }

  opts.topTitle_height = 0;
  opts.bottomTitle_height = opts.xaxis_title ? opts.xaxis_title_font_size * 1.5 + 5 : 0;
  if (opts.xaxis_location === "top" && !data.cols) {
    opts.bottomTitle_height = 0;
    opts.topTitle_height = opts.xaxis_title ? opts.xaxis_title_font_size * 1.5 + 5 : 0;
  }*/

  /*var gridSizer = new GridSizer(
    [opts.leftTitle_width, opts.leftEl_width, "*", opts.rightEl_width, opts.rightTitle_width],
    [opts.topTitle_height, opts.topEl_height, "*", opts.bottomEl_height, opts.bottomTitle_height],
    opts.width,
    opts.height
  );*/

  var row_heights = [], col_widths = [], i = 0, j = 0;
  for (i = 0; i < opts.col_element_names.length; i++) {
    col_widths.push(opts.col_element_map[opts.col_element_names[i]]);
  }


  for (i = 0; i < opts.row_element_names.length; i++) {
    row_heights.push(opts.row_element_map[opts.row_element_names[i]]);
  }

  var gridSizer = new GridSizer(
    col_widths,
    row_heights,
    opts.width,
    opts.height
  );

  var colormapBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("*"));

  var colDendBounds = !data.cols ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("col_dendro"));

  var rowDendBounds = !data.rows ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("row_dendro"), opts.row_element_names.indexOf("*"));

  var xaxisBounds = opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("xaxis"));

  var yaxisBounds = opts.yaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("yaxis"), opts.row_element_names.indexOf("*"));

  var xtitleBounds = !opts.xaxis_title || opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("xtitle"));

  var ytitleBounds = !opts.yaxis_title || opts.yaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("ytitle"), opts.row_element_names.indexOf("*"));
/*
  var topElBounds = gridSizer.getCellBounds(2, 1);
  var leftElBounds = gridSizer.getCellBounds(1, 2);
  var rightElBounds = gridSizer.getCellBounds(3, 2);
  var bottomElBounds = gridSizer.getCellBounds(2, 3);
  var xtitleBounds = gridSizer.getCellBounds(2, 4);
  var ytitleBounds = gridSizer.getCellBounds(4, 2);

  if (opts.yaxis_location === "left" && !data.rows) {
    ytitleBounds = gridSizer.getCellBounds(0, 2);
  }

  if (opts.xaxis_location === "top" && !data.cols) {
    xtitleBounds = gridSizer.getCellBounds(2, 0);
  }



  if (!data.rows) {
    if (opts.yaxis_location === "right") {
      yaxisBounds = rightElBounds;
    } else {
      yaxisBounds = leftElBounds;
    }
  } else {
    yaxisBounds = rightElBounds;
    rowDendBounds = leftElBounds;
  }

  if (!data.cols) {
    if (opts.xaxis_location === "bottom") {
      xaxisBounds = bottomElBounds;
    } else {
      xaxisBounds = topElBounds;
    }
  } else {
    xaxisBounds = bottomElBounds;
    colDendBounds = topElBounds;
  }*/

  //var colDendBounds = gridSizer.getCellBounds(1, 0);
  //var rowDendBounds = gridSizer.getCellBounds(0, 1);
  //var yaxisBounds = gridSizer.getCellBounds(2, 1);
  //var xaxisBounds = gridSizer.getCellBounds(1, 2);

  function cssify(styles) {
    return {
      position: "absolute",
      top: styles.top + "px",
      left: styles.left + "px",
      width: styles.width + "px",
      height: styles.height + "px"
    };
  }

  // Create DOM structure
  (function() {
    var inner = el.select(".inner");
    var info = inner.select(".info");
    var xtitle = !opts.xaxis_title || opts.xaxis_hidden ? null : inner.append("svg").classed("xtitle", true).style(cssify(xtitleBounds));
    var ytitle = !opts.yaxis_title || opts.yaxis_hidden ? null : inner.append("svg").classed("ytitle", true).style(cssify(ytitleBounds));
    var colDend = !data.cols ? null : inner.append("svg").classed("dendrogram colDend", true).style(cssify(colDendBounds));
    var rowDend = !data.rows ? null : inner.append("svg").classed("dendrogram rowDend", true).style(cssify(rowDendBounds));
    var colmap = inner.append("svg").classed("colormap", true).style(cssify(colormapBounds));
    var xaxis = opts.xaxis_hidden ? null : inner.append("svg").classed("axis xaxis", true).style(cssify(xaxisBounds));
    var yaxis = opts.yaxis_hidden ? null : inner.append("svg").classed("axis yaxis", true).style(cssify(yaxisBounds));

    // Hack the width of the x-axis to allow x-overflow of rotated labels; the
    // QtWebkit viewer won't allow svg elements to overflow:visible.
    if (!opts.xaxis_hidden) {
      var overflow_width = 0;
      if (!opts.yaxis_hidden) {
        if (opts.yaxis_location === "right") {
          overflow_width = yaxisBounds.width;
        } else {
          overflow_width = xaxisBounds.height/2;
        }
      } else {
        overflow_width = xaxisBounds.height/2;
      }
      if (data.rows) {
        opts.yclust_width = options.yclust_width || opts.width * 0.12;
      } else {
        opts.yclust_width = 0;
      }
      xaxis.style("width", (opts.width - opts.yclust_width) + "px");
      xaxis
        .append("defs")
          .append("clipPath").attr("id", "xaxis-clip")
            .append("polygon")
              .attr("points", "" + [
                [0, 0],
                [xaxisBounds.width, 0],
                [xaxisBounds.width + overflow_width, xaxisBounds.height],
                [0, xaxisBounds.height]
              ]);
      xaxis.node(0).setAttribute("clip-path", "url(#xaxis-clip)");
    }

    inner.on("click", function() {
      controller.highlight(null, null);
    });
    controller.on('highlight.inner', function(hl) {
      inner.classed('highlighting',
        typeof(hl.x) === 'number' || typeof(hl.y) === 'number');
    });
  })();

  var row = !data.rows ? null : dendrogram(el.select('svg.rowDend'), data.rows, false, rowDendBounds.width, rowDendBounds.height, opts.axis_padding);
  var col = !data.cols ? null : dendrogram(el.select('svg.colDend'), data.cols, true, colDendBounds.width, colDendBounds.height, opts.axis_padding);
  var colormap = colormap(el.select('svg.colormap'), data.matrix, colormapBounds.width, colormapBounds.height);
  var xax = opts.xaxis_hidden ? null : axisLabels(el.select('svg.xaxis'), opts.xlabs_mod, true, xaxisBounds.width, xaxisBounds.height, opts.axis_padding, opts.xaxis_location);
  var yax = opts.yaxis_hidden ? null : axisLabels(el.select('svg.yaxis'), opts.ylabs_mod, false, yaxisBounds.width, yaxisBounds.height, opts.axis_padding, opts.yaxis_location);
  var xtitle = !opts.xaxis_title || opts.xaxis_hidden ? null : title(el.select('svg.xtitle'), opts.xaxis_title, false, xtitleBounds);
  var ytitle = !opts.yaxis_title || opts.yaxis_hidden ? null : title(el.select('svg.ytitle'), opts.yaxis_title, true, ytitleBounds);

  function colormap(svg, data, width, height) {
    // Check for no data
    if (data.length === 0)
      return function() {};

	if (!opts.show_grid) {
      svg.style("shape-rendering", "crispEdges");
	}

    var cols = data.dim[1];
    var rows = data.dim[0];

    var merged = data.merged;

    var x = d3.scale.linear().domain([0, cols]).range([0, width]);
    var y = d3.scale.linear().domain([0, rows]).range([0, height]);
    var old_x = d3.scale.linear().domain([0, cols]).range([0, width]);
    var old_y = d3.scale.linear().domain([0, rows]).range([0, height]);
    var tip = d3.tip()
        .attr('class', 'rhtmlHeatmap-tip')
        .html(function(d, i) {
          var rowTitle = opts.yaxis_title ? opts.yaxis_title : "Row";
          var colTitle = opts.xaxis_title ? opts.xaxis_title : "Column";
          var txt = "";
          if (opts.extra_tooltip_info) {
            var tt_info = opts.extra_tooltip_info;
            var tt_names = Object.keys(opts.extra_tooltip_info);
            for (var j = 0; j < tt_names.length; j++) {
              txt = txt + "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px'>" + tt_names[j] + "</th><td style='font-size:" + opts.tip_font_size +"px'>" + htmlEscape(tt_info[tt_names[j]][d.row*cols + d.col]) + "</td></tr>";
            }
          }

          return "<table class='rhtmlHeatmap-tip-table'>" +
            "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px'>" + rowTitle + "</th><td style='font-size:" + opts.tip_font_size +"px'>" + htmlEscape(data.rows[d.row]) + "</td></tr>" +
            "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px'>" + colTitle + "</th><td style='font-size:" + opts.tip_font_size +"px'>" + htmlEscape(data.cols[d.col]) + "</td></tr>" +
            "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px'>Value</th><td style='font-size:" + opts.tip_font_size +"px'>" + htmlEscape(d.label) + "</td></tr>" + txt +
            "</table>";
        })
        .direction("se")
        .style("position", "fixed");

    var brush = d3.svg.brush()
        .x(x)
        .y(y)
        .clamp([true, true])
        .on('brush', function() {
          var extent = brush.extent();
          extent[0][0] = Math.round(extent[0][0]);
          extent[0][1] = Math.round(extent[0][1]);
          extent[1][0] = Math.round(extent[1][0]);
          extent[1][1] = Math.round(extent[1][1]);
          d3.select(this).call(brush.extent(extent));
        })
        .on('brushend', function() {

          if (brush.empty()) {
            controller.transform({
              scale: [1,1],
              translate: [0,0],
              extent: [[0,0],[cols,rows]]
            });
          } else {
            var tf = controller.transform();
            var ex = brush.extent();
            var scale = [
              cols / (ex[1][0] - ex[0][0]),
              rows / (ex[1][1] - ex[0][1])
            ];
            var translate = [
              ex[0][0] * (width / cols) * scale[0] * -1,
              ex[0][1] * (height / rows) * scale[1] * -1
            ];
            controller.transform({scale: scale, translate: translate, extent: ex});
          }
          brush.clear();
          d3.select(this).call(brush).select(".brush .extent")
              .style({fill: opts.brush_color, stroke: opts.brush_color});
        });

    svg = svg
        .attr("width", width)
        .attr("height", height);
    var rect = svg.selectAll("rect").data(merged);
    rect.enter().append("rect").classed("datapt", true)
        .property("colIndex", function(d, i) { return i % cols; })
        .property("rowIndex", function(d, i) { return Math.floor(i / cols); })
        .property("value", function(d, i) { return d.label; })
        .attr("fill", function(d) {
          if (!d.color) {
            return "transparent";
          }
          return d.color;
        });
    rect.exit().remove();
    rect.append("title")
        .text(function(d, i) { return d.label; });
    rect.call(tip);

    var spacing;
    if (typeof(opts.show_grid) === 'number') {
      spacing = opts.show_grid;
    } else if (!!opts.show_grid) {
      spacing = 0.25;
    } else {
      spacing = 0;
    }
    function draw(selection) {
      selection
          .attr("x", function(d, i) {
            return x(i % cols);
          })
          .attr("y", function(d, i) {
            return y(Math.floor(i / cols));
          })
          .attr("width", (x(1) - x(0)) - spacing)
          .attr("height", (y(1) - y(0)) - spacing);
    }

    draw(rect);

    var new_ft_size;
    function draw_text(selection, old_x, old_y) {

      if (arguments.length == 3) {
        x_scale = old_x;
        y_scale = old_y;
      } else {
        x_scale = x;
        y_scale = y;
      }

      var box_w = x_scale(1) - x_scale(0) - spacing;
      var box_h = y_scale(1) - y_scale(0) - spacing;
      var ft_size = Math.min(Math.floor(box_h/1.5), opts.cell_font_size);

      selection
        .attr("x", function(d, i) {
          return x_scale(i % cols) + (box_w)/2;
        })
        .attr("y", function(d, i) {
          return y_scale(Math.floor(i / cols)) + (box_h)/2;
        })
        .style("font-size", ft_size);

      var out_of_bounds;
      do {
        out_of_bounds = 0;

        selection
          .each(function() {
            if (this.getBBox().width > box_w - 4) {
              out_of_bounds += 1;
            }
          });

        if (out_of_bounds > 0) {
          ft_size -= 1;
        }

        selection.style("font-size", ft_size);
      } while (out_of_bounds > 0 && ft_size > 3);

      return ft_size;

    }

    if (opts.shownote_in_cell) {

      cellnote_incell = svg.selectAll("text").data(merged);
      cellnote_incell.enter().append("text")
        .text(function(d) {
          return d.label;
        })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-family", "sans-serif")
        .style("fill", function(d) {
          return d.cellnote_color;
        });

      new_ft_size = draw_text(cellnote_incell);
    }

    controller.on('transform.colormap', function(_) {

      old_box_w = x(1) - x(0) - spacing;
      old_box_h = y(1) - y(0) - spacing;

      x.range([_.translate[0], width * _.scale[0] + _.translate[0]]);
      y.range([_.translate[1], height * _.scale[1] + _.translate[1]]);
      draw(rect.transition().duration(opts.anim_duration).ease("linear"));

      if (opts.shownote_in_cell) {
        new_ft_size = draw_text(cellnote_incell);
        draw_text(cellnote_incell, old_x, old_y);

        old_x.range([_.translate[0], width * _.scale[0] + _.translate[0]]);
        old_y.range([_.translate[1], height * _.scale[1] + _.translate[1]]);

        cellnote_incell
          .transition()
          .duration(opts.anim_duration)
          .ease("linear")
          .attr("x", function(d, i) {
            return x(i % cols) + ((x(1) - x(0)) - spacing)/2;
          })
          .attr("y", function(d, i) {
            return y(Math.floor(i / cols)) + ((y(1) - y(0)) - spacing)/2;
          })
          .style("font-size", new_ft_size);
      }
    });


    var brushG = svg.append("g")
        .attr('class', 'brush')
        .call(brush)
        .call(brush.event);
    brushG.select("rect.background")
        .on("mouseenter", function() {
          var e = d3.event;
          var offsetX = d3.event.offsetX;
          var offsetY = d3.event.offsetY;
          if (typeof(offsetX) === "undefined") {
            // Firefox 38 and earlier
            var target = e.target || e.srcElement;
            var rect = target.getBoundingClientRect();
            offsetX = e.clientX - rect.left,
            offsetY = e.clientY - rect.top;
          }

          var col = Math.floor(x.invert(offsetX));
          var row = Math.floor(y.invert(offsetY));
          var label = merged[row*cols + col].label;
          var this_tip = tip.show({col: col, row: row, label: label}).style({
            top: d3.event.clientY + 15 + "px",
            left: d3.event.clientX + 15 + "px",
            opacity: 0.9
          });

          // height of the tip
          var tipHeight = parseFloat(this_tip.style("height"));
          // width of the tip
          var tipWidth = parseFloat(this_tip.style("width"));
          var top = d3.event.clientY, left = d3.event.clientX;

          if (parseFloat(this_tip.style("left")) + tipWidth > opts.width) {
            this_tip.style("left", left - tipWidth - 15 + "px");
          }

          if (parseFloat(this_tip.style("top")) + tipHeight > opts.height) {
            this_tip.style("top", top - tipHeight - 15 + "px");
          }

        })
        .on("mousemove", function() {
          var e = d3.event;
          var offsetX = d3.event.offsetX;
          var offsetY = d3.event.offsetY;
          if (typeof(offsetX) === "undefined") {
            // Firefox 38 and earlier
            var target = e.target || e.srcElement;
            var rect = target.getBoundingClientRect();
            offsetX = e.clientX - rect.left,
            offsetY = e.clientY - rect.top;
          }

          var col = Math.floor(x.invert(offsetX));
          var row = Math.floor(y.invert(offsetY));
          var label = merged[row*cols + col].label;
          var this_tip = tip.show({col: col, row: row, label: label}).style({
            top: d3.event.clientY + 15 + "px",
            left: d3.event.clientX + 15 + "px",
            opacity: 0.9
          });

          // height of the tip
          var tipHeight = parseFloat(this_tip.style("height"));
          // width of the tip
          var tipWidth = parseFloat(this_tip.style("width"));
          var top = d3.event.clientY, left = d3.event.clientX;

          if (parseFloat(this_tip.style("left")) + tipWidth > opts.width) {
            this_tip.style("left", left - tipWidth - 15 + "px");
          }

          if (parseFloat(this_tip.style("top")) + tipHeight > opts.height) {
            this_tip.style("top", top - tipHeight - 15 + "px");
          }

          controller.datapoint_hover({col:col, row:row, label:label});
        })
        .on("mouseleave", function() {
          tip.hide();
          controller.datapoint_hover(null);
        });

    controller.on('highlight.datapt', function(hl) {
      rect.classed('highlight', function(d, i) {
        return (this.rowIndex === hl.y) || (this.colIndex === hl.x);
      });
    });
  }


  function title(svg, data, rotated, bounds) {

    // rotated is y, unrotated is x

    svg = svg.append('g');

    svg.append("text")
      .text(data)
      .attr("x", 0)
      .attr("y", 0)
      .attr("transform", rotated ? "translate(" + (bounds.width/2) + "," + (bounds.height/2) + "),rotate(-90)" :
                                    "translate(" + (bounds.width/2) + "," + (bounds.height/2) + ")")
      .style("font-weight", "bold")
      .style("font-size", rotated ? opts.yaxis_title_font_size : opts.xaxis_title_font_size)
      .style("text-anchor", "middle");
  }

  function axisLabels(svg, data, rotated, width, height, padding, axis_location) {
    svg = svg.append('g');

    // The data variable is either cluster info, or a flat list of names.
    // If the former, transform it to simply a list of names.
    var leaves;
    if (data.children) {
      leaves = d3.layout.cluster().nodes(data)
          .filter(function(x) { return !x.children; })
          .map(function(x) { return x.label + ""; });
    } else if (data.length) {
      leaves = data;
    }

    // Define scale, axis

    // set axis options
    var scale = d3.scale.ordinal()
        .domain(leaves)
        .rangeBands([0, rotated ? width : height]);
    var axis = d3.svg.axis()
        .scale(scale)
        .orient(axis_location)
        .outerTickSize(0)
        .tickPadding(padding)
        .tickValues(leaves);

    // Create the actual axis
    var axisNodes = svg.append("g")
        .attr("transform", function() {
          if (rotated) {
            if (axis_location === "bottom") {
              return "translate(0," + padding + ")";
            } else if (axis_location === "top") {
              return "translate(0," + (xaxisBounds.height - padding) + ")";
            }
          } else {
            if (axis_location === "right") {
              return "translate(" + padding + ",0)";
            } else if (axis_location === "left") {
              return "translate(" + (yaxisBounds.width - padding) + ",0)";
            }
          }
        })
        .call(axis);

    var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size'] + "px";
    //var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size']
    //    || Math.min(18, Math.max(9, scale.rangeBand() - (rotated ? 11: 8))) + "px";
    axisNodes.selectAll("text").style("font-size", fontSize);

    var mouseTargets = svg.append("g")
      .selectAll("g").data(leaves);
    mouseTargets
      .enter()
        .append("g").append("rect")
          .attr("transform", rotated ? (axis_location === "bottom" ? "rotate(45),translate(0,0)": "rotate(-45),translate(0,0)") : "")
          .attr("fill", "transparent")
          .on("click", function(d, i) {
            var dim = rotated ? 'x' : 'y';
            var hl = controller.highlight() || {x:null, y:null};
            if (hl[dim] == i) {
              // If clicked already-highlighted row/col, then unhighlight
              hl[dim] = null;
              controller.highlight(hl);
            } else {
              hl[dim] = i;
              controller.highlight(hl);
            }
            d3.event.stopPropagation();
          });
    function layoutMouseTargets(selection) {
      var _h = scale.rangeBand() / (rotated ? 1.414 : 1);
      var _w = rotated ? height * 1.414 * 1.2 : width;
      selection
          .attr("transform", function(d, i) {
            var x = rotated ? (axis_location === "bottom" ? scale(d) + scale.rangeBand()/2 : scale(d)) : 0;
            var y = rotated ? (axis_location === "bottom" ? padding + 6 : height - _h/1.414 - padding - 6): scale(d);
            return "translate(" + x + "," + y + ")";
          })
        .selectAll("rect")
          .attr("height", _h)
          .attr("width", _w);
    }
    layoutMouseTargets(mouseTargets);
    // workout what this mouseTarget is

    if (rotated) {
      axisNodes.selectAll("text")
        .attr("transform", function() {
          if (axis_location === "bottom") {
            return "rotate(45),translate(" + padding + ", 0)";
          } else if (axis_location === "top") {
            return "rotate(-45),translate(" + (padding) + ", 0)";
          }
        })
        .style("text-anchor", "start");
    }

    controller.on('highlight.axis-' + (rotated ? 'x' : 'y'), function(hl) {
      var ticks = axisNodes.selectAll('.tick');
      var selected = hl[rotated ? 'x' : 'y'];
      if (typeof(selected) !== 'number') {
        ticks.classed('faded', false);
        return;
      }
      ticks.classed('faded', function(d, i) {
        return i !== selected;
      });
    });

    controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function(_) {
      var dim = rotated ? 0 : 1;
      //scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
      var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]];
      scale.rangeBands(rb);
      var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear');
      tAxisNodes.call(axis);
      // Set text-anchor on the non-transitioned node to prevent jumpiness
      // in RStudio Viewer pane
      axisNodes.selectAll("text").style("text-anchor", rotated ? "start" : axis_location === "right" ? "start" : "end");
      tAxisNodes.selectAll("g")
          .style("opacity", function(d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1;
            } else {
              return 0;
            }
          });
      tAxisNodes
        .selectAll("text")
          .style("text-anchor", rotated ? "start" : axis_location === "right" ? "start" : "end");
      mouseTargets.transition().duration(opts.anim_duration).ease('linear')
          .call(layoutMouseTargets)
          .style("opacity", function(d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1;
            } else {
              return 0;
            }
          });
    });

  }

  function edgeStrokeWidth(node) {
    if (node.edgePar && node.edgePar.lwd)
      return node.edgePar.lwd;
    else
      return 1;
  }

  function maxChildStrokeWidth(node, recursive) {
    var max = 0;
    for (var i = 0; i < node.children.length; i++) {
      if (recursive) {
        max = Math.max(max, maxChildStrokeWidth(node.children[i], true));
      }
      max = Math.max(max, edgeStrokeWidth(node.children[i]));
    }
    return max;
  }

  function dendrogram(svg, data, rotated, width, height, padding) {
    var topLineWidth = maxChildStrokeWidth(data, false);

    var x = d3.scale.linear()
        .domain([data.height, 0])
        .range([topLineWidth/2, width-padding]);
    var y = d3.scale.linear()
        .domain([0, height])
        .range([0, height]);

    var cluster = d3.layout.cluster()
        .separation(function(a, b) { return 1; })
        .size([rotated ? width : height, NaN]);

    var transform = "translate(1,0)";
    if (rotated) {
      // Flip dendrogram vertically
      x.range([topLineWidth/2, -height+padding+2]);
      // Rotate
      transform = "rotate(-90) translate(-2,0)";
    }

    var dendrG = svg
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", transform);

    var nodes = cluster.nodes(data),
        links = cluster.links(nodes);

    // I'm not sure why, but after the heatmap loads the "links"
    // array mutates to much smaller values. I can't figure out
    // what's doing it, so instead we just make a deep copy of
    // the parts we want.
    var links1 = links.map(function(link, i) {
      return {
        source: {x: link.source.x, y: link.source.height},
        target: {x: link.target.x, y: link.target.height},
        edgePar: link.target.edgePar
      };
    });

    var lines = dendrG.selectAll("polyline").data(links1);
    lines
      .enter().append("polyline")
        .attr("class", "link")
        .attr("stroke", function(d, i) {
          if (!d.edgePar.col) {
            return opts.link_color;
          } else {
            return d.edgePar.col;
          }
        })
        .attr("stroke-width", edgeStrokeWidth)
        .attr("stroke-dasharray", function(d, i) {
          var pattern;
          switch (d.edgePar.lty) {
            case 6:
              pattern = [3,3,5,3];
              break;
            case 5:
              pattern = [15,5];
              break;
            case 4:
              pattern = [2,4,4,4];
              break;
            case 3:
              pattern = [2,4];
              break;
            case 2:
              pattern = [4,4];
              break;
            case 1:
            default:
              pattern = [];
              break;
          }
          for (var i = 0; i < pattern.length; i++) {
            pattern[i] = pattern[i] * (d.edgePar.lwd || 1);
          }
          return pattern.join(",");
        });

    function draw(selection) {
      function elbow(d, i) {
        return x(d.source.y) + "," + y(d.source.x) + " " +
            x(d.source.y) + "," + y(d.target.x) + " " +
            x(d.target.y) + "," + y(d.target.x);
      }

      selection
          .attr("points", elbow);
    }

    controller.on('transform.dendr-' + (rotated ? 'x' : 'y'), function(_) {
      var scaleBy = _.scale[rotated ? 0 : 1];
      var translateBy = _.translate[rotated ? 0 : 1];
      y.range([translateBy, height * scaleBy + translateBy]);
      draw(lines.transition().duration(opts.anim_duration).ease("linear"));
    });

    draw(lines);
  }


  var dispatcher = d3.dispatch('hover', 'click');

  controller.on("datapoint_hover", function(_) {
    dispatcher.hover({data: _});
  });

  function on_col_label_mouseenter(e) {
    controller.highlight(+d3.select(this).attr("index"), null);
  }
  function on_col_label_mouseleave(e) {
    controller.highlight(null, null);
  }
  function on_row_label_mouseenter(e) {
    controller.highlight(null, +d3.select(this).attr("index"));
  }
  function on_row_label_mouseleave(e) {
    controller.highlight(null, null);
  }

  return {
    on: function(type, listener) {
      dispatcher.on(type, listener);
      return this;
    }
  };
}
