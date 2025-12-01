Feature: Page Editing
  As a user
  I want to edit page content
  So that I can update my notes

  Scenario: Page editing workflow
    Given I am viewing a page
    And I am in preview mode
    When I click the "Edit" button
    Then the "markdown source editor" should be visible
    When I modify the content and press Cmd+S
    Then the content should be saved
    And I should see a success indicator
    When I edit the title field and blur focus
    Then the title should be saved automatically

  Scenario: Keyboard navigation from title
    Given the title field is focused
    When I press Enter
    Then the content editor should receive focus

  Scenario: Autosave and editor preservation
    Given I am viewing a page
    And I am in preview mode
    When I click the "Edit" button
    Then the "markdown source editor" should be visible
    When I type some content in the editor
    And I wait for autosave to complete
    Then the content should be saved automatically
    When I click the "Preview" button
    Then the "markdown source editor" should be hidden
    And the preview should show the new content
    When I click the "Edit" button again
    Then the "markdown source editor" should be visible
    And the editor should contain my previous content
    And I should be able to undo my changes

  Scenario: HTML with inline styles is sanitized
    Given I have a page with HTML content with inline styles
    When I view the page
    Then the page should display without errors
    And the HTML should be rendered without style attributes

  Scenario: Malformed markdown shows error gracefully
    Given I have a page with malformed MDX content
    When I view the page
    Then I should see an error message in the content area
    And the app should not crash

  Scenario: Edit mode cancels when navigating to another page
    Given I am viewing "Getting Started" page
    And I am in preview mode
    When I click the "Edit" button
    Then the "markdown source editor" should be visible
    When I click a different page in the sidebar
    Then the "markdown source editor" should be hidden
    And I should see the new page in preview mode
    And the page content should match the new page

