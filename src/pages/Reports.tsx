import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar,
  ChevronLeft,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { Order, Product, Customer } from '../types';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    });
    const unsubProds = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });
    const unsubCust = onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    });
    return () => {
      unsubOrders();
      unsubProds();
      unsubCust();
    };
  }, []);

  const totalRevenue = orders.filter(o => o.status === 'closed').reduce((acc, o) => acc + o.total, 0);
  const totalOrders = orders.filter(o => o.status === 'closed').length;
  
  const salesByProduct = products.map(p => {
    const count = orders
      .filter(o => o.status === 'closed')
      .flatMap(o => o.items)
      .filter(i => i.productId === p.id)
      .reduce((acc, i) => acc + i.quantity, 0);
    return { name: p.name, sales: count };
  }).filter(s => s.sales > 0).sort((a,b) => b.sales - a.sales).slice(0, 5);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Relatório de Vendas - Ederon Distribuidora', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Receita Total: ${formatCurrency(totalRevenue)}`, 14, 38);
    doc.text(`Total de Pedidos: ${totalOrders}`, 14, 46);

    const tableData = orders
      .filter(o => o.status === 'closed')
      .map(o => [
        o.id.substring(0, 8),
        new Date(o.closedAt?.toDate()).toLocaleString(),
        formatCurrency(o.total),
        o.status
      ]);

    autoTable(doc, {
      startY: 55,
      head: [['ID', 'Data/Hora', 'Total', 'Status']],
      body: tableData,
    });

    doc.save('relatorio-ederon.pdf');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="p-6 bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Relatórios</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Desempenho do negócio</p>
            </div>
          </div>
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-6 py-4 bg-gold-500 text-black font-black rounded-2xl shadow-xl shadow-gold-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            <Download size={18} />
            PDF
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card-dark border border-white/5 p-8 rounded-[40px] space-y-2">
            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center mb-2">
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Receita Bruta</p>
          </div>
          <div className="bg-card-dark border border-white/5 p-8 rounded-[40px] space-y-2">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-2">
              <Package size={20} className="text-blue-500" />
            </div>
            <p className="text-2xl font-black text-white tracking-tighter">{totalOrders}</p>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Pedidos Pagos</p>
          </div>
        </div>

        {/* Chart */}
        <section className="bg-card-dark border border-white/5 rounded-[40px] p-8">
           <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
             <BarChart3 size={16} className="text-gold-500" />
             Produtos Mais Vendidos
           </h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={salesByProduct}>
                 <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }} 
                   interval={0}
                 />
                 <Tooltip 
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                 />
                 <Bar dataKey="sales" radius={[10, 10, 0, 0]}>
                   {salesByProduct.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={index === 0 ? '#d4af37' : '#1a1a1a'} />
                   ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </section>

        {/* Recent Closed Orders */}
        <section className="space-y-4">
           <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest ml-4">Últimas Vendas</h3>
           <div className="space-y-2">
              {orders
                .filter(o => o.status === 'closed')
                .sort((a,b) => b.closedAt?.toMillis() - a.closedAt?.toMillis())
                .slice(0, 5)
                .map(order => (
                  <div key={order.id} className="bg-card-dark border border-white/5 rounded-[32px] p-6 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-tight">Pedido #{order.id.slice(0, 4)}</p>
                      <p className="text-[10px] text-gray-600 font-extrabold">{new Date(order.closedAt?.toDate()).toLocaleTimeString()}</p>
                    </div>
                    <p className="text-lg font-black text-white">{formatCurrency(order.total)}</p>
                  </div>
                ))}
           </div>
        </section>
      </main>
    </div>
  );
}
