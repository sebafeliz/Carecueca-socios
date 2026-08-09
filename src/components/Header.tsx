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
  CloudCheck
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
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUserRole,
  setCurrentUserRole,
  unreadCount,
  openNotifications,
  pushEnabled,
  togglePushNotifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'members', label: 'Registro de Socios', icon: Users },
    { id: 'dues', label: 'Pago de Cuotas', icon: Wallet },
    { id: 'dashboard', label: 'Resumen General', icon: BarChart3 },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2">
            <CarecuecaLogo size="md" lightText={true} />
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800/60 uppercase tracking-wider ml-1">
              Tesorería
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Real-time Push Status Button */}
            <button
              onClick={togglePushNotifications}
              title={pushEnabled ? "Notificaciones Push Activas" : "Activar Notificaciones Push"}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                pushEnabled
                  ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{pushEnabled ? "Push ON" : "Push OFF"}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={openNotifications}
              className="relative p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Alertas y Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white ring-2 ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Role Switcher Pill */}
            <div className="relative group">
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-md text-xs font-medium text-slate-200 cursor-pointer hover:bg-slate-700 transition-colors">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline text-slate-400">Rol:</span>
                <span className="font-semibold text-indigo-300">{currentUserRole}</span>
              </div>
              <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-lg py-1 hidden group-hover:block z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cambiar Vista</div>
                {(['Admin', 'Tesorero', 'Socio'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setCurrentUserRole(role)}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-700 flex items-center justify-between ${
                      currentUserRole === role ? 'font-bold text-indigo-300 bg-slate-700/50' : 'text-slate-300'
                    }`}
                  >
                    <span>{role}</span>
                    {currentUserRole === role && <Sparkles className="w-3 h-3 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
