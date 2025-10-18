/// <reference types="cypress" />

type AuthCredentials = {
  email: string;
  password: string;
};

type CrewMember = {
  name: string;
  email: string;
  role: string;
  phone?: string;
};

Cypress.Commands.add('login', (credentials: AuthCredentials) => {
  Cypress.log({ name: 'login', message: `Stubbed login for ${credentials.email}` });
});

Cypress.Commands.add('addCrewMember', (member: CrewMember) => {
  Cypress.log({ name: 'addCrewMember', message: `Stubbed crew member ${member.email}` });
});

Cypress.Commands.add('scheduleShift', (email: string, date: string, start: string, end: string) => {
  Cypress.log({
    name: 'scheduleShift',
    message: `Stubbed shift for ${email} on ${date} (${start}-${end})`,
  });
});

Cypress.Commands.add('requestTimeOff', (email: string, start: string, end: string) => {
  Cypress.log({
    name: 'requestTimeOff',
    message: `Stubbed time off for ${email} from ${start} to ${end}`,
  });
});

Cypress.Commands.add('createClient', (client: Record<string, unknown>) => {
  Cypress.log({ name: 'createClient', message: `Stubbed client ${client?.email ?? ''}` });
});

Cypress.Commands.add('addContract', (contract: Record<string, unknown>) => {
  Cypress.log({ name: 'addContract', message: 'Stubbed contract creation', consoleProps: () => contract });
});

Cypress.Commands.add('logInteraction', (interaction: Record<string, unknown>) => {
  Cypress.log({ name: 'logInteraction', message: 'Stubbed interaction log', consoleProps: () => interaction });
});

Cypress.Commands.add('createInvoice', (invoice: Record<string, unknown>) => {
  Cypress.log({ name: 'createInvoice', message: 'Stubbed invoice creation', consoleProps: () => invoice });
});

Cypress.Commands.add('generateFinancialReport', (options: Record<string, unknown>) => {
  Cypress.log({ name: 'generateFinancialReport', message: 'Stubbed report generation', consoleProps: () => options });
});

Cypress.Commands.add('createProject', (project: Record<string, unknown>) => {
  Cypress.log({ name: 'createProject', message: 'Stubbed project creation', consoleProps: () => project });
});
