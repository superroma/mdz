Feature: Page Editing
  As a user
  I want to edit page content
  So that I can update my notes

  Scenario: Page editing workflow
    Given I am viewing a page in view mode
    When I click the Edit button
    Then I should see the markdown source editor
    When I modify the content and press Cmd+S
    Then the content should be saved
    And I should see a success indicator
    When I edit the title field and blur focus
    Then the title should be saved automatically

  Scenario: Keyboard navigation from title
    Given the title field is focused
    When I press Enter
    Then the content editor should receive focus

