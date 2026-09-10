import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface WalletTransaction {
  txId: number;
  walletId: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description?: string;
  createdAt: string;
}

export interface WalletInfo {
  walletId: number;
  userId: number;
  coinsBalance: number;
  membershipTier: 'FREE' | 'GOLD_VIP' | 'PLATINUM_VIP';
  transactions: WalletTransaction[];
}

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/wallet';

  wallet = signal<WalletInfo | null>(null);
  coins = signal<number>(0);
  tier = signal<'FREE' | 'GOLD_VIP' | 'PLATINUM_VIP'>('FREE');

  getWallet(): Observable<WalletInfo> {
    return this.http.get<WalletInfo>(this.apiUrl).pipe(
      tap((info) => {
        this.wallet.set(info);
        this.coins.set(info.coinsBalance);
        this.tier.set(info.membershipTier);
      }),
    );
  }

  topup(amount: number, description: string = 'Coin pack refill'): Observable<WalletInfo> {
    return this.http.post<WalletInfo>(`${this.apiUrl}/topup`, { amount, description }).pipe(
      tap((info) => {
        this.wallet.set(info);
        this.coins.set(info.coinsBalance);
        this.tier.set(info.membershipTier);
      }),
    );
  }

  unlockChapter(issueId: number, cost: number = 20): Observable<{ success: boolean; issueId: number; remainingCoins: number }> {
    return this.http.post<{ success: boolean; issueId: number; remainingCoins: number }>(
      `${this.apiUrl}/unlock-chapter`,
      { issueId, cost },
    ).pipe(
      tap((res) => {
        this.coins.set(res.remainingCoins);
      }),
    );
  }

  upgradeTier(tier: 'GOLD_VIP' | 'PLATINUM_VIP'): Observable<WalletInfo> {
    return this.http.post<WalletInfo>(`${this.apiUrl}/upgrade-tier`, { tier }).pipe(
      tap((info) => {
        this.wallet.set(info);
        this.coins.set(info.coinsBalance);
        this.tier.set(info.membershipTier);
      }),
    );
  }
}
