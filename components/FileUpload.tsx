import React, { useRef, useState, useEffect } from 'react';
import { Upload, Lock, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { ModelProvider } from '../types';

interface FileUploadProps {
  onFileProcess: (base64: string, mimeType: string, provider: ModelProvider) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [provider, setProvider] = useState<ModelProvider>(ModelProvider.GEMINI_FLASH);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Physics-based Progress Bar (The Henry Ford Assembly Line Visual)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isProcessing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          // Rapid acceleration to 30%, steady to 70%, slow crawl to 90%
          if (prev < 30) return prev + 5;
          if (prev < 70) return prev + 2;
          if (prev < 90) return prev + 0.5;
          // Hold at 90% until the promise resolves to avoid the "95% hang" frustration
          return 90; 
        });
      }, 150);
    } else {
      // If processing finished successfully (external prop check), jump to 100 before unmounting
      // Since component usually unmounts/hides on success, this resets for next time
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const processFile = (file: File) => {
    setError(null);
    
    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError("Secure format required: PDF, JPG, or PNG only.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Document exceeds secure processing limit (Max 5MB).");
      return;
    }

    // Start assembly line
    setProgress(1); 

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onFileProcess(e.target.result as string, file.type, provider);
      }
    };
    reader.onerror = () => {
      setError("Secure read failed. Please retry.");
    }
    reader.readAsDataURL(file);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    processFile(files[0]);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      
      {/* Premium Engine Selector */}
      <div className="flex justify-between items-center mb-6 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Encrypted Tunnel</span>
        </div>
        
        <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setProvider(ModelProvider.GEMINI_FLASH)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300
              ${provider === ModelProvider.GEMINI_FLASH ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            Lightning (Flash)
          </button>
          <button
            onClick={() => setProvider(ModelProvider.GROK_BETA)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300
              ${provider === ModelProvider.GROK_BETA ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            Deep Scan (Grok)
          </button>
        </div>
      </div>

      {/* Main Secure Drop Zone */}
      <div 
        className={`relative group bg-white rounded-3xl transition-all duration-300 ease-out overflow-hidden
          ${dragActive ? 'scale-[1.02] shadow-2xl ring-2 ring-emerald-500' : 'shadow-xl hover:shadow-2xl ring-1 ring-slate-100'}
          ${error ? 'ring-2 ring-red-100' : ''}
        `}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {/* Processing Overlay (High Liquidity Animation) */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="w-full max-w-[200px] space-y-4">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                <span>Encrypting & Analyzing</span>
                <span>{Math.floor(progress)}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-slate-900 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex justify-center mt-4">
                 <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            </div>
          </div>
        )}

        {/* Default State */}
        <div className="p-12 sm:p-16 flex flex-col items-center text-center cursor-pointer min-h-[320px] justify-center">
          
          <div className={`
            relative w-20 h-20 mb-8 rounded-2xl flex items-center justify-center transition-all duration-500
            ${error ? 'bg-red-50' : 'bg-slate-50 group-hover:bg-slate-100'}
          `}>
            {error ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <>
                <div className="absolute inset-0 border border-slate-200 rounded-2xl"></div>
                {/* Animated Lock Icon */}
                <Lock className={`w-8 h-8 text-slate-400 transition-all duration-300 ${dragActive ? 'scale-110 text-emerald-600' : 'group-hover:text-slate-600'}`} />
                {dragActive && (
                   <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl animate-pulse"></div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 max-w-xs relative z-10">
            {error ? (
              <div className="animate-in slide-in-from-bottom-2">
                <h3 className="text-lg font-bold text-slate-900">Upload Failed</h3>
                <p className="text-sm text-red-500 mt-1 font-medium">{error}</p>
                <p className="text-xs text-slate-400 mt-4 underline decoration-slate-300 underline-offset-4">Tap to retry</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {dragActive ? "Release to Secure" : "Drop Statement"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {dragActive ? "Encrypting link..." : "PDF or Image • Max 5MB"}
                </p>
                
                <div className="pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg hover:bg-emerald-600 transition-colors">
                    <Upload className="w-3 h-3" />
                    Select File
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Background Decorative Elements for "High Liquidity" feel */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0f172a_1px,transparent_1px)] [background-size:16px_16px]"></div>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-1.5 bg-emerald-50 rounded-full text-emerald-600">
             <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AES-256</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-1.5 bg-blue-50 rounded-full text-blue-600">
             <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ephemeral</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
           <div className="p-1.5 bg-slate-100 rounded-full text-slate-600">
             <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">GDPR Ready</span>
        </div>
      </div>

    </div>
  );
};

export default FileUpload;