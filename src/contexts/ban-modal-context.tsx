"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface BanModalData {
  clientId: string;
  ipAddress: string;
  visitorName?: string;
  visitorMetadata?: {
    country?: string;
    browser?: string;
    os?: string;
    user_agent?: string;
  };
}

interface BanModalContextType {
  isOpen: boolean;
  banData: BanModalData | null;
  openBanModal: (data: BanModalData) => void;
  closeBanModal: () => void;
  onBanSuccess?: () => void;
  setOnBanSuccess: (callback?: () => void) => void;
}

const BanModalContext = createContext<BanModalContextType | undefined>(undefined);

export const useBanModal = () => {
  const context = useContext(BanModalContext);
  if (!context) {
    throw new Error('useBanModal must be used within a BanModalProvider');
  }
  return context;
};

interface BanModalProviderProps {
  children: ReactNode;
}

export const BanModalProvider: React.FC<BanModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [banData, setBanData] = useState<BanModalData | null>(null);
  const [onBanSuccess, setOnBanSuccess] = useState<(() => void) | undefined>(undefined);

  const openBanModal = (data: BanModalData) => {
    setBanData(data);
    setIsOpen(true);
  };

  const closeBanModal = () => {
    setIsOpen(false);
    setBanData(null);
    setOnBanSuccess(undefined);
  };

  return (
    <BanModalContext.Provider
      value={{
        isOpen,
        banData,
        openBanModal,
        closeBanModal,
        onBanSuccess,
        setOnBanSuccess,
      }}
    >
      {children}
    </BanModalContext.Provider>
  );
};
