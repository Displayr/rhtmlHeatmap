@applitools @heatmap @highlight
Feature: Highlight Interactions

  Clicking on a row in the y axis will highlight and unhighlight the row

  Scenario: Scenario: User can highlight a row
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 650x650
    And I click row 2 name
    Then the "highlight_interaction_minimal_3x3_highlight_row_2" snapshot matches the baseline
    And I click row 1 name
    Then the "highlight_interaction_minimal_3x3_highlight_row_1" snapshot matches the baseline
    When I click row 1 name
    Then the "highlight_interaction_minimal_3x3_unhighlight_row" snapshot matches the baseline

  Scenario: Scenario: User can highlight a column
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 650x650
    And I click column 2 name
    Then the "highlight_interaction_minimal_3x3_highlight_column_2" snapshot matches the baseline
    And I click column 1 name
    Then the "highlight_interaction_minimal_3x3_highlight_column_1" snapshot matches the baseline
    When I click column 1 name
    Then the "highlight_interaction_minimal_3x3_unhighlight_column" snapshot matches the baseline

  Scenario: Scenario: User can highlight both, and click anywhere to reset
    Given I am viewing "data.minimal_3x3_standalone_legend" with dimensions 650x650
    And I click row 1 name
    And I click column 1 name
    Then the "column_highlight_interaction_minimal_3x3_highlight_both" snapshot matches the baseline
    When I click the legend bar
    Then the "highlight_interaction_minsnapshot matches the baselineimal_3x3_unhighlight_both" snapshot matches the baseline