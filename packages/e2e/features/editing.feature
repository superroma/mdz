Feature: Page Editing
  As a user
  I want to edit page content
  So that I can update my notes

  Scenario: Title field auto-saves
    Given I am viewing a page
    When I edit the title field and blur focus
    Then the title should be saved automatically

  Scenario: MDXEditor is always in edit mode
    Given I am viewing a page in view mode
    When I click the Edit button
    Then I should see the markdown source editor

  Scenario: Auto-save content changes
    Given I am editing a page
    When I modify the content and press Cmd+S
    Then the content should be saved
    And I should see a success indicator

  Scenario: Keyboard navigation from title
    Given the title field is focused
    When I press Enter
    Then the content editor should receive focus

