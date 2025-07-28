describe('Authentication', () => {
  beforeEach(() => {
    // Reset database state before each test
    cy.request('POST', `${Cypress.env('apiUrl')}/api/testing/reset`);
    
    // Create test user
    cy.request('POST', `${Cypress.env('apiUrl')}/api/testing/users`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should allow user to register', () => {
    cy.visit('/register');

    // Fill registration form
    cy.get('input[name="name"]').type('New User');
    cy.get('input[name="email"]').type('new@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="password_confirmation"]').type('password123');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Should redirect to chat page
    cy.url().should('not.include', '/register');
    cy.get('[data-testid="chat-list"]').should('exist');
  });

  it('should allow user to login', () => {
    cy.visit('/login');

    // Fill login form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Should redirect to chat page
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="chat-list"]').should('exist');
  });

  it('should show error for invalid credentials', () => {
    cy.visit('/login');

    // Fill login form with wrong password
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('wrongpassword');

    // Submit form
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');

    // Should stay on login page
    cy.url().should('include', '/login');
  });

  it('should allow user to logout', () => {
    // Login first
    cy.login('test@example.com', 'password123');

    // Click logout button
    cy.get('[data-testid="logout-button"]').click();

    // Should redirect to login page
    cy.url().should('include', '/login');

    // Should not be able to access protected routes
    cy.visit('/');
    cy.url().should('include', '/login');
  });

  it('should persist authentication across page reloads', () => {
    // Login
    cy.login('test@example.com', 'password123');

    // Reload page
    cy.reload();

    // Should still be logged in
    cy.url().should('not.include', '/login');
    cy.get('[data-testid="chat-list"]').should('exist');
  });

  it('should handle token expiration', () => {
    // Login
    cy.login('test@example.com', 'password123');

    // Simulate token expiration by waiting
    cy.clock().tick(24 * 60 * 60 * 1000); // 24 hours

    // Try to access protected route
    cy.visit('/');

    // Should redirect to login
    cy.url().should('include', '/login');
  });
});