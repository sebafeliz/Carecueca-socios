import React, { useState } from 'react';
import { 
  Drama, 
  BarChart3, 
  Wallet, 
  Users, 
  FileText, 
  Bell, 
  UserCheck, 
  ShieldCheck, 
  Menu, 
  X, 
  Sparkles,
  Smartphone,
  CloudCheck,
  RotateCcw
} from 'lucide-react';
import { UserRole } from '../types';
import { CarecuecaLogo } from './CarecuecaLogo';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  unreadCount: number;
  openNotifications: () => void;
  pushEnabled: boolean;
  togglePushNotifications: () => void;
  onOpenWipeModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUserRole,
  setCurrentUserRole,
  unreadCount,
  openNotifications,
  pushEnabled,
  togglePushNotifications,
  onOpenWipeModal
}) => {
  const navItems = [
    { id: 'members', label: 'Socios', icon: Users },
    { id: 'dues', label: 'Cuotas y Pagos', icon: Wallet },
    { id: 'dashboard', label: 'Resumen', icon: BarChart3 },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
  };

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <CarecuecaLogo size="sm" lightText={false} />
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 text-sm tracking-tight block">Carecueca Teatro</span>
              <span className="text-[11px] text-slate-400 block -mt-0.5">Control de Socios y Cuotas</span>
            </div>
          </div>

          {/* Minimalist Desktop Navigation */}
          <nav className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Secondary Actions */}
          <div className="flex items-center space-x-2">
            {onOpenWipeModal && (
              <button
                onClick={onOpenWipeModal}
                className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center space-x-1"
                title="Reiniciar pagos y cobros (conserva socios)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[11px]">Reiniciar Cuotas</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

