@applitools @heatmap @rowFocus
Feature: Zoom Interactions

  Clicking on a row in the y axis will focus and unfocus the row

  Scenario: Scenario: User can focus a row
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 650x650
    And I click row 2 name
    Then Sleep 700 milliseconds
    Then the "row_focus_interaction_minimal_3x3_focus_row_2" snapshot matches the baseline
    When I click row 2 name
    Then Sleep 700 milliseconds
    Then the "zoom_interaction_minimal_3x3_unfocus_row_2" snapshot matches the baseline
