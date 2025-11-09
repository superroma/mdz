Feature: Application Health Check
  As a developer
  I want to verify the application infrastructure is working
  So that I can build features on a solid foundation

  Scenario: Backend server is running
    Given the backend server is running
    When I request the health check endpoint
    Then I should receive a successful response

  Scenario: Frontend application loads
    Given the frontend application is running
    When I navigate to the homepage
    Then I should see the application interface

