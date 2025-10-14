/// <reference types="cypress" />

/**
 * E2E tests for CRM management flows
 * @group crm
 * @group critical
 */
describe('CRM beheer flows', () => {
  const client = {
    name: 'Nieuwe Klant BV',
    email: 'info@nieuweklant.nl',
    phone: '0201234567'
  };

  beforeEach(() => {
    cy.login({ email: 'test@rentguy.nl', password: 'VeiligWachtwoord123!' });
    cy.visit('/crm');
  });

  context('Klantenbeheer', () => {
    it('Moet nieuwe klant succesvol registreren', () => {
      cy.intercept('POST', '/api/clients').as('createClient');
      
      cy.get('[data-testid="new-client-button"]').click();
      cy.get('[data-testid="client-name-input"]').type(client.name);
      cy.get('[data-testid="client-email-input"]').type(client.email);
      cy.get('[data-testid="client-phone-input"]').type(client.phone);
      cy.get('[data-testid="submit-client-button"]').click();

      cy.wait('@createClient').its('response.statusCode').should('eq', 201);
      cy.get('[data-testid="clients-list"]').should('contain', client.name);
      cy.contains('Klant succesvol toegevoegd').should('be.visible');
    });

    it('Moet klantgegevens succesvol bijwerken', () => {
      const updatedName = 'Bijgewerkte Klant BV';
      cy.createClient(client); // Custom command
      
      cy.get('[data-testid="edit-client-button"]').first().click();
      cy.get('[data-testid="client-name-input"]').clear().type(updatedName);
      cy.get('[data-testid="submit-client-button"]').click();

      cy.contains(updatedName).should('be.visible');
      cy.contains('Klantgegevens bijgewerkt').should('be.visible');
    });
  });

  context('Interactie tracking', () => {
    it('Moet klantinteractie succesvol vastleggen', () => {
      const interaction = {
        type: 'Telefoongesprek',
        notes: 'Offerte besproken'
      };
      cy.createClient(client);
      
      cy.get('[data-testid="log-interaction-button"]').first().click();
      cy.get('[data-testid="interaction-type-select"]').select(interaction.type);
      cy.get('[data-testid="interaction-notes-input"]').type(interaction.notes);
      cy.get('[data-testid="submit-interaction-button"]').click();

      cy.get('[data-testid="interactions-list"]').should('contain', interaction.type);
      cy.contains('Interactie geregistreerd').should('be.visible');
    });

    it('Moet interactiehistorie correct tonen', () => {
      cy.createClient(client);
      cy.logInteraction(client.email, 'Email', 'Offer verstuurd'); // Custom command
      
      cy.get('[data-testid="view-history-button"]').first().click();
      cy.get('[data-testid="interaction-history"]').should('contain', 'Email');
      cy.get('[data-testid="interaction-history"]').should('contain', 'Offer verstuurd');
    });
  });

  context('Contractbeheer', () => {
    const contract = {
      type: 'Jaarcontract',
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    };

    it('Moet contract succesvol toevoegen', () => {
      cy.createClient(client);
      
      cy.get('[data-testid="add-contract-button"]').first().click();
      cy.get('[data-testid="contract-type-select"]').select(contract.type);
      cy.get('[data-testid="start-date-input"]').type(contract.startDate);
      cy.get('[data-testid="end-date-input"]').type(contract.endDate);
      cy.get('[data-testid="submit-contract-button"]').click();

      cy.get('[data-testid="contracts-list"]').should('contain', contract.type);
      cy.contains('Contract toegevoegd').should('be.visible');
    });

    it('Moet contract verlenging correct verwerken', () => {
      cy.createClient(client);
      cy.addContract(client.email, contract); // Custom command
      
      cy.get('[data-testid="renew-contract-button"]').first().click();
      cy.get('[data-testid="end-date-input"]').clear().type('2025-12-31');
      cy.get('[data-testid="submit-contract-button"]').click();

      cy.get('[data-testid="contract-end-date"]').should('contain', '2025');
      cy.contains('Contract verlengd').should('be.visible');
    });
  });
});