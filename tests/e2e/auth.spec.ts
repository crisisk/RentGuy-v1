/// <reference types="cypress" />

/**
 * E2E tests for authentication flows
 * @group auth
 * @group critical
 */
describe('Authenticatie flows', () => {
  const testUser = {
    email: 'test@rentguy.nl',
    password: 'VeiligWachtwoord123!'
  };

  beforeEach(() => {
    cy.visit('/');
  });

  context('Registratie flow', () => {
    it('Moet een nieuwe gebruiker succesvol registreren', () => {
      cy.intercept('POST', '/api/register').as('registerRequest');
      
      cy.get('[data-testid="register-link"]').click();
      cy.get('[data-testid="email-input"]').type('nieuwe@user.nl');
      cy.get('[data-testid="password-input"]').type('NieuweUser123!');
      cy.get('[data-testid="terms-checkbox"]').check();
      cy.get('[data-testid="register-button"]').click();

      cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
      cy.contains('Account succesvol aangemaakt').should('be.visible');
      cy.url().should('include', '/verify-email');
    });

    it('Moet fouten tonen bij ongeldige registratiepoging', () => {
      cy.get('[data-testid="register-link"]').click();
      
      // Test empty submission
      cy.get('[data-testid="register-button"]').click();
      cy.contains('E-mail is verplicht').should('be.visible');
      cy.contains('Wachtwoord is verplicht').should('be.visible');

      // Test invalid email
      cy.get('[data-testid="email-input"]').type('ongeldig-email');
      cy.get('[data-testid="password-input"]').type('test');
      cy.get('[data-testid="register-button"]').click();
      cy.contains('Ongeldig e-mailadres').should('be.visible');
      cy.contains('Wachtwoord moet minimaal 8 tekens bevatten').should('be.visible');
    });
  });

  context('Inlog flow', () => {
    it('Moet succesvol inloggen met juiste credentials', () => {
      cy.intercept('POST', '/api/login').as('loginRequest');
      
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="password-input"]').type(testUser.password);
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-avatar"]').should('be.visible');
    });

    it('Moet foutmelding tonen bij onjuiste credentials', () => {
      cy.intercept('POST', '/api/login', {
        statusCode: 401,
        body: { message: 'Ongeldige inloggegevens' }
      }).as('failedLogin');

      cy.get('[data-testid="email-input"]').type('fout@email.nl');
      cy.get('[data-testid="password-input"]').type('foutwachtwoord');
      cy.get('[data-testid="login-button"]').click();

      cy.wait('@failedLogin');
      cy.contains('Ongeldige inloggegevens').should('be.visible');
      cy.url().should('include', '/login');
    });
  });

  context('Wachtwoord reset flow', () => {
    it('Moet wachtwoord reset proces succesvol afronden', () => {
      cy.intercept('POST', '/api/password-reset').as('resetRequest');
      cy.intercept('POST', '/api/password-reset/confirm').as('confirmRequest');

      // Initiate reset
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.get('[data-testid="email-input"]').type(testUser.email);
      cy.get('[data-testid="reset-request-button"]').click();
      cy.wait('@resetRequest').its('response.statusCode').should('eq', 200);
      cy.contains('Reset link verzonden').should('be.visible');

      // Confirm reset (simulate email link click)
      cy.visit('/password-reset/confirm?token=valid-token');
      cy.get('[data-testid="new-password-input"]').type('NieuwWachtwoord123!');
      cy.get('[data-testid="confirm-password-input"]').type('NieuwWachtwoord123!');
      cy.get('[data-testid="reset-confirm-button"]').click();
      
      cy.wait('@confirmRequest').its('response.statusCode').should('eq', 200);
      cy.url().should('include', '/login');
      cy.contains('Wachtwoord succesvol gewijzigd').should('be.visible');
    });
  });

  context('Sessie beheer', () => {
    it('Moet uitloggen en sessie verwijderen', () => {
      cy.login(testUser); // Custom command
      
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      cy.url().should('include', '/login');
      cy.window().its('localStorage').invoke('getItem', 'sessionToken').should('be.null');
    });

    it('Moet ongeldige sessie detecteren', () => {
      cy.login(testUser);
      cy.clearLocalStorage();
      cy.reload();
      
      cy.url().should('include', '/login');
      cy.contains('Sessie verlopen').should('be.visible');
    });
  });
});