import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import UserManagement from './UserManagement';

// Mock the admin hooks
jest.mock('~/data-provider/Admin/queries', () => ({
  useAdminUsersQuery: jest.fn(),
}));

jest.mock('~/data-provider/Admin/mutations', () => ({
  useCreateUserMutation: jest.fn(),
  useUpdateUserRoleMutation: jest.fn(),
  useBanUserMutation: jest.fn(),
  useAdminDeleteUserMutation: jest.fn(),
}));

// Mock localization
jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => key,
}));

// Mock UI components
jest.mock('~/components/ui', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  Button: ({ children, onClick, disabled, variant, size }: any) => (
    <button 
      data-testid="button" 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input 
      data-testid="input"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
  Select: ({ children, value, onValueChange }: any) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

// Mock icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  MoreHorizontal: () => <div data-testid="more-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  ShieldOff: () => <div data-testid="shield-off-icon" />,
  ChevronLeft: () => <div data-testid="chevron-left-icon" />,
  ChevronRight: () => <div data-testid="chevron-right-icon" />,
}));

const { useAdminUsersQuery } = require('~/data-provider/Admin/queries');
const { 
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useBanUserMutation,
  useAdminDeleteUserMutation 
} = require('~/data-provider/Admin/mutations');

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

describe('UserManagement', () => {
  const mockUsersData = {
    users: [
      {
        _id: 'user1',
        username: 'testuser1',
        email: 'test1@example.com',
        name: 'Test User 1',
        role: 'USER',
        isEnabled: true,
        createdAt: '2024-01-01T00:00:00Z',
        lastActivity: '2024-01-15T12:00:00Z',
      },
      {
        _id: 'user2',
        username: 'testuser2',
        email: 'test2@example.com',
        name: 'Test User 2',
        role: 'ADMIN',
        isEnabled: false,
        createdAt: '2024-01-02T00:00:00Z',
        lastActivity: '2024-01-14T15:30:00Z',
      },
    ],
    pagination: {
      totalCount: 2,
      totalPages: 1,
      currentPage: 1,
      hasNext: false,
      hasPrev: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    useAdminUsersQuery.mockReturnValue({
      data: mockUsersData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    useCreateUserMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    useUpdateUserRoleMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    useBanUserMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });

    useAdminDeleteUserMutation.mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      error: null,
    });
  });

  it('renders user management interface correctly', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('admin.users.title')).toBeInTheDocument();
    expect(screen.getByText('admin.users.createUser')).toBeInTheDocument();
    expect(screen.getByTestId('input')).toBeInTheDocument(); // Search input
    expect(screen.getByTestId('table')).toBeInTheDocument();
  });

  it('displays user list correctly', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    // Check that users are displayed
    expect(screen.getByText('testuser1')).toBeInTheDocument();
    expect(screen.getByText('test1@example.com')).toBeInTheDocument();
    expect(screen.getByText('testuser2')).toBeInTheDocument();
    expect(screen.getByText('test2@example.com')).toBeInTheDocument();

    // Check role badges
    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    const mockRefetch = jest.fn();
    useAdminUsersQuery.mockReturnValue({
      data: mockUsersData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    const searchInput = screen.getByTestId('input');
    fireEvent.change(searchInput, { target: { value: 'testuser1' } });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledWith({
        search: 'testuser1',
        page: 1,
      });
    });
  });

  it('handles role filter', async () => {
    const mockRefetch = jest.fn();
    useAdminUsersQuery.mockReturnValue({
      data: mockUsersData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    const roleSelect = screen.getByTestId('select');
    fireEvent.change(roleSelect, { target: { value: 'ADMIN' } });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledWith({
        role: 'ADMIN',
        page: 1,
      });
    });
  });

  it('shows loading state', () => {
    useAdminUsersQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('shows error state', () => {
    useAdminUsersQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch users'),
      refetch: jest.fn(),
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('admin.errors.loadingUsers')).toBeInTheDocument();
  });

  it('handles create user action', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    const createButton = screen.getByText('admin.users.createUser');
    fireEvent.click(createButton);

    // Should open create user dialog
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
  });

  it('handles user role update', async () => {
    const mockMutate = jest.fn();
    useUpdateUserRoleMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    // Find and click the edit button for the first user
    const editButtons = screen.getAllByTestId('edit-icon');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user1',
        role: expect.any(String),
      });
    });
  });

  it('handles user ban/unban', async () => {
    const mockMutate = jest.fn();
    useBanUserMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    // Find and click the ban button
    const banButtons = screen.getAllByTestId('shield-off-icon');
    fireEvent.click(banButtons[0]);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user1',
        isEnabled: false,
        reason: expect.any(String),
      });
    });
  });

  it('handles user deletion', async () => {
    const mockMutate = jest.fn();
    useAdminDeleteUserMutation.mockReturnValue({
      mutate: mockMutate,
      isLoading: false,
      error: null,
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    // Find and click the delete button
    const deleteButtons = screen.getAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        userId: 'user1',
        reason: expect.any(String),
      });
    });
  });

  it('handles pagination', async () => {
    const paginatedData = {
      ...mockUsersData,
      pagination: {
        totalCount: 20,
        totalPages: 2,
        currentPage: 1,
        hasNext: true,
        hasPrev: false,
      },
    };

    const mockRefetch = jest.fn();
    useAdminUsersQuery.mockReturnValue({
      data: paginatedData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    // Find and click next page button
    const nextButton = screen.getByTestId('chevron-right-icon');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalledWith({
        page: 2,
      });
    });
  });

  it('shows empty state when no users', () => {
    useAdminUsersQuery.mockReturnValue({
      data: {
        users: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          hasNext: false,
          hasPrev: false,
        },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<UserManagement />, { wrapper: createWrapper() });

    expect(screen.getByText('admin.users.noUsers')).toBeInTheDocument();
  });

  it('shows user status badges correctly', () => {
    render(<UserManagement />, { wrapper: createWrapper() });

    const badges = screen.getAllByTestId('badge');
    
    // Should show active/inactive status badges
    const statusBadges = badges.filter(badge => 
      badge.textContent === 'admin.users.active' || 
      badge.textContent === 'admin.users.inactive'
    );
    
    expect(statusBadges.length).toBeGreaterThan(0);
  });
});