Feature: Autosave and Deep Undo
  As a user
  I want my changes to be automatically saved
  And I want to undo/redo changes even after switching between edit and preview modes
  So that I never lose my work

  Scenario: Autosave after typing
    Given I am viewing a page
    When I click the "Edit" button
    And I type "New content here" in the editor
    And I wait for 1.5 seconds
    Then the content should be auto-saved
    And I should see "Saving..." indicator briefly

  Scenario: Changes persist when switching to preview without manual save
    Given I am viewing a page
    When I click the "Edit" button
    And I type "Modified content" in the editor
    And I click the "Preview" button
    Then I should see "Modified content" in the preview
    When I click the "Edit" button again
    Then the editor should contain "Modified content"

  Scenario: Deep undo persists across mode switches
    Given I am viewing a page
    When I click the "Edit" button
    And I type "First edit" in the editor
    And I wait for 1.5 seconds
    And I type " Second edit" in the editor
    And I click the "Preview" button
    And I click the "Edit" button again
    When I press Cmd+Z
    Then the editor should contain "First edit"

  Scenario: Undo and redo with keyboard shortcuts
    Given I am viewing a page
    When I click the "Edit" button
    And I clear the editor and type "Version 1"
    And I wait for 1.5 seconds
    And I clear the editor and type "Version 2"
    And I wait for 1.5 seconds
    When I press Cmd+Z
    Then the editor should contain "Version 1"
    When I press Cmd+Shift+Z
    Then the editor should contain "Version 2"

  Scenario: Undo and redo buttons work correctly
    Given I am viewing a page
    When I click the "Edit" button
    Then the undo button should be disabled
    When I type "New text" in the editor
    And I wait for 1.5 seconds
    Then the undo button should be enabled
    When I click the undo button
    Then the editor should not contain "New text"
    And the redo button should be enabled
    When I click the redo button
    Then the editor should contain "New text"

  Scenario: No save button is visible
    Given I am viewing a page
    When I click the "Edit" button
    Then the save button should not exist
    And I should see autosave hints
