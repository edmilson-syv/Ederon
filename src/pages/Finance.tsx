import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  Save,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { FinanceRecord } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Finance() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: 'Geral'
  });

  useEffect(() => {
    const q = query(collection(db, 'finance'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecords(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as FinanceRecord[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'finance', auth));
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    try {
      await addDoc(collection(db, 'finance'), {
        ...formData,
        amount: parseFloat(formData.amount),
        date: serverTimestamp()
      });
      toast.success('Lançamento registrado');
      setFormData({ type: 'expense', amount: '', description: '', category: 'Geral' });
      setIsModalOpen(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'finance', auth);
    }
  };

  const totalIncome = records.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="p-6 bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Financeiro</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Controle de caixa</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-4 bg-white text-black rounded-[24px] shadow-xl active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Entradas</p>
              <p className="text-xs font-black text-green-500">{formatCurrency(totalIncome)}</p>
           </div>
           <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Saídas</p>
              <p className="text-xs font-black text-red-500">{formatCurrency(totalExpense)}</p>
           </div>
           <div className={cn(
             "p-4 rounded-2xl border",
             balance >= 0 ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
           )}>
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Saldo</p>
              <p className={cn("text-xs font-black", balance >= 0 ? "text-green-500" : "text-red-500")}>
                {formatCurrency(balance)}
              </p>
           </div>
        </div>
      </header>

      <main className="p-6 space-y-4">
        {records.map((record) => (
          <div key={record.id} className="bg-card-dark border border-white/5 rounded-3xl p-5 flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              record.type === 'income' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
            )}>
              {record.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{record.description}</p>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{record.category}</p>
            </div>
            <p className={cn("font-black text-sm", record.type === 'income' ? "text-green-500" : "text-red-500")}>
              {record.type === 'income' ? '+' : '-'}{formatCurrency(record.amount)}
            </p>
          </div>
        ))}
      </main>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-card-dark border border-white/5 rounded-[48px] p-8 mt-[-10vh]"
            >
              <div className="text-center mb-8">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Novo Lançamento</h3>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Movimentação financeira</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-white/5 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      formData.type === 'income' ? "bg-green-500 text-black" : "text-gray-500"
                    )}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      formData.type === 'expense' ? "bg-red-500 text-black" : "text-gray-500"
                    )}
                  >
                    Saída
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-white transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Descrição</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-white transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none transition-all font-bold appearance-none"
                  >
                    <option value="Geral">Geral</option>
                    <option value="Fornecedores">Fornecedores</option>
                    <option value="Vendas">Vendas</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-6"
                >
                  <Save size={18} />
                  Confirmar
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
