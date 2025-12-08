import { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Shield,
  X,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useCreateUserMutation, type TCreateUserRequest } from '~/data-provider';
import { useLocalize } from '~/hooks';

interface UserCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  username?: string;
  general?: string;
}

export default function UserCreationModal({
  isOpen,
  onClose,
  onSuccess
}: UserCreationModalProps) {
  const localize = useLocalize();
  const createUserMutation = useCreateUserMutation();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    username: '',
    role: 'USER'
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return localize('com_admin_email_required');
    if (!email.includes('@')) return localize('com_admin_email_invalid');
    if (email.length < 3) return localize('com_admin_email_too_short');
    if (email.length > 255) return localize('com_admin_email_too_long');
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return localize('com_admin_password_required');
    if (password.length < 8) return localize('com_admin_password_min_length');
    if (password.length > 128) return localize('com_admin_password_max_length');
    return undefined;
  };

  const validateConfirmPassword = (password: string, confirmPassword: string): string | undefined => {
    if (!confirmPassword) return localize('com_admin_confirm_password_required');
    if (password !== confirmPassword) return localize('com_admin_passwords_do_not_match');
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name) return localize('com_admin_name_required');
    if (name.length < 1) return localize('com_admin_name_too_short');
    if (name.length > 80) return localize('com_admin_name_too_long');
    return undefined;
  };

  const validateUsername = (username: string): string | undefined => {
    if (!username) return localize('com_admin_username_required');
    if (username.length < 2) return localize('com_admin_username_too_short');
    if (username.length > 80) return localize('com_admin_username_too_long');
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return localize('com_admin_username_invalid_chars');
    return undefined;
  };

  // Validate entire form
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    errors.email = validateEmail(formData.email);
    errors.password = validatePassword(formData.password);
    errors.confirmPassword = validateConfirmPassword(formData.password, formData.confirmPassword);
    errors.name = validateName(formData.name);
    errors.username = validateUsername(formData.username);

    // Remove undefined values
    return Object.fromEntries(
      Object.entries(errors).filter(([_, value]) => value !== undefined)
    );
  };

  // Handle input changes with real-time validation
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear specific field error on change
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // For confirm password, also validate when password changes
    if (field === 'password' && formErrors.confirmPassword && formData.confirmPassword) {
      const confirmError = validateConfirmPassword(value, formData.confirmPassword);
      if (!confirmError) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  // Handle role change
  const handleRoleChange = (role: 'USER' | 'ADMIN') => {
    setFormData(prev => ({ ...prev, role }));
  };

  // Auto-fill username from email
  const handleEmailChange = (email: string) => {
    handleInputChange('email', email);

    // Auto-fill username if it's empty
    if (!formData.username && email.includes('@')) {
      const emailPrefix = email.split('@')[0];
      handleInputChange('username', emailPrefix);
    }

    // Auto-fill name if it's empty
    if (!formData.name && email.includes('@')) {
      const emailPrefix = email.split('@')[0];
      handleInputChange('name', emailPrefix);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Clear any previous errors
    setFormErrors({});

    // Prepare submission data
    const submitData: TCreateUserRequest = {
      email: formData.email.trim(),
      password: formData.password,
      name: formData.name.trim(),
      username: formData.username.trim(),
      role: formData.role,
      isEnabled: true
    };

    try {
      const result = await createUserMutation.mutateAsync(submitData);

      // Success callback
      if (onSuccess) {
        onSuccess(result.user);
      }

      // Reset form and close modal
      resetForm();
      onClose();

    } catch (error: any) {
      // Handle server errors
      const errorMessage = error?.response?.data?.message || error?.message || localize('com_admin_user_creation_failed');
      setFormErrors({ general: errorMessage });
    }
  };

  // Reset form state
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      name: '',
      username: '',
      role: 'USER'
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Handle modal close
  const handleClose = () => {
    if (!createUserMutation.isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

        {/* Modal */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle border border-border-medium">
          {/* Header */}
          <div className="bg-surface-primary px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-surface-secondary sm:mx-0 sm:h-10 sm:w-10">
                  <User className="h-6 w-6 text-text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium leading-6 text-text-primary">
                    {localize('com_admin_create_user')}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">
                    {localize('com_admin_create_user_description')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={createUserMutation.isLoading}
                className="rounded-md text-text-tertiary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-border-heavy disabled:opacity-50 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* General Error */}
            {formErrors.general && (
              <div className="mb-4 rounded-lg bg-surface-destructive/10 p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <div className="ml-3">
                    <p className="text-sm text-destructive">
                      {formErrors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                  {localize('com_admin_email')} *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-surface-secondary text-text-primary ${
                      formErrors.email
                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                        : 'border-border-medium focus:border-border-heavy focus:ring-border-heavy'
                    }`}
                    placeholder={localize('com_admin_email_placeholder')}
                    disabled={createUserMutation.isLoading}
                    required
                  />
                </div>
                {formErrors.email && (
                  <p className="mt-1 text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              {/* Name and Username Row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-secondary">
                    {localize('com_admin_name')} *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-surface-secondary text-text-primary ${
                        formErrors.name
                          ? 'border-destructive focus:border-destructive focus:ring-destructive'
                          : 'border-border-medium focus:border-border-heavy focus:ring-border-heavy'
                      }`}
                      placeholder={localize('com_admin_name_placeholder')}
                      disabled={createUserMutation.isLoading}
                      required
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>

                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-text-secondary">
                    {localize('com_admin_username')} *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-surface-secondary text-text-primary ${
                        formErrors.username
                          ? 'border-destructive focus:border-destructive focus:ring-destructive'
                          : 'border-border-medium focus:border-border-heavy focus:ring-border-heavy'
                      }`}
                      placeholder={localize('com_admin_username_placeholder')}
                      disabled={createUserMutation.isLoading}
                      required
                    />
                  </div>
                  {formErrors.username && (
                    <p className="mt-1 text-sm text-destructive">{formErrors.username}</p>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                  {localize('com_admin_password')} *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-surface-secondary text-text-primary ${
                      formErrors.password
                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                        : 'border-border-medium focus:border-border-heavy focus:ring-border-heavy'
                    }`}
                    placeholder={localize('com_admin_password_placeholder')}
                    disabled={createUserMutation.isLoading}
                    minLength={8}
                    maxLength={128}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={createUserMutation.isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="mt-1 text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary">
                  {localize('com_admin_confirm_password')} *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-text-tertiary" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 sm:text-sm bg-surface-secondary text-text-primary ${
                      formErrors.confirmPassword
                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                        : 'border-border-medium focus:border-border-heavy focus:ring-border-heavy'
                    }`}
                    placeholder={localize('com_admin_confirm_password_placeholder')}
                    disabled={createUserMutation.isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={createUserMutation.isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-text-tertiary hover:text-text-secondary transition-colors" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-destructive">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3">
                  {localize('com_admin_role')} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* User Role */}
                  <div
                    onClick={() => !createUserMutation.isLoading && handleRoleChange('USER')}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      formData.role === 'USER'
                        ? 'border-border-heavy bg-surface-secondary'
                        : 'border-border-light bg-surface-primary hover:bg-surface-hover'
                    } ${createUserMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="USER"
                        checked={formData.role === 'USER'}
                        onChange={() => handleRoleChange('USER')}
                        className="h-4 w-4 text-text-primary focus:ring-border-heavy border-border-medium"
                        disabled={createUserMutation.isLoading}
                      />
                      <User className="ml-3 h-5 w-5 text-text-tertiary" />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-text-primary">
                          {localize('com_admin_user_role')}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {localize('com_admin_user_role_description')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Admin Role */}
                  <div
                    onClick={() => !createUserMutation.isLoading && handleRoleChange('ADMIN')}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                      formData.role === 'ADMIN'
                        ? 'border-destructive bg-surface-destructive/10'
                        : 'border-border-light bg-surface-primary hover:bg-surface-hover'
                    } ${createUserMutation.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="ADMIN"
                        checked={formData.role === 'ADMIN'}
                        onChange={() => handleRoleChange('ADMIN')}
                        className="h-4 w-4 text-destructive focus:ring-destructive border-border-medium"
                        disabled={createUserMutation.isLoading}
                      />
                      <Shield className="ml-3 h-5 w-5 text-destructive" />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-text-primary">
                          {localize('com_admin_admin_role')}
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {localize('com_admin_admin_role_description')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="bg-surface-secondary px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-border-light">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={createUserMutation.isLoading || Object.keys(validateForm()).length > 0}
              className="inline-flex w-full justify-center rounded-md border border-transparent bg-text-primary px-4 py-2 text-base font-medium text-surface-primary shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-border-heavy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all sm:ml-3 sm:w-auto sm:text-sm"
            >
              {createUserMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {localize('com_admin_creating_user')}
                </>
              ) : (
                localize('com_admin_create_user')
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={createUserMutation.isLoading}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-border-medium bg-surface-primary px-4 py-2 text-base font-medium text-text-primary shadow-sm hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-border-heavy focus:ring-offset-2 disabled:opacity-50 transition-colors sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {localize('com_admin_cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
