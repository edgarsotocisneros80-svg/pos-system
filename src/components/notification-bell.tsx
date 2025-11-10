"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { BellIcon, AlertTriangleIcon, CreditCardIcon, PackageIcon } from "lucide-react";

interface Notification {
  id: string;
  type: 'low_stock' | 'payable_overdue' | 'payable_due_soon';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  data: any;
  created_at: string;
}

interface NotificationSummary {
  low_stock_count: number;
  overdue_payables_count: number;
  due_soon_payables_count: number;
  total_count: number;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [summary, setSummary] = useState<NotificationSummary>({
    low_stock_count: 0,
    overdue_payables_count: 0,
    due_soon_payables_count: 0,
    total_count: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setSummary(data.summary || {});
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <PackageIcon className="h-4 w-4 text-orange-500" />;
      case 'payable_overdue': return <CreditCardIcon className="h-4 w-4 text-red-500" />;
      case 'payable_due_soon': return <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default: return <BellIcon className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const formatTime = (dateStr: string) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  const highPriorityCount = notifications.filter(n => n.priority === 'high').length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellIcon className="h-5 w-5" />
          {summary.total_count > 0 && (
            <Badge 
              variant={highPriorityCount > 0 ? 'destructive' : 'secondary'} 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {summary.total_count > 99 ? '99+' : summary.total_count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {loading && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No hay notificaciones
          </div>
        ) : (
          <>
            {/* Summary */}
            {summary.total_count > 0 && (
              <>
                <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50">
                  <div className="grid grid-cols-2 gap-1">
                    {summary.low_stock_count > 0 && (
                      <div className="flex items-center gap-1">
                        <PackageIcon className="h-3 w-3 text-orange-500" />
                        <span>{summary.low_stock_count} stock bajo</span>
                      </div>
                    )}
                    {summary.overdue_payables_count > 0 && (
                      <div className="flex items-center gap-1">
                        <CreditCardIcon className="h-3 w-3 text-red-500" />
                        <span>{summary.overdue_payables_count} vencidas</span>
                      </div>
                    )}
                    {summary.due_soon_payables_count > 0 && (
                      <div className="flex items-center gap-1">
                        <AlertTriangleIcon className="h-3 w-3 text-yellow-500" />
                        <span>{summary.due_soon_payables_count} por vencer</span>
                      </div>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem key={notification.id} className="p-0">
                  <div className="w-full p-3 hover:bg-gray-50 border-l-4 border-l-transparent hover:border-l-blue-500">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                            {notification.priority === 'high' ? 'Urgente' : 
                             notification.priority === 'medium' ? 'Medio' : 'Bajo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>

            {notifications.length > 10 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2 text-center">
                  <span className="text-xs text-gray-500">
                    +{notifications.length - 10} notificaciones más
                  </span>
                </div>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
