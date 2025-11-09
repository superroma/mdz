Feature: Backend Storage Operations
  As a system
  I need to store and retrieve pages from the filesystem
  So that content persists between sessions

  Background:
    Given seed pages are loaded in a temporary test directory
    And the backend is configured to use the test directory

  Scenario: Create a page
    When I create a page named "Test Page"
    Then the file "Test Page.md" should exist
    And I should be able to read the page content

  Scenario: Folderization on child creation
    Given a page "Parent.md" exists
    When I create a child page "Parent/Child"
    Then "Parent.md" should not exist
    And "Parent/README.md" should exist
    And "Parent/Child.md" should exist

  Scenario: Read seed pages with front-matter
    When I request the page "Welcome/Tasks/Write Tests"
    Then I should receive a 200 response
    And the response should include front-matter with status "In Progress"
    And the response should include front-matter with priority "High"

  Scenario: List pages with hierarchy
    When I request the list of all pages
    Then I should see "Welcome" as a root page
    And I should see "Welcome" as a root page with children
    And "Welcome/Tasks" should have 4 child pages
    And "Welcome/Projects" should have 3 child pages

  Scenario: Prevent path traversal
    When I attempt to access "../../../etc/passwd"
    Then I should receive a 403 Forbidden response

