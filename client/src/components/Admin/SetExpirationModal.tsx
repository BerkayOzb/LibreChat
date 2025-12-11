import { useState, useEffect } from 'react';
import { X, Clock, Calendar, Loader2, AlertTriangle, Infinity } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface SetExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (expirationDate: string | null) => Promise<void>;
  userName: string;
  currentExpiration?: string | null;
  isLoading?: boolean;
}

export default function SetExpirationModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  currentExpiration,
  isLoading = false,
}: SetExpirationModalProps) {
  const localize = useLocalize();
  const [expirationType, setExpirationType] = useState<'unlimited' | 'date' | 'days'>('date');
  const [selectedDate, setSelectedDate] = useState('');
  const [daysToAdd, setDaysToAdd] = useState(30);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (currentExpiration) {
        const date = new Date(currentExpiration);
        if (date > new Date()) {
          setExpirationType('date');
          setSelectedDate(date.toISOString().split('T')[0]);
        } else {
          setExpirationType('days');
          setDaysToAdd(30);
        }
      } else {
        setExpirationType('unlimited');
      }
    }
  }, [isOpen, currentExpiration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let expirationDate: string | null = null;

      if (expirationType === 'date') {
        if (!selectedDate) {
          setError(localize('com_admin_select_date'));
          return;
        }
        expirationDate = new Date(selectedDate).toISOString();
      } else if (expirationType === 'days') {
        if (daysToAdd < 1) {
          setError(localize('com_admin_days_min'));
          return;
        }
        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        expirationDate = date.toISOString();
      }
      // For 'unlimited', expirationDate stays null

      await onConfirm(expirationDate);
      onClose();
    } catch (err: any) {
      setError(err?.message || localize('com_admin_update_expiration_failed'));
    }
  };

  const quickOptions = [
    { labelKey: 'com_admin_7_days', days: 7 },
    { labelKey: 'com_admin_30_days', days: 30 },
    { labelKey: 'com_admin_90_days', days: 90 },
    { labelKey: 'com_admin_1_year', days: 365 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        </div>

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>

        <div className="inline-block transform overflow-hidden rounded-xl bg-surface-primary text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle border border-border-medium">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-medium">
            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              {localize('com_admin_set_membership_expiration')}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-sm text-text-secondary mb-4">
              {localize('com_admin_set_membership_for')} <span className="font-medium text-text-primary">{userName}</span>
            </p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Expiration Type Selection */}
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-border-medium cursor-pointer hover:bg-surface-hover transition-colors">
                  <input
                    type="radio"
                    name="expirationType"
                    value="unlimited"
                    checked={expirationType === 'unlimited'}
                    onChange={() => setExpirationType('unlimited')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <Infinity className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-text-primary">{localize('com_admin_unlimited_access')}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-border-medium cursor-pointer hover:bg-surface-hover transition-colors">
                  <input
                    type="radio"
                    name="expirationType"
                    value="days"
                    checked={expirationType === 'days'}
                    onChange={() => setExpirationType('days')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-text-primary">{localize('com_admin_add_days_from_today')}</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-border-medium cursor-pointer hover:bg-surface-hover transition-colors">
                  <input
                    type="radio"
                    name="expirationType"
                    value="date"
                    checked={expirationType === 'date'}
                    onChange={() => setExpirationType('date')}
                    className="h-4 w-4 text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-text-primary">{localize('com_admin_specific_date')}</span>
                  </div>
                </label>
              </div>

              {/* Days Input */}
              {expirationType === 'days' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {localize('com_admin_number_of_days')}
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {quickOptions.map((opt) => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setDaysToAdd(opt.days)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${daysToAdd === opt.days
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                          }`}
                      >
                        {localize(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={daysToAdd}
                    onChange={(e) => setDaysToAdd(parseInt(e.target.value) || 1)}
                    className="block w-full rounded-lg border border-border-medium bg-surface-secondary px-3 py-2.5 text-sm text-text-primary focus:border-border-heavy focus:ring-1 focus:ring-border-heavy"
                  />
                  <p className="text-xs text-text-tertiary mt-1">
                    {localize('com_admin_expires_on_date', { date: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toLocaleDateString() })}
                  </p>
                </div>
              )}

              {/* Date Input */}
              {expirationType === 'date' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {localize('com_admin_expiration_date')}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full rounded-lg border border-border-medium bg-surface-secondary px-3 py-2.5 text-sm text-text-primary focus:border-border-heavy focus:ring-1 focus:ring-border-heavy"
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border-medium mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-border-medium bg-surface-primary px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors"
                >
                  {localize('com_admin_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      {localize('com_admin_saving')}
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4" />
                      {localize('com_admin_save_expiration')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
