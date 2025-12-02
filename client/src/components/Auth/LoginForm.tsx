import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { Turnstile } from '@marsidev/react-turnstile';
import { ThemeContext, Spinner, Button, isDark } from '@librechat/client';
import type { TLoginUser, TStartupConfig } from 'librechat-data-provider';
import type { TAuthContext } from '~/common';
import { useResendVerificationEmail, useGetStartupConfig } from '~/data-provider';
import { useLocalize } from '~/hooks';
import { getLoginError } from '~/utils';

type TLoginFormProps = {
  onSubmit: (data: TLoginUser) => void;
  startupConfig: TStartupConfig;
  error: Pick<TAuthContext, 'error'>['error'];
  setError: Pick<TAuthContext, 'setError'>['setError'];
  onEmailBlur?: (email: string) => void;
  onEmailChange?: (email: string) => void;
  disabled?: boolean;
};

const LoginForm: React.FC<TLoginFormProps> = ({ onSubmit, startupConfig, error, setError, onEmailBlur, onEmailChange, disabled = false }) => {
  const localize = useLocalize();
  const { theme } = useContext(ThemeContext);
  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TLoginUser>();
  const [showResendLink, setShowResendLink] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { data: config } = useGetStartupConfig();
  const useUsernameLogin = config?.ldap?.username;
  const validTheme = isDark(theme) ? 'dark' : 'light';
  const requireCaptcha = Boolean(startupConfig.turnstile?.siteKey);

  useEffect(() => {
    if (error && error.includes('422') && !showResendLink) {
      setShowResendLink(true);
    }
  }, [error, showResendLink]);

  const resendLinkMutation = useResendVerificationEmail({
    onMutate: () => {
      setError(undefined);
      setShowResendLink(false);
    },
  });

  if (!startupConfig) {
    return null;
  }

  const renderError = (fieldName: string) => {
    const errorMessage = errors[fieldName]?.message;
    return errorMessage ? (
      <span role="alert" className="mt-1 text-sm text-red-500 dark:text-red-400">
        {String(errorMessage)}
      </span>
    ) : null;
  };

  const handleResendEmail = () => {
    const email = getValues('email');
    if (!email) {
      return setShowResendLink(false);
    }
    resendLinkMutation.mutate({ email });
  };

  // Check if error indicates admin approval required
  const isAwaitingApproval = error && (
    error.includes('pending admin approval') ||
    error.includes('com_auth_error_login_pending_approval') ||
    getLoginError(error) === 'com_auth_error_login_pending_approval'
  );

  return (
    <>
      {showResendLink && (
        <div className="mb-4 rounded-md border border-green-500 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {localize('com_auth_email_verification_resend_prompt')}
          <button
            type="button"
            className="ml-2 font-medium underline hover:text-green-800 dark:hover:text-green-300"
            onClick={handleResendEmail}
            disabled={resendLinkMutation.isLoading}
          >
            {localize('com_auth_email_resend_link')}
          </button>
        </div>
      )}
      {isAwaitingApproval && (
        <div className="mb-4 rounded-md border border-yellow-500 bg-yellow-50 p-4 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="font-medium">
                Account Pending Approval
              </h3>
              <p className="mt-1">
                Thank you for registering! Your account is currently pending admin approval.
                You will be able to log in once an administrator approves your account.
              </p>
            </div>
          </div>
        </div>
      )}
      <form
        className="space-y-6"
        aria-label="Login form"
        onSubmit={disabled ? (e) => e.preventDefault() : handleSubmit((data) => onSubmit(data))}
      >
        <div>
          <div className="relative">
            <input
              type="text"
              id="email"
              autoComplete={useUsernameLogin ? 'username' : 'email'}
              aria-label={localize('com_auth_email')}
              {...register('email', {
                required: localize('com_auth_email_required'),
                maxLength: { value: 120, message: localize('com_auth_email_max_length') },
                pattern: {
                  value: useUsernameLogin ? /\S+/ : /\S+@\S+\.\S+/,
                  message: localize('com_auth_email_pattern'),
                },
                onChange: (e) => {
                  const email = e.target.value.trim();
                  if (onEmailChange && !disabled) {
                    onEmailChange(email);
                  }
                },
                onBlur: (e) => {
                  const email = e.target.value.trim();
                  if (email && onEmailBlur && !disabled) {
                    onEmailBlur(email);
                  }
                },
              })}
              disabled={disabled}
              aria-invalid={!!errors.email}
              className={`peer block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder=" "
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-3 z-10 origin-[0] -translate-y-5 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-5 peer-focus:scale-75 peer-focus:text-blue-600 dark:text-gray-400 dark:peer-focus:text-blue-500"
            >
              {useUsernameLogin
                ? localize('com_auth_username').replace(/ \(.*$/, '')
                : localize('com_auth_email_address')}
            </label>
          </div>
          {renderError('email')}
        </div>

        <div>
          <div className="relative">
            <input
              type="password"
              id="password"
              autoComplete="current-password"
              aria-label={localize('com_auth_password')}
              {...register('password', {
                required: localize('com_auth_password_required'),
                minLength: {
                  value: startupConfig?.minPasswordLength || 8,
                  message: localize('com_auth_password_min_length'),
                },
                maxLength: { value: 128, message: localize('com_auth_password_max_length') },
              })}
              disabled={disabled}
              aria-invalid={!!errors.password}
              className={`peer block w-full rounded-xl border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500 sm:text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder=" "
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-3 z-10 origin-[0] -translate-y-5 scale-75 transform text-sm text-gray-500 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-5 peer-focus:scale-75 peer-focus:text-blue-600 dark:text-gray-400 dark:peer-focus:text-blue-500"
            >
              {localize('com_auth_password')}
            </label>
          </div>
          {renderError('password')}
        </div>

        <div className="flex items-center justify-end">
          {startupConfig.passwordResetEnabled && (
            <a
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {localize('com_auth_password_forgot')}
            </a>
          )}
        </div>

        {requireCaptcha && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={startupConfig.turnstile!.siteKey}
              options={{
                ...startupConfig.turnstile!.options,
                theme: validTheme,
              }}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken(null)}
              onExpire={() => setTurnstileToken(null)}
            />
          </div>
        )}

        <Button
          aria-label={localize('com_auth_continue')}
          data-testid="login-button"
          type="submit"
          disabled={disabled || (requireCaptcha && !turnstileToken) || isSubmitting}
          className="flex w-full justify-center rounded-xl bg-blue-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-500"
          title={disabled ? 'Bu hesap yönetici onayı bekliyor' : ''}
        >
          {isSubmitting ? <Spinner className="h-5 w-5 text-white" /> : disabled ? 'Hesap Onay Bekliyor' : localize('com_auth_continue')}
        </Button>
      </form>
    </>
  );
};

export default LoginForm;
