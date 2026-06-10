import React from 'react';
import { motion } from 'framer-motion';

interface StatusIndicatorProps {
  status: 'positive' | 'negative' | 'neutral' | 'warning';
  value: number;
  label: string;
  icon?: React.ReactNode;
  pulse?: boolean;
  formatAsCurrency?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  value,
  label,
  icon,
  pulse = true,
  formatAsCurrency = true
}) => {
  const statusConfig = {
    positive: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900',
      pulseColor: 'bg-green-500'
    },
    negative: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900',
      pulseColor: 'bg-red-500'
    },
    neutral: {
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      pulseColor: 'bg-blue-500'
    },
    warning: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      pulseColor: 'bg-yellow-500'
    }
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 relative">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
          {icon}
        </div>
        {pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.pulseColor} opacity-30`}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
      <div className="ml-5 w-0 flex-1">
        <dl>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
            {label}
          </dt>
          <motion.dd
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className={`text-lg font-medium ${config.color}`}
          >
            {formatAsCurrency 
              ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
              : value.toLocaleString('pt-BR')
            }
          </motion.dd>
        </dl>
      </div>
    </div>
  );
};

export default StatusIndicator;
