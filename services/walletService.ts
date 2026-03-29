import { getAuthToken } from './auth';

export type WalletType = 'Customer' | 'Vendor' | 'System';

export interface WalletInfo {
  walletId?: string;
  profileId?: string;
  type?: WalletType | string | number;
  balance?: number;
  heldBalance?: number;
  debt?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string | null;
  availableBalance?: number;
  [key: string]: unknown;
}

export interface TopupLinkResult {
  checkoutUrl?: string;
  paymentLink?: string;
  payUrl?: string;
  url?: string;
  link?: string;
  [key: string]: unknown;
}

export interface WithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  type: WalletType;
}

export interface WithdrawalResult {
  [key: string]: unknown;
}

export interface WithdrawalListItem {
  id: string;
  vendor: string;
  amount: number;
  bank: string;
  requestedAt: string;
  status: string;
  raw?: Record<string, unknown>;
}

export interface TransactionFilter {
  type?: string;
  status?: string;
  from?: string;
  to?: string;
  walletType?: WalletType;
}

export interface AllTransactionFilter extends TransactionFilter {
  walletId?: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  description: string;
  createdAt: string;
  balanceBefore?: number | null;
  balanceAfter?: number | null;
  walletId?: string;
  walletType?: string;
  raw?: Record<string, unknown>;
}

function readField<T>(source: Record<string, unknown>, keys: string[], fallback: T): T {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }

  return fallback;
}

function readNestedField<T>(
  source: Record<string, unknown>,
  parentKeys: string[],
  childKeys: string[],
  fallback: T
): T {
  for (const parentKey of parentKeys) {
    const parentValue = source[parentKey];

    if (parentValue && typeof parentValue === 'object') {
      const parentObject = parentValue as Record<string, unknown>;
      for (const childKey of childKeys) {
        const childValue = parentObject[childKey];
        if (childValue !== undefined && childValue !== null) {
          return childValue as T;
        }
      }
    }
  }

  return fallback;
}

function normalizeWithdrawalItem(item: unknown, index: number): WithdrawalListItem {
  const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

  const id = String(readField(source, ['withdrawalId', 'WithdrawalId', 'id', 'Id'], `WD-${index + 1}`));
  const vendor = String(
    readField(source, ['vendorName', 'VendorName', 'shopName', 'ShopName', 'accountHolder', 'AccountHolder'], 'Không xác định')
  );

  const amountRaw = readField(source, ['amount', 'Amount'], 0);
  const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw) || 0;

  const bankName = String(readField(source, ['bankName', 'BankName'], ''));
  const accountNumber = String(readField(source, ['accountNumber', 'AccountNumber'], ''));
  const bank = [bankName, accountNumber].filter(Boolean).join(' - ') || 'Chưa có thông tin';

  const requestedAt = String(
    readField(
      source,
      ['requestedAt', 'RequestedAt', 'createdDate', 'CreatedDate', 'createdAt', 'CreatedAt'],
      readNestedField(source, ['transaction', 'Transaction'], ['createdAt', 'CreatedAt', 'createdDate', 'CreatedDate'], 'Chưa xác định')
    )
  );
  const status = String(readField(source, ['status', 'Status'], 'Chờ duyệt'));

  return {
    id,
    vendor,
    amount,
    bank,
    requestedAt,
    status,
    raw: source,
  };
}

function normalizeTransactionItem(item: unknown, index: number): WalletTransaction {
  const source = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};

  const tx = (source.transaction || source.Transaction || source) as Record<string, unknown>;

  const id = String(readField(tx, ['transactionId', 'TransactionId', 'id', 'Id'], `TX-${index + 1}`));
  const type = String(readField(tx, ['type', 'Type', 'transactionType', 'TransactionType'], ''));
  const status = String(readField(tx, ['status', 'Status'], ''));

  const amountRaw = readField(tx, ['amount', 'Amount', 'value', 'Value'], 0);
  const amount = typeof amountRaw === 'number' ? amountRaw : Number(amountRaw) || 0;

  const description = String(readField(tx, ['description', 'Description', 'note', 'Note'], ''));
  const createdAt = String(
    readField(
      tx,
      ['createdAt', 'CreatedAt', 'createdDate', 'CreatedDate', 'timestamp', 'Timestamp'],
      ''
    )
  );

  const balanceBeforeRaw = readField(tx, ['balanceBefore', 'BalanceBefore'], null as unknown as number | null);
  const balanceAfterRaw = readField(tx, ['balanceAfter', 'BalanceAfter'], null as unknown as number | null);

  const balanceBefore =
    typeof balanceBeforeRaw === 'number'
      ? balanceBeforeRaw
      : balanceBeforeRaw != null
        ? Number(balanceBeforeRaw) || null
        : null;

  const balanceAfter =
    typeof balanceAfterRaw === 'number'
      ? balanceAfterRaw
      : balanceAfterRaw != null
        ? Number(balanceAfterRaw) || null
        : null;

  const walletId = String(readField(tx, ['walletId', 'WalletId'], '') || readField(source, ['walletId', 'WalletId'], ''));
  const walletType = String(readField(tx, ['walletType', 'WalletType'], '') || readField(source, ['walletType', 'WalletType'], ''));

  return {
    id,
    type,
    status,
    amount,
    description,
    createdAt,
    balanceBefore,
    balanceAfter,
    walletId: walletId || undefined,
    walletType: walletType || undefined,
    raw: source,
  };
}

function unwrapResultArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const envelope = payload as Record<string, unknown>;
    const result = envelope.result;

    if (Array.isArray(result)) {
      return result;
    }

    if (result && typeof result === 'object') {
      const resultObject = result as Record<string, unknown>;
      const nestedArray = resultObject.items ?? resultObject.data ?? resultObject.records;
      if (Array.isArray(nestedArray)) {
        return nestedArray;
      }
    }
  }

  return [];
}

export async function getMyWallet(type: WalletType): Promise<WalletInfo> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  // Swagger shows the parameter name is 'ActiveRole' and values are 'Vendor', 'Customer', etc.
  const response = await fetch(`/api/wallets/me?ActiveRole=${encodeURIComponent(type)}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.errorMessages?.join?.(', ') ||
      payload?.message ||
      `Không thể lấy thông tin ví (${response.status}).`;
    throw new Error(message);
  }

  if (payload?.result && typeof payload.result === 'object') {
    return payload.result as WalletInfo;
  }

  if (payload && typeof payload === 'object') {
    return payload as WalletInfo;
  }

  return {};
}

export async function createTopupLink(amount: number, type: WalletType): Promise<TopupLinkResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const response = await fetch('/api/payos/create-topup-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      type,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.isSuccess === false || payload?.isSucceeded === false) {
    const message =
      payload?.errorMessages?.join?.(', ') ||
      payload?.message ||
      `Không thể tạo link nạp tiền (${response.status}).`;
    throw new Error(message);
  }

  if (payload?.result && typeof payload.result === 'object') {
    return payload.result as TopupLinkResult;
  }

  if (payload && typeof payload === 'object') {
    return payload as TopupLinkResult;
  }

  return {};
}

export async function createWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResult> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const walletTypeMap: Record<string, number> = {
    'Customer': 0,
    'Vendor': 1,
    'System': 2
  };

  const response = await fetch('/api/withdrawals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // PascalCase keys for strict backend and including both Integer/String values for WalletType
    body: JSON.stringify({
      Amount: request.amount,
      BankName: request.bankName,
      AccountNumber: request.accountNumber,
      AccountHolder: request.accountHolder,
      WalletType: walletTypeMap[request.type] ?? request.type,
      Type: request.type,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.isSuccess === false || payload?.isSucceeded === false) {
    const errorMessages = Array.isArray(payload?.errorMessages)
      ? payload.errorMessages.filter((item: unknown) => typeof item === 'string')
      : [];

    const modelErrors = payload?.errors && typeof payload.errors === 'object'
      ? Object.values(payload.errors as Record<string, unknown>)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter((item): item is string => typeof item === 'string')
      : [];

    const message =
      [...errorMessages, ...modelErrors].join(', ') ||
      payload?.message ||
      `Không thể tạo yêu cầu rút tiền (${response.status}).`;
    throw new Error(message);
  }

  if (payload?.result && typeof payload.result === 'object') {
    return payload.result as WithdrawalResult;
  }

  if (payload && typeof payload === 'object') {
    return payload as WithdrawalResult;
  }

  return {};
}

export async function getWithdrawalRequests(): Promise<WithdrawalListItem[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const response = await fetch('/api/withdrawals', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) || (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)) {
    const errorMessages = payload && typeof payload === 'object' && Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
      ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter((item): item is string => typeof item === 'string')
      : [];

    const message =
      errorMessages.join(', ') ||
      (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể lấy danh sách rút tiền (${response.status}).`;

    throw new Error(message);
  }

  const items = unwrapResultArray(payload);
  return items.map((item, index) => normalizeWithdrawalItem(item, index));
}

export async function getMyWithdrawalRequests(status?: string): Promise<WithdrawalListItem[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const query = status && status.trim().length > 0
    ? `?status=${encodeURIComponent(status.trim())}`
    : '';

  const response = await fetch(`/api/withdrawals/me${query}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (
    !response.ok ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)
  ) {
    const errorMessages = payload && typeof payload === 'object' && Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
      ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter((item): item is string => typeof item === 'string')
      : [];

    const message =
      errorMessages.join(', ') ||
      (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể lấy lịch sử rút tiền (${response.status}).`;

    throw new Error(message);
  }

  const items = unwrapResultArray(payload);
  return items.map((item, index) => normalizeWithdrawalItem(item, index));
}

export async function approveWithdrawal(id: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const response = await fetch(`/api/withdrawals/${encodeURIComponent(id)}/approve`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) || (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)) {
    const errorMessages = payload && typeof payload === 'object' && Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
      ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter((item): item is string => typeof item === 'string')
      : [];

    const message =
      errorMessages.join(', ') ||
      (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể duyệt yêu cầu rút tiền (${response.status}).`;

    throw new Error(message);
  }
}

export async function rejectWithdrawal(id: string, reason: string): Promise<void> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const response = await fetch(`/api/withdrawals/${encodeURIComponent(id)}/reject`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) || (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)) {
    const errorMessages = payload && typeof payload === 'object' && Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
      ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter((item): item is string => typeof item === 'string')
      : [];

    const message =
      errorMessages.join(', ') ||
      (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể từ chối yêu cầu rút tiền (${response.status}).`;

    throw new Error(message);
  }
}

export async function getMyTransactions(filter: TransactionFilter = {}): Promise<WalletTransaction[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const params = new URLSearchParams();
  
  // ActiveRole determines the wallet context (Vendor/Customer)
  if (filter.walletType) {
    params.append('ActiveRole', filter.walletType);
  }
  
  // Type is the transaction category filter
  if (filter.type && filter.type.trim()) {
    params.append('Type', filter.type.trim());
  }
  
  if (filter.status && filter.status.trim()) {
    params.append('Status', filter.status.trim());
  }
  if (filter.from && filter.from.trim()) {
    params.append('From', filter.from.trim());
  }
  if (filter.to && filter.to.trim()) {
    params.append('To', filter.to.trim());
  }
  
  // Add default pagination to ensure we get items
  params.append('PageNumber', '1');
  params.append('PageSize', '100');

  const queryString = params.toString();

  const response = await fetch(`/api/transactions/me${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (
    !response.ok ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)
  ) {
    const errorMessages =
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
        ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter(
            (item): item is string => typeof item === 'string',
          )
        : [];

    const message =
      errorMessages.join(', ') ||
      (payload &&
      typeof payload === 'object' &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể tải lịch sử giao dịch (${response.status}).`;

    throw new Error(message);
  }

  const items = unwrapResultArray(payload);
  return items.map((item, index) => normalizeTransactionItem(item, index));
}

export async function getTransactionById(id: string): Promise<WalletTransaction> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const safeId = encodeURIComponent(id);

  const response = await fetch(`/api/transactions/${safeId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (
    !response.ok ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)
  ) {
    const errorMessages =
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
        ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter(
            (item): item is string => typeof item === 'string',
          )
        : [];

    const message =
      errorMessages.join(', ') ||
      (payload &&
      typeof payload === 'object' &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể tải chi tiết giao dịch (${response.status}).`;

    throw new Error(message);
  }

  // API có thể trả thẳng object hoặc bọc trong result
  const main: unknown =
    payload && typeof payload === 'object' && 'result' in payload
      ? (payload as { result: unknown }).result
      : payload;

  return normalizeTransactionItem(main, 0);
}

export async function getRelatedTransactions(id: string): Promise<WalletTransaction[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const safeId = encodeURIComponent(id);

  const response = await fetch(`/api/transactions/${safeId}/related`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (
    !response.ok ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)
  ) {
    const errorMessages =
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
        ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter(
            (item): item is string => typeof item === 'string',
          )
        : [];

    const message =
      errorMessages.join(', ') ||
      (payload &&
      typeof payload === 'object' &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể tải chuỗi giao dịch liên quan (${response.status}).`;

    throw new Error(message);
  }

  const items = unwrapResultArray(payload);
  return items.map((item, index) => normalizeTransactionItem(item, index));
}

export async function getAllTransactions(filter: AllTransactionFilter = {}): Promise<WalletTransaction[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const params = new URLSearchParams();
  if (filter.walletId && filter.walletId.trim()) {
    params.append('walletId', filter.walletId.trim());
  }
  if (filter.type && filter.type.trim()) {
    params.append('type', filter.type.trim());
  }
  if (filter.status && filter.status.trim()) {
    params.append('status', filter.status.trim());
  }
  if (filter.from && filter.from.trim()) {
    params.append('from', filter.from.trim());
  }
  if (filter.to && filter.to.trim()) {
    params.append('to', filter.to.trim());
  }

  const queryString = params.toString();

  const response = await fetch(`/api/transactions${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (
    !response.ok ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSuccess === false) ||
    (payload && typeof payload === 'object' && (payload as { isSuccess?: boolean; isSucceeded?: boolean }).isSucceeded === false)
  ) {
    const errorMessages =
      payload &&
      typeof payload === 'object' &&
      Array.isArray((payload as { errorMessages?: unknown[] }).errorMessages)
        ? ((payload as { errorMessages?: unknown[] }).errorMessages as unknown[]).filter(
            (item): item is string => typeof item === 'string',
          )
        : [];

    const message =
      errorMessages.join(', ') ||
      (payload &&
      typeof payload === 'object' &&
      typeof (payload as { message?: unknown }).message === 'string'
        ? ((payload as { message?: string }).message as string)
        : '') ||
      `Không thể tải danh sách giao dịch (${response.status}).`;

    throw new Error(message);
  }

  const items = unwrapResultArray(payload);
  return items.map((item, index) => normalizeTransactionItem(item, index));
}
