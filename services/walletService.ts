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

export async function getMyWallet(type: WalletType): Promise<WalletInfo> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Bạn chưa đăng nhập.');
  }

  const response = await fetch(`/api/wallets/me?type=${encodeURIComponent(type)}`, {
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
