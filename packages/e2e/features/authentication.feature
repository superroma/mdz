Feature: Authentication
  As a user
  I want to authenticate and be redirected to my intended page
  So that I can resume my work after logging in

  Scenario: Redirect to intended page after login
    When I visit a protected page URL "/Welcome"
    Then I should be redirected to the login page
    When I log in using the test provider as "admin"
    Then I should be redirected back to "/Welcome"
    And I should see the "Welcome" page content

  Scenario: Multiple login/logout cycles maintain redirect
    When I visit a protected page URL "/Welcome/Tasks"
    And I log in using the test provider as "admin"
    Then I should be redirected back to "/Welcome/Tasks"
    When I log out
    Then I should be redirected to the login page
    When I visit a protected page URL "/Welcome/Projects"
    And I log in using the test provider as "writer"
    Then I should be redirected back to "/Welcome/Projects"

  Scenario: Login from login page redirects to home
    When I visit the login page directly
    And I log in using the test provider as "admin"
    Then I should be redirected to the home page
