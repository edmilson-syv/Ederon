import { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Save, 
  X, 
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { Customer } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'customers', auth));
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const data = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        totalSpent: editingCustomer?.totalSpent || 0
      };

      if (editingCustomer) {
        await updateDoc(doc(db, 'customers', editingCustomer.id), data);
        toast.success('Cliente atualizado');
      } else {
        await addDoc(collection(db, 'customers'), data);
        toast.success('Cliente cadastrado');
      }
      
      setFormData({ name: '', phone: '', email: '' });
      setEditingCustomer(null);
      setIsModalOpen(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'customers', auth);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este cliente?')) return;
    try {
      await deleteDoc(doc(db, 'customers', id));
      toast.success('Cliente excluído');
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, 'customers', auth);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="p-6 bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Clientes</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Fidelidade e contato</p>
          </div>
          <button 
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: '', phone: '', email: '' });
              setIsModalOpen(true);
            }}
            className="p-4 bg-blue-500 rounded-[24px] text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-8 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm"
          />
        </div>
      </header>

      <main className="p-6 space-y-4">
        {customers
          .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((customer) => (
            <motion.div
              layout
              key={customer.id}
              className="bg-card-dark border border-white/5 rounded-[32px] p-6 flex flex-col gap-4 group hover:border-blue-500/20 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                  <Users size={20} />
                </div>
                <div className="flex-1">
                   <h4 className="font-bold text-white tracking-tight">{customer.name}</h4>
                   <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-1">Total Gasto: {formatCurrency(customer.totalSpent)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEdit(customer)}
                    className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="p-2.5 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                 {customer.phone && (
                   <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                     <Phone size={10} /> {customer.phone}
                   </div>
                 )}
                 {customer.email && (
                   <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                     <Mail size={10} /> {customer.email}
                   </div>
                 )}
              </div>
            </motion.div>
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
              <div className="flex justify-between items-center text-center w-full">
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {editingCustomer ? 'Editar' : 'Novo'} Cliente
                  </h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Perfil do cliente</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Nome Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Telefone</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-6"
                >
                  <Save size={18} />
                  <span>Salvar Cliente</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
