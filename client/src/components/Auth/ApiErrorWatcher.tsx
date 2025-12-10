import React from 'react';
import { useApiErrorBoundary } from '~/hooks/ApiErrorBoundaryContext';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks/AuthContext';
import ExpiredAccountModal from './ExpiredAccountModal';

const ApiErrorWatcher = () => {
  const { error } = useApiErrorBoundary();
  const navigate = useNavigate();
  const { expiredState, setExpiredState } = useAuthContext();

  React.useEffect(() => {
    if (error?.response?.status === 500) {
      // do something with error
      // navigate('/login');
    }

    // Check for membership expired error (403 with expired flag)
    if (error?.response?.status === 403) {
      const responseData = error.response?.data as any;
      if (responseData?.expired === true || responseData?.code === 'MEMBERSHIP_EXPIRED') {
        setExpiredState({
          isExpired: true,
          expiredAt: responseData?.expiredAt || null,
        });
      }
    }
  }, [error, navigate, setExpiredState]);

  const handleCloseModal = () => {
    setExpiredState({ isExpired: false, expiredAt: null });
  };

  return (
    <ExpiredAccountModal
      isOpen={expiredState.isExpired}
      onClose={handleCloseModal}
      expiredAt={expiredState.expiredAt}
    />
  );
};

export default ApiErrorWatcher;
