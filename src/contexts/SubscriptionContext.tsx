/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { analytics } from '../utils/analytics';

const RC_API_KEY_IOS = 'appl_wDTGjapNESRBZKFCnBICukFeQKy';

const IS_BETA = true;

export const ENTITLEMENT_ID = 'Palante: Personal Growth Partner Pro';
export const PRODUCT_MONTHLY = 'palante_monthly';
export const PRODUCT_ANNUAL = 'palante_annual';

export interface SubscriptionPrices {
  monthly?: string;        // e.g. "$9.99", localized priceString from the store
  annual?: string;         // e.g. "$59.99"
  annualPerMonth?: string; // annual price / 12, formatted in the store currency
}

interface SubscriptionContextType {
  isPro: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  prices: SubscriptionPrices;
  purchaseMonthly: () => Promise<{ error?: string }>;
  purchaseAnnual: () => Promise<{ error?: string }>;
  restorePurchases: () => Promise<{ error?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children, userId }: { children: ReactNode; userId?: string }) => {
  const [isPro, setIsPro] = useState(IS_BETA);
  const [isTrialing, setIsTrialing] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(!IS_BETA);
  const [prices, setPrices] = useState<SubscriptionPrices>({});

  const loadPrices = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      const monthly = packages.find(p => p.product.identifier === PRODUCT_MONTHLY);
      const annual = packages.find(p => p.product.identifier === PRODUCT_ANNUAL);

      let annualPerMonth: string | undefined;
      if (annual?.product.price && annual.product.currencyCode) {
        annualPerMonth = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: annual.product.currencyCode,
        }).format(annual.product.price / 12);
      }

      setPrices({
        monthly: monthly?.product.priceString,
        annual: annual?.product.priceString,
        annualPerMonth,
      });
    } catch (e) {
      console.error('RevenueCat price fetch failed:', e);
      // prices stay empty: paywall falls back to USD copy
    }
  }, []);

  const refreshEntitlement = useCallback(async () => {
    if (IS_BETA) return;
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      const hasAccess = !!entitlement;
      setIsPro(hasAccess);

      if (entitlement?.periodType === 'TRIAL') {
        setIsTrialing(true);
        if (entitlement.expirationDate) {
          const msLeft = new Date(entitlement.expirationDate).getTime() - Date.now();
          setTrialDaysRemaining(Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24))));
        }
      } else {
        setIsTrialing(false);
        setTrialDaysRemaining(0);
      }
    } catch (e) {
      console.error('RevenueCat entitlement check failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (IS_BETA || !Capacitor.isNativePlatform()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- short-circuits RevenueCat init on platforms/builds that never call it, can't be known during render
      setIsLoading(false);
      return;
    }

    const init = async () => {
      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey: RC_API_KEY_IOS });
        if (userId) {
          await Purchases.logIn({ appUserID: userId });
        }
        await refreshEntitlement();
        await loadPrices();
      } catch (e) {
        console.error('RevenueCat init failed:', e);
        setIsLoading(false);
      }
    };

    init();
  }, [userId, refreshEntitlement, loadPrices]);

  const purchaseMonthly = async (): Promise<{ error?: string }> => {
    analytics.purchaseStarted({ plan: 'monthly' });
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p: { product: { identifier: string } }) => p.product.identifier === PRODUCT_MONTHLY);
      if (!pkg) {
        analytics.purchaseFailed({ plan: 'monthly', reason: 'unavailable' });
        return { error: 'Monthly plan unavailable. Please try again.' };
      }
      await Purchases.purchasePackage({ aPackage: pkg });
      await refreshEntitlement();
      analytics.purchaseCompleted({ plan: 'monthly' });
      return {};
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (err.userCancelled) {
        analytics.purchaseCancelled({ plan: 'monthly' });
        return {};
      }
      analytics.purchaseFailed({ plan: 'monthly', reason: err.message ?? 'unknown' });
      return { error: err.message ?? 'Purchase failed. Please try again.' };
    }
  };

  const purchaseAnnual = async (): Promise<{ error?: string }> => {
    analytics.purchaseStarted({ plan: 'annual' });
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p: { product: { identifier: string } }) => p.product.identifier === PRODUCT_ANNUAL);
      if (!pkg) {
        analytics.purchaseFailed({ plan: 'annual', reason: 'unavailable' });
        return { error: 'Annual plan unavailable. Please try again.' };
      }
      await Purchases.purchasePackage({ aPackage: pkg });
      await refreshEntitlement();
      analytics.purchaseCompleted({ plan: 'annual' });
      return {};
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (err.userCancelled) {
        analytics.purchaseCancelled({ plan: 'annual' });
        return {};
      }
      analytics.purchaseFailed({ plan: 'annual', reason: err.message ?? 'unknown' });
      return { error: err.message ?? 'Purchase failed. Please try again.' };
    }
  };

  const restorePurchases = async (): Promise<{ error?: string }> => {
    try {
      await Purchases.restorePurchases();
      await refreshEntitlement();
      analytics.purchasesRestored();
      return {};
    } catch (e: unknown) {
      const err = e as { message?: string };
      return { error: err.message ?? 'Restore failed. Please try again.' };
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      isPro,
      isTrialing,
      trialDaysRemaining,
      isLoading,
      prices,
      purchaseMonthly,
      purchaseAnnual,
      restorePurchases,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
};
