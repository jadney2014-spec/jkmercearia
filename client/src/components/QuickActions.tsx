import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  ShoppingBagIcon,
  CubeIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import SafeIcon from './SafeIcon';
import { appPath } from '../constants/app';

const SafeAnimatePresence = AnimatePresence as unknown as React.FC<React.PropsWithChildren<any>>;

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
}

const QuickActions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const actions: QuickAction[] = [
    {
      id: 'venda',
      label: 'Nova Venda',
      icon: ShoppingBagIcon,
      href: appPath('vendas'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'product',
      label: 'Novo Produto',
      icon: CubeIcon,
      href: appPath('products'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'report',
      label: 'Relatórios',
      icon: ChartBarIcon,
      href: appPath('reports'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <SafeAnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="mb-4 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={action.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-white shadow-lg transition-all duration-200 hover:shadow-xl ${action.color}`}
                  onClick={() => setIsOpen(false)}
                >
                  <SafeIcon icon={action.icon} className="h-5 w-5" />
                  <span className="font-medium">{action.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </SafeAnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 ${
          isOpen ? 'rotate-45' : 'rotate-0'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <PlusIcon className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default QuickActions;
