import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  ChevronLeft,
  X,
  CreditCard,
  Banknote,
  CheckCircle2,
  Package,
  Users
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { Product, Table, Order, OrderItem, Customer } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Orders() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams] = useSearchParams();
  const tableIdParam = searchParams.get('tableId');
  
  const [currentOrder, setCurrentOrder] = useState<Partial<Order>>({
    tableId: tableIdParam || '',
    items: [],
    total: 0,
    status: 'open'
  });

  const [isClosingOrder, setIsClosingOrder] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
  
  const navigate = useNavigate();

  useEffect(() => {
    onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    });

    onSnapshot(collection(db, 'tables'), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Table[]);
    });

    onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    });

    if (tableIdParam) {
      const q = query(
        collection(db, 'orders'), 
        where('tableId', '==', tableIdParam),
        where('status', '==', 'open')
      );
      const unsubscribeOrder = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          setCurrentOrder({ id: orderDoc.id, ...orderDoc.data() } as Order);
        } else {
          setCurrentOrder({
            tableId: tableIdParam,
            items: [],
            total: 0,
            status: 'open'
          });
        }
      });
      return unsubscribeOrder;
    }
  }, [tableIdParam]);

  const addToOrder = (product: Product) => {
    const items = [...(currentOrder.items || [])];
    const existing = items.find(i => i.productId === product.id);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setCurrentOrder(prev => ({ ...prev, items, total }));
  };

  const removeFromOrder = (productId: string) => {
    const items = [...(currentOrder.items || [])];
    const existing = items.find(i => i.productId === productId);
    
    if (existing && existing.quantity > 1) {
      existing.quantity -= 1;
    } else {
      const idx = items.findIndex(i => i.productId === productId);
      items.splice(idx, 1);
    }

    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setCurrentOrder(prev => ({ ...prev, items, total }));
  };

  const handleSaveOrder = async () => {
    if (!currentOrder.tableId || !currentOrder.items?.length) {
      toast.error('Selecione uma mesa e adicione itens');
      return;
    }

    try {
      const orderData = {
        ...currentOrder,
        updatedAt: serverTimestamp()
      };
      
      if (currentOrder.id) {
        await updateDoc(doc(db, 'orders', currentOrder.id), orderData);
      } else {
        const orderRef = await addDoc(collection(db, 'orders'), {
          ...orderData,
          createdAt: serverTimestamp(),
          status: 'open'
        });
        await updateDoc(doc(db, 'tables', currentOrder.tableId), {
          status: 'occupied',
          currentOrderId: orderRef.id
        });
      }
      toast.success('Pedido atualizado');
      navigate('/tables');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders', auth);
    }
  };

  const handleCloseOrder = async () => {
    if (!currentOrder.id) return;
    try {
      await updateDoc(doc(db, 'orders', currentOrder.id), {
        status: 'closed',
        closedAt: serverTimestamp(),
        paymentMethod
      });
      await updateDoc(doc(db, 'tables', currentOrder.tableId!), {
        status: 'available',
        currentOrderId: null
      });
      
      // Save to finance
      await addDoc(collection(db, 'finance'), {
        type: 'income',
        amount: currentOrder.total,
        description: `Venda Mesa ${tables.find(t => t.id === currentOrder.tableId)?.number}`,
        date: serverTimestamp(),
        category: 'Vendas'
      });

      toast.success('Venda concluída!');
      navigate('/tables');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders', auth);
    }
  };

  const handleDeleteOrder = async () => {
    if (!currentOrder.id) return;
    if (!confirm('Deseja excluir este pedido?')) return;
    try {
      // In a real app we might soft delete, but here let's just close/delete
       await updateDoc(doc(db, 'tables', currentOrder.tableId!), {
        status: 'available',
        currentOrderId: null
      });
      // We could delete the order doc, but let's just mark it 'cancelled'
       await updateDoc(doc(db, 'orders', currentOrder.id), {
        status: 'cancelled',
        closedAt: serverTimestamp()
      });
      toast.success('Pedido cancelado');
      navigate('/tables');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders', auth);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col sm:flex-row h-screen font-sans">
      {/* Search & Products - Desktop Link, Mobile Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
        <header className="mb-8 flex items-center gap-4 sticky top-0 bg-[#0a0a0a] py-2 z-10">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10">
            <ChevronLeft size={20} />
          </button>
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-card-dark border border-white/10 rounded-[32px] pl-16 pr-8 py-5 focus:outline-none focus:border-gold-500/50 transition-all font-medium text-sm"
            />
          </div>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-20 sm:pb-0">
          {products
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(product => (
              <motion.div
                whileTap={{ scale: 0.95 }}
                key={product.id}
                onClick={() => addToOrder(product)}
                className="bg-card-dark border border-white/5 p-5 rounded-[32px] text-center hover:border-gold-500/20 transition-all cursor-pointer shadow-lg group"
              >
                <div className="w-12 h-12 bg-white/5 rounded-2xl mx-auto flex items-center justify-center mb-4 group-hover:bg-gold-500/10 group-hover:text-gold-500 transition-colors">
                  <Package size={20} />
                </div>
                <h4 className="text-white font-bold text-sm line-clamp-1">{product.name}</h4>
                <p className="text-gold-500 font-black text-xs mt-1">{formatCurrency(product.price)}</p>
                <p className="text-[10px] text-gray-600 font-bold uppercase mt-2">{product.category}</p>
              </motion.div>
            ))}
        </section>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full sm:w-[450px] bg-card-dark border-t sm:border-t-0 sm:border-l border-white/10 flex flex-col h-[70vh] sm:h-screen sticky bottom-0 sm:static sm:z-20 shadow-2xl rounded-t-[40px] sm:rounded-t-none">
        <div className="p-6 sm:p-10 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Comanda</h3>
              <p className="text-[10px] text-gold-500 font-bold uppercase tracking-[0.2em]">
                {tables.find(t => t.id === currentOrder.tableId)?.number ? `Mesa ${tables.find(t => t.id === currentOrder.tableId)?.number}` : 'Mesa não selecionada'}
              </p>
            </div>
            <button 
              onClick={() => setIsCustomerModalOpen(true)}
              className={cn(
                "p-3 rounded-2xl border transition-all flex items-center gap-2",
                currentOrder.customerId ? "bg-gold-500/10 border-gold-500/20 text-gold-500" : "bg-white/5 border-white/5 text-gray-500"
              )}
            >
              <Users size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {currentOrder.customerName || 'Cliente'}
              </span>
            </button>
          </div>

          <div className="space-y-4">
            {currentOrder.items?.map(item => (
              <motion.div 
                layout
                key={item.productId} 
                className="flex items-center gap-4 p-5 bg-white/5 rounded-[28px] border border-white/5"
              >
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">{item.name}</p>
                  <p className="text-xs font-black text-gold-500">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                <div className="flex items-center gap-3 bg-black/30 p-1.5 rounded-2xl">
                  <button onClick={() => removeFromOrder(item.productId)} className="p-2 hover:text-white text-gray-500 transition-colors">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-black text-white w-4 text-center">{item.quantity}</span>
                  <button onClick={() => addToOrder(products.find(p => p.id === item.productId)!)} className="p-2 hover:text-white text-gray-500 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
            {(!currentOrder.items || currentOrder.items.length === 0) && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6 text-gray-700">
                  <Package size={32} />
                </div>
                <p className="text-gray-600 font-bold text-[10px] uppercase tracking-widest leading-loose">Selecione produtos<br/>para adicionar à comanda</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-black/40 border-t border-white/5 rounded-t-[40px] space-y-6">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total Geral</span>
            <span className="text-3xl font-black text-white tracking-tighter">{formatCurrency(currentOrder.total || 0)}</span>
          </div>

          <div className="flex gap-2">
            {currentOrder.id && (
              <button 
                onClick={handleDeleteOrder}
                className="h-9 w-9 sm:h-14 sm:w-14 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-lg sm:rounded-2xl border border-red-500/10 active:scale-95 transition-all flex items-center justify-center"
                title="Excluir Pedido"
              >
                <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
            <button 
              id="btn-save-order"
              onClick={handleSaveOrder}
              className="h-9 sm:h-14 px-1.5 sm:px-5 bg-accent-dark border border-white/10 text-white font-black uppercase tracking-widest text-[7px] sm:text-[9px] rounded-lg sm:rounded-2xl hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1 sm:gap-3"
            >
              <Save size={14} className="text-gold-500 sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Salvar</span>
              <span className="sm:hidden text-[7px]">Salvar</span>
            </button>
            <button 
              id="btn-receive-payment"
              disabled={!currentOrder.id || !currentOrder.items?.length}
              onClick={() => setIsClosingOrder(true)}
              className="h-9 sm:h-14 px-2 sm:px-8 bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:grayscale text-black font-black uppercase tracking-widest text-[7px] sm:text-[9px] rounded-lg sm:rounded-2xl shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center gap-1 sm:gap-2 ring-1 sm:ring-2 ring-green-500/20"
            >
              <CheckCircle2 size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span>Receber</span>
            </button>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      <AnimatePresence>
        {isCustomerModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomerModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-card-dark border border-white/5 rounded-[48px] p-8 overflow-hidden"
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Vincular Cliente</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Selecione um cliente para esta comanda</p>
              </div>

              <div className="relative mb-6">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar cliente..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white focus:outline-none focus:border-gold-500/50 transition-all text-sm font-medium"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar pr-2">
                <button
                  onClick={() => {
                    setCurrentOrder(prev => ({ ...prev, customerId: '', customerName: '' }));
                    setIsCustomerModalOpen(false);
                  }}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-left transition-all group"
                >
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest group-hover:text-white">Nenhum / Balcão</p>
                </button>
                {customers
                  .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()))
                  .map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setCurrentOrder(prev => ({ ...prev, customerId: customer.id, customerName: customer.name }));
                        setIsCustomerModalOpen(false);
                      }}
                      className={cn(
                        "w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between",
                        currentOrder.customerId === customer.id ? "bg-gold-500 text-black" : "bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{customer.name}</p>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", currentOrder.customerId === customer.id ? "text-black/60" : "text-gray-500")}>
                          {customer.phone || 'Sem telefone'}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isClosingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClosingOrder(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-card-dark border border-white/5 rounded-[48px] p-8 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
              
              <div className="text-center mb-8">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-1">Finalização</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Pagamento</h3>
              </div>

              <div className="bg-white/5 rounded-[32px] p-8 text-center mb-8">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total a Receber</p>
                 <p className="text-4xl font-black text-white tracking-tighter">{formatCurrency(currentOrder.total || 0)}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-8">
                 {[
                   { id: 'dinheiro', icon: Banknote, label: 'Dinheiro' },
                   { id: 'cartao', icon: CreditCard, label: 'Cartão' },
                   { id: 'pix', icon: Plus, label: 'Pix' } // Use Plus for Pix or a better icon if available
                 ].map(method => (
                   <button
                     key={method.id}
                     onClick={() => setPaymentMethod(method.id as any)}
                     className={cn(
                       "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all",
                       paymentMethod === method.id 
                         ? "bg-green-500 border-green-500 text-black shadow-lg shadow-green-500/20" 
                         : "bg-white/5 border-white/5 text-gray-500"
                     )}
                   >
                     {/* @ts-ignore */}
                     <method.icon size={20} />
                     <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                   </button>
                 ))}
              </div>

              <div className="space-y-3">
                 <button 
                   onClick={handleCloseOrder}
                   className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                 >
                   <CheckCircle2 size={18} />
                   Confirmar Recebimento
                 </button>
                 <button 
                   onClick={() => setIsClosingOrder(false)}
                   className="w-full bg-white/5 text-gray-500 font-black py-5 rounded-2xl hover:text-white transition-all uppercase tracking-widest text-xs"
                 >
                   Cancelar
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
