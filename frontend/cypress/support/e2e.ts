import '@testing-library/cypress/add-commands';
import 'cypress-file-upload';

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createChat(type: 'private' | 'group', participants: number[]): Chainable<void>;
    }
  }
}

// Custom command for login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

// Custom command for logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/login');
});

// Custom command for creating a chat
Cypress.Commands.add('createChat', (type: 'private' | 'group', participants: number[]) => {
  cy.get('[data-testid="new-chat-button"]').click();
  if (type === 'group') {
    cy.get('[data-testid="chat-type-group"]').click();
    cy.get('input[name="name"]').type('Test Group');
  }
  participants.forEach(id => {
    cy.get(`[data-testid="user-${id}"]`).click();
  });
  cy.get('[data-testid="create-chat-button"]').click();
});

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err) => {
  // Prevent WebSocket connection errors from failing tests
  if (err.message.includes('WebSocket')) {
    return false;
  }
  return true;
});