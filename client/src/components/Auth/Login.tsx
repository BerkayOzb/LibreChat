import { useEffect, useState } from 'react';
import { ErrorTypes } from 'librechat-data-provider';
import { OpenIDIcon, useToastContext } from '@librechat/client';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import type { TLoginLayoutContext } from '~/common';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import SocialButton from '~/components/Auth/SocialButton';
import { useAuthContext } from '~/hooks/AuthContext';
import { getLoginError } from '~/utils';
import { useLocalize } from '~/hooks';
import { useCheckBannedStatusQuery } from '~/data-provider';
import LoginForm from './LoginForm';

function Login() {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { error, setError, login } = useAuthContext();
  const { startupConfig } = useOutletContext<TLoginLayoutContext>();

  const [searchParams, setSearchParams] = useSearchParams();
  // Determine if auto-redirect should be disabled based on the URL parameter
  const disableAutoRedirect = searchParams.get('redirect') === 'false';

  // Persist the disable flag locally so that once detected, auto-redirect stays disabled.
  const [isAutoRedirectDisabled, setIsAutoRedirectDisabled] = useState(disableAutoRedirect);

  // State for banned user check
  const [emailToCheck, setEmailToCheck] = useState('');
  const { showBannedModal, setShowBannedModal } = useAuthContext(); // Get from context
  const [isBannedUser, setIsBannedUser] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  // Check banned status query
  const { data: bannedStatus } = useCheckBannedStatusQuery(
    emailToCheck,
    { enabled: !!emailToCheck }
  );

  // Handle banned status check result
  useEffect(() => {
    if (bannedStatus?.banned) {
      setShowBannedModal(true);
      setIsBannedUser(true); // Permanently mark as banned
      setCurrentEmail(emailToCheck); // Store the banned email
      setEmailToCheck(''); // Reset to prevent re-checking
    }
  }, [bannedStatus]);

  // Reset banned status when email changes
  const handleEmailChange = (email: string) => {
    if (email !== currentEmail) {
      setIsBannedUser(false);
      setShowBannedModal(false);
      setCurrentEmail('');
    }
  };


  useEffect(() => {
    const oauthError = searchParams?.get('error');
    if (oauthError && oauthError === ErrorTypes.AUTH_FAILED) {
      showToast({
        message: localize('com_auth_error_oauth_failed'),
        status: 'error',
      });
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, showToast, localize]);

  // Once the disable flag is detected, update local state and remove the parameter from the URL.
  useEffect(() => {
    if (disableAutoRedirect) {
      setIsAutoRedirectDisabled(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('redirect');
      setSearchParams(newParams, { replace: true });
    }
  }, [disableAutoRedirect, searchParams, setSearchParams]);

  // Determine whether we should auto-redirect to OpenID.
  const shouldAutoRedirect =
    startupConfig?.openidLoginEnabled &&
    startupConfig?.openidAutoRedirect &&
    startupConfig?.serverDomain &&
    !isAutoRedirectDisabled;

  useEffect(() => {
    if (shouldAutoRedirect) {
      console.log('Auto-redirecting to OpenID provider...');
      window.location.href = `${startupConfig.serverDomain}/oauth/openid`;
    }
  }, [shouldAutoRedirect, startupConfig]);


  // Render fallback UI if auto-redirect is active.
  if (shouldAutoRedirect) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-lg font-semibold">
          {localize('com_ui_redirecting_to_provider', { 0: startupConfig.openidLabel })}
        </p>
        <div className="mt-4">
          <SocialButton
            key="openid"
            enabled={startupConfig.openidLoginEnabled}
            serverDomain={startupConfig.serverDomain}
            oauthPath="openid"
            Icon={() =>
              startupConfig.openidImageUrl ? (
                <img src={startupConfig.openidImageUrl} alt="OpenID Logo" className="h-5 w-5" />
              ) : (
                <OpenIDIcon />
              )
            }
            label={startupConfig.openidLabel}
            id="openid"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Banned user modal overlay */}
      {showBannedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-white">
                  Hesap Onay Bekliyor
                </h3>
                <p className="mt-2 text-sm text-gray-300">
                  Kayıt olduğunuz için teşekkürler! Hesabınız şu anda yönetici onayı bekliyor.
                  Bir yönetici hesabınızı onayladıktan sonra platforma erişebileceksiniz.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setShowBannedModal(false)}
                    className="rounded-md bg-yellow-800 px-3 py-2 text-sm font-medium text-yellow-100 hover:bg-yellow-700"
                  >
                    Tamam
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular login form - always visible */}
      {error != null && (
        <div className="mb-6 w-full rounded-lg bg-red-900/20 p-4 text-sm text-red-400">
          <ErrorMessage>{localize(getLoginError(error))}</ErrorMessage>
        </div>
      )}
      {startupConfig?.emailLoginEnabled === true && (
        <LoginForm
          onSubmit={login}
          startupConfig={startupConfig}
          error={error}
          setError={setError}
          onEmailBlur={setEmailToCheck}
          onEmailChange={handleEmailChange}
          disabled={isBannedUser}
        />
      )}
      {startupConfig?.registrationEnabled === true && (
        <p className="mt-6 text-center text-sm text-gray-400">
          {' '}
          {localize('com_auth_no_account')}{' '}
          <a
            href="/register"
            className="font-semibold leading-6 text-blue-400 hover:text-blue-300"
          >
            {localize('com_auth_sign_up')}
          </a>
        </p>
      )}
    </>
  );
}

export default Login;
