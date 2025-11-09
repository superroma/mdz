Feature: Page Management
  As a user
  I want to create, rename, and delete pages
  So that I can organize my content

  Scenario: Create root page
    When I click the root "+" button
    Then a new page named "Untitled" should be created
    And the title field should be focused with text selected
    And I should be navigated to the new page

  Scenario: Rename page via title field
    Given I am viewing a page
    When I edit the title field and press Enter
    Then the page should be renamed
    And the URL should update if needed
    And the sidebar should show the new name

  Scenario: Create child page
    Given I am viewing a page
    When I click that page's "+" button in the sidebar
    Then a new child page should be created
    And I should be navigated to the new child page

  Scenario: Delete page
    Given I am viewing a page
    When I delete the page
    Then the page should be removed
    And I should be navigated to another page
    And the sidebar should no longer show the deleted page

