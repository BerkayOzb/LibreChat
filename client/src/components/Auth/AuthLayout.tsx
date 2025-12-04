import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { BlinkAnimation } from './BlinkAnimation';
import { Banner } from '../Banners';
import Footer from './Footer';
import { BRAND_NAME } from '~/config/brand';
import { useEffect } from 'react';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  // Force dark mode for auth pages
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      // Cleanup: restore original theme when leaving auth pages
      const savedTheme = localStorage.getItem('color-theme');
      if (savedTheme !== 'dark') {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mb-6 w-full rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mb-6 w-full rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold underline hover:text-red-300" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mb-6 w-full rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full bg-gray-900 animate-in fade-in duration-700">
      <Banner />

      {/* Left Side - Visual Showcase (Desktop only) */}
      <div className="hidden w-1/2 flex-col justify-between bg-gray-900 p-12 lg:flex xl:w-7/12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-blue-900/20 blur-3xl animate-pulse duration-[10000ms]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-purple-900/20 blur-3xl animate-pulse duration-[12000ms]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-indigo-900/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full justify-between animate-in slide-in-from-left-10 duration-700 fade-in">
          <div className="flex items-center">
            <img
              src="assets/logo-dark.png"
              className="h-16 w-auto object-contain"
              alt={localize('com_ui_logo', { 0: startupConfig?.appTitle ?? BRAND_NAME })}
            />
          </div>

          <div className="max-w-2xl">
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white lg:text-6xl">
              {localize('com_auth_welcome_title') || 'Welcome to the Future of AI'}
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-gray-300">
              {localize('com_auth_welcome_subtitle') || 'Experience the power of advanced artificial intelligence with our cutting-edge platform.'}
            </p>
          </div>

          <div className="text-sm font-medium text-gray-400">
            © {new Date().getFullYear()} {startupConfig?.appTitle ?? BRAND_NAME}. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Form Container */}
      <div className="relative z-10 flex w-full flex-col items-center px-6 py-12 lg:w-1/2 xl:w-5/12 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
        {/* Theme selector removed - always dark mode */}

        <div className="w-full max-w-md my-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          {/* Mobile Logo */}
          <div className="mb-10 flex justify-center lg:hidden">
            <BlinkAnimation active={isFetching}>
              <img
                src="assets/logo-dark.png"
                className="h-16 w-auto object-contain"
                alt={localize('com_ui_logo', { 0: startupConfig?.appTitle ?? BRAND_NAME })}
              />
            </BlinkAnimation>
          </div>

          <div className="mb-8">
            {!hasStartupConfigError && !isFetching && (
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {header}
              </h2>
            )}
            <p className="mt-2 text-sm text-gray-400">
              {pathname.includes('login')
                ? localize('com_auth_login_subtitle') || 'Please enter your details to sign in.'
                : localize('com_auth_register_subtitle') || 'Create an account to get started.'}
            </p>
          </div>

          <DisplayError />

          {children}
        </div>

        {/* Mobile Footer */}
        <div className="mt-10 lg:hidden">
          <Footer startupConfig={startupConfig} />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
