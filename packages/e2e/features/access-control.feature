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
    Then I should see no pages in the navigation
    And accessing any page should return 404

  Scenario: Reader can only view pages with everyone group
    When I log in using the test provider as "reader"
    Then I should see pages accessible to "everyone" group
    And I should not be able to edit any page

  Scenario: Writer can edit pages with writer access
    When I log in using the test provider as "writer"
    Then I should see pages accessible to "writers" group
    And I should be able to edit pages with writer access
    And I should not be able to edit pages restricted to admins

  Scenario: Page with explicit access control
    Given a page "Private/Secret" with access control:
      """
      __access:
        read: [admins]
        write: [admins]
      """
    When I log in using the test provider as "reader"
    Then I should not see the page "Private/Secret" in navigation
    And accessing "Private/Secret" should return 404
    When I log in using the test provider as "admin"
    Then I should see the page "Private/Secret" in navigation
    And I should be able to edit "Private/Secret"

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

  Scenario: User groups are shown in JWT
    When I log in using the test provider as "admin"
    Then my user info should include groups: ["everyone", "admins"]
    When I log in using the test provider as "writer"
    Then my user info should include groups: ["everyone", "writers"]
    When I log in using the test provider as "reader"
    Then my user info should include groups: ["everyone"]
