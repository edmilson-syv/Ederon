import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Bem-vindo!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao fazer login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md bg-card-dark border border-white/5 rounded-[40px] p-8 text-center shadow-2xl">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gold-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-gold-500/20 mb-6 group-hover:scale-110 transition-transform">
            <LogIn size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Ederon</h1>
          <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Distribuidora & Gestão</p>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full h-16 bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-widest text-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          <span>Entrar com Google</span>
        </button>
        
        <p className="mt-8 text-gray-600 text-[10px] font-medium uppercase tracking-widest">
          Acesse para gerenciar seu negócio
        </p>
      </div>
    </div>
  );
}
