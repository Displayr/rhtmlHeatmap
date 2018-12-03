@applitools @heatmap @hover @tooltip
Feature: Tooltip Interactions

  Hovering over different cells triggers tooltips

  Scenario: Scenario: User can hover over the cells and see tooltips
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 650x650
    And I hover over cell 0x0
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_top_left_anchoring" snapshot matches the baseline
    And I hover over cell 0x0 with offset 10x10
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_follows_mouse" snapshot matches the baseline
    And I hover over cell 0x2 with offset 50x0
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_top_right_anchoring" snapshot matches the baseline
    And I hover over cell 2x0 with offset 0x50
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_bottom_left_anchoring" snapshot matches the baseline
    And I hover over cell 2x2 with offset 50x50
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_bottom_right_anchoring" snapshot matches the baseline

  Scenario: Scenario: User can add extra data to tooltip
    Given I am viewing "displayr_regression_cases.correlation_matrix" with dimensions 1000x1000
    And I hover over cell 5x0
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_extra_info" snapshot matches the baseline

  Scenario: Scenario: Tooltip font settings can be customised
    Given I am viewing "data.minimal_3x3_standalone_legend_large_tooltips" with dimensions 650x650
    And I hover over cell 0x0
    Then Sleep 700 milliseconds
    Then the "tooltip_interaction_custom_font" snapshot matches the baseline