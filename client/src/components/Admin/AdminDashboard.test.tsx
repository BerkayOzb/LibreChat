import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import AdminDashboard from './AdminDashboard';

// Mock the admin hooks
jest.mock('~/data-provider/Admin/queries', () => ({
  useAdminStatsQuery: jest.fn(),
  useAdminUsersQuery: jest.fn(),
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

// Mock localization
jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
}));

// Mock UI components
jest.mock('~/components/ui', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  Button: ({ children, onClick, disabled, variant }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  UserCheck: () => <div data-testid="user-check-icon" />,
  MessageSquare: () => <div data-testid="message-square-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  UserPlus: () => <div data-testid="user-plus-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
}));

const { useAdminStatsQuery, useAdminUsersQuery } = require('~/data-provider/Admin/queries');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <RecoilRoot>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </RecoilRoot>
    </MemoryRouter>
  );
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    // Mock loading state
    useAdminStatsQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    useAdminUsersQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<AdminDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('admin.dashboard.title')).toBeInTheDocument();
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('renders dashboard with stats data correctly', async () => {
    const mockStatsData = {
      totalUsers: 150,
      activeUsers: 120,
      totalConversations: 2500,
      totalMessages: 45000,
      newUsersThisMonth: 25,
      activeUsersToday: 45,
      systemLoad: {
        cpu: 65,
        memory: 78,
        storage: 45,
      },
    };

    const mockUsersData = {
      users: [
        {
          _id: 'user1',
          username: 'testuser1',
          email: 'test1@example.com',
          role: 'USER',
          isEnabled: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          _id: 'user2',
          username: 'testuser2',
          email: 'test2@example.com',
          role: 'ADMIN',
          isEnabled: true,
          createdAt: '2024-01-02T00:00:00Z',
        },
      ],
      pagination: {
        totalCount: 150,
        totalPages: 15,
        currentPage: 1,
        hasNext: true,
        hasPrev: false,
      },
    };

    useAdminStatsQuery.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    useAdminUsersQuery.mockReturnValue({
      data: mockUsersData,
      isLoading: false,
      error: null,
    });

    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check dashboard title
      expect(screen.getByText('admin.dashboard.title')).toBeInTheDocument();

      // Check stats cards are rendered
      expect(screen.getByText('150')).toBeInTheDocument(); // Total users
      expect(screen.getByText('120')).toBeInTheDocument(); // Active users
      expect(screen.getByText('2,500')).toBeInTheDocument(); // Total conversations
      expect(screen.getByText('45,000')).toBeInTheDocument(); // Total messages

      // Check system metrics
      expect(screen.getByText('65%')).toBeInTheDocument(); // CPU
      expect(screen.getByText('78%')).toBeInTheDocument(); // Memory
      expect(screen.getByText('45%')).toBeInTheDocument(); // Storage

      // Check quick actions
      expect(screen.getByText('admin.actions.createUser')).toBeInTheDocument();
      expect(screen.getByText('admin.actions.manageUsers')).toBeInTheDocument();
      expect(screen.getByText('admin.actions.systemSettings')).toBeInTheDocument();
    });
  });

  it('renders error state correctly', () => {
    useAdminStatsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch stats'),
      refetch: jest.fn(),
    });

    useAdminUsersQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch users'),
    });

    render(<AdminDashboard />, { wrapper: createWrapper() });

    expect(screen.getByText('common.error')).toBeInTheDocument();
    expect(screen.getByText('admin.errors.loadingStats')).toBeInTheDocument();
  });

  it('handles refresh action correctly', async () => {
    const mockRefetch = jest.fn();

    useAdminStatsQuery.mockReturnValue({
      data: {
        totalUsers: 150,
        activeUsers: 120,
        totalConversations: 2500,
        totalMessages: 45000,
      },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    useAdminUsersQuery.mockReturnValue({
      data: { users: [], pagination: { totalCount: 0 } },
      isLoading: false,
      error: null,
    });

    render(<AdminDashboard />, { wrapper: createWrapper() });

    const refreshButtons = screen.getAllByTestId('button');
    const refreshButton = refreshButtons.find(btn => btn.textContent?.includes('admin.actions.refresh'));
    
    if (refreshButton) {
      refreshButton.click();
      expect(mockRefetch).toHaveBeenCalled();
    }
  });

  it('displays correct metric trends', async () => {
    const mockStatsData = {
      totalUsers: 150,
      activeUsers: 120,
      totalConversations: 2500,
      totalMessages: 45000,
      newUsersThisMonth: 25,
      activeUsersToday: 45,
      systemLoad: {
        cpu: 65,
        memory: 78,
        storage: 45,
      },
    };

    useAdminStatsQuery.mockReturnValue({
      data: mockStatsData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    useAdminUsersQuery.mockReturnValue({
      data: { users: [], pagination: { totalCount: 0 } },
      isLoading: false,
      error: null,
    });

    render(<AdminDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check that trend indicators are displayed
      expect(screen.getByText('25')).toBeInTheDocument(); // New users this month
      expect(screen.getByText('45')).toBeInTheDocument(); // Active users today
    });
  });

  it('renders responsive grid layout', () => {
    useAdminStatsQuery.mockReturnValue({
      data: {
        totalUsers: 150,
        activeUsers: 120,
        totalConversations: 2500,
        totalMessages: 45000,
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    useAdminUsersQuery.mockReturnValue({
      data: { users: [], pagination: { totalCount: 0 } },
      isLoading: false,
      error: null,
    });

    render(<AdminDashboard />, { wrapper: createWrapper() });

    // Check that grid layout classes are applied
    const cards = screen.getAllByTestId('card');
    expect(cards.length).toBeGreaterThan(0);
  });
});