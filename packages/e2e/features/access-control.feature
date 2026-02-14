Feature: Access Control
  As a system administrator
  I want to control page access based on user groups
  So that sensitive content is only visible to authorized users

  Background:
    Given the users.yaml configuration exists

  Scenario: Admin can access all pages
    When I log in using the test provider as "admin"
    Then I should see all pages in the navigation
    And I should be able to edit any page

  Scenario: User not in users.yaml cannot access anything
    When I log in using the test provider as "outsider"
    Then I should be redirected to the login page
    And I should see a login access denied message for "non-user@test.local"

  Scenario: Reader can only view pages with everyone group
    When I log in using the test provider as "reader"
    Then I should see pages accessible to "everyone" group
    And I should not be able to edit any page

  Scenario: Writer can edit pages with writer access
    When I log in using the test provider as "writer"
    Then I should see pages accessible to "writers" group
    And I should be able to edit pages with writer access
    And I should not be able to edit pages restricted to admins

  Scenario: Settings page is restricted to admins
    When I log in using the test provider as "reader"
    Then I should not see the page ".settings" in navigation
    And accessing ".settings" should return 404
    And I should not be able to edit pages restricted to admins
    When I log in using the test provider as "admin"
    Then I should be able to edit ".settings"

  Scenario: Access inheritance from parent page
    Given a parent page "Team" with access control:
      """
      __access:
        read: [writers]
        write: [writers]
      """
    And a child page "Team/Project" without access control
    When I log in using the test provider as "reader"
    Then I should not see "Team" or "Team/Project" in navigation
    When I log in using the test provider as "writer"
    Then I should see both "Team" and "Team/Project" in navigation
    And I should be able to edit both pages

  Scenario: File access follows page access
    Given a page "Docs" with file "report.pdf"
    And "Docs" has access control:
      """
      __access:
        read: [writers]
        write: [writers]
      """
    When I log in using the test provider as "reader"
    Then I should not be able to access "report.pdf"
    When I log in using the test provider as "writer"
    Then I should be able to download "report.pdf"
    And I should be able to upload files to "Docs"

  Scenario: Reader should not see edit or delete buttons
    When I log in using the test provider as "reader"
    And I navigate to "Welcome" page
    Then I should not see the "Edit page content" button
    And I should not see the "Delete page" button

  Scenario: Reader should not be able to toggle checkboxes
    When I log in using the test provider as "writer"
    And I navigate to "Getting Started" page
    And I am in preview mode
    And I note the current document state
    When I log in using the test provider as "reader"
    And I navigate to "Getting Started" page
    And I am in preview mode
    Then checkboxes should be disabled

  Scenario: Writer should see edit and delete buttons
    When I log in using the test provider as "writer"
    And I navigate to "Welcome" page
    Then I should see the "Edit page content" button
    And I should see the "Delete page" button

  Scenario: Reader should not be able to rename page title
    When I log in using the test provider as "reader"
    And I navigate to "Welcome" page
    Then the page title should be read-only

  Scenario: User groups are shown in JWT
    When I log in using the test provider as "admin"
    Then my user info should include groups: ["everyone", "admins"]
    When I log in using the test provider as "writer"
    Then my user info should include groups: ["everyone", "writers"]
    When I log in using the test provider as "reader"
    Then my user info should include groups: ["everyone"]
