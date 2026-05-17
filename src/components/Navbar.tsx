import { 
  BarChart3, 
  Table2, 
  Package, 
  Users, 
  Home,
  DollarSign,
  Clock
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Navbar() {
  const navItems = [
    { icon: Home, path: '/', label: 'Início' },
    { icon: Table2, path: '/tables', label: 'Mesas' },
    { icon: DollarSign, path: '/finance', label: 'Financeiro' },
    { icon: Clock, path: '/history', label: 'Histórico' },
    { icon: BarChart3, path: '/reports', label: 'Relatórios' },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-card-dark/80 backdrop-blur-2xl border border-white/5 rounded-[32px] p-1.5 flex gap-0.5 z-50 shadow-2xl w-max max-w-[98vw]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => cn(
            "flex flex-col items-center gap-1 px-3 sm:px-5 py-3 rounded-2xl transition-all active:scale-90 min-w-[64px]",
            isActive ? "bg-white text-black shadow-xl" : "text-gray-500 hover:text-white"
          )}
        >
          <item.icon size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
