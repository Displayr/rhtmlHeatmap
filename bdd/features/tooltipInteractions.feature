@applitools @heatmap @hover @tooltip
Feature: Tooltip Interactions

  Hovering over different cells triggers tooltips

  Scenario: Scenario: User can hover over the cells and see tooltips
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 650x650
    And I hover over cell 0x0
    Then Sleep 700 milliseconds
    Then the "interaction_hover_cell_0x0_tooltip_top_left_anchoring" snapshot matches the baseline
    And I hover over cell 0x0 with offset 10x10
    Then Sleep 700 milliseconds
    Then the "interaction_hover_cell_0x0_tooltip_follows_mouse" snapshot matches the baseline
    And I hover over cell 0x2 with offset 50x0
    Then Sleep 700 milliseconds
    Then the "interaction_hover_cell_0x2_tooltip_top_right_anchoring" snapshot matches the baseline
    And I hover over cell 2x0 with offset 0x50
    Then Sleep 700 milliseconds
    Then the "interaction_hover_cell_0x2_tooltip_bottom_left_anchoring" snapshot matches the baseline
    And I hover over cell 2x2 with offset 50x50
    Then Sleep 700 milliseconds
    Then the "interaction_hover_cell_2x2_tooltip_bottom_right_anchoring" snapshot matches the baseline
