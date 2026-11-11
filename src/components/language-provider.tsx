"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type LanguageCode = "bn" | "en";

const STORAGE_KEY = "bazar.language.v1";

export const TRANSLATIONS = {
  bn: {
    // Header & Navigation
    skipToContent: "মূল অংশে যান",
    homeAria: "বাজার হোম",
    selectArea: "এলাকা বাছাই করুন",
    shoppingAreaAria: "কেনাকাটার এলাকা",
    searchProductsLabel: "পণ্য খুঁজুন",
    searchPlaceholder: "পণ্য, ব্র্যান্ড ও দোকান খুঁজুন...",
    search: "খুঁজুন",
    wishlist: "পছন্দের তালিকা",
    notifications: "নোটিফিকেশন",
    cart: "ঝুড়ি",
    settings: "সেটিংস",
    account: "অ্যাকাউন্ট",
    myAccount: "আমার অ্যাকাউন্ট",
    myOrders: "আমার অর্ডার",
    addresses: "ঠিকানা তালিকা",
    signOut: "সাইন আউট",
    signIn: "সাইন ইন",

    // Home & Product Grid
    loadingProducts: "পণ্য লোড হচ্ছে…",
    emptyAreaPrimary: "এখানে এখনো কোনো দোকান নেই। আমরা স্থানীয় বিক্রেতাদের জানিয়েছি!",
    emptyAreaSecondary: "No shops are available here yet. We have notified local sellers!",
    chooseAnotherArea: "অন্য এলাকা বাছাই করুন · Choose another area",
    soldSuffix: "বিক্রি",
    outOfStock: "স্টকে নেই",
    inStock: "স্টকে আছে",

    // Quick View & Product
    addToCart: "ঝুড়িতে যোগ করুন",
    addedToCart: "যোগ হয়েছে ✓",
    buyNow: "এখনই কিনুন",
    perUnitPrice: "প্রতি কেজি / একক মূল্য",
    unitWeightLabel: "একক / ওজন",
    defaultUnitWeight: "১ কেজি / স্ট্যান্ডার্ড প্যাক",
    close: "বন্ধ করুন",

    // Mini-Cart & 1-Click Checkout
    yourCart: "আপনার ঝুড়ি",
    cartEmptyTitle: "আপনার ঝুড়ি খালি",
    cartEmptyCaption: "যেকোনো পণ্যে ক্লিক করে ঝুড়িতে যোগ করুন।",
    subtotalExclDelivery: "মোট (ডেলিভারি ছাড়া)",
    total: "মোট",
    remove: "সরান",
    orderPlaced: "আপনার অর্ডার সম্পন্ন হয়েছে!",
    orderPlacedSub: "ক্যাশ অন ডেলিভারি · হোম পেজে ফিরে যাওয়া হচ্ছে...",
    guestPhoneTitle: "আপনার মোবাইল নম্বর দিন",
    guestPhoneSubtitle: "১-ক্লিকে অর্ডার করতে শুধু আপনার ফোন নম্বর দিন। GPS অবস্থান স্বয়ংক্রিয়ভাবে নেওয়া হচ্ছে।",
    phoneNumberLabel: "মোবাইল নম্বর",
    phonePlaceholder: "01XXXXXXXXX",
    phoneInvalidError: "সঠিক মোবাইল নম্বর দিন (কমপক্ষে ৬ সংখ্যার)",
    gpsFetching: "GPS অবস্থান নেওয়া হচ্ছে...",
    gpsReady: "GPS অবস্থান সংযুক্ত হয়েছে",
    gpsFallback: "নির্বাচিত এলাকায় ডেলিভারি হবে",
    confirmOrder: "অর্ডার কনফার্ম করুন",
    placingOrder: "অর্ডার হচ্ছে...",
    orderStepVerifyPhone: "আপনার নম্বর যাচাই করা হচ্ছে...",
    orderStepConfirmLocation: "লোকেশন নিশ্চিত করা হচ্ছে...",
    orderStepCalculateTotal: "মোট হিসাব করা হচ্ছে...",
    orderStepPrepareOrder: "অর্ডার প্রস্তুত করা হচ্ছে...",

    // Settings Page
    shoppingSettingsTitle: "সেটিংস ও ভাষা",
    languageTitle: "ভাষা · Language",
    languageCaption: "ওয়েবসাইটের ভাষা নির্বাচন করুন",
    banglaName: "বাংলা",
    englishName: "English",
    shoppingAreaTitle: "কেনাকাটার এলাকা",
    tapToChangeVillage: "আপনার গ্রাম বা এলাকা পরিবর্তন করতে ট্যাপ করুন",
    chooseVillage: "আপনার গ্রাম বা এলাকা বাছাই করুন",
    changeAreaBtn: "এলাকা পরিবর্তন",
    returnToShopping: "← কেনাকাটায় ফিরে যান",

    // Footer
    footerTagline: "বাংলাদেশের সহজ ও বিশ্বস্ত মার্কেটপ্লেস। ক্যাশ অন ডেলিভারিতে কেনাকাটা করুন।",
    shopHeading: "কেনাকাটা",
    allProducts: "সব পণ্য",
    categories: "ক্যাটাগরি",
    newArrivals: "নতুন পণ্য",
    supportHeading: "সহায়তা",
    helpCentre: "হেল্প সেন্টার",
    returns: "রিটার্ন",
    delivery: "ডেলিভারি",
    allRightsReserved: "সর্বস্বত্ব সংরক্ষিত।",
  },
  en: {
    // Header & Navigation
    skipToContent: "Skip to content",
    homeAria: "Bazar home",
    selectArea: "Select area",
    shoppingAreaAria: "Shopping area",
    searchProductsLabel: "Search products",
    searchPlaceholder: "Search products, brands and stores",
    search: "Search",
    wishlist: "Wishlist",
    notifications: "Notifications",
    cart: "Cart",
    settings: "Settings",
    account: "Account",
    myAccount: "My account",
    myOrders: "My orders",
    addresses: "Addresses",
    signOut: "Sign out",
    signIn: "Sign in",

    // Home & Product Grid
    loadingProducts: "Loading products…",
    emptyAreaPrimary: "No shops are available here yet. We have notified local sellers!",
    emptyAreaSecondary: "এখানে এখনো কোনো দোকান নেই। আমরা স্থানীয় বিক্রেতাদের জানিয়েছি!",
    chooseAnotherArea: "Choose another area · অন্য এলাকা বাছাই করুন",
    soldSuffix: "sold",
    outOfStock: "Out of stock",
    inStock: "In stock",

    // Quick View & Product
    addToCart: "Add to Cart",
    addedToCart: "Added ✓",
    buyNow: "Buy Now",
    perUnitPrice: "Per kg / unit price",
    unitWeightLabel: "Unit / Weight",
    defaultUnitWeight: "1 kg / Standard pack",
    close: "Close",

    // Mini-Cart & 1-Click Checkout
    yourCart: "Your Cart",
    cartEmptyTitle: "Your cart is empty",
    cartEmptyCaption: "Click any product to add it to your cart.",
    subtotalExclDelivery: "Subtotal (excl. delivery)",
    total: "Total",
    remove: "Remove",
    orderPlaced: "Your order is placed!",
    orderPlacedSub: "Cash on Delivery · Returning to home...",
    guestPhoneTitle: "Enter your phone number",
    guestPhoneSubtitle: "Enter only your phone number for 1-click checkout. Fetching GPS coordinates automatically.",
    phoneNumberLabel: "Phone Number",
    phonePlaceholder: "01XXXXXXXXX",
    phoneInvalidError: "Enter a valid phone number (at least 6 digits)",
    gpsFetching: "Getting GPS coordinates...",
    gpsReady: "GPS coordinates captured",
    gpsFallback: "Using active area for delivery",
    confirmOrder: "Confirm Order",
    placingOrder: "Placing order...",
    orderStepVerifyPhone: "Verifying your number...",
    orderStepConfirmLocation: "Confirming location...",
    orderStepCalculateTotal: "Calculating total...",
    orderStepPrepareOrder: "Preparing your order...",

    // Settings Page
    shoppingSettingsTitle: "Shopping settings",
    languageTitle: "Language · ভাষা",
    languageCaption: "Choose your preferred language",
    banglaName: "বাংলা",
    englishName: "English",
    shoppingAreaTitle: "Shopping area",
    tapToChangeVillage: "tap to change your village or area",
    chooseVillage: "Choose your village or area",
    changeAreaBtn: "Change area",
    returnToShopping: "← Return to shopping",

    // Footer
    footerTagline: "Bangladesh's friendly marketplace. Shop from trusted sellers with cash on delivery.",
    shopHeading: "Shop",
    allProducts: "All products",
    categories: "Categories",
    newArrivals: "New arrivals",
    supportHeading: "Support",
    helpCentre: "Help centre",
    returns: "Returns",
    delivery: "Delivery",
    allRightsReserved: "All rights reserved.",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.bn;
export type TranslationDictionary = Record<TranslationKey, string>;

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  strings: TranslationDictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "bn",
  setLanguage: () => undefined,
  t: (key) => TRANSLATIONS.bn[key],
  strings: TRANSLATIONS.bn,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window === "undefined") return "bn";
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "bn" || saved === "en") return saved;
    } catch {
      /* ignore storage errors */
    }
    return "bn";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) => TRANSLATIONS[language][key] ?? TRANSLATIONS.bn[key],
      strings: TRANSLATIONS[language],
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
