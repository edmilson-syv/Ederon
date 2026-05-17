import { 
  Plus, 
  Table2, 
  Package, 
  Users, 
  BarChart3, 
  LogOut,
  TrendingUp,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const user = auth.currentUser;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Ederon</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{user?.displayName || 'Distribuidora'}</p>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="p-3 bg-white/5 rounded-2xl hover:bg-red-500/10 hover:text-red-500 transition-all"
        >
          <LogOut size={20} />
        </button>
      </header>

      <main className="p-6 max-w-lg mx-auto space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card-dark border border-white/5 p-6 rounded-[32px] space-y-2">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-green-500/10 rounded-xl">
                <TrendingUp size={16} className="text-green-500" />
              </div>
              <span className="text-[10px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">R$ 2.450</p>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Vendas Hoje</p>
          </div>
          
          <div className="bg-card-dark border border-white/5 p-6 rounded-[32px] space-y-2">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-gold-500/10 rounded-xl">
                <Clock size={16} className="text-gold-500" />
              </div>
              <span className="text-[10px] font-black text-gray-500">8 Ativas</span>
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">15</p>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Pedidos</p>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-500 rounded-full" />
            Gestão Rápida
          </h3>
          <div className="grid grid-cols-4 gap-2 px-2">
            {[
              { label: 'Nova Venda', icon: Plus, path: '/orders', color: 'bg-gold-500 text-black' },
              { label: 'Mesas', icon: Table2, path: '/tables', color: 'bg-accent-dark text-white' },
              { label: 'Estoque', icon: Package, path: '/products', color: 'bg-accent-dark text-white' },
              { label: 'Clientes', icon: Users, path: '/customers', color: 'bg-blue-500 text-white shadow-blue-500/20' },
            ].map((item, idx) => (
              <Link 
                key={idx}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-2 bg-card-dark border border-white/5 rounded-2xl p-3 transition-all active:scale-95 shadow-lg group",
                  item.label === 'Clientes' ? "border-blue-500/20 bg-blue-500/5 ring-1 ring-blue-500/10" : "hover:border-gold-500/20"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                  item.color
                )}>
                  {/* @ts-ignore */}
                  <item.icon size={16} />
                </div>
                <span className={cn(
                  "text-[8px] font-black uppercase tracking-widest transition-colors text-center",
                  item.label === 'Clientes' ? "text-blue-400" : "text-gray-400 group-hover:text-gold-500"
                )}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent Activity Mini-List */}
        <section className="bg-card-dark border border-white/5 rounded-[40px] p-8">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Atividade Recente</h3>
              <Link to="/reports" className="text-[10px] font-black text-gold-500 uppercase flex items-center gap-1">
                Ver Tudo <ArrowUpRight size={12} />
              </Link>
           </div>
           
           <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-white/10 transition-colors">
                    <TrendingUp size={16} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">Venda Mesa {i}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Há 10 minutos</p>
                  </div>
                  <p className="text-sm font-black text-white">R$ 45,90</p>
                </div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
}
