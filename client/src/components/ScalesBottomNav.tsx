import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MusicalNoteIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import {
  MusicalNoteIcon as MusicalNoteIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconSolid: React.ComponentType<{ className?: string }>;
}

const ScalesBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      name: 'Ministérios',
      href: '/tesouraria/ministries',
      icon: MusicalNoteIcon,
      iconSolid: MusicalNoteIconSolid,
    },
    {
      name: 'Escalas',
      href: '/tesouraria/scales',
      icon: ClipboardDocumentListIcon,
      iconSolid: ClipboardDocumentListIconSolid,
    },
    {
      name: 'Relatórios',
      href: '/tesouraria/scale-reports',
      icon: ChartBarIcon,
      iconSolid: ChartBarIconSolid,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/tesouraria/scales') {
      return location.pathname === '/tesouraria/scales';
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
                active ? 'text-primary-400' : 'text-gray-400'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className={`text-xs mt-1 font-medium ${active ? 'font-semibold' : 'font-normal'}`}>
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

export default ScalesBottomNav;
