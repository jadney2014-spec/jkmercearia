// Navegação Mobile Bottom Bar - Estilo LouveApp
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  CalendarIcon,
  MusicalNoteIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CalendarIcon as CalendarIconSolid,
  MusicalNoteIcon as MusicalNoteIconSolid,
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
  UserGroupIcon as UserGroupIconSolid,
} from '@heroicons/react/24/solid';
import { useNotifications } from '../hooks/useNotifications';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const navItems: NavItem[] = [
    {
      name: 'Início',
      href: '/tesouraria/mobile-dashboard',
      icon: HomeIcon,
      iconSolid: HomeIconSolid,
    },
    {
      name: 'Calendário',
      href: '/tesouraria/calendar',
      icon: CalendarIcon,
      iconSolid: CalendarIconSolid,
    },
    {
      name: 'Música',
      href: '/tesouraria/scales',
      icon: MusicalNoteIcon,
      iconSolid: MusicalNoteIconSolid,
    },
    {
      name: 'Mensagens',
      href: '/tesouraria/messages',
      icon: ChatBubbleLeftRightIcon,
      iconSolid: ChatBubbleLeftRightIconSolid,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: 'Ministério',
      href: '/tesouraria/ministry',
      icon: UserGroupIcon,
      iconSolid: UserGroupIconSolid,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/tesouraria/mobile-dashboard') {
      return location.pathname === '/tesouraria/mobile-dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = active ? item.iconSolid : item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full relative transition-colors ${
                active
                  ? 'text-primary-400'
                  : 'text-gray-400'
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold min-w-[20px]">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-xs mt-1 font-medium ${
                  active ? 'font-semibold' : 'font-normal'
                }`}
              >
                {item.name}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-600 dark:bg-primary-400 rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
