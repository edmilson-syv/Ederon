import { useState, useEffect } from 'react';
import { 
  ChevronLeft,
  Search,
  Calendar,
  Filter,
  Users,
  Package,
  TrendingUp,
  Clock,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { Order, Product, Customer } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function SalesHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  
  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [customerFilter, setCustomerFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch closed orders
    const q = query(
      collection(db, 'orders'), 
      where('status', '==', 'closed'),
      orderBy('closedAt', 'desc')
    );
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders', auth));

    onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    });

    return () => unsubOrders();
  }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedOrders(next);
  };

  const filteredOrders = orders.filter(order => {
    // Date filter
    if (dateRange.start) {
      const start = new Date(dateRange.start);
      if (order.closedAt?.toDate() < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(dateRange.end);
      end.setHours(23, 59, 59, 999);
      if (order.closedAt?.toDate() > end) return false;
    }

    // Customer filter
    if (customerFilter && !order.customerName?.toLowerCase().includes(customerFilter.toLowerCase())) {
      return false;
    }

    // Product filter
    if (productFilter) {
      const hasProduct = order.items.some(item => 
        item.name.toLowerCase().includes(productFilter.toLowerCase())
      );
      if (!hasProduct) return false;
    }

    return true;
  });

  const getPaymentIcon = (method?: string) => {
    switch (method) {
      case 'cartao': return <CreditCard size={14} />;
      case 'dinheiro': return <Banknote size={14} />;
      case 'pix': return <TrendingUp size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getPaymentLabel = (method?: string) => {
    switch (method) {
      case 'cartao': return 'Cartão';
      case 'dinheiro': return 'Dinheiro';
      case 'pix': return 'Pix';
      default: return 'Pendente';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="p-6 bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Histórico</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Todas as vendas realizadas</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFilterVisible(!isFilterVisible)}
            className={cn(
              "p-4 rounded-2xl border transition-all",
              isFilterVisible ? "bg-white text-black" : "bg-white/5 text-gray-400 border-white/5"
            )}
          >
            <Filter size={20} />
          </button>
        </div>

        <AnimatePresence>
          {isFilterVisible && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">De</label>
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-2">Até</label>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Filtrar por cliente..."
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                />
              </div>

              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Filtrar por produto..."
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-4 text-xs text-white focus:outline-none focus:border-white/20 transition-all font-bold"
                />
              </div>

              <div className="flex gap-2 pb-4">
                <button 
                  onClick={() => {
                    setDateRange({ start: '', end: '' });
                    setCustomerFilter('');
                    setProductFilter('');
                  }}
                  className="flex-1 py-3 bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-white transition-all"
                >
                  Limpar Filtros
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="p-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center">
            <Clock size={48} className="mx-auto text-white/5 mb-4" />
            <p className="text-gray-600 font-bold text-xs uppercase tracking-widest">Nenhuma venda encontrada</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-card-dark border border-white/5 rounded-[32px] overflow-hidden"
            >
              <div 
                onClick={() => toggleExpand(order.id)}
                className="p-6 flex items-center justify-between cursor-pointer active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-400">
                    <p className="text-[10px] font-black uppercase leading-tight">Mesa</p>
                    <p className="text-base font-black text-white">{order.tableId.slice(-2)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                      {order.customerName || 'Balcão'}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                       {getPaymentIcon(order.paymentMethod)}
                       <span>{getPaymentLabel(order.paymentMethod)}</span>
                       <span>•</span>
                       <span>{order.closedAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white tracking-tighter">{formatCurrency(order.total)}</p>
                  <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                    {order.closedAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {expandedOrders.has(order.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-black/20 p-6 space-y-4"
                  >
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-gold-500 bg-gold-500/10 px-2 py-1 rounded-md">{item.quantity}x</span>
                            <span className="text-xs font-bold text-gray-300">{item.name}</span>
                          </div>
                          <span className="text-xs font-black text-white">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">ID do Pedido</span>
                       <span className="text-[10px] font-mono text-gray-600">#{order.id.slice(0, 8)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
