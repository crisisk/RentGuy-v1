/// <reference types="cypress" />

/**
 * E2E tests for crew management flows
 * @group crew
 * @group critical
 */
describe('Crewbeheer flows', () => {
  const crewMember = {
    name: 'Jan Jansen',
    email: 'jan@rentguy.nl',
    role: 'Technicus',
    phone: '0612345678'
  };

  beforeEach(() => {
    cy.login({ email: 'test@rentguy.nl', password: 'VeiligWachtwoord123!' });
    cy.visit('/crew');
  });

  context('Crewlid registratie', () => {
    it('Moet nieuw crewlid succesvol toevoegen', () => {
      cy.intercept('POST', '/api/crew').as('addCrewMember');
      
      cy.get('[data-testid="add-crew-button"]').click();
      cy.get('[data-testid="name-input"]').type(crewMember.name);
      cy.get('[data-testid="email-input"]').type(crewMember.email);
      cy.get('[data-testid="role-select"]').select(crewMember.role);
      cy.get('[data-testid="phone-input"]').type(crewMember.phone);
      cy.get('[data-testid="submit-crew-button"]').click();

      cy.wait('@addCrewMember').its('response.statusCode').should('eq', 201);
      cy.get('[data-testid="crew-list"]').should('contain', crewMember.name);
    });

    it('Moet duplicaat crewlid detecteren', () => {
      cy.addCrewMember(crewMember); // Custom command
      
      cy.get('[data-testid="add-crew-button"]').click();
      cy.get('[data-testid="email-input"]').type(crewMember.email);
      cy.get('[data-testid="submit-crew-button"]').click();

      cy.contains('Crewlid bestaat al').should('be.visible');
    });
  });

  context('Crew planning', () => {
    it('Moet shift succesvol plannen', () => {
      const shift = {
        date: '2024-03-20',
        start: '09:00',
        end: '17:00'
      };
      
      cy.addCrewMember(crewMember);
      cy.get('[data-testid="schedule-shift-button"]').first().click();
      cy.get('[data-testid="shift-date-input"]').type(shift.date);
      cy.get('[data-testid="shift-start-input"]').type(shift.start);
      cy.get('[data-testid="shift-end-input"]').type(shift.end);
      cy.get('[data-testid="submit-shift-button"]').click();

      cy.get('[data-testid="crew-schedule"]').should('contain', shift.date);
      cy.contains('Shift succesvol ingepland').should('be.visible');
    });

    it('Moet conflicterende shifts detecteren', () => {
      cy.addCrewMember(crewMember);
      cy.scheduleShift(crewMember.email, '2024-03-20', '09:00', '17:00'); // Custom command
      
      cy.get('[data-testid="schedule-shift-button"]').first().click();
      cy.get('[data-testid="shift-date-input"]').type('2024-03-20');
      cy.get('[data-testid="shift-start-input"]').type('15:00');
      cy.get('[data-testid="shift-end-input"]').type('19:00');
      cy.get('[data-testid="submit-shift-button"]').click();

      cy.contains('Conflict met bestaande shift').should('be.visible');
    });
  });

  context('Crew beschikbaarheid', () => {
    it('Moet tijdelijk beschikbaarheid registreren', () => {
      cy.addCrewMember(crewMember);
      
      cy.get('[data-testid="request-timeoff-button"]').first().click();
      cy.get('[data-testid="timeoff-start"]').type('2024-03-25');
      cy.get('[data-testid="timeoff-end"]').type('2024-03-27');
      cy.get('[data-testid="timeoff-reason"]').select('Vakantie');
      cy.get('[data-testid="submit-timeoff-button"]').click();

      cy.get('[data-testid="availability-status"]').should('contain', 'Niet beschikbaar');
      cy.contains('Beschikbaarheid geregistreerd').should('be.visible');
    });

    it('Moet overlapping beschikbaarheid voorkomen', () => {
      cy.addCrewMember(crewMember);
      cy.requestTimeOff(crewMember.email, '2024-03-25', '2024-03-27'); // Custom command
      
      cy.get('[data-testid="request-timeoff-button"]').first().click();
      cy.get('[data-testid="timeoff-start"]').type('2024-03-26');
      cy.get('[data-testid="timeoff-end"]').type('2024-03-28');
      cy.get('[data-testid="submit-timeoff-button"]').click();

      cy.contains('Overlappende periode').should('be.visible');
    });
  });
});