import { useState, useEffect } from 'react';
import { 
  Plus, 
  Package, 
  Save, 
  X, 
  Search,
  Edit2,
  Trash2
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
import { Product } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: 'Bebidas'
  });

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products', auth));
    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    try {
      const data = {
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category: formData.category
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), data);
        toast.success('Produto atualizado');
      } else {
        await addDoc(collection(db, 'products'), data);
        toast.success('Produto cadastrado');
      }
      
      setFormData({ name: '', price: '', stock: '', category: 'Bebidas' });
      setEditingProduct(null);
      setIsModalOpen(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'products', auth);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este produto?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Produto excluído');
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, 'products', auth);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="p-6 bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Produtos</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Gestão de estoque</p>
          </div>
          <button 
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: '', price: '', stock: '', category: 'Bebidas' });
              setIsModalOpen(true);
            }}
            className="p-4 bg-gold-500 rounded-[24px] text-black shadow-xl shadow-gold-500/20 active:scale-95 transition-all"
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
            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-16 pr-8 py-4 focus:outline-none focus:border-gold-500/50 transition-all font-medium text-sm"
          />
        </div>
      </header>

      <main className="p-6 space-y-4">
        {products
          .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map((product) => (
            <motion.div
              layout
              key={product.id}
              className="bg-card-dark border border-white/5 rounded-[32px] p-6 flex items-center gap-6 group hover:border-gold-500/20 transition-all"
            >
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:bg-gold-500/10 group-hover:text-gold-500 transition-colors">
                <Package size={24} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                   <h4 className="font-bold text-white tracking-tight">{product.name}</h4>
                   <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">{product.category}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                   <span className="text-gold-500">{formatCurrency(product.price)}</span>
                   <span>Stock: {product.stock} un</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(product)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-2.5 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
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
                    {editingProduct ? 'Editar' : 'Novo'} Produto
                  </h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Detalhes do estoque</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Nome do Produto</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-bold"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Estoque</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/5 text-white px-6 py-4 rounded-2xl focus:outline-none focus:border-gold-500 transition-all font-bold appearance-none cursor-pointer"
                  >
                    <option value="Bebidas" className="bg-card-dark text-white">Bebidas</option>
                    <option value="Porções" className="bg-card-dark text-white">Porções</option>
                    <option value="Cigarros" className="bg-card-dark text-white">Cigarros</option>
                    <option value="Outros" className="bg-card-dark text-white">Outros</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-gold-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-6"
                >
                  <Save size={18} />
                  <span>Salvar Produto</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
