import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import {
  Home,
  PlusCircle,
  Users,
  Settings,
  BarChart,
  Layers,
  LineChart
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active: boolean;
  badge?: number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, to, active, badge }) => (
  <Link to={to} className="w-full">
    <motion.div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
        active
          ? "bg-primary text-white font-medium"
          : "text-gray-600 hover:bg-gray-100"
      )}
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.98 }}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {active && !badge && (
        <motion.div
          className="w-1 h-6 bg-white rounded-full ml-auto"
          layoutId="activeIndicator"
        />
      )}
    </motion.div>
  </Link>
);

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { tasks } = useAppContext();
  const [unallocatedCount, setUnallocatedCount] = useState(0);
  
  // Calculate unallocated tasks count
  useEffect(() => {
    if (tasks) {
      const count = tasks.filter(task => task.status === 'Pending Allocation').length;
      setUnallocatedCount(count);
    }
  }, [tasks]);
  
  const navItems = [
    { icon: <Home size={20} />, label: 'Dashboard', to: '/' },
    { icon: <PlusCircle size={20} />, label: 'New Request', to: '/new-request' },
    { icon: <Layers size={20} />, label: 'Allocate Tasks', to: '/allocate', badge: unallocatedCount },
    { icon: <BarChart size={20} />, label: 'Reports', to: '/reports' },
    { icon: <LineChart size={20} />, label: 'Metrics', to: '/metrics' },
    { icon: <Settings size={20} />, label: 'Settings', to: '/settings' }
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="w-64 border-r bg-white shadow-sm z-10"
      >
        <div className="flex flex-col h-full">
          <div className="p-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <img 
                src="/lovable-uploads/80c074f4-5cec-402a-be24-31718b565435.png" 
                alt="Bioforum Logo" 
                className="h-12 mx-auto mb-2"
              />
              <p className="text-sm text-gray-600 mt-1 font-medium">Build Management Tracker</p>
            </motion.div>
          </div>
          
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item, index) => (
              <motion.div
                key={item.to}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <SidebarItem
                  icon={item.icon}
                  label={item.label}
                  to={item.to}
                  active={location.pathname === item.to}
                  badge={item.badge}
                />
              </motion.div>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Users size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">Francois van Vuuren</p>
                <p className="text-xs text-gray-500">Director</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full p-6"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default Layout;
