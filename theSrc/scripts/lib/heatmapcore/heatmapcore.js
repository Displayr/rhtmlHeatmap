function heatmap(selector, data, options) {
  'use strict'

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

  function wrap_new(text, width) {
    var separators = {"-": 1, " ": 1};
    var lineNumbers = [];
    text.each(function() {
        var text = d3.select(this),
            chars = text.text().split("").reverse(),
            c,
            nextchar,
            sep,
            newline = [],
            lineTemp = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            x = text.attr("x"),
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
        while (c = chars.pop()) {
            // remove leading space
            if (lineTemp.length === 0 && c === " ") {
              continue;
            }
            lineTemp.push(c);
            tspan.text(lineTemp.join(""));
            if (tspan.node().getComputedTextLength() > width) {

            // if no separator detected before c, wait until there is one
            // otherwise, wrap texts
              if (sep === undefined) {
                if (c in separators) {
                  if (c === " ") {
                    lineTemp.pop();
                  }
                  // make new line
                  sep = undefined;
                  tspan.text(lineTemp.join(""));
                  tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text("");
                  lineTemp = [];
                  newline = [];
                }
              } else {
                // pop out chars until reaching sep
                if (c in separators) {
                  newline.push(lineTemp.pop());
                }
                nextchar = lineTemp.pop();
                while (nextchar !== sep && lineTemp.length > 0) {
                  newline.push(nextchar);
                  nextchar = lineTemp.pop();
                }
                newline.reverse();
                while (nextchar = newline.pop()) {
                  chars.push(nextchar);
                }

                if (sep !== " ") {
                  lineTemp.push(sep);
                }
                // make new line
                sep = undefined;
                tspan.text(lineTemp.join(""));
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text("");
                lineTemp = [];
                newline = [];
              }
            } else {
                if (c in separators) {
                  sep = c;
                }
            }
        }
        lineNumbers.push(lineNumber + 1);
    });
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
  opts.tip_font_family = options.tip_font_family || "sans-serif";
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
  opts.left_columns_title = undefined;
  opts.right_columns_title = undefined;

  if (options.left_columns_subtitles) {
    opts.left_columns_subtitles = [];
    for (var j = 0; j < options.left_columns_subtitles.length; j++) {
      opts.left_columns_subtitles.push(options.left_columns_subtitles[j]);
    }
    if (options.left_columns_title) {
      opts.left_columns_title = options.left_columns_title;
    } else {
      opts.left_columns_title = undefined;
    }
  } else {
    opts.left_columns_title = undefined;
  }

  if (options.right_columns_subtitles) {
    opts.right_columns_subtitles = [];
    for (var j = 0; j < options.right_columns_subtitles.length; j++) {
      opts.right_columns_subtitles.push(options.right_columns_subtitles[j]);
    }
    if (options.right_columns_title) {
      opts.right_columns_title = options.right_columns_title;
    } else {
      opts.right_columns_title = undefined;
    }
  } else {
    opts.right_columns_title = undefined;
  }

  opts.xaxis_hidden = options.xaxis_hidden;
  opts.yaxis_hidden = options.yaxis_hidden;
  options.table_style = options.left_columns || options.right_columns ? true : false;

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
  opts.legend_text_len = [];
  opts.x_is_factor = options.x_is_factor;
  opts.legend_digits = options.legend_digits;
  opts.legend_font_size = options.legend_font_size;
  opts.legend_colors = options.legend_colors;
  opts.legend_range = options.legend_range;
  opts.legend_width = options.legend_width;
  opts.legend_left_space = 26;
  opts.legend_x_padding = 4;
  opts.legend_bar_width = (options.legend_width - opts.legend_x_padding*2)/2;

  opts.legend_format = null;


  opts.title_margin_X = 10;
  opts.title_margin_top = 5;
  opts.title_margin_bottom = options.subtitle ? 5 : 10;
  opts.title_width = opts.width - opts.title_margin_X * 2;

  opts.subtitle_margin_X = 10;
  opts.subtitle_margin_top = options.title ? 0 : 5;
  opts.subtitle_margin_bottom = 10;
  opts.subtitle_width = opts.width - opts.subtitle_margin_X * 2;

  opts.footer_margin_X = 10;
  opts.footer_margin_Y = 5;
  opts.footer_width = opts.width - opts.footer_margin_X * 2;
  var i = 0, j = 0;

  var row_element_col_subtitle_var_name = undefined;
  var row_element_col_title_var_name = undefined;
  // get the number of rows and columns for the GridSizer

  var compute_title_footer_height = function(svg, input, fontFam, fontSize, fontCol, wrapWidth, bold) {
    var dummySvg = svg.append("svg");
    var dummy_g = dummySvg
      .append("g")
      .classed("dummy_g", true);

    var text_el = dummy_g.append("text")
      .text(input)
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", 0)
      .style("font-family", fontFam)
      .style("font-size", fontSize)
      .style("fill", fontCol)
      .attr("font-weight", bold ? "bold" : "normal")
      .call(wrap_new, wrapWidth);

    var output = text_el.node().getBBox().height;
    dummySvg.remove();
    return output;
  };

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
        .style("font-family", options.yaxis_font_family)
        .style("font-size", opts.left_columns_font_size)
        .each(function(d,i) {
          var parent_index = d3.select(this.parentNode).attr("data-index");
          var textLength = this.getComputedTextLength();
          text_widths[parent_index] = text_widths[parent_index] > textLength ? text_widths[parent_index] : textLength;
        });

      dummySvg.remove();
    };

    var compute_axis_label_dim = function(input, x_or_y, fontsize, fontfamily, additional) {
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
        .style("font-size", fontsize)
        .style("font-family", fontfamily);

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
            //modified_text = new_text + "...-" + text_hash[new_text]; // make it unique
            modified_text = new_text + "...";
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

    var compute_legend_text_length = function(text_widths) {

      var dummySvg = inner.append("svg");
      var legendAxisG = dummySvg.append("g");

      var legendRects = dummySvg.selectAll("rect")
        .data(opts.legend_colors);

      var boundsPaddingX = 4 + opts.legend_left_space,
          boundsPaddingY = 20,
          rectWidth = 10,
          rectHeight = 10;
      // append axis
      var legendScale;
      if (opts.x_is_factor) {
        legendScale = d3.scale.ordinal().rangeBands([opts.legend_colors.length * rectHeight, 0]).nice();
      } else {
        legendScale = d3.scale.linear().range([opts.legend_colors.length * rectHeight, 0]).nice();
      }

      legendScale.domain(opts.legend_range);

      var legendAxis = d3.svg.axis()
          .scale(legendScale)
          .orient("right")
          .tickSize(0)
          .tickValues( legendScale.ticks( opts.x_is_factor ? opts.legend_colors.length : 8 ).concat( legendScale.domain() ) );

      legendAxisG.call(legendAxis);
      var legendTicksCount = legendAxisG.selectAll("text")[0].length;

      if (opts.legend_colors && !opts.x_is_factor) {
        if (opts.legend_digits) {
          opts.legend_format = d3.format(",." + opts.legend_digits + "f");
        } else {
          var legend_step = (d3.max(opts.legend_range) - d3.min(opts.legend_range))/(legendTicksCount-1);
          console.log(opts.legend_range + " " + legendTicksCount);
          var legend_dig;
          if (legend_step < 0.1) {
            legend_dig = -Math.floor( Math.log(legend_step) / Math.log(10) + 1) + 1;
          } else if (legend_step > 0.1 && legend_step < 1) {
            legend_dig = 1;
          } else {
            legend_dig = 0;
          }
          opts.legend_format = d3.format(",." + legend_dig + "f");
        }
      }

      legendAxis.tickFormat(opts.legend_format);
      legendAxisG.call(legendAxis);

      legendAxisG.selectAll("text")
        .style("font-size", opts.legend_font_size + "px")
        .style("font-family", options.legend_font_family)
        .style("fill", options.legend_font_color)
        .each(function(d,i) {
          text_widths[i] = this.getComputedTextLength();
        });

      dummySvg.remove();
    };


    var i = 0, j = 0, x_texts, y_texts;
    opts.xaxis_title_height = 0;
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
        opts.xaxis_title_height = options.xaxis_font_size * 1.5 + 5;
        opts.row_element_map["xtitle"] = opts.xaxis_title_height;
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

      opts.xaxis_len = compute_axis_label_dim(opts.xlabs_mod, 
                                        true, 
                                        options.xaxis_font_size, 
                                        options.xaxis_font_family);
      opts.row_element_map["xaxis"] = opts.xaxis_len;
    }

    if (data.cols) {
      opts.row_element_names.unshift("col_dendro");
    }

    if (options.footer) {
      opts.row_element_names.push("footer");
      opts.row_element_map["footer"] =
        compute_title_footer_height(
          inner,
          options.footer,
          options.footer_font_family,
          options.footer_font_size,
          options.footer_font_color,
          opts.footer_width, 
          options.footer_font_bold) + opts.footer_margin_Y * 2;
    }

    if (opts.legend_colors) {
      for (i = 0;i < opts.legend_range.length; i++) {
        opts.legend_text_len.push(0);
      }
      compute_legend_text_length(opts.legend_text_len);
      opts.legend_total_width = opts.legend_left_space + opts.legend_bar_width + opts.legend_x_padding*2 + d3.max(opts.legend_text_len);
    }

    // columns to the left of the main plot data
    options.larger_columns_subtitles_font_size = options.left_columns_subtitles_font_size > options.right_columns_subtitles_font_size ? options.left_columns_subtitles_font_size : options.right_columns_subtitles_font_size;
    options.larger_columns_title_font_size = options.left_columns_title_font_size > options.right_columns_title_font_size ? options.left_columns_title_font_size : options.right_columns_title_font_size;
    opts.left_columns_total_width = 0;

    if (opts.left_columns) {

      var left_cols_widths = [];
      opts.left_columns_width = [];
      for (i = 0;i < opts.left_columns.length; i++) {
        left_cols_widths.push(0);
        opts.col_element_names.unshift("left_col" + i);
      }

      //compute mean column width
      compute_col_text_widths(opts.left_columns, left_cols_widths, true);

      for (i = 0;i < opts.left_columns.length; i++) {
        if (left_cols_widths[i] > opts.width * 0.2) {
          left_cols_widths[i] = opts.width * 0.2;
        }
        opts.col_element_map["left_col" + i] = left_cols_widths[i] + opts.axis_padding*2;
        opts.left_columns_width.push(left_cols_widths[i] + opts.axis_padding*2);
        opts.left_columns_total_width = d3.sum(opts.left_columns_width);
      }
    }

    opts.right_columns_total_width = 0;
    if (opts.right_columns) {

      var right_cols_widths = [];
      opts.right_columns_width = [];
      for (i = 0;i < opts.right_columns.length; i++) {
        right_cols_widths.push(0);
        opts.col_element_names.push("right_col" + i);
      }

      //compute mean column width
      compute_col_text_widths(opts.right_columns, right_cols_widths, true);

      for (i = 0;i < opts.right_columns.length; i++) {
        if (right_cols_widths[i] > opts.width * 0.2) {
          right_cols_widths[i] = opts.width * 0.2;
        }
        opts.col_element_map["right_col" + i] = right_cols_widths[i] + opts.axis_padding*2;
        opts.right_columns_width.push(right_cols_widths[i] + opts.axis_padding*2);
      }
      opts.right_columns_total_width = d3.sum(opts.right_columns_width);
    }


    opts.left_columns_subtitles = opts.left_columns ? opts.left_columns_subtitles : undefined;
    opts.left_columns_title = opts.left_columns && opts.left_columns_subtitles ? options.left_columns_title : undefined;
    opts.right_columns_subtitles = opts.right_columns ? opts.right_columns_subtitles : undefined;
    opts.right_columns_title = opts.right_columns && opts.right_columns_subtitles ? options.right_columns_title : undefined;
    opts.left_sub_len = 0;
    opts.right_sub_len = 0;


    if (opts.left_columns_subtitles) {
      // compute text width of left column subtitles
      opts.left_sub_len = compute_axis_label_dim(opts.left_columns_subtitles,
                                      true,
                                      options.left_columns_subtitles_font_size, 
                                      options.left_columns_subtitles_font_family);
    }

    if (opts.right_columns_subtitles) {
      // compute text width of right column subtitles
      opts.right_sub_len = compute_axis_label_dim(opts.right_columns_subtitles,
                                      true,
                                      options.right_columns_subtitles_font_size, 
                                      options.right_columns_subtitles_font_family);
    }

    // compare text width of left column subtitles, right column subtitles and x axis
    if (opts.xaxis_hidden) {
      options.xaxis_location = undefined;
    }

    if (!opts.xaxis_hidden && options.xaxis_location == "top") {
      opts.topaxis_len = Math.max(opts.xaxis_len, opts.left_sub_len, opts.right_sub_len);
      opts.row_element_map["xaxis"] = opts.topaxis_len;
    } else {
      opts.topaxis_len = Math.max(opts.left_sub_len, opts.right_sub_len);
      if (opts.topaxis_len > 0) {
        opts.row_element_names.unshift("top_axis_el");
        opts.row_element_map["top_axis_el"] = opts.topaxis_len;
      }
    }

    opts.left_col_title_height = 0;
    opts.right_col_title_height = 0;

    if (opts.left_columns_title) {
      // compute height and wrap of left column title
      opts.left_col_title_height =
        compute_title_footer_height(
          inner,
          opts.left_columns_title,
          options.left_columns_title_font_family,
          options.left_columns_title_font_size,
          options.left_columns_title_font_color,
          opts.left_columns_total_width, 
          options.left_columns_title_bold) + opts.axis_padding * 2;
    }

    if (opts.right_columns_title) {
      opts.right_col_title_height =
        compute_title_footer_height(
          inner,
          opts.right_columns_title,
          options.right_columns_title_font_family,
          options.right_columns_title_font_size,
          options.right_columns_title_font_color,
          opts.right_columns_total_width, 
          options.right_columns_title_bold) + opts.axis_padding * 2;
    }

    if (!opts.xaxis_hidden && options.xaxis_location == "top" && opts.xaxis_title) {
      opts.topaxis_title_height = Math.max(opts.xaxis_title_height, opts.left_col_title_height, opts.right_col_title_height);
      opts.row_element_map["xtitle"] = opts.topaxis_title_height;
    } else {
      opts.topaxis_title_height = Math.max(opts.left_col_title_height, opts.right_col_title_height);
      if (opts.topaxis_title_height > 0) {
        opts.row_element_names.unshift("top_axis_title_el");
        opts.row_element_map["top_axis_title_el"] = opts.topaxis_title_height;
      }
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

      opts.col_element_map["yaxis"] = compute_axis_label_dim(opts.ylabs_mod,
                                        false,
                                        options.yaxis_font_size, 
                                        options.yaxis_font_family);

      if (opts.yaxis_title) {
        if (opts.yaxis_location === "right") {
          opts.col_element_names.push("ytitle");
        } else {
          opts.col_element_names.unshift("ytitle");
        }
        opts.col_element_map["ytitle"] = opts.yaxis_title_font_size * 1.5 + 5;
      }

      if (!opts.xaxis_hidden) {

        var x_texts_net = opts.row_element_map["xaxis"];
        var y_width_net = x_texts_net/1.1;

        if (opts.yaxis_location === "right") {
          if (opts.legend_colors) {
            if (y_width_net > opts.col_element_map["yaxis"] + opts.legend_total_width) {
              opts.col_element_map["yaxis"] = y_width_net - opts.legend_total_width;
              opts.col_element_names.push("legend");
              opts.col_element_map["legend"] = opts.legend_total_width;
            } else {
              opts.col_element_names.push("legend");
              opts.col_element_map["legend"] = opts.legend_total_width;
            }
          } else {
            if (y_width_net > opts.col_element_map["yaxis"]) {
              opts.col_element_map["yaxis"] = y_width_net;
            }
          }
        } else {
          if (opts.legend_colors) {
            if (opts.legend_total_width < y_width_net) {
              opts.col_element_names.push("yaxis_dummy1");
              opts.col_element_map["yaxis_dummy1"] = (y_width_net - opts.legend_total_width)/2;
              opts.col_element_names.push("legend");
              opts.col_element_map["legend"] = opts.legend_total_width;
              opts.col_element_names.push("yaxis_dummy2");
              opts.col_element_map["yaxis_dummy2"] = (y_width_net - opts.legend_total_width)/2;
            } else {
              opts.col_element_names.push("legend");
              opts.col_element_map["legend"] = opts.legend_total_width;
            }
          } else {
            opts.col_element_names.push("yaxis_dummy");
            opts.col_element_map["yaxis_dummy"] = y_width_net;
          }
        }
      } else {
        if (opts.legend_colors) {
          opts.col_element_names.push("legend");
          opts.col_element_map["legend"] = opts.legend_total_width;
        }
      }
    } else {

      if (!opts.xaxis_hidden) {
        // keep the space to mitigate the overflow of x axis label
        var x_texts_net = opts.row_element_map["xaxis"];
        var y_width_net = x_texts_net/1.1;

        if (opts.legend_colors) {
          if (opts.legend_total_width < y_width_net) {
            opts.col_element_names.push("yaxis_dummy1");
            opts.col_element_map["yaxis_dummy1"] = (y_width_net - opts.legend_total_width)/2;
            opts.col_element_names.push("legend");
            opts.col_element_map["legend"] = opts.legend_total_width;
            opts.col_element_names.push("yaxis_dummy2");
            opts.col_element_map["yaxis_dummy2"] = (y_width_net - opts.legend_total_width)/2;
          } else {
            opts.col_element_names.push("legend");
            opts.col_element_map["legend"] = opts.legend_total_width;
          }
        } else {
          if (opts.right_columns) {
            if (opts.right_sub_len/1.1 > opts.right_columns_width[opts.right_columns_width.length-1]/2) {
              opts.col_element_names.push("yaxis");
              opts.col_element_map["yaxis"] = opts.right_sub_len/1.1 - opts.right_columns_width[opts.right_columns_width.length-1]/2;
            }
          } else {
            opts.col_element_names.push("yaxis");
            opts.col_element_map["yaxis"] = y_width_net;
          }

        }
      } else {
        if (opts.legend_colors) {
          opts.col_element_names.push("legend");
          opts.col_element_map["legend"] = opts.legend_total_width;
        } else {
          if (opts.right_columns && opts.right_sub_len/1.1 > opts.right_columns_width[opts.right_columns_width.length-1]/2) {
            opts.col_element_names.push("yaxis");
            opts.col_element_map["yaxis"] = opts.right_sub_len/1.1 - opts.right_columns_width[opts.right_columns_width.length-1]/2;
          }
        }
      }
    }

    // row dendrogram, add one more column
    if (data.rows) {
      opts.col_element_names.unshift("row_dendro");
      opts.col_element_map["row_dendro"] = options.yclust_width || opts.width * 0.12;
    }

    // column dendrogram, add one more row
    if (data.cols) {
      opts.row_element_map["col_dendro"] = options.xclust_height || opts.height * 0.12;
    }

    if (options.subtitle) {
      opts.row_element_names.unshift("subtitle");
      opts.row_element_map["subtitle"] =
        compute_title_footer_height(
          inner,
          options.subtitle,
          options.subtitle_font_family,
          options.subtitle_font_size,
          options.subtitle_font_color,
          opts.subtitle_width,
          options.subtitle_font_bold) + opts.subtitle_margin_top + opts.subtitle_margin_bottom;
    }

    if (options.title) {
      opts.row_element_names.unshift("title");
      opts.row_element_map["title"] =
        compute_title_footer_height(
          inner,
          options.title,
          options.title_font_family,
          options.title_font_size,
          options.title_font_color,
          opts.title_width,
          options.title_font_bold) + opts.title_margin_top + opts.title_margin_bottom;
    }
  })();


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

  if (!opts.xaxis_hidden && opts.xaxis_title) {
    var dummydiv = el.append("div");
    opts.xaxis_title_height = 
      compute_title_footer_height(
        dummydiv,
        opts.xaxis_title,
        options.xaxis_title_font_family,
        options.xaxis_title_font_size,
        options.xaxis_title_font_color,
        colormapBounds.width, 
        options.xaxis_title_bold) + opts.axis_padding * 2;
    opts.row_element_map["xtitle"] = opts.xaxis_title_height;
    dummydiv.remove();
  }

  if (!opts.xaxis_hidden && options.xaxis_location == "top" && opts.xaxis_title) {
    opts.topaxis_title_height = Math.max(opts.xaxis_title_height, opts.left_col_title_height, opts.right_col_title_height);
    opts.row_element_map["xtitle"] = opts.topaxis_title_height;
  }

  row_heights = [], col_widths = [], i = 0, j = 0, gridSizer = undefined;
  for (i = 0; i < opts.col_element_names.length; i++) {
    col_widths.push(opts.col_element_map[opts.col_element_names[i]]);
  }


  for (i = 0; i < opts.row_element_names.length; i++) {
    row_heights.push(opts.row_element_map[opts.row_element_names[i]]);
  }

  gridSizer = new GridSizer(
    col_widths,
    row_heights,
    opts.width,
    opts.height
  );

  colormapBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("*"));
  var colDendBounds = !data.cols ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("col_dendro"));

  var rowDendBounds = !data.rows ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("row_dendro"), opts.row_element_names.indexOf("*"));

  var xaxisBounds = opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("xaxis"));
  if (xaxisBounds) {
    xaxisBounds.width0 = xaxisBounds.width;
  }

  var yaxisBounds = opts.yaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("yaxis"), opts.row_element_names.indexOf("*"));

  var xtitleBounds = !opts.xaxis_title || opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("xtitle"));

  var ytitleBounds = !opts.yaxis_title || opts.yaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("ytitle"), opts.row_element_names.indexOf("*"));

  var legendBounds = !opts.legend_colors ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("legend"), opts.row_element_names.indexOf("*"));

  var titleBounds = !options.title ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("title"));

  var subtitleBounds = !options.subtitle ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("subtitle"));

  var footerBounds = !options.footer ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("footer"));

  var leftColsBounds = !opts.left_columns ? null : [];
  var leftTitleBounds = {};
  leftTitleBounds.left = 0;
  leftTitleBounds.width = 0;
  var leftSubtitleBounds = !opts.left_columns_subtitles || !opts.left_columns ? null : [];
  var leftColumnsWidth = 0;
  var topAxisElBounds = undefined;
  var topAxisTitleElBounds = undefined;

  if (opts.left_columns) {

    for (var i = 0;i < opts.left_columns.length; i++) {
      leftColsBounds.push(gridSizer.getCellBounds(opts.col_element_names.indexOf("left_col" + i), opts.row_element_names.indexOf("*")));
      leftColumnsWidth += leftColsBounds[i].width;
    }

    if (!opts.xaxis_hidden && options.xaxis_location == "top") {
      xaxisBounds.left = 0;
      xaxisBounds.width = xaxisBounds.width + opts.left_columns_total_width;
    } else {
      if (opts.topaxis_len > 0) {
        topAxisElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("top_axis_el"));
        topAxisElBounds.left = 0;
        topAxisElBounds.width = opts.width;
      }
    }
    if (!opts.xaxis_hidden && options.xaxis_location == "top" && opts.xaxis_title) {
      xtitleBounds.left = 0;
      xtitleBounds.width = xtitleBounds.width + opts.left_columns_total_width;
    } else {
      if (opts.topaxis_title_height > 0) {
        topAxisTitleElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("top_axis_title_el"));
        topAxisTitleElBounds.left = 0;
        topAxisTitleElBounds.width = opts.width;
      }
    }
  }

  var rightColsBounds = !opts.right_columns ? null : [];
  var rightTitleBounds = {};
  rightTitleBounds.width = 0;
  var rightSubtitleBounds = !opts.right_columns_subtitles || !opts.right_columns ? null : [];
  var rightColumnsWidth = 0;

  if (opts.right_columns) {

    for (var i = 0;i < opts.right_columns.length; i++) {
      rightColsBounds.push(gridSizer.getCellBounds(opts.col_element_names.indexOf("right_col" + i), opts.row_element_names.indexOf("*")));
      rightColumnsWidth += rightColsBounds[i].width;
    }

    if (!opts.xaxis_hidden && options.xaxis_location == "top") {
      xaxisBounds.width = xaxisBounds.width + opts.right_columns_total_width;
    } else {
      if (opts.topaxis_len > 0 && !opts.left_columns_subtitles) {
        topAxisElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("top_axis_el"));
        topAxisElBounds.left = 0;
        topAxisElBounds.width = opts.width;
      }
    }

    if (!opts.xaxis_hidden && options.xaxis_location == "top" && opts.xaxis_title) {
      xtitleBounds.width = xtitleBounds.width + opts.right_columns_total_width;
    } else {
      if (opts.topaxis_title_height > 0 && !opts.left_columns_title) {
        topAxisTitleElBounds = gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("top_axis_title_el"));
        topAxisTitleElBounds.left = 0;
        topAxisTitleElBounds.width = opts.width;
      }
    }
  }

  if (options.title) {
    titleBounds.width = opts.width;
    titleBounds.left = 0;
  }

  if (options.subtitle) {
    subtitleBounds.width = opts.width;
    subtitleBounds.left = 0;
  }

  if (options.footer) {
    footerBounds.width = opts.width;
    footerBounds.left = 0;
  }

  var modifiedXbounds = opts.xaxis_hidden ? null : gridSizer.getCellBounds(opts.col_element_names.indexOf("*"), opts.row_element_names.indexOf("xaxis"));

  if (!opts.xaxis_hidden) {
      if (data.rows) {
        opts.yclust_width = options.yclust_width || opts.width * 0.12;
      } else {
        opts.yclust_width = 0;
      }
      modifiedXbounds.width = opts.width - opts.yclust_width;
      modifiedXbounds.left = 0;
  }

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
    var xaxis = opts.xaxis_hidden ? null : inner.append("svg").classed("axis xaxis", true).style(cssify(modifiedXbounds));
    var yaxis = opts.yaxis_hidden ? null : inner.append("svg").classed("axis yaxis", true).style(cssify(yaxisBounds));
    var legend = !opts.legend_colors ? null : inner.append("svg").classed("legend", true).style(cssify(legendBounds));
    var title = !options.title ? null : inner.append("svg").classed("graph_title", true).style(cssify(titleBounds));
    var subtitle = !options.subtitle ? null : inner.append("svg").classed("graph_subtitle", true).style(cssify(subtitleBounds));
    var footer = !options.footer ? null : inner.append("svg").classed("graph_footer", true).style(cssify(footerBounds));
    var leftCols = !opts.left_columns ? null : [];
    if (opts.left_columns) {
      for (i = 0; i < opts.left_columns.length; i++) {
        leftCols.push(!opts.left_columns ? null : inner.append("svg").classed("graph_leftCols" + i, true).style(cssify(leftColsBounds[i])));
      }
      if (opts.left_columns_subtitles) {
        var leftColsSub = !options.xaxis_hidden && options.xaxis_location == "top" ? null : inner.append("svg").classed("graph_topaxis_el", true).style(cssify(topAxisElBounds));
        if (opts.left_columns_title) {
          var leftColsSub = !options.xaxis_hidden && options.xaxis_location == "top" && opts.xaxis_title ? null : inner.append("svg").classed("graph_topaxis_title_el", true).style(cssify(topAxisTitleElBounds));
        }
      }
    }
    var rightCols = !opts.right_columns ? null : [];
    if (opts.right_columns) {
      for (i = 0; i < opts.right_columns.length; i++) {
        rightCols.push(!opts.right_columns ? null : inner.append("svg").classed("graph_rightCols" + i, true).style(cssify(rightColsBounds[i])));
      }
      if (opts.right_columns_subtitles && !opts.left_columns_subtitles) {
        var rightColsSub = !options.xaxis_hidden && options.xaxis_location == "top" ? null : inner.append("svg").classed("graph_topaxis_el", true).style(cssify(topAxisElBounds));
      }
      if (opts.left_columns_title && opts.right_columns_title) {
        var rightColsSub = !options.xaxis_hidden && options.xaxis_location == "top" && opts.xaxis_title ? null : inner.append("svg").classed("graph_topaxis_title_el", true).style(cssify(topAxisTitleElBounds));
      }
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
  var xax = opts.xaxis_hidden ? null : axisLabels(el.select('svg.xaxis'), opts.xlabs_mod, true, xaxisBounds.width0, xaxisBounds.height, opts.axis_padding, opts.xaxis_location);
  var yax = opts.yaxis_hidden ? null : axisLabels(el.select('svg.yaxis'), opts.ylabs_mod, false, yaxisBounds.width, yaxisBounds.height, opts.axis_padding, opts.yaxis_location);
  var xtitle = !opts.xaxis_title || opts.xaxis_hidden ? null : axis_title(el.select('svg.xtitle'), opts.xaxis_title, false, colormapBounds.width, xtitleBounds.height);
  var ytitle = !opts.yaxis_title || opts.yaxis_hidden ? null : axis_title(el.select('svg.ytitle'), opts.yaxis_title, true, ytitleBounds.width, colormapBounds.height);
  var legend = !opts.legend_colors ? null : legend(el.select('svg.legend'), opts.legend_colors, opts.legend_range, legendBounds);

  var graph_title = !options.title ? null :
    title_footer(
      el.select('svg.graph_title'),
      titleBounds,
      options.title,
      options.title_font_family,
      options.title_font_size,
      options.title_font_color,
      options.title_font_bold,
      opts.title_width,
      "1");

  var graph_subtitle = !options.subtitle ? null :
    title_footer(
      el.select('svg.graph_subtitle'),
      subtitleBounds,
      options.subtitle,
      options.subtitle_font_family,
      options.subtitle_font_size,
      options.subtitle_font_color,
      options.subtitle_font_bold,
      opts.subtitle_width,
      "2");

  var graph_footer = !options.footer ? null :
    title_footer(
      el.select('svg.graph_footer'),
      footerBounds,
      options.footer,
      options.footer_font_family,
      options.footer_font_size,
      options.footer_font_color,
      options.footer_font_bold,
      opts.footer_width,
      "3");

  if (opts.left_columns) {
    if (!options.left_columns_align){
      options.left_columns_align = [];
      for (i = 0; i < opts.left_columns.length; i++) {
        options.left_columns_align.push("l");
      }
    }
  }

  if (opts.right_columns) {
    if (!options.right_columns_align){
      options.right_columns_align = [];
      for (i = 0; i < opts.right_columns.length; i++) {
        options.right_columns_align.push("l");
      }
    }
  }

  var graph_left_cols = [];
  var graph_left_cols_sub;
  var graph_left_cols_title;

  opts.left_columns_axis = [];
  opts.left_columns_scales = [];
  opts.left_columns_mouseTargets = [];
  if (opts.left_columns) {
    for (i = 0; i < opts.left_columns.length; i++) {
      graph_left_cols.push(
        !opts.left_columns ? null : insert_columns(
          el.select('svg.graph_leftCols' + i),
          leftColsBounds[i],
          options.left_columns[i],
          options.left_columns_font_family,
          options.left_columns_font_size,
          options.left_columns_font_color,
          options.left_columns_align[i],
          true,
          i));
    }

    if (opts.left_columns_subtitles) {
      if (!options.xaxis_hidden && options.xaxis_location == "top") {
        var this_el = el.select('svg.xaxis');
        var this_bounds = xaxisBounds;
        insert_column_subtitle (this_el, 
          this_bounds, 
          opts.left_columns_subtitles, 
          options.left_columns_subtitles_font_family,
          options.left_columns_subtitles_font_size,
          options.left_columns_subtitles_font_color, 
          opts.left_columns_width, 
          true);
      } else {
        var this_el = el.select('svg.graph_topaxis_el');
        var this_bounds = topAxisElBounds;
        insert_column_subtitle (this_el, 
          this_bounds, 
          opts.left_columns_subtitles, 
          options.left_columns_subtitles_font_family,
          options.left_columns_subtitles_font_size,
          options.left_columns_subtitles_font_color, 
          opts.left_columns_width, 
          true);
      }

      if (opts.left_columns_title) {
        if (!options.xaxis_hidden && options.xaxis_location == "top" && options.xaxis_title) {
          var this_el = el.select('svg.xtitle');
          var thisBounds = xtitleBounds;

          insert_column_title (this_el,
            thisBounds, 
            opts.left_columns_title, 
            options.left_columns_title_bold, 
            options.left_columns_title_font_family, 
            options.left_columns_title_font_size, 
            options.left_columns_title_font_color, 
            opts.left_columns_total_width, 
            true);
        } else {
          var this_el = el.select('svg.graph_topaxis_title_el');
          var this_bounds = topAxisTitleElBounds;
          insert_column_title (this_el, 
            this_bounds, 
            opts.left_columns_title, 
            options.left_columns_title_bold,
            options.left_columns_title_font_family,
            options.left_columns_title_font_size, 
            options.left_columns_title_font_color,
            opts.left_columns_total_width, 
            true);
        }
      }
    }
  }

  var graph_right_cols = [];
  var graph_right_cols_sub = [];
  var graph_right_cols_title;

  opts.right_columns_axis = [];
  opts.right_columns_scales = [];
  opts.right_columns_mouseTargets = [];
  if (opts.right_columns) {
    for (i = 0; i < opts.right_columns.length; i++) {
      graph_right_cols.push(
        !opts.right_columns ? null : insert_columns(
          el.select('svg.graph_rightCols' + i),
          rightColsBounds[i],
          options.right_columns[i],
          options.right_columns_font_family,
          options.right_columns_font_size,
          options.right_columns_font_color,
          options.right_columns_align[i],
          false,
          i));
    }

    if (opts.right_columns_subtitles) {
      if (!options.xaxis_hidden && options.xaxis_location == "top") {
        var this_el = el.select('svg.xaxis');
        var this_bounds = xaxisBounds;
        insert_column_subtitle (this_el, 
          this_bounds, 
          opts.right_columns_subtitles, 
          options.right_columns_subtitles_font_family,
          options.right_columns_subtitles_font_size,
          options.right_columns_subtitles_font_color, 
          opts.right_columns_width, 
          false);
      } else {
        var this_el = el.select('svg.graph_topaxis_el');
        var this_bounds = topAxisElBounds;
        insert_column_subtitle (this_el, 
          this_bounds, 
          opts.right_columns_subtitles, 
          options.right_columns_subtitles_font_family,
          options.right_columns_subtitles_font_size,
          options.right_columns_subtitles_font_color, 
          opts.right_columns_width, 
          false);
      }

      if (opts.right_columns_title) {
        if (!options.xaxis_hidden && options.xaxis_location == "top" && options.xaxis_title) {
          var this_el = el.select('svg.xtitle');
          var thisBounds = xtitleBounds;

          insert_column_title (this_el,
            thisBounds, 
            opts.right_columns_title, 
            options.right_columns_title_bold, 
            options.right_columns_title_font_family, 
            options.right_columns_title_font_size, 
            options.right_columns_title_font_color, 
            opts.right_columns_total_width, 
            false);
        } else {
          var this_el = el.select('svg.graph_topaxis_title_el');
          var this_bounds = topAxisTitleElBounds;
          insert_column_title (this_el, 
            this_bounds, 
            opts.right_columns_title, 
            options.right_columns_title_bold,
            options.right_columns_title_font_family,
            options.right_columns_title_font_size, 
            options.right_columns_title_font_color,
            opts.right_columns_total_width, 
            false);
        }
      }
    }
  }

  if (opts.left_columns || opts.right_columns) {
    controller.on('highlight.axis-y', function(hl) {
      var selected = hl['y'];
      if (opts.left_columns) {
        for (var j = 0; j < opts.left_columns.length; j++) {
          d3.selectAll(".coltickLeft" + j)
          .style("opacity", function(dd,ii) {
            if (typeof(selected) !== 'number') {
              return 1;
            }
            var opa = parseFloat(d3.select(this).style("opacity"));
            var el_id = d3.select(this).attr("id");
            el_id = parseInt(el_id.substr(1));
            if (selected == el_id) {
              return 1;
            } else {
              return 0.4;
            }
          });
        }
      }
      if (opts.right_columns) {
        for (var j = 0; j < opts.right_columns.length; j++) {
          d3.selectAll(".coltickRight" + j)
          .style("opacity", function(dd,ii) {
            if (typeof(selected) !== 'number') {
              return 1;
            }
            var opa = parseFloat(d3.select(this).style("opacity"));
            var el_id = d3.select(this).attr("id");
            el_id = parseInt(el_id.substr(1));
            if (selected == el_id) {
              return 1;
            } else {
              return 0.4;
            }
          });
        }
      }
    });

    controller.on('transform.axis-y', function(_) {
      var dim = 1;
      if (opts.left_columns) {
        for (var j = 0; j < opts.left_columns.length; j++) {
          var rb = [_.translate[dim], leftColsBounds[j].height * _.scale[dim] + _.translate[dim]];
          opts.left_columns_scales[j].rangeBands(rb);

          var tAxisNodes = d3.select(".axisNodesLeft" + j)
            .transition('1')
            .duration(opts.anim_duration)
            .ease('linear');

          tAxisNodes.call(opts.left_columns_axis[j]);

          d3.select(".axisNodesLeft" + j).selectAll("text")
              .style("text-anchor", function() {
                if (options.left_columns_align[j] == "l") {
                  return "start";
                } else if (options.left_columns_align[j] == "c") {
                  return "middle";
                } else if (options.left_columns_align[j] == "r") {
                  return "end";
                }
              });

          tAxisNodes.selectAll("g")
              .style("opacity", function(d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1;
                } else {
                  return 0;
                }
              });

          tAxisNodes.selectAll("text")
              .style("text-anchor", function() {
                if (options.left_columns_align[j] == "l") {
                  return "start";
                } else if (options.left_columns_align[j] == "c") {
                  return "middle";
                } else if (options.left_columns_align[j] == "r") {
                  return "end";
                }
              });

          function layoutMouseTargetsLocal(selection) {
            var _h = opts.left_columns_scales[j].rangeBand();
            var _w = opts.left_columns_width[j];
            selection
                .attr("transform", function(d, i) {
                  var x = 0;
                  var y = opts.left_columns_scales[j](i);
                  return "translate(" + x + "," + y + ")";
                })
              .selectAll("rect")
                .attr("height", _h)
                .attr("width", _w);
          }

          opts.left_columns_mouseTargets[j].transition().duration(opts.anim_duration).ease('linear')
              .call(layoutMouseTargetsLocal)
              .style("opacity", function(d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1;
                } else {
                  return 0;
                }
              });
        }
      }

      if (opts.right_columns) {
        for (var j = 0; j < opts.right_columns.length; j++) {
          var rb = [_.translate[dim], rightColsBounds[j].height * _.scale[dim] + _.translate[dim]];
          opts.right_columns_scales[j].rangeBands(rb);

          var tAxisNodes = d3.select(".axisNodesRight" + j)
            .transition()
            .duration(opts.anim_duration)
            .ease('linear');

          tAxisNodes.call(opts.right_columns_axis[j]);

          d3.select(".axisNodesRight" + j).selectAll("text")
              .style("text-anchor", function() {
                if (options.right_columns_align[j] == "l") {
                  return "start";
                } else if (options.right_columns_align[j] == "c") {
                  return "middle";
                } else if (options.right_columns_align[j] == "r") {
                  return "end";
                }
              });

          tAxisNodes.selectAll("g")
              .style("opacity", function(d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1;
                } else {
                  return 0;
                }
              });

          tAxisNodes.selectAll("text")
              .style("text-anchor", function() {
                if (options.right_columns_align[j] == "l") {
                  return "start";
                } else if (options.right_columns_align[j] == "c") {
                  return "middle";
                } else if (options.right_columns_align[j] == "r") {
                  return "end";
                }
              });

          function layoutMouseTargetsLocal(selection) {
            var _h = opts.right_columns_scales[j].rangeBand();
            var _w = opts.right_columns_width[j];
            selection
                .attr("transform", function(d, i) {
                  var x = 0;
                  var y = opts.right_columns_scales[j](i);
                  return "translate(" + x + "," + y + ")";
                })
              .selectAll("rect")
                .attr("height", _h)
                .attr("width", _w);
          }

          opts.right_columns_mouseTargets[j].transition().duration(opts.anim_duration).ease('linear')
              .call(layoutMouseTargetsLocal)
              .style("opacity", function(d, i) {
                if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                  return 1;
                } else {
                  return 0;
                }
              });
        }
      }
    });
  }

  function insert_columns(svg, bounds, data, fontFamily, fontSize, fontColor, align, left_or_right, index) {
    // bounds is an array of columns, data is an array of data columns
    var svg = svg.append('g');
    var thisColData = data;
    var thisBounds = bounds;
    // set axis options
    var scale = d3.scale.ordinal()
        .domain(d3.range(0, thisColData.length))
        .rangeBands([0, thisBounds.height]);

    var axis = d3.svg.axis()
        .scale(scale)
        .orient("left")
        .outerTickSize(0)
        .innerTickSize(0)
        .tickPadding(0)
        .tickFormat(function(d, i) { return thisColData[i]; });// hack for repeated values

    var lr = "Left";
    if (left_or_right) {
      opts.left_columns_axis.push(axis);
      opts.left_columns_scales.push(scale);
    } else {
      opts.right_columns_axis.push(axis);
      opts.right_columns_scales.push(scale);
      lr = "Right";
    }

    // Create the actual axis
    var axisNodes = svg.append('g')
        .attr("class", "axisNodes" + lr + index)
        .attr("transform", function() {
          if (align =="l") {
            return "translate(0,0)";
          } else if (align == "c") {
            return "translate(" + thisBounds.width/2 + ",0)";
          } else if (align == "r") {
            return "translate(" + (thisBounds.width - opts.axis_padding) + ",0)";
          }
        })
        .call(axis);

    axisNodes.selectAll("text")
      .attr("class", "coltick" + lr + index)
      .attr("id", function (d,i) {
        return "c" + i;
      }) 
      .style("opacity", 1)
      .style("font-size", fontSize)
      .style("fill", fontColor)
      .style("font-family", fontFamily);

    var mouseTargets = svg.append("g")
      .selectAll("g").data(thisColData);

    mouseTargets
      .enter()
        .append("g").append("rect")
          .style("cursor", "pointer")
          .attr("transform", "")
          .attr("fill", "transparent")
          .on("click", function(d, i) {
            var dim = 'y';
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

    if (left_or_right) {
      opts.left_columns_mouseTargets.push(mouseTargets);
    } else {
      opts.right_columns_mouseTargets.push(mouseTargets);
    }
    
    function layoutMouseTargets(selection) {
      var _h = scale.rangeBand();
      var _w = bounds.width;
      selection
          .attr("transform", function(d, i) {
            var x = 0;
            var y = scale(i);
            return "translate(" + x + "," + y + ")";
          })
        .selectAll("rect")
          .attr("height", _h)
          .attr("width", _w);
    }
    layoutMouseTargets(mouseTargets);

    axisNodes.selectAll("text")
      .style("text-anchor", "start");

    if (align == "c") {
      axisNodes.selectAll("text")
        .style("text-anchor", "middle");
    } else if (align == "r") {
      axisNodes.selectAll("text")
        .style("text-anchor", "end");
    }
  }

  function insert_column_subtitle (svg, bounds, subtitle, fontFam, fontSize, fontCol, colWidth, left_or_right) {
    var this_sub = [];
    var this_colw = [];
    for (var j = 0; j < subtitle.length; j++) {
      this_sub.push(subtitle[j]);
      this_colw.push(colWidth[j]);
    }
    if (left_or_right) {
      this_sub = this_sub.reverse();
      this_colw = this_colw.reverse();
    }
    var text_el = svg.append('g').selectAll("text").data(this_sub).enter();
    var thisBounds = bounds;
    var sub;
    sub = text_el.append("g")
      .attr("transform", function(d,i) {

        var accumu_x = 0;
        for (var kk = 0; kk < i; kk++) {
          accumu_x = accumu_x + this_colw[kk];
        }
        if (!left_or_right) {
          accumu_x = accumu_x + rightColsBounds[0].left;
        }
        return "translate(" + (accumu_x + this_colw[i]/2 - fontSize/2) + "," + (thisBounds.height - opts.axis_padding) + ")";
      })
      .append("text")
      .attr("transform", function() {
        return "rotate(-45),translate(" + opts.axis_padding + "," + 0 + ")";
      })
      .attr("x", 0)
      .attr("y", -opts.axis_padding)
      .text(function(d){ return d;})
      .style("text-anchor", function() {
        return "start";
      })
      .style("font-family", fontFam)
      .style("font-size", fontSize)
      .style("fill", fontCol);

  }

  function insert_column_title (svg, bounds, title, titleBold, fontFam, fontSize, fontCol, colWidth, left_or_right) {
    var svg = svg.append('g');
    var thisBounds = bounds;
    var sub = svg.append("g")
        .attr("transform", function() {
          return "translate(0," + fontSize + ")";
        })
        .append("text")
        .attr("transform", function() {
          return "translate(0,0)";
        })
        .attr("x", function() {
          if (left_or_right) {
            return opts.left_columns_total_width/2;
          } else {
            return opts.left_columns_total_width + colormapBounds.width + opts.right_columns_total_width/2;
          }
          
        })
        .attr("y", function() {
          return 0;
        })
        .attr("dy", 0)
        .text(title)
        .style("text-anchor", function() {
            return "middle";
        })
        .attr("font-weight", titleBold ? "bold" : "normal")
        .style("font-family", fontFam)
        .style("font-size", fontSize)
        .style("fill", fontCol)
        .call(wrap_new, colWidth);
  }

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
              txt = txt + "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + tt_names[j] + "</th><td style='font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + htmlEscape(tt_info[tt_names[j]][d.row*cols + d.col]) + "</td></tr>";
            }
          }

          return "<table class='rhtmlHeatmap-tip-table'>" +
            "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + rowTitle + "</th><td style='font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + htmlEscape(data.rows[d.row]) + "</td></tr>" +
            "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + colTitle + "</th><td style='font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + htmlEscape(data.cols[d.col]) + "</td></tr>" +
            "<tr><th style='text-align:right;font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>Value</th><td style='font-size:" + opts.tip_font_size + "px;font-family:" + options.tip_font_family + ";color:white'>" + htmlEscape(d.label) + "</td></tr>" + txt +
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
          if (d.hide) {
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
      var x_scale, y_scale;
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
        .style("font-size", ft_size)
        .style("font-family", options.cell_font_family);

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

      var cellnote_incell = svg.selectAll("text").data(merged);
      cellnote_incell.enter().append("text")
        .text(function(d) {
          return d.cellnote_in_cell;
        })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "central")
        .style("font-family", options.cell_font_family)
        .style("font-size", options.cell_font_size)
        .style("fill", function(d) {
          return d.cellnote_color;
        });

      new_ft_size = draw_text(cellnote_incell);
    }

    controller.on('transform.colormap', function(_) {

      var old_box_w = x(1) - x(0) - spacing;
      var old_box_h = y(1) - y(0) - spacing;

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
          if (merged[row*cols + col].hide) {
            return;
          }
          var label = merged[row*cols + col].label;
          var this_tip = tip.show({col: col, row: row, label: label}).style({
            top: d3.event.clientY + 10 + "px",
            left: d3.event.clientX + 10 + "px",
            opacity: 0.9
          });

          // height of the tip
          var tipHeight = parseFloat(this_tip.style("height"));
          // width of the tip
          var tipWidth = parseFloat(this_tip.style("width"));
          var mouseTop = d3.event.clientY, mouseLeft = d3.event.clientX;

          var tipLeft = parseFloat(this_tip.style("left"));
          var tipTop = parseFloat(this_tip.style("top"));

          if (tipLeft + tipWidth > opts.width) {
            // right edge out of bound
            if (mouseLeft - tipWidth - 10 < 0) {
              // left edge out of bound if adjusted
              if (Math.abs(mouseLeft - tipWidth - 10) > Math.abs(opts.width - tipLeft - tipWidth )) {
                this_tip.style("left", tipLeft + "px");
              } else {
                this_tip.style("left", mouseLeft - tipWidth - 10 + "px");
              }
            } else {
              this_tip.style("left", mouseLeft - tipWidth - 10 + "px");
            }
          }

          if (tipTop + tipHeight > opts.height) {
            if (mouseTop - tipHeight - 10 < 0) {
              if (Math.abs(mouseTop - tipHeight - 10) > Math.abs(opts.height - tipTop - tipHeight )) {
                this_tip.style("top", tipTop + "px");
              } else {
                this_tip.style("top", mouseTop - tipHeight - 10 + "px");
              }
            } else {
              this_tip.style("top", mouseTop - tipHeight - 10 + "px");
            }
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
          if (merged[row*cols + col].hide) {
            tip.hide();
            return;
          }
          var label = merged[row*cols + col].label;
          var this_tip = tip.show({col: col, row: row, label: label}).style({
            top: d3.event.clientY + 10 + "px",
            left: d3.event.clientX + 10 + "px",
            opacity: 0.9
          });

          // height of the tip
          var tipHeight = parseFloat(this_tip.style("height"));
          // width of the tip
          var tipWidth = parseFloat(this_tip.style("width"));
          var mouseTop = d3.event.clientY, mouseLeft = d3.event.clientX;

          var tipLeft = parseFloat(this_tip.style("left"));
          var tipTop = parseFloat(this_tip.style("top"));

          if (tipLeft + tipWidth > opts.width) {
            // right edge out of bound
            if (mouseLeft - tipWidth - 10 < 0) {
              // left edge out of bound if adjusted
              if (Math.abs(mouseLeft - tipWidth - 10) > Math.abs(opts.width - tipLeft - tipWidth )) {
                this_tip.style("left", tipLeft + "px");
              } else {
                this_tip.style("left", mouseLeft - tipWidth - 10 + "px");
              }
            } else {
              this_tip.style("left", mouseLeft - tipWidth - 10 + "px");
            }
          }

          if (tipTop + tipHeight > opts.height) {
            if (mouseTop - tipHeight - 10 < 0) {
              if (Math.abs(mouseTop - tipHeight - 10) > Math.abs(opts.height - tipTop - tipHeight )) {
                this_tip.style("top", tipTop + "px");
              } else {
                this_tip.style("top", mouseTop - tipHeight - 10 + "px");
              }
            } else {
              this_tip.style("top", mouseTop - tipHeight - 10 + "px");
            }
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

  function legend(svg, colors, range, bounds) {
    var legendAxisG = svg.append("g");
    svg = svg.append('g');

    var legendRects = svg.selectAll("rect")
      .data(colors);

    var boundsPaddingX = 4 + opts.legend_left_space,
        boundsPaddingY = 20,
        rectWidth = opts.legend_bar_width,
        rectHeight = (bounds.height - boundsPaddingY*2)/colors.length;

    legendRects.enter()
      .append("rect")
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .attr("transform", function(d,i) {
        return "translate(" + (boundsPaddingX) + "," + (rectHeight * i + boundsPaddingY) + ")";
      })
      .style("fill", function(d){ return d;})
      .style("stroke", function(d){ return d;})
      .style("stroke-width", "1px");

    // append axis
    legendAxisG.attr("transform", "translate(" + (boundsPaddingX + rectWidth) + "," + boundsPaddingY + ")");
    var legendScale;
    if (opts.x_is_factor) {
      legendScale = d3.scale.ordinal().rangeBands([colors.length * rectHeight, 0]).nice();
    } else {
      legendScale = d3.scale.linear().range([colors.length * rectHeight, 0]).nice();
    }

    legendScale.domain(opts.legend_range);

/*    var tickCount, tickVals, step;
    if (!opts.x_is_factor) {
      tickCount = 10;
      step = (opts.legend_range[1]-opts.legend_range[0])/tickCount;
      tickVals = d3.range(opts.legend_range[0], opts.legend_range[1]+step, step);
    }
*/
    var legendAxis = d3.svg.axis()
        .scale(legendScale)
        .orient("right")
        .tickSize(0)
        .tickValues( legendScale.ticks( opts.x_is_factor ? opts.legend_colors.length : 8 ).concat( legendScale.domain() ) )
        .tickFormat(opts.legend_format);

    legendAxisG.call(legendAxis);
    legendAxisG.selectAll("text")
      .style("font-size", opts.legend_font_size + "px")
      .style("font-family", options.legend_font_family)
      .style("fill", options.legend_font_color);
  }

  function title_footer(svg, bounds, texts, fontFam, fontSize, fontColor, fontWeight, wrapwidth, t_st_f) {
    svg = svg.append('g');
    var this_text = svg.append("text")
      .text(texts)
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", 0)
      .style("font-family", fontFam)
      .style("font-size", fontSize)
      .style("fill", fontColor)
      .call(wrap_new, wrapwidth)
      .style("text-anchor", t_st_f === "3" ? "start" : "middle")
      .attr("font-weight", fontWeight ? "bold" : "normal");

    var transX = t_st_f === "3" ? opts.footer_margin_X : opts.width / 2;
    var transY = (t_st_f === "3" ? opts.footer_margin_Y : t_st_f === "1" ? opts.title_margin_top : opts.subtitle_margin_top) + fontSize;
    this_text.attr("transform", "translate(" + transX + "," + transY + ")");

  }


  function axis_title(svg, data, rotated, width, height) {

    // rotated is y, unrotated is x

    svg = svg.append('g');
    var fontsize = rotated ? options.yaxis_title_font_size : options.xaxis_title_font_size;
    var fontBold = rotated ? options.yaxis_title_bold : options.xaxis_title_bold;
    var fontColor = rotated ? options.yaxis_title_font_color : options.xaxis_title_font_color;
    var fontFam = rotated ? options.yaxis_title_font_family : options.xaxis_title_font_family;

    var this_title = svg.append("text")
      .text(data)
      .attr("x", 0)
      .attr("y", 0)
      .attr("dy", 0)
      .attr("transform", function(){
        if (rotated) {
          return "translate(" + (width/2) + "," + (height/2) + "),rotate(-90)"
        } else {
          if (opts.xaxis_location == "top") {
            return "translate(" + (width/2 + opts.left_columns_total_width) + "," + (fontsize) + ")"
          } else {
            return "translate(" + (width/2) + "," + (fontsize) + ")"
          }
        }
      })                         
      .style("font-weight", fontBold ? "bold" : "normal")
      .style("font-size", fontsize)
      .style("fill", fontColor)
      .style("font-family", fontFam)
      .style("text-anchor", "middle");

    if (!rotated) {
      this_title.call(wrap_new, width);
    }
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
        .domain(d3.range(0, leaves.length))
        .rangeBands([0, rotated ? width : height]);
    var axis = d3.svg.axis()
        .scale(scale)
        .orient(axis_location)
        .outerTickSize(0)
        .tickPadding(padding)
        .tickFormat(function(d, i) { return leaves[i]; });// hack for repeated values

    if (options.table_style) {
      axis.innerTickSize(0);
    }

    var xboundsleft = 0;
    if (opts.left_columns && options.xaxis_location == "top") {
      xboundsleft = opts.left_columns_total_width - padding;
    }
    // Create the actual axis
    var axisNodes = svg.append("g")
        .attr("transform", function() {
          if (rotated) {
            if (axis_location === "bottom") {
              return "translate(" + (xboundsleft + xaxisBounds.left) + "," + padding + ")";
            } else if (axis_location === "top") {
              return "translate(" + (xboundsleft + xaxisBounds.left) + "," + (xaxisBounds.height - padding) + ")";
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
    axisNodes.selectAll("text")
      .style("font-size", fontSize)
      .style("fill", rotated ? options.xaxis_font_color : options.yaxis_font_color)
      .style("font-family", rotated ? options.xaxis_font_family : options.yaxis_font_family);

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
            var x = rotated ? (axis_location === "bottom" ? scale(i) + scale.rangeBand()/2 + xaxisBounds.left + xboundsleft : scale(i) + xaxisBounds.left + xboundsleft) : 0;
            var y = rotated ? (axis_location === "bottom" ? padding + 6 : height - _h/1.414 - padding - 6): scale(i);
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
    //  else {
    //   if (options.table_style) {
    //     axisNodes.selectAll("text").style("text-anchor", "start");
    //   }
    // }

    controller.on('highlight.axis-' + (rotated ? 'x' : 'y'), function(hl) {
      var ticks = axisNodes.selectAll('.tick');
      var selected = hl[rotated ? 'x' : 'y'];
      if (typeof(selected) !== 'number') {
        ticks.style('opacity', function(d,i) {
          if (rotated) {
            var ttt = d3.transform(d3.select(this).attr("transform"));
            if (ttt.translate[0] < 0 || ttt.translate[0] > width) {
              return 0;
            } else {
              return 1;
            }
          }
        });
        return;
      }
      ticks.style('opacity', function(d, i) {
        if (i !== selected) {
          return 0.4;
        } else {
          return 1;
        }
      });
      ticks.each(function(d,i) {
        if (rotated) {
          var ttt = d3.transform(d3.select(this).attr("transform"));
          if (ttt.translate[0] < 0 || ttt.translate[0] > width) {
            d3.select(this).style("opacity", 0);
          }
        }
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
      // if (options.table_style) {
      //   axisNodes.selectAll("text").style("text-anchor", "start");
      // } else {
        axisNodes.selectAll("text").style("text-anchor", rotated ? "start" : axis_location === "right" ? "start" : "end");
      // }
      
      tAxisNodes.selectAll("g")
          .style("opacity", function(d, i) {
            if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
              return 1;
            } else {
              return 0;
            }
          });
      // if (options.table_style) {
      //   tAxisNodes.selectAll("text")
      //     .style("text-anchor", "start");

      // } else {
        tAxisNodes.selectAll("text")
          .style("text-anchor", rotated ? "start" : axis_location === "right" ? "start" : "end");
      // }


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
