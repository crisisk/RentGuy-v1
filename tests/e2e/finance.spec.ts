/// <reference types="cypress" />

/**
 * E2E tests for financial management flows
 * @group finance
 * @group critical
 */
describe('Financieel beheer flows', () => {
  const invoice = {
    client: 'Test Client BV',
    amount: '1500,00',
    description: 'Project X factuur'
  };

  beforeEach(() => {
    cy.login({ email: 'test@rentguy.nl', password: 'VeiligWachtwoord123!' });
    cy.visit('/finance');
  });

  context('Facturatie', () => {
    it('Moet factuur succesvol genereren en versturen', () => {
      cy.intercept('POST', '/api/invoices').as('createInvoice');
      
      cy.get('[data-testid="new-invoice-button"]').click();
      cy.get('[data-testid="client-select"]').select(invoice.client);
      cy.get('[data-testid="amount-input"]').type(invoice.amount);
      cy.get('[data-testid="description-input"]').type(invoice.description);
      cy.get('[data-testid="send-invoice-button"]').click();

      cy.wait('@createInvoice').its('response.statusCode').should('eq', 201);
      cy.contains(invoice.description).should('be.visible');
      cy.get('[data-testid="invoice-status"]').should('contain', 'Openstaand');
    });

    it('Moet factuurbedrag validatie afdwingen', () => {
      cy.get('[data-testid="new-invoice-button"]').click();
      cy.get('[data-testid="amount-input"]').type('ongeldig bedrag');
      cy.get('[data-testid="send-invoice-button"]').click();

      cy.contains('Ongeldig bedrag formaat').should('be.visible');
    });
  });

  context('Betalingen', () => {
    it('Moet betaling succesvol registreren', () => {
      cy.createInvoice(invoice); // Custom command
      
      cy.get('[data-testid="register-payment-button"]').first().click();
      cy.get('[data-testid="payment-amount-input"]').type(invoice.amount);
      cy.get('[data-testid="payment-method-select"]').select('Creditcard');
      cy.get('[data-testid="submit-payment-button"]').click();

      cy.get('[data-testid="invoice-status"]').should('contain', 'Betaald');
      cy.contains('Betaling geregistreerd').should('be.visible');
    });

    it('Moet gedeeltelijke betaling correct verwerken', () => {
      cy.createInvoice(invoice);
      
      cy.get('[data-testid="register-payment-button"]').first().click();
      cy.get('[data-testid="payment-amount-input"]').type('1000,00');
      cy.get('[data-testid="submit-payment-button"]').click();

      cy.get('[data-testid="invoice-status"]').should('contain', 'Deels betaald');
      cy.get('[data-testid="remaining-amount"]').should('contain', '500,00');
    });
  });

  context('Financiële rapportage', () => {
    it('Moet financieel overzicht genereren', () => {
      cy.intercept('GET', '/api/financial-reports').as('getReport');
      cy.createInvoice(invoice);
      
      cy.get('[data-testid="generate-report-button"]').click();
      cy.get('[data-testid="report-type-select"]').select('Jaarlijks');
      cy.get('[data-testid="generate-report-submit"]').click();

      cy.wait('@getReport').its('response.statusCode').should('eq', 200);
      cy.contains('Financieel Overzicht 2024').should('be.visible');
      cy.get('[data-testid="total-revenue"]').should('contain', '1.500');
    });

    it('Moet export naar PDF succesvol uitvoeren', () => {
      cy.generateFinancialReport('Jaarlijks'); // Custom command
      
      cy.get('[data-testid="export-pdf-button"]').click();
      cy.readFile('cypress/downloads/financial-report-2024.pdf').should('exist');
    });
  });
});