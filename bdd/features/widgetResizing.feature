@applitools @heatmap @resize
Feature: Calls to Resize

  Resize functions correctly.

  Scenario: Basic Resizing Test
    Given I am viewing "data.minimal_3x3_standalone" with dimensions 400x400
    Then the "resize_minimal_3x3_standalone_400x400" snapshot matches the baseline
    When I resize the widget to 600x400
    Then the "resize_minimal_3x3_standalone_600x400" snapshot matches the baseline
    When I resize the widget to 400x600
    Then the "resize_minimal_3x3_standalone_400x600" snapshot matches the baseline

  Scenario: Dendrogram resizing Test
    Given I am viewing "displayr_regression_cases.dendrogram" with dimensions 600x600
    Then the "resize_dendrogram_600x600" snapshot matches the baseline
    When I resize the widget to 400x600
    Then the "resize_dendrogram_400x600" snapshot matches the baseline
    When I resize the widget to 600x400
    Then the "resize_dendrogram_600x400" snapshot matches the baseline