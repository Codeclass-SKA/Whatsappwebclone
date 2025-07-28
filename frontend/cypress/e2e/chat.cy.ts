describe('Chat Functionality', () => {
  beforeEach(() => {
    // Reset database state
    cy.request('POST', `${Cypress.env('apiUrl')}/api/testing/reset`);
    
    // Create test users
    cy.request('POST', `${Cypress.env('apiUrl')}/api/testing/users`, [
      {
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
      },
      {
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
      },
    ]);

    // Login as first user
    cy.login('user1@example.com', 'password123');
  });

  it('should create a private chat', () => {
    // Open new chat modal
    cy.get('[data-testid="new-chat-button"]').click();

    // Select second user
    cy.get('[data-testid="user-select-user2@example.com"]').click();

    // Create chat
    cy.get('[data-testid="create-chat-button"]').click();

    // Verify chat is created
    cy.get('[data-testid="chat-list"]')
      .should('contain', 'User Two');
  });

  it('should send and receive messages', () => {
    // Create chat with second user
    cy.createChat('private', [2]);

    // Send message
    cy.get('[data-testid="message-input"]')
      .type('Hello, how are you?{enter}');

    // Verify message appears in chat
    cy.get('[data-testid="message-list"]')
      .should('contain', 'Hello, how are you?');

    // Login as second user in another window
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.login('user2@example.com', 'password123');

    // Verify message is received
    cy.get('[data-testid="message-list"]')
      .should('contain', 'Hello, how are you?');

    // Reply to message
    cy.get('[data-testid="message-input"]')
      .type('I am fine, thanks!{enter}');

    // Verify reply appears
    cy.get('[data-testid="message-list"]')
      .should('contain', 'I am fine, thanks!');
  });

  it('should handle message reactions', () => {
    // Create chat and send message
    cy.createChat('private', [2]);
    cy.get('[data-testid="message-input"]')
      .type('React to this message{enter}');

    // Add reaction
    cy.get('[data-testid="message"]').first()
      .trigger('mouseover')
      .get('[data-testid="reaction-button"]')
      .click();
    cy.get('[data-testid="emoji-👍"]').click();

    // Verify reaction appears
    cy.get('[data-testid="message-reactions"]')
      .should('contain', '👍')
      .and('contain', '1');

    // Login as second user
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.login('user2@example.com', 'password123');

    // Add same reaction
    cy.get('[data-testid="message"]').first()
      .trigger('mouseover')
      .get('[data-testid="reaction-button"]')
      .click();
    cy.get('[data-testid="emoji-👍"]').click();

    // Verify reaction count increases
    cy.get('[data-testid="message-reactions"]')
      .should('contain', '👍')
      .and('contain', '2');
  });

  it('should handle real-time updates', () => {
    // Create chat
    cy.createChat('private', [2]);

    // Open another window as second user
    cy.window().then((win) => {
      const newWin = win.open('/', '_blank');
      newWin?.localStorage.clear();
    });

    // Login as second user in new window
    cy.origin('http://localhost:3000', () => {
      cy.login('user2@example.com', 'password123');
    });

    // Send message as first user
    cy.get('[data-testid="message-input"]')
      .type('This is a real-time test{enter}');

    // Verify message appears in second window
    cy.origin('http://localhost:3000', () => {
      cy.get('[data-testid="message-list"]')
        .should('contain', 'This is a real-time test');
    });

    // Send message as second user
    cy.origin('http://localhost:3000', () => {
      cy.get('[data-testid="message-input"]')
        .type('Real-time response{enter}');
    });

    // Verify message appears in first window
    cy.get('[data-testid="message-list"]')
      .should('contain', 'Real-time response');
  });

  it('should handle typing indicators', () => {
    // Create chat
    cy.createChat('private', [2]);

    // Open another window as second user
    cy.window().then((win) => {
      const newWin = win.open('/', '_blank');
      newWin?.localStorage.clear();
    });

    // Login as second user in new window
    cy.origin('http://localhost:3000', () => {
      cy.login('user2@example.com', 'password123');
    });

    // Start typing as first user
    cy.get('[data-testid="message-input"]')
      .type('Hello');

    // Verify typing indicator appears in second window
    cy.origin('http://localhost:3000', () => {
      cy.get('[data-testid="typing-indicator"]')
        .should('contain', 'User One is typing...');
    });

    // Stop typing and verify indicator disappears
    cy.wait(3000);
    cy.origin('http://localhost:3000', () => {
      cy.get('[data-testid="typing-indicator"]')
        .should('not.exist');
    });
  });

  it('should handle online status updates', () => {
    // Create chat
    cy.createChat('private', [2]);

    // Verify second user is offline
    cy.get('[data-testid="user-status"]')
      .should('contain', 'Offline');

    // Login as second user in another window
    cy.window().then((win) => {
      const newWin = win.open('/', '_blank');
      newWin?.localStorage.clear();
    });
    cy.origin('http://localhost:3000', () => {
      cy.login('user2@example.com', 'password123');
    });

    // Verify second user appears online
    cy.get('[data-testid="user-status"]')
      .should('contain', 'Online');

    // Close second window
    cy.origin('http://localhost:3000', () => {
      cy.window().then((win) => {
        win.close();
      });
    });

    // Verify second user appears offline
    cy.get('[data-testid="user-status"]')
      .should('contain', 'Offline');
  });
});