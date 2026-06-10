import React from 'react';
import { motion } from 'framer-motion';
import WhatsAppIntegration from '../components/WhatsAppIntegration';
import PageTransition from '../components/PageTransition';

const WhatsAppPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="space-y-6">
        <WhatsAppIntegration />
      </div>
    </PageTransition>
  );
};

export default WhatsAppPage;
