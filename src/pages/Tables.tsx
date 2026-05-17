import { useState, useEffect } from 'react';
import { 
  Plus, 
  Table2, 
  Save, 
  X, 
  ChevronRight,
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
import { cn, handleFirestoreError, OperationType } from '../lib/utils';
import { Table } from '../types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tables() {
  const [tables, setTables] = useState<Table[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'tables'), orderBy('number'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Table[];
      setTables(tablesList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tables', auth);
    });
    return unsubscribe;
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;
    const path = 'tables';
    try {
      if (editingTable) {
        await updateDoc(doc(db, 'tables', editingTable.id), {
          number: newTableNumber
        });
        toast.success('Mesa atualizada');
      } else {
        await addDoc(collection(db, 'tables'), {
          number: newTableNumber,
          status: 'available'
        });
        toast.success('Mesa cadastrada');
      }
      setNewTableNumber('');
      setEditingTable(null);
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path, auth);
    }
  };

  const handleEditTable = (e: React.MouseEvent, table: Table) => {
    e.stopPropagation();
    setEditingTable(table);
    setNewTableNumber(table.number);
    setIsModalOpen(true);
  };

  const handleDeleteTable = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const table = tables.find(t => t.id === id);
    if (!table) return;
    
    if (table.status === 'occupied') {
      toast.error('Não é possível excluir uma mesa ocupada');
      return;
    }
    
    if (!confirm(`Excluir Mesa ${table.number}?`)) return;

    const deletePromise = async () => {
      try {
        await deleteDoc(doc(db, 'tables', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'tables', auth);
        throw error;
      }
    };

    toast.promise(deletePromise(), {
      loading: 'Excluindo mesa...',
      success: 'Mesa excluída',
      error: 'Erro ao excluir mesa'
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      <header className="p-6 bg-card-dark/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Mesas</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Gestão de atendimento</p>
          </div>
          <button 
            onClick={() => {
               setEditingTable(null);
               setNewTableNumber('');
               setIsModalOpen(true);
            }}
            className="p-4 bg-gold-500 rounded-[24px] text-black shadow-xl shadow-gold-500/20 active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <main className="p-6 grid grid-cols-2 gap-4">
        {tables.map((table) => {
          const isOccupied = table.status === 'occupied';
          return (
            <motion.div
              layout
              key={table.id}
              onClick={() => navigate(`/orders?tableId=${table.id}`)}
              className={cn(
                "relative bg-card-dark border rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 transition-all active:scale-95 cursor-pointer shadow-lg overflow-hidden group",
                isOccupied ? "border-red-500/20 shadow-red-500/5 ring-1 ring-red-500/10" : "border-white/5"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-500",
                isOccupied ? "bg-red-500 text-white shadow-xl shadow-red-500/20" : "bg-white/5 text-gray-400 group-hover:bg-white/10"
              )}>
                <Table2 size={32} />
              </div>
              
              <div className="text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1 block">Mesa</span>
                <p className="text-3xl font-black text-white tracking-tighter">{table.number}</p>
              </div>

              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                <button 
                  onClick={(e) => handleEditTable(e, table)}
                  className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl sm:rounded-2xl transition-all"
                  title="Editar Mesa"
                >
                  <Edit2 size={14} className="sm:w-4 sm:h-4" />
                </button>
                {!isOccupied && (
                  <button 
                    onClick={(e) => handleDeleteTable(e, table.id)}
                    className="p-2 sm:p-3 bg-red-500/5 hover:bg-red-500 hover:text-white text-red-500 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-red-500/10"
                    title="Excluir Mesa"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </main>

      {/* Modal */}
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
                    {editingTable ? 'Editar Mesa' : 'Nova Mesa'}
                  </h3>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">Identificação no salão</p>
                </div>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTable(null);
                    setNewTableNumber('');
                  }} 
                  className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-all font-black text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTable} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest block ml-4">Número da Mesa</label>
                  <input
                    autoFocus
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="Ex: 01"
                    className="w-full bg-white/5 border border-white/5 text-white p-6 rounded-3xl focus:outline-none focus:border-gold-500 transition-all text-center text-2xl font-black"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 text-black font-black py-4 rounded-2xl shadow-xl shadow-gold-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-4"
                >
                  <Save size={18} />
                  <span>{editingTable ? 'Salvar' : 'Cadastrar'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
