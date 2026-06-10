// Type augmentation to ensure AnimatePresence is treated as a valid JSX component
// with React 19 + TS 5.x in this project setup.
import * as React from 'react';

declare module 'framer-motion' {
  export const AnimatePresence: React.FC<any>;
}

