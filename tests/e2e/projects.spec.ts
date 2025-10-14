/// <reference types="cypress" />

/**
 * E2E tests for project management flows
 * @group projects
 * @group critical
 */
describe('Projectbeheer flows', () => {
  const testProject = {
    name: 'Test Project',
    description: 'Test project omschrijving',
    location: 'Amsterdam'
  };

  beforeEach(() => {
    cy.login({ email: 'test@rentguy.nl', password: 'VeiligWachtwoord123!' });
    cy.visit('/projects');
  });

  context('Project creatie', () => {
    it('Moet een nieuw project succesvol aanmaken', () => {
      cy.intercept('POST', '/api/projects').as('createProject');
      
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(testProject.name);
      cy.get('[data-testid="project-description-input"]').type(testProject.description);
      cy.get('[data-testid="project-location-input"]').type(testProject.location);
      cy.get('[data-testid="project-submit-button"]').click();

      cy.wait('@createProject').its('response.statusCode').should('eq', 201);
      cy.contains(testProject.name).should('be.visible');
      cy.get('[data-testid="project-status"]').should('contain', 'Actief');
    });

    it('Moet validatiefouten tonen bij onvolledige projectaanmaak', () => {
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-submit-button"]').click();
      
      cy.contains('Naam is verplicht').should('be.visible');
      cy.contains('Locatie is verplicht').should('be.visible');
    });
  });

  context('Projectwerkstromen', () => {
    it('Moet projectdetails succesvol bijwerken', () => {
      const updatedName = 'Bijgewerkt Project';
      cy.createProject(testProject); // Custom command
      
      cy.get('[data-testid="project-edit-button"]').first().click();
      cy.get('[data-testid="project-name-input"]').clear().type(updatedName);
      cy.get('[data-testid="project-submit-button"]').click();

      cy.contains(updatedName).should('be.visible');
      cy.contains('Project succesvol bijgewerkt').should('be.visible');
    });

    it('Moet projectstatus wijzigen', () => {
      cy.createProject(testProject);
      
      cy.get('[data-testid="project-status-select"]').first().select('Gearchiveerd');
      cy.contains('Status succesvol gewijzigd').should('be.visible');
      cy.get('[data-testid="project-status"]').should('contain', 'Gearchiveerd');
    });

    it('Moet project succesvol verwijderen', () => {
      cy.createProject(testProject);
      
      cy.get('[data-testid="project-delete-button"]').first().click();
      cy.get('[data-testid="confirm-delete-button"]').click();

      cy.contains('Project succesvol verwijderd').should('be.visible');
      cy.get('[data-testid="project-list"]').should('not.contain', testProject.name);
    });
  });

  context('Project samenwerking', () => {
    it('Moet teamlid succesvol uitnodigen', () => {
      cy.intercept('POST', '/api/invitations').as('sendInvitation');
      cy.createProject(testProject);
      
      cy.get('[data-testid="project-collaborate-button"]').first().click();
      cy.get('[data-testid="invite-email-input"]').type('collega@rentguy.nl');
      cy.get('[data-testid="send-invite-button"]').click();

      cy.wait('@sendInvitation').its('response.statusCode').should('eq', 201);
      cy.contains('Uitnodiging verzonden').should('be.visible');
    });

    it('Moet realtime updates tonen bij teamwijzigingen', () => {
      cy.createProject(testProject);
      
      // Simulate realtime update via WebSocket
      cy.window().then((win) => {
        win.dispatchEvent(new CustomEvent('teammateUpdate', {
          detail: { type: 'joined', user: 'nieuwe@collega.nl' }
        }));
      });

      cy.get('[data-testid="teammates-list"]').should('contain', 'nieuwe@collega.nl');
    });
  });
});