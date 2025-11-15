Feature: Interactive Checkboxes
  As a user
  I want to toggle checkboxes in preview mode
  So that I can mark tasks as complete without editing the markdown source

  Scenario: Toggle checkboxes in preview mode
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    And I scroll to the checkbox for "Read this getting started guide"
    When I click the checkbox for "Read this getting started guide"
    Then the checkbox should be toggled
    And the markdown should be updated to the toggled state for that item
    And the changes should be saved automatically
    And the page should not have scrolled

  Scenario: Toggle nested checkbox
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    When I click the checkbox for "This is a nested unchecked item"
    Then the checkbox should be toggled
    And the markdown should be updated to the toggled state for that item
    And the changes should be saved automatically

  Scenario: Checkboxes are not interactive in edit mode
    Given I am viewing the "Getting Started" page
    And I am in edit mode
    When I try to click a checkbox
    Then the checkbox should not toggle
    And the "markdown source editor" should be visible

  Scenario: Toggle checkbox twice - check and uncheck
    Given I am viewing the "Getting Started" page
    And I am in preview mode
    When I click the checkbox for "Read this getting started guide"
    Then the checkbox should be toggled
    And the markdown should be updated to the toggled state for that item
    And the changes should be saved automatically
    When I click the checkbox for "Read this getting started guide"
    Then the checkbox should be toggled
    And the markdown should be updated to the toggled state for that item
    And the changes should be saved automatically

