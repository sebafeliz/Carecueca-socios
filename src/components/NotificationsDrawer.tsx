import React from 'react';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  MessageSquare,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onGenerateTestAlert: () => void;
  pushEnabled: boolean;
  togglePushNotifications: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
  onGenerateTestAlert,
  pushEnabled,
  togglePushNotifications
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'payment':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'reminder':
        return <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />;
      default:
        return <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex justify-end">
      <div className="bg-white text-slate-900 max-w-sm w-full h-full p-5 shadow-xl border-l border-slate-200 flex flex-col justify-between">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Notificaciones & Alertas</h3>
                <p className="text-[11px] text-slate-500">{unreadCount} no leídas</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls */}
          <div className="my-3 flex items-center justify-between text-xs">
            <button
              onClick={togglePushNotifications}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                pushEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              <span>{pushEnabled ? 'Push ON' : 'Activar Push'}</span>
            </button>

            <button
              onClick={onMarkAllAsRead}
              className="text-indigo-600 font-medium text-[11px] hover:underline flex items-center space-x-1"
            >
              <Check className="w-3 h-3" />
              <span>Marcar Leídas</span>
            </button>
          </div>

          {/* Notifications List */}
          <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-2.5 rounded-lg border text-xs transition-colors ${
                    !n.read
                      ? 'bg-indigo-50/50 border-indigo-200 text-slate-900 font-medium'
                      : 'bg-slate-50 border-slate-100 text-slate-600'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {getIcon(n.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                        <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs">
                No hay notificaciones.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <button
            onClick={onGenerateTestAlert}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generar Prueba de Alerta</span>
          </button>

          <button
            onClick={onClearNotifications}
            className="w-full py-1 text-slate-400 hover:text-rose-600 text-[11px] font-medium text-center flex items-center justify-center space-x-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Limpiar Historial</span>
          </button>
        </div>

      </div>
    </div>
  );
};
