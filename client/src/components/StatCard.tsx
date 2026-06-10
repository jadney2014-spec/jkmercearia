import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  delay = 0
}) => {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      accent: 'bg-blue-500'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      accent: 'bg-green-500'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      accent: 'bg-red-500'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      accent: 'bg-yellow-500'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      accent: 'bg-purple-500'
    }
  };

  const config = colorConfig[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: delay * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="bg-white overflow-hidden shadow-xl rounded-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-lg ${config.bg} flex items-center justify-center`}>
              <div className={config.icon}>
                {icon}
              </div>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <motion.dd
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: delay * 0.1 + 0.2 }}
                className="text-2xl font-bold text-gray-900"
              >
                {typeof value === 'number' ? 
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                  value
                }
              </motion.dd>
            </dl>
          </div>
        </div>
        
        {subtitle && (
          <div className="mt-2">
            <div className="text-sm text-gray-500">
              {subtitle}
            </div>
          </div>
        )}

        {trend && (
          <div className="mt-3 flex items-center">
            <div className={`flex items-center text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay * 0.1 + 0.4 }}
                className={`w-2 h-2 rounded-full mr-2 ${
                  trend.isPositive ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="font-medium">
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="ml-1 text-gray-500">
                {trend.label}
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
