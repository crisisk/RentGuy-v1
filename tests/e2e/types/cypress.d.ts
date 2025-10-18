/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(credentials: { email: string; password: string }): Chainable<void>;
      addCrewMember(member: { name: string; email: string; role: string; phone?: string }): Chainable<void>;
      scheduleShift(email: string, date: string, start: string, end: string): Chainable<void>;
      requestTimeOff(email: string, start: string, end: string): Chainable<void>;
      createClient(client: Record<string, unknown>): Chainable<void>;
      addContract(contract: Record<string, unknown>): Chainable<void>;
      logInteraction(interaction: Record<string, unknown>): Chainable<void>;
      createInvoice(invoice: Record<string, unknown>): Chainable<void>;
      generateFinancialReport(options: Record<string, unknown>): Chainable<void>;
      createProject(project: Record<string, unknown>): Chainable<void>;
    }
  }
}

export {};
