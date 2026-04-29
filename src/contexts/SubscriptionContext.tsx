/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';

const RC_API_KEY_IOS = 'appl_wDTGjapNESRBZKFCnBICukFeQKy';

// Set to false before App Store release
const IS_BETA = true;

export const ENTITLEMENT_ID = 'Palante: Personal Growth Partner Pro';
export const PRODUCT_MONTHLY = 'palante_monthly';
export const PRODUCT_ANNUAL = 'palante_annual';

interface SubscriptionContextType {
  isPro: boolean;
  isTrialing: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
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
    if (!Capacitor.isNativePlatform()) {
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
      } catch (e) {
        console.error('RevenueCat init failed:', e);
        setIsLoading(false);
      }
    };

    init();
  }, [userId, refreshEntitlement]);

  const purchaseMonthly = async (): Promise<{ error?: string }> => {
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p: { product: { identifier: string } }) => p.product.identifier === PRODUCT_MONTHLY)
        ?? offerings.current?.availablePackages[0];
      if (!pkg) return { error: 'Monthly plan unavailable. Please try again.' };
      await Purchases.purchasePackage({ aPackage: pkg });
      await refreshEntitlement();
      return {};
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (err.userCancelled) return {};
      return { error: err.message ?? 'Purchase failed. Please try again.' };
    }
  };

  const purchaseAnnual = async (): Promise<{ error?: string }> => {
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.availablePackages.find((p: { product: { identifier: string } }) => p.product.identifier === PRODUCT_ANNUAL)
        ?? offerings.current?.availablePackages[1];
      if (!pkg) return { error: 'Annual plan unavailable. Please try again.' };
      await Purchases.purchasePackage({ aPackage: pkg });
      await refreshEntitlement();
      return {};
    } catch (e: unknown) {
      const err = e as { userCancelled?: boolean; message?: string };
      if (err.userCancelled) return {};
      return { error: err.message ?? 'Purchase failed. Please try again.' };
    }
  };

  const restorePurchases = async (): Promise<{ error?: string }> => {
    try {
      await Purchases.restorePurchases();
      await refreshEntitlement();
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
