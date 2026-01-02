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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-slate-900 selection:text-white">
      
      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}

      {/* Navbar */}
      <header className="fixed w-full bg-white/80 backdrop-blur-xl border-b border-slate-200 z-40 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-900/20 transition-transform group-hover:scale-95 group-hover:bg-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                  NairaSync
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                  AI Tax Engine
                </span>
              </div>
            </div>
            
            <nav className="flex items-center gap-2">
              <button 
                onClick={() => setShowOnboarding(true)}
                className="text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 px-4 py-2 rounded-full hover:bg-slate-100 transition-all"
              >
                Docs
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 mt-10">
        
        {view === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
            <div className="space-y-6 max-w-2xl mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Nigerian Tax Law Compliant
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tighter leading-[1.05]">
                Tax clarity,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-slate-800 to-slate-500">
                  instantly.
                </span>
              </h1>
              
              <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed font-medium">
                Drag and drop your bank statement to calculate PIT liability using real-time OCR.
              </p>
            </div>

            <FileUpload onFileProcess={handleFileProcess} isProcessing={isProcessing} />
          </div>
        )}

        {view === 'dashboard' && (
          <div className="animate-fade-in space-y-8 mt-6">
             <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Overview</h2>
                  <p className="text-slate-500 font-medium mt-1">Consolidated report & tax breakdown</p>
                </div>
                <button 
                  onClick={handleReset}
                  className="text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-white hover:bg-slate-900 border border-slate-200 hover:border-slate-900 px-6 py-2.5 rounded-lg transition-all duration-300"
                >
                  New Scan
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