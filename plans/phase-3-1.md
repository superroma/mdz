App is fast, make e2e test timeout 5 sec
make e2e tests run on own servers - not default, in the 3201 and 3202 ports
Add e2e tests that formatting seed page content is actually rendered formatted. Make this test pass
Add e2e test (not bdd) that ensure formatted markdown HTML has actual styles. Make test pass.

Add sample mdx component to the markdown guide page.
Do a progress bar:
<Progress value={75} label="Backend Development" color="green" />
Implment this component with unit tests, add it to the page and test it is shown there correctly
