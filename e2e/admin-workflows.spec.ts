import { test, expect } from '@playwright/test';

// Admin user credentials for testing
const ADMIN_CREDENTIALS = {
  email: 'admin@librechat.test',
  password: 'admin123',
};

// Regular user credentials for testing
const USER_CREDENTIALS = {
  email: 'user@librechat.test',
  password: 'user123',
};

test.describe('Admin User Management Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login as admin
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete and navigate to admin panel
    await page.waitForURL('/c/new');
    await page.goto('/admin');
    
    // Verify admin panel access
    await expect(page.locator('[data-testid="admin-layout"]')).toBeVisible();
  });

  test('should display admin dashboard with stats', async ({ page }) => {
    // Check dashboard title
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Check stats cards are visible
    await expect(page.locator('[data-testid="total-users-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-users-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-conversations-card"]')).toBeVisible();
    
    // Check system metrics
    await expect(page.locator('[data-testid="cpu-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="memory-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-metric"]')).toBeVisible();
    
    // Check quick actions
    await expect(page.locator('[data-testid="create-user-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="manage-users-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-settings-button"]')).toBeVisible();
  });

  test('should navigate to user management', async ({ page }) => {
    // Click on user management
    await page.click('[data-testid="manage-users-button"]');
    
    // Should navigate to users page
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('h1')).toContainText('User Management');
    
    // Check user management interface
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="role-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Click create user button
    await page.click('[data-testid="create-user-button"]');
    
    // Fill create user form
    await page.fill('[data-testid="username-input"]', 'testuser123');
    await page.fill('[data-testid="email-input"]', 'testuser123@test.com');
    await page.fill('[data-testid="name-input"]', 'Test User 123');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.selectOption('[data-testid="role-select"]', 'USER');
    
    // Submit form
    await page.click('[data-testid="submit-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User created successfully');
    
    // Verify user appears in table
    await expect(page.locator('[data-testid="users-table"]')).toContainText('testuser123');
    await expect(page.locator('[data-testid="users-table"]')).toContainText('testuser123@test.com');
  });

  test('should search and filter users', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'admin');
    await page.waitForTimeout(500); // Wait for debounced search
    
    // Should show filtered results
    const tableRows = page.locator('[data-testid="user-row"]');
    await expect(tableRows).toHaveCount(1); // Assuming only one admin user
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '');
    await page.waitForTimeout(500);
    
    // Test role filter
    await page.selectOption('[data-testid="role-filter"]', 'ADMIN');
    await page.waitForTimeout(500);
    
    // Should show only admin users
    const adminRows = page.locator('[data-testid="user-row"]:has-text("ADMIN")');
    await expect(adminRows.first()).toBeVisible();
  });

  test('should update user role', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Find a regular user and click edit
    const userRow = page.locator('[data-testid="user-row"]:has-text("USER")').first();
    await userRow.locator('[data-testid="edit-button"]').click();
    
    // Change role to ADMIN
    await page.selectOption('[data-testid="role-select"]', 'ADMIN');
    await page.click('[data-testid="save-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User role updated successfully');
    
    // Verify role change in table
    await expect(userRow).toContainText('ADMIN');
  });

  test('should ban and unban user', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Find a regular user and click ban
    const userRow = page.locator('[data-testid="user-row"]:has-text("USER")').first();
    await userRow.locator('[data-testid="ban-button"]').click();
    
    // Fill ban reason
    await page.fill('[data-testid="ban-reason-input"]', 'Test ban for e2e testing');
    await page.click('[data-testid="confirm-ban-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User banned successfully');
    
    // Verify ban status in table
    await expect(userRow).toContainText('Banned');
    
    // Unban the user
    await userRow.locator('[data-testid="unban-button"]').click();
    await page.fill('[data-testid="unban-reason-input"]', 'Test unban for e2e testing');
    await page.click('[data-testid="confirm-unban-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User unbanned successfully');
    
    // Verify active status in table
    await expect(userRow).toContainText('Active');
  });

  test('should delete user with confirmation', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Create a test user first (to avoid deleting important users)
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="username-input"]', 'deletetest');
    await page.fill('[data-testid="email-input"]', 'deletetest@test.com');
    await page.fill('[data-testid="name-input"]', 'Delete Test User');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="submit-button"]');
    
    // Wait for user to be created
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    
    // Find the test user and click delete
    const testUserRow = page.locator('[data-testid="user-row"]:has-text("deletetest")');
    await testUserRow.locator('[data-testid="delete-button"]').click();
    
    // Fill deletion reason
    await page.fill('[data-testid="delete-reason-input"]', 'E2E test cleanup');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('User deleted successfully');
    
    // Verify user is no longer in table
    await expect(page.locator('[data-testid="users-table"]')).not.toContainText('deletetest');
  });

  test('should paginate through users', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Check if pagination is visible (assuming there are enough users)
    const pagination = page.locator('[data-testid="pagination"]');
    
    if (await pagination.isVisible()) {
      // Click next page
      await page.click('[data-testid="next-page-button"]');
      
      // Should update page indicator
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 2');
      
      // Click previous page
      await page.click('[data-testid="prev-page-button"]');
      
      // Should go back to page 1
      await expect(page.locator('[data-testid="page-indicator"]')).toContainText('Page 1');
    }
  });

  test('should refresh data', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Click refresh button
    await page.click('[data-testid="refresh-button"]');
    
    // Should show loading state briefly
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    
    // Data should reload
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
  });
});

test.describe('Admin Navigation and Security', () => {
  test('should prevent non-admin access', async ({ page }) => {
    // Logout if logged in
    await page.goto('/logout');
    
    // Login as regular user
    await page.goto('/login');
    await page.fill('input[name="email"]', USER_CREDENTIALS.email);
    await page.fill('input[name="password"]', USER_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for login
    await page.waitForURL('/c/new');
    
    // Try to access admin panel
    await page.goto('/admin');
    
    // Should be redirected or show access denied
    await expect(page).not.toHaveURL('/admin');
    // Alternative: Check for access denied message
    // await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
  });

  test('should navigate between admin sections', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/c/new');
    
    // Navigate to admin dashboard
    await page.goto('/admin');
    await expect(page.locator('[data-testid="admin-nav-dashboard"]')).toHaveClass(/active/);
    
    // Navigate to users
    await page.click('[data-testid="admin-nav-users"]');
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('[data-testid="admin-nav-users"]')).toHaveClass(/active/);
    
    // Navigate to stats
    await page.click('[data-testid="admin-nav-stats"]');
    await expect(page).toHaveURL('/admin/stats');
    await expect(page.locator('[data-testid="admin-nav-stats"]')).toHaveClass(/active/);
    
    // Navigate back to dashboard
    await page.click('[data-testid="admin-nav-dashboard"]');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('[data-testid="admin-nav-dashboard"]')).toHaveClass(/active/);
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/c/new');
    
    // Navigate to admin users
    await page.goto('/admin/users');
    
    // Check breadcrumb
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Admin');
    await expect(page.locator('[data-testid="breadcrumb"]')).toContainText('Users');
    
    // Click breadcrumb to navigate back
    await page.click('[data-testid="breadcrumb-admin"]');
    await expect(page).toHaveURL('/admin');
  });
});

test.describe('Admin Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return errors
    await page.route('**/api/admin/users', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/c/new');
    
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load users');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle network errors', async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/c/new');
    
    // Navigate to admin panel
    await page.goto('/admin/users');
    
    // Simulate network failure
    await page.setOffline(true);
    
    // Try to create a user
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="username-input"]', 'networktest');
    await page.fill('[data-testid="email-input"]', 'networktest@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="submit-button"]');
    
    // Should show network error
    await expect(page.locator('[data-testid="error-toast"]')).toContainText('Network error');
    
    // Restore network
    await page.setOffline(false);
  });
});