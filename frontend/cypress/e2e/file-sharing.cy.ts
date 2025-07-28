describe('File Sharing Functionality', () => {
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

    // Login as first user and create chat
    cy.login('user1@example.com', 'password123');
    cy.createChat('private', [2]);
  });

  it('should upload and send image files', () => {
    // Upload image
    cy.fixture('test-image.jpg').then(fileContent => {
      cy.get('[data-testid="file-input"]')
        .attachFile({
          fileContent,
          fileName: 'test-image.jpg',
          mimeType: 'image/jpeg'
        });
    });

    // Verify image preview appears
    cy.get('[data-testid="file-preview"]')
      .should('be.visible')
      .and('have.attr', 'src')
      .and('include', 'test-image.jpg');

    // Send message with image
    cy.get('[data-testid="send-file-button"]').click();

    // Verify image appears in chat
    cy.get('[data-testid="message-image"]')
      .should('be.visible')
      .and('have.attr', 'src')
      .and('include', 'test-image.jpg');

    // Login as second user
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    cy.login('user2@example.com', 'password123');

    // Verify image is received
    cy.get('[data-testid="message-image"]')
      .should('be.visible')
      .and('have.attr', 'src')
      .and('include', 'test-image.jpg');
  });

  it('should handle document file sharing', () => {
    // Upload document
    cy.fixture('test-document.pdf').then(fileContent => {
      cy.get('[data-testid="file-input"]')
        .attachFile({
          fileContent,
          fileName: 'test-document.pdf',
          mimeType: 'application/pdf'
        });
    });

    // Verify document preview
    cy.get('[data-testid="file-preview"]')
      .should('contain', 'test-document.pdf')
      .and('contain', 'PDF');

    // Send message with document
    cy.get('[data-testid="send-file-button"]').click();

    // Verify document appears in chat
    cy.get('[data-testid="message-file"]')
      .should('contain', 'test-document.pdf')
      .and('contain', 'PDF');

    // Verify download button
    cy.get('[data-testid="download-button"]')
      .should('be.visible')
      .and('have.attr', 'href')
      .and('include', 'test-document.pdf');
  });

  it('should handle multiple file uploads', () => {
    // Upload multiple files
    cy.fixture('test-image.jpg').then(imageContent => {
      cy.fixture('test-document.pdf').then(docContent => {
        cy.get('[data-testid="file-input"]')
          .attachFile([
            {
              fileContent: imageContent,
              fileName: 'test-image.jpg',
              mimeType: 'image/jpeg'
            },
            {
              fileContent: docContent,
              fileName: 'test-document.pdf',
              mimeType: 'application/pdf'
            }
          ]);
      });
    });

    // Verify multiple file previews
    cy.get('[data-testid="file-preview"]')
      .should('have.length', 2);

    // Send message with multiple files
    cy.get('[data-testid="send-file-button"]').click();

    // Verify files appear in chat
    cy.get('[data-testid="message-image"]').should('be.visible');
    cy.get('[data-testid="message-file"]')
      .should('contain', 'test-document.pdf');
  });

  it('should handle file upload errors', () => {
    // Try uploading oversized file
    cy.fixture('large-file.zip').then(fileContent => {
      cy.get('[data-testid="file-input"]')
        .attachFile({
          fileContent,
          fileName: 'large-file.zip',
          mimeType: 'application/zip'
        });
    });

    // Verify error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'File size exceeds limit');

    // Try uploading unsupported file type
    cy.fixture('unsupported.exe').then(fileContent => {
      cy.get('[data-testid="file-input"]')
        .attachFile({
          fileContent,
          fileName: 'unsupported.exe',
          mimeType: 'application/x-msdownload'
        });
    });

    // Verify error message
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'File type not supported');
  });

  it('should handle file preview modal', () => {
    // Upload and send image
    cy.fixture('test-image.jpg').then(fileContent => {
      cy.get('[data-testid="file-input"]')
        .attachFile({
          fileContent,
          fileName: 'test-image.jpg',
          mimeType: 'image/jpeg'
        });
    });
    cy.get('[data-testid="send-file-button"]').click();

    // Click image to open preview modal
    cy.get('[data-testid="message-image"]').click();

    // Verify modal appears with full-size image
    cy.get('[data-testid="preview-modal"]')
      .should('be.visible')
      .find('img')
      .should('have.attr', 'src')
      .and('include', 'test-image.jpg');

    // Test zoom controls
    cy.get('[data-testid="zoom-in"]').click();
    cy.get('[data-testid="preview-modal"] img')
      .should('have.css', 'transform')
      .and('include', 'scale(1.5)');

    cy.get('[data-testid="zoom-out"]').click();
    cy.get('[data-testid="preview-modal"] img')
      .should('have.css', 'transform')
      .and('include', 'scale(1)');

    // Close modal
    cy.get('[data-testid="close-modal"]').click();
    cy.get('[data-testid="preview-modal"]')
      .should('not.exist');
  });

  it('should handle file download progress', () => {
    // Upload and send large file
    cy.fixture('large-document.pdf').then(fileContent => {
      cy.get('[data-testid="file-input"]')
        .attachFile({
          fileContent,
          fileName: 'large-document.pdf',
          mimeType: 'application/pdf'
        });
    });
    cy.get('[data-testid="send-file-button"]').click();

    // Start download
    cy.get('[data-testid="download-button"]').click();

    // Verify progress indicator
    cy.get('[data-testid="download-progress"]')
      .should('be.visible')
      .and('contain', '%');

    // Wait for download to complete
    cy.get('[data-testid="download-progress"]', { timeout: 10000 })
      .should('not.exist');

    // Verify download success message
    cy.get('[data-testid="download-success"]')
      .should('be.visible')
      .and('contain', 'Download complete');
  });
});