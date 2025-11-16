Feature: Hidden Files and Pages

  Background:
    Given seed pages are loaded in a temporary test directory
    And the backend is configured to use the test directory

  Scenario: Hidden pages are not shown by default
    Given a page ".hidden-page" exists
    And a page "visible-page" exists
    When I am viewing a page
    Then I should see "visible-page" in the sidebar
    And I should not see ".hidden-page" in the sidebar

  Scenario: Show hidden files toggle reveals hidden pages
    Given a page ".hidden-page" exists
    And a page "visible-page" exists
    When I am viewing a page
    And I click the show hidden files toggle
    Then I should see "visible-page" in the sidebar
    And I should see ".hidden-page" in the sidebar
