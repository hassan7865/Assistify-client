"use client";

import React from 'react';
import { useBanModal } from '@/contexts/ban-modal-context';
import BanVisitorModal from '@/components/ui/ban-visitor-modal';

const BanModalWrapper: React.FC = () => {
  const { isOpen, banData, closeBanModal, onBanSuccess } = useBanModal();
  
  if (!banData) return null;
  
  return (
    <BanVisitorModal
      isOpen={isOpen}
      onClose={closeBanModal}
      clientId={banData.clientId}
      ipAddress={banData.ipAddress}
      visitorName={banData.visitorName}
      visitorMetadata={banData.visitorMetadata}
      onBanSuccess={onBanSuccess}
    />
  );
};

export default BanModalWrapper;
