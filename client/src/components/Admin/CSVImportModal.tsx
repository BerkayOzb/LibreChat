import { useState, useCallback, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Users,
  Calendar,
  ChevronDown,
  Info,
} from 'lucide-react';
import { useBulkImportUsersMutation, type TBulkImportUserData } from '~/data-provider';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedUser extends TBulkImportUserData {
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

type ModalStep = 'upload' | 'preview' | 'importing' | 'results';

type ExpirationOption = 'none' | '1month' | '3months' | '6months' | '1year' | 'custom';

const getExpirationDate = (option: ExpirationOption, customDate?: string): string | undefined => {
  if (option === 'none') return undefined;
  if (option === 'custom' && customDate) return customDate;

  const date = new Date();
  switch (option) {
    case '1month':
      date.setMonth(date.getMonth() + 1);
      break;
    case '3months':
      date.setMonth(date.getMonth() + 3);
      break;
    case '6months':
      date.setMonth(date.getMonth() + 6);
      break;
    case '1year':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return undefined;
  }
  return date.toISOString().split('T')[0];
};

export default function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const localize = useLocalize();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkImportMutation = useBulkImportUsersMutation();

  const [step, setStep] = useState<ModalStep>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parseError, setParseError] = useState<string>('');
  const [consentChecked, setConsentChecked] = useState(false);
  const [defaultExpiration, setDefaultExpiration] = useState<ExpirationOption>('none');
  const [customExpirationDate, setCustomExpirationDate] = useState<string>('');
  const [showExpirationDropdown, setShowExpirationDropdown] = useState(false);

  // Validation functions
  const validateEmail = (email: string): string | null => {
    if (!email) return localize('com_admin_email_required');
    if (!email.includes('@') || email.length < 3) return localize('com_admin_csv_email_invalid');
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (!password) return localize('com_admin_password_required');
    if (password.length < 8) return localize('com_admin_password_min_length');
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name) return localize('com_admin_name_required');
    if (name.length > 80) return localize('com_admin_csv_name_too_long');
    return null;
  };

  const validateUsername = (username: string): string | null => {
    if (!username) return localize('com_admin_username_required');
    if (username.length < 2) return localize('com_admin_username_too_short');
    if (username.length > 80) return localize('com_admin_username_too_long');
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return localize('com_admin_username_invalid_chars');
    return null;
  };

  const validateUser = (user: Partial<TBulkImportUserData>, rowNumber: number): ParsedUser => {
    const errors: string[] = [];

    const emailError = validateEmail(user.email || '');
    if (emailError) errors.push(emailError);

    const passwordError = validatePassword(user.password || '');
    if (passwordError) errors.push(passwordError);

    const nameError = validateName(user.name || '');
    if (nameError) errors.push(nameError);

    const usernameError = validateUsername(user.username || '');
    if (usernameError) errors.push(usernameError);

    // Validate date format if provided
    if (user.membershipExpiresAt) {
      const date = new Date(user.membershipExpiresAt);
      if (isNaN(date.getTime())) {
        errors.push(localize('com_admin_csv_invalid_date'));
      }
    }

    return {
      email: user.email || '',
      password: user.password || '',
      name: user.name || '',
      username: user.username || '',
      membershipExpiresAt: user.membershipExpiresAt,
      rowNumber,
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseCSV = (content: string): ParsedUser[] => {
    const lines = content.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error(localize('com_admin_csv_empty_file'));
    }

    // Parse header
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredColumns = ['email', 'password', 'name', 'username'];
    const missingColumns = requiredColumns.filter((col) => !header.includes(col));

    if (missingColumns.length > 0) {
      throw new Error(localize('com_admin_csv_required_columns'));
    }

    // Get column indices
    const emailIdx = header.indexOf('email');
    const passwordIdx = header.indexOf('password');
    const nameIdx = header.indexOf('name');
    const usernameIdx = header.indexOf('username');
    const expirationIdx = header.indexOf('membershipexpiresat');

    // Parse data rows
    const users: ParsedUser[] = [];
    const seenEmails = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handling quoted values)
      const values = parseCSVLine(line);

      const email = values[emailIdx]?.trim().toLowerCase() || '';
      const password = values[passwordIdx]?.trim() || '';
      const name = values[nameIdx]?.trim() || '';
      const username = values[usernameIdx]?.trim() || '';
      const membershipExpiresAt = expirationIdx >= 0 ? values[expirationIdx]?.trim() : undefined;

      // Skip completely empty rows (all fields empty)
      if (!email && !password && !name && !username) {
        continue;
      }

      const user = validateUser(
        { email, password, name, username, membershipExpiresAt },
        i + 1, // Row number (1-indexed, accounting for header)
      );

      // Check for duplicate emails in CSV
      if (seenEmails.has(email.toLowerCase())) {
        user.isValid = false;
        user.errors.push(localize('com_admin_csv_duplicate_email'));
      } else if (email) {
        seenEmails.add(email.toLowerCase());
      }

      users.push(user);
    }

    return users;
  };

  // Parse CSV line handling quoted values
  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  };

  const handleFile = useCallback(
    (file: File) => {
      setParseError('');

      if (!file.name.endsWith('.csv')) {
        setParseError(localize('com_admin_csv_invalid_format'));
        return;
      }

      if (file.size > 1024 * 1024) {
        // 1MB limit
        setParseError(localize('com_admin_csv_file_too_large'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const users = parseCSV(content);
          setParsedUsers(users);
          setFileName(file.name);
          setStep('preview');
        } catch (error) {
          setParseError(error instanceof Error ? error.message : localize('com_admin_csv_parse_error'));
        }
      };
      reader.readAsText(file);
    },
    [localize],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile],
  );

  const handleImport = async () => {
    const validUsers = parsedUsers.filter((u) => u.isValid);

    if (validUsers.length === 0) {
      return;
    }

    setStep('importing');

    // Calculate default expiration date if set
    const defaultExpirationDate = getExpirationDate(defaultExpiration, customExpirationDate);

    try {
      const result = await bulkImportMutation.mutateAsync({
        users: validUsers.map((u) => ({
          email: u.email,
          password: u.password,
          name: u.name,
          username: u.username,
          // Use CSV date if provided, otherwise use default expiration
          membershipExpiresAt: u.membershipExpiresAt || defaultExpirationDate,
        })),
      });

      setImportResults(result.results);
      setStep('results');

      if (onSuccess && result.results.successful > 0) {
        onSuccess();
      }
    } catch (error) {
      setImportResults({
        total: validUsers.length,
        successful: 0,
        failed: validUsers.length,
        errors: [{ email: 'all', error: localize('com_admin_csv_import_failed') }],
      });
      setStep('results');
    }
  };

  const downloadTemplate = () => {
    // CSV template with header and one example row only
    // Required: email, password, name, username
    // Optional: membershipExpiresAt (YYYY-MM-DD format)
    const header = 'email,password,name,username,membershipExpiresAt';
    const exampleRow = 'user@example.com,SecurePass123!,John Doe,johndoe,2025-12-31';
    const template = `${header}\n${exampleRow}\n`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetModal = () => {
    setStep('upload');
    setFileName('');
    setParsedUsers([]);
    setImportResults(null);
    setParseError('');
    setConsentChecked(false);
    setDefaultExpiration('none');
    setCustomExpirationDate('');
    setShowExpirationDropdown(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (step !== 'importing') {
      resetModal();
      onClose();
    }
  };

  const validCount = parsedUsers.filter((u) => u.isValid).length;
  const invalidCount = parsedUsers.filter((u) => !u.isValid).length;

  // Count users without expiration date in CSV (only valid ones)
  const usersWithoutExpiration = useMemo(
    () => parsedUsers.filter((u) => u.isValid && !u.membershipExpiresAt).length,
    [parsedUsers],
  );

  // Expiration options for dropdown
  const expirationOptions: { value: ExpirationOption; label: string }[] = [
    { value: 'none', label: localize('com_admin_csv_exp_none') },
    { value: '1month', label: localize('com_admin_csv_exp_1month') },
    { value: '3months', label: localize('com_admin_csv_exp_3months') },
    { value: '6months', label: localize('com_admin_csv_exp_6months') },
    { value: '1year', label: localize('com_admin_csv_exp_1year') },
    { value: 'custom', label: localize('com_admin_csv_exp_custom') },
  ];

  const getSelectedExpirationLabel = () => {
    if (defaultExpiration === 'custom' && customExpirationDate) {
      return new Date(customExpirationDate).toLocaleDateString();
    }
    return expirationOptions.find((opt) => opt.value === defaultExpiration)?.label || '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div
          className="admin-modal-overlay fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal */}
        <div className="admin-modal inline-block transform overflow-hidden text-left align-bottom transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:align-middle">
          {/* Header */}
          <div className="admin-modal-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--admin-info-bg)] sm:mx-0 sm:h-10 sm:w-10">
                  <Users className="h-6 w-6 text-[var(--admin-info)]" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[var(--admin-text-primary)]">
                    {localize('com_admin_import_users')}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
                    {localize('com_admin_import_users_description')}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={step === 'importing'}
                className="rounded-md p-1 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-input-focus)] disabled:opacity-50 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Upload Step */}
            {step === 'upload' && (
              <div className="space-y-4">
                {/* Error Message */}
                {parseError && (
                  <div className="admin-alert admin-alert-danger">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="admin-alert-description">{parseError}</p>
                  </div>
                )}

                {/* Drag & Drop Zone */}
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
                    dragActive
                      ? 'border-[var(--admin-primary)] bg-[var(--admin-info-bg)]'
                      : 'border-[var(--admin-border-muted)] hover:border-[var(--admin-primary)] hover:bg-[var(--admin-bg-elevated)]',
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-12 w-12 mb-4 text-[var(--admin-text-muted)]" />
                  <p className="text-[var(--admin-text-primary)] font-medium">
                    {localize('com_admin_csv_drop_zone')}
                  </p>
                  <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">CSV, max 1MB</p>
                </div>

                {/* Download Template */}
                <div className="flex justify-center">
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 text-sm text-[var(--admin-link)] hover:text-[var(--admin-link-hover)] transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    {localize('com_admin_csv_download_template')}
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-[var(--admin-bg-elevated)] rounded-lg p-4 border border-[var(--admin-border-subtle)]">
                  <h4 className="text-sm font-medium text-[var(--admin-text-primary)] mb-2">
                    {localize('com_admin_csv_required_columns')}
                  </h4>
                  <ul className="text-sm text-[var(--admin-text-secondary)] space-y-1">
                    <li>
                      <code className="bg-[var(--admin-bg-tertiary)] text-[var(--admin-text-primary)] px-1.5 py-0.5 rounded text-xs">
                        email
                      </code>{' '}
                      - {localize('com_admin_email')}
                    </li>
                    <li>
                      <code className="bg-[var(--admin-bg-tertiary)] text-[var(--admin-text-primary)] px-1.5 py-0.5 rounded text-xs">
                        password
                      </code>{' '}
                      - {localize('com_admin_password')} (min 8 chars)
                    </li>
                    <li>
                      <code className="bg-[var(--admin-bg-tertiary)] text-[var(--admin-text-primary)] px-1.5 py-0.5 rounded text-xs">
                        name
                      </code>{' '}
                      - {localize('com_admin_name')}
                    </li>
                    <li>
                      <code className="bg-[var(--admin-bg-tertiary)] text-[var(--admin-text-primary)] px-1.5 py-0.5 rounded text-xs">
                        username
                      </code>{' '}
                      - {localize('com_admin_username')}
                    </li>
                    <li>
                      <code className="bg-[var(--admin-bg-tertiary)] text-[var(--admin-text-primary)] px-1.5 py-0.5 rounded text-xs">
                        membershipExpiresAt
                      </code>{' '}
                      - ({localize('com_ui_optional')}) YYYY-MM-DD
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Preview Step */}
            {step === 'preview' && (
              <div className="space-y-4">
                {/* File Info */}
                <div className="flex items-center justify-between bg-[var(--admin-bg-elevated)] rounded-lg p-3 border border-[var(--admin-border-subtle)]">
                  <div className="flex items-center gap-2">
                    <FileUp className="h-5 w-5 text-[var(--admin-text-secondary)]" />
                    <span className="text-[var(--admin-text-primary)] font-medium">{fileName}</span>
                  </div>
                  <button
                    onClick={resetModal}
                    className="text-sm text-[var(--admin-link)] hover:text-[var(--admin-link-hover)] transition-colors"
                  >
                    {localize('com_ui_select')}
                  </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[var(--admin-bg-elevated)] rounded-lg p-4 text-center border border-[var(--admin-border-subtle)]">
                    <div className="text-2xl font-bold text-[var(--admin-text-primary)]">
                      {parsedUsers.length}
                    </div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">
                      {localize('com_admin_csv_total_rows')}
                    </div>
                  </div>
                  <div className="bg-[var(--admin-success-bg)] rounded-lg p-4 text-center border border-[var(--admin-success)]">
                    <div className="text-2xl font-bold text-[var(--admin-success)]">
                      {validCount}
                    </div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">
                      {localize('com_admin_csv_valid_rows')}
                    </div>
                  </div>
                  <div className="bg-[var(--admin-danger-bg)] rounded-lg p-4 text-center border border-[var(--admin-danger)]">
                    <div className="text-2xl font-bold text-[var(--admin-danger)]">
                      {invalidCount}
                    </div>
                    <div className="text-sm text-[var(--admin-text-secondary)]">
                      {localize('com_admin_csv_invalid_rows')}
                    </div>
                  </div>
                </div>

                {/* Default Expiration Selector - Only show when there are users without expiration date */}
                {usersWithoutExpiration > 0 && (
                  <div className="bg-[var(--admin-bg-elevated)] rounded-lg p-4 border border-[var(--admin-border-subtle)]">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-[var(--admin-info)] mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-[var(--admin-text-primary)]">
                          {localize('com_admin_csv_default_expiration')}
                        </h4>
                        <p className="text-sm text-[var(--admin-text-secondary)] mt-1">
                          {localize('com_admin_csv_default_expiration_desc', {
                            count: usersWithoutExpiration,
                          })}
                        </p>

                        {/* Dropdown */}
                        <div className="mt-3 relative">
                          <button
                            type="button"
                            onClick={() => setShowExpirationDropdown(!showExpirationDropdown)}
                            className="w-full sm:w-64 flex items-center justify-between px-3 py-2 text-sm bg-[var(--admin-bg-surface)] border border-[var(--admin-border-muted)] rounded-md text-[var(--admin-text-primary)] hover:border-[var(--admin-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-input-focus)] transition-colors"
                          >
                            <span>{getSelectedExpirationLabel()}</span>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 text-[var(--admin-text-muted)] transition-transform',
                                showExpirationDropdown && 'rotate-180',
                              )}
                            />
                          </button>

                          {showExpirationDropdown && (
                            <div className="absolute z-10 mt-1 w-full sm:w-64 bg-[var(--admin-bg-surface)] border border-[var(--admin-border-subtle)] rounded-md shadow-lg">
                              {expirationOptions.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setDefaultExpiration(option.value);
                                    if (option.value !== 'custom') {
                                      setShowExpirationDropdown(false);
                                    }
                                  }}
                                  className={cn(
                                    'w-full px-3 py-2 text-sm text-left hover:bg-[var(--admin-row-hover)] transition-colors',
                                    defaultExpiration === option.value &&
                                      'bg-[var(--admin-info-bg)] text-[var(--admin-primary)]',
                                  )}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Custom Date Picker */}
                        {defaultExpiration === 'custom' && (
                          <div className="mt-2">
                            <input
                              type="date"
                              value={customExpirationDate}
                              onChange={(e) => {
                                setCustomExpirationDate(e.target.value);
                                setShowExpirationDropdown(false);
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full sm:w-64 px-3 py-2 text-sm bg-[var(--admin-bg-surface)] border border-[var(--admin-border-muted)] rounded-md text-[var(--admin-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-input-focus)]"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preview Table - Desktop */}
                <div className="hidden md:block border border-[var(--admin-border-subtle)] rounded-lg">
                  <div className="max-h-64 overflow-auto admin-scrollbar">
                    <table className="min-w-full divide-y divide-[var(--admin-border-subtle)]">
                      <thead className="bg-[var(--admin-table-header-bg)] sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--admin-table-header-text)] uppercase">
                            #
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--admin-table-header-text)] uppercase">
                            {localize('com_admin_email')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--admin-table-header-text)] uppercase">
                            {localize('com_admin_name')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--admin-table-header-text)] uppercase">
                            {localize('com_admin_username')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--admin-table-header-text)] uppercase">
                            {localize('com_admin_membership_expiration')}
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-[var(--admin-table-header-text)] uppercase">
                            {localize('com_admin_csv_validation')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-[var(--admin-bg-surface)] divide-y divide-[var(--admin-border-subtle)]">
                        {parsedUsers.map((user) => (
                          <tr
                            key={user.rowNumber}
                            className={cn(
                              'hover:bg-[var(--admin-row-hover)] transition-colors',
                              !user.isValid && 'bg-[var(--admin-danger-bg)]',
                            )}
                          >
                            <td className="px-4 py-2 text-sm text-[var(--admin-text-secondary)]">
                              {user.rowNumber}
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--admin-text-primary)]">
                              {user.email}
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--admin-text-primary)]">
                              {user.name}
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--admin-text-primary)]">
                              {user.username}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {user.membershipExpiresAt ? (
                                <span className="inline-flex items-center gap-1.5 text-[var(--admin-text-primary)] group/tooltip">
                                  {new Date(user.membershipExpiresAt).toLocaleDateString()}
                                  <span className="relative inline-flex">
                                    <Info className="h-3.5 w-3.5 text-[var(--admin-text-muted)] cursor-help" />
                                    <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-2 w-52 rounded-lg bg-gray-900 px-3 py-2.5 text-xs leading-relaxed text-white shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[9999]">
                                      {localize('com_admin_csv_date_from_csv')}
                                      <span className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-gray-900" />
                                    </span>
                                  </span>
                                </span>
                              ) : getExpirationDate(defaultExpiration, customExpirationDate) ? (
                                <span className="text-[var(--admin-info)] font-medium">
                                  {new Date(
                                    getExpirationDate(defaultExpiration, customExpirationDate)!,
                                  ).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-[var(--admin-success)] font-medium">
                                  {localize('com_admin_unlimited')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {user.isValid ? (
                                <CheckCircle className="h-5 w-5 text-[var(--admin-success)]" />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-5 w-5 flex-shrink-0 text-[var(--admin-danger)]" />
                                  <span
                                    className="text-xs truncate max-w-[200px] text-[var(--admin-danger)]"
                                    title={user.errors.join(', ')}
                                  >
                                    {user.errors[0]}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preview Cards - Mobile */}
                <div className="md:hidden max-h-80 overflow-y-auto admin-scrollbar space-y-3">
                  {parsedUsers.map((user) => (
                    <div
                      key={user.rowNumber}
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        user.isValid
                          ? 'border-[var(--admin-border-subtle)] bg-[var(--admin-bg-surface)]'
                          : 'border-[var(--admin-danger)] bg-[var(--admin-danger-bg)]',
                      )}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--admin-text-muted)] bg-[var(--admin-bg-elevated)] px-2 py-0.5 rounded">
                            #{user.rowNumber}
                          </span>
                          {user.isValid ? (
                            <CheckCircle className="h-4 w-4 text-[var(--admin-success)]" />
                          ) : (
                            <XCircle className="h-4 w-4 text-[var(--admin-danger)]" />
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-[var(--admin-text-muted)] uppercase">
                            {localize('com_admin_email')}
                          </p>
                          <p className="text-sm text-[var(--admin-text-primary)] truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-[var(--admin-text-muted)] uppercase">
                              {localize('com_admin_name')}
                            </p>
                            <p className="text-sm text-[var(--admin-text-primary)] truncate">
                              {user.name}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--admin-text-muted)] uppercase">
                              {localize('com_admin_username')}
                            </p>
                            <p className="text-sm text-[var(--admin-text-primary)] truncate">
                              {user.username}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--admin-text-muted)] uppercase">
                            {localize('com_admin_membership_expiration')}
                          </p>
                          <div className="text-sm">
                            {user.membershipExpiresAt ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[var(--admin-text-primary)]">
                                  {new Date(user.membershipExpiresAt).toLocaleDateString()}
                                </span>
                                <span className="relative group/tooltip">
                                  <span className="inline-flex items-center gap-1 text-xs text-[var(--admin-text-muted)] bg-[var(--admin-bg-elevated)] px-1.5 py-0.5 rounded cursor-help">
                                    <Info className="h-3 w-3" />
                                    CSV
                                  </span>
                                  <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 w-52 rounded-lg bg-gray-900 px-3 py-2.5 text-xs leading-relaxed text-white shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-[9999]">
                                    {localize('com_admin_csv_date_from_csv')}
                                    <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[6px] border-y-transparent border-r-[6px] border-r-gray-900" />
                                  </span>
                                </span>
                              </div>
                            ) : getExpirationDate(defaultExpiration, customExpirationDate) ? (
                              <span className="text-[var(--admin-info)] font-medium">
                                {new Date(
                                  getExpirationDate(defaultExpiration, customExpirationDate)!,
                                ).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-[var(--admin-success)] font-medium">
                                {localize('com_admin_unlimited')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Error Message */}
                      {!user.isValid && (
                        <div className="mt-3 pt-3 border-t border-[var(--admin-danger)]">
                          <p className="text-xs text-[var(--admin-danger)]">
                            {user.errors.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Warning for invalid rows */}
                {invalidCount > 0 && (
                  <div className="admin-alert admin-alert-warning">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="admin-alert-description">
                      {invalidCount} {localize('com_admin_csv_invalid_rows_warning')}
                    </p>
                  </div>
                )}

                {/* Consent Checkbox */}
                <div className="bg-[var(--admin-warning-bg)] border border-[var(--admin-warning)] rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[var(--admin-border-muted)] text-[var(--admin-primary)] focus:ring-[var(--admin-primary)]"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-[var(--admin-text-primary)]">
                        {localize('com_admin_csv_consent_title')}
                      </p>
                      <p className="mt-1 text-[var(--admin-text-secondary)]">
                        {localize('com_admin_csv_consent_description')}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Importing Step */}
            {step === 'importing' && (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-[var(--admin-primary)] mb-4" />
                <p className="text-[var(--admin-text-primary)] font-medium">
                  {localize('com_admin_csv_importing')}
                </p>
                <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
                  {validCount} {localize('com_admin_users')}
                </p>
              </div>
            )}

            {/* Results Step */}
            {step === 'results' && importResults && (
              <div className="space-y-4">
                {/* Success/Failure Summary */}
                <div
                  className={cn(
                    'rounded-lg p-6 text-center border',
                    importResults.successful > 0
                      ? 'bg-[var(--admin-success-bg)] border-[var(--admin-success)]'
                      : 'bg-[var(--admin-danger-bg)] border-[var(--admin-danger)]',
                  )}
                >
                  {importResults.successful > 0 ? (
                    <CheckCircle className="mx-auto h-12 w-12 mb-3 text-[var(--admin-success)]" />
                  ) : (
                    <XCircle className="mx-auto h-12 w-12 mb-3 text-[var(--admin-danger)]" />
                  )}
                  <h3 className="text-lg font-medium text-[var(--admin-text-primary)] mb-1">
                    {localize('com_admin_csv_import_success')}
                  </h3>
                  <p className="text-[var(--admin-text-secondary)]">
                    {importResults.successful} / {importResults.total}{' '}
                    {localize('com_admin_csv_import_results')}
                  </p>
                </div>

                {/* Error Details */}
                {importResults.errors.length > 0 && (
                  <div className="border border-[var(--admin-border-subtle)] rounded-lg overflow-hidden">
                    <div className="bg-[var(--admin-bg-elevated)] px-4 py-2 border-b border-[var(--admin-border-subtle)]">
                      <h4 className="text-sm font-medium text-[var(--admin-text-primary)]">
                        {localize('com_admin_csv_failed_imports')} ({importResults.failed})
                      </h4>
                    </div>
                    <div className="max-h-48 overflow-y-auto admin-scrollbar bg-[var(--admin-bg-surface)]">
                      <ul className="divide-y divide-[var(--admin-border-subtle)]">
                        {importResults.errors.map((error, index) => (
                          <li
                            key={index}
                            className="px-4 py-2 text-sm hover:bg-[var(--admin-row-hover)] transition-colors"
                          >
                            <span className="text-[var(--admin-text-primary)] font-medium">
                              {error.email}
                            </span>
                            <span className="text-[var(--admin-danger)]"> - {error.error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="admin-modal-footer sm:flex sm:flex-row-reverse">
            {step === 'upload' && (
              <button
                type="button"
                onClick={handleClose}
                className="admin-btn-secondary w-full sm:w-auto"
              >
                {localize('com_admin_cancel')}
              </button>
            )}

            {step === 'preview' && (
              <>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={validCount === 0 || !consentChecked}
                  className="admin-btn-primary w-full sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {localize('com_admin_csv_confirm_import')} ({validCount})
                </button>
                <button
                  type="button"
                  onClick={resetModal}
                  className="admin-btn-secondary mt-3 w-full sm:mt-0 sm:w-auto"
                >
                  {localize('com_ui_back')}
                </button>
              </>
            )}

            {step === 'results' && (
              <button
                type="button"
                onClick={handleClose}
                className="admin-btn-primary w-full sm:w-auto"
              >
                {localize('com_ui_close')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
