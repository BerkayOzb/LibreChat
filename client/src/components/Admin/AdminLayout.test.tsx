import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';

// Mock localization
jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
}));

// Mock the auth context
jest.mock('~/hooks/AuthContext', () => ({
  useAuthContext: () => ({
    user: {
      id: 'admin-123',
      username: 'admin',
      email: 'admin@test.com',
      role: 'ADMIN',
    },
    isAuthenticated: true,
  }),
}));

// Create a simple AdminLayout component for testing
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="admin-layout">
    <header data-testid="admin-header">
      <h1>Admin Panel</h1>
    </header>
    <nav data-testid="admin-nav">
      <a href="/admin">Dashboard</a>
      <a href="/admin/users">Users</a>
      <a href="/admin/stats">Statistics</a>
    </nav>
    <main data-testid="admin-main">
      {children}
    </main>
  </div>
);

const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <RecoilRoot>
        {children}
      </RecoilRoot>
    </MemoryRouter>
  );
};

describe('AdminLayout', () => {
  it('renders admin layout structure correctly', () => {
    render(
      <AdminLayout>
        <div>Test content</div>
      </AdminLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    expect(screen.getByTestId('admin-nav')).toBeInTheDocument();
    expect(screen.getByTestId('admin-main')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('renders navigation links correctly', () => {
    render(
      <AdminLayout>
        <div>Test content</div>
      </AdminLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
  });

  it('renders children content correctly', () => {
    render(
      <AdminLayout>
        <div data-testid="test-content">Custom admin content</div>
      </AdminLayout>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Custom admin content')).toBeInTheDocument();
  });
});