import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../firebase/AuthContext';
import { useUserRole } from '../hooks/useUserRole';
import { NotificationCenter } from '../contexts/NotificationContext';
import ThemeToggle from './ThemeToggle';
import TabTransition from './TabTransition';
import OfflineIndicator from './OfflineIndicator';
import { usePreloadComponents } from '../hooks/usePreloadComponents';
import { APP_NAME, appPath } from '../constants/app';
import {
  HomeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TagIcon,
  ShoppingBagIcon,
  CubeIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

interface NavLink {
  type: 'link';
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface NavHeading {
  type: 'heading';
  name: string;
}

type NavItem = NavLink | NavHeading;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isAdmin, isTesouraria, isVendedor } = useUserRole();
  const location = useLocation();

  usePreloadComponents();

  const canManage = isAdmin || isTesouraria || isVendedor;

  const navigation: NavItem[] = [
    { type: 'link', name: 'Início', href: appPath('welcome'), icon: HomeIcon },
    { type: 'link', name: 'Nova Venda', href: appPath('vendas'), icon: ShoppingBagIcon },
    { type: 'link', name: 'Dashboard', href: appPath('dashboard'), icon: ChartBarIcon },

    { type: 'heading', name: 'Gerenciar' },
    ...(canManage
      ? ([
          { type: 'link', name: 'Produtos', href: appPath('products'), icon: CubeIcon },
          { type: 'link', name: 'Categorias', href: appPath('categories'), icon: TagIcon },
          { type: 'link', name: 'Fiados', href: appPath('fiados'), icon: ClipboardDocumentListIcon },
          { type: 'link', name: 'Itens a Comprar', href: appPath('compras'), icon: ShoppingCartIcon },
        ] as NavItem[])
      : []),

    { type: 'heading', name: 'Relatórios' },
    { type: 'link', name: 'Relatórios', href: appPath('reports'), icon: CurrencyDollarIcon },

    ...(isAdmin
      ? ([
          { type: 'heading', name: 'Administração' },
          { type: 'link', name: 'Usuários', href: appPath('admin/admins'), icon: UsersIcon },
        ] as NavItem[])
      : []),
  ];

  const isCurrentPath = (path: string) => location.pathname === path;

  const renderNav = () =>
    navigation.map((item, index) => {
      if (item.type === 'link') {
        const Icon = item.icon;
        return (
          <Link
            key={`${item.href}-${index}`}
            to={item.href}
            onClick={() => setSidebarOpen(false)}
            className={`group flex items-center px-3 py-3 min-h-[44px] text-sm font-medium rounded-md transition-colors touch-manipulation ${
              isCurrentPath(item.href)
                ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
            }`}
          >
            <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.name}</span>
          </Link>
        );
      }
      return (
        <div key={`${item.name}-${index}`} className="pt-6 pb-2 px-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider dark:text-gray-500">
            {item.name}
          </h3>
        </div>
      );
    });

  const BrandHeader = () => (
    <div className="flex items-center gap-x-3">
      <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
        <ShoppingBagIcon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-700 dark:text-gray-300">{APP_NAME}</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Gestão & Vendas</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-950">
      <OfflineIndicator />
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-gray-900">
          <div className="flex h-16 items-center justify-between px-4">
            <BrandHeader />
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">{renderNav()}</nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-sm border-r border-gray-100 dark:bg-gray-900/95 dark:border-gray-800 shadow-sm">
          <div className="flex h-16 items-center px-4">
            <BrandHeader />
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">{renderNav()}</nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex-1 flex flex-col">
        <div className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-x-2 border-b border-gray-100 bg-white/80 backdrop-blur-sm px-2 sm:px-3 shadow-sm sm:gap-x-4 sm:px-4 lg:gap-x-6 lg:px-8 dark:border-gray-800 dark:bg-gray-900/80">
          <button
            type="button"
            className="-m-2.5 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-700 lg:hidden dark:text-gray-300 touch-manipulation"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-2 self-stretch sm:gap-x-4 lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
              <NotificationCenter />
              <ThemeToggle />
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-x-1 sm:gap-x-2">
                <span className="hidden sm:inline text-sm text-gray-700 dark:text-gray-300">
                  Olá, {user?.displayName || user?.email?.split('@')[0] || 'Usuário'}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-x-1 min-w-[44px] min-h-[44px] px-2 justify-center text-sm text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white touch-manipulation"
                  aria-label="Sair"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 py-2 sm:py-4 lg:py-6">
          <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
            <TabTransition transitionKey={location.pathname}>
              <div className="bg-white/90 dark:bg-gray-900/90 border border-gray-100 dark:border-gray-800 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-md p-3 sm:p-4 md:p-6 lg:p-8">
                {children}
              </div>
            </TabTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
