import './commands';

beforeEach(function skipPlaceholderSpecs(this: Mocha.Context) {
  if (Cypress.env('skipRentGuyE2E')) {
    cy.log('Skipping placeholder RentGuy E2E spec while UI coverage is migrated to Playwright.');
    this.skip();
  }
});
