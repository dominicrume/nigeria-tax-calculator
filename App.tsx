import React, { useState, useCallback, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { extractTransactionsFromDocument } from './services/geminiService';
import { Transaction, ModelProvider } from './types';

function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState<'upload' | 'dashboard'>('upload');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCompleteOnboarding = () => {
    localStorage.setItem('hasOnboarded', 'true');
    setShowOnboarding(false);
  };

  const handleFileProcess = useCallback(async (base64Data: string, mimeType: string, provider: ModelProvider) => {
    setIsProcessing(true);
    try {
      const extractedData = await extractTransactionsFromDocument(base64Data, mimeType, provider);
      setTransactions(extractedData);
      setView('dashboard');
    } catch (error: any) {
      alert(error.message || "Error processing statement. Please try a clearer document.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleReset = () => {
    setTransactions([]);
    setView('upload');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 relative overflow-hidden">
      
      {/* Background Guilloche Pattern - Subtle Federal Feel */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-100/40 blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-50/60 blur-3xl"></div>
      </div>

      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}

      {/* Navbar - Federal/Institutional Style */}
      <header className="fixed w-full bg-white/90 backdrop-blur-xl border-b border-emerald-900/10 z-40 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
              <div className="w-10 h-10 bg-emerald-800 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-900/10 transition-transform group-hover:scale-95 group-hover:bg-emerald-900">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 leading-none font-display">
                  NairaSync
                </span>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.2em] mt-0.5">
                  Federal Tax Engine
                </span>
              </div>
            </div>
            
            <nav className="flex items-center gap-2">
              <button 
                onClick={() => setShowOnboarding(true)}
                className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-800 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-all"
              >
                Guide
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-10 relative z-10">
        
        {view === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
            <div className="space-y-6 max-w-3xl mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-emerald-800 text-[10px] font-extrabold uppercase tracking-widest mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                Tax Compliance System
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight leading-[1.05]">
                Powering Nigeria's<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-800 to-emerald-500">
                  Digital Economy.
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
                The standard for auditing Nigerian bank statements. Calculate Personal Income Tax (PIT) and analyze cash flow with federal-grade precision.
              </p>
            </div>

            <FileUpload onFileProcess={handleFileProcess} isProcessing={isProcessing} />
          </div>
        )}

        {view === 'dashboard' && (
          <div className="animate-fade-in space-y-8 mt-6">
             <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-emerald-900/10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Report</h2>
                  <p className="text-slate-500 font-medium mt-1">Consolidated fiscal breakdown & tax liability</p>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-xs font-bold uppercase tracking-wider text-emerald-800 hover:text-white hover:bg-emerald-800 border border-emerald-200 hover:border-emerald-800 px-6 py-2.5 rounded-lg transition-all duration-300"
                >
                  New Audit
                </button>
             </div>
             <Dashboard transactions={transactions} />
          </div>
        )}

      </main>
    </div>
  );
}

export default App;