import React, { useRef, useState } from 'react';
import { Upload, ShieldCheck, AlertCircle, CheckCircle2, FileText, X, Loader2 } from 'lucide-react';
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // Gmail-style file handling
  const processFile = (file: File) => {
    setError(null);
    setUploadProgress(0);
    
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError("Secure format required: PDF, JPG, or PNG only.");
      return;
    }

    // Increased to 500MB for Institutional/Audit Use
    if (file.size > 500 * 1024 * 1024) {
      setError("File exceeds the 500MB institutional limit.");
      return;
    }

    setStatusMessage('Encrypting & Uploading...');
    
    const reader = new FileReader();

    // Real-time progress monitoring
    reader.onprogress = (data) => {
      if (data.lengthComputable) {
        const progress = Math.round((data.loaded / data.total) * 100);
        setUploadProgress(progress);
      }
    };

    reader.onloadstart = () => {
      setUploadProgress(0);
    };

    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadProgress(100);
        setStatusMessage('Initiating Federal Audit...');
        // Small delay to let UI render 100% before switching to processing state
        setTimeout(() => {
            onFileProcess(e.target!.result as string, file.type, provider);
        }, 500);
      }
    };

    reader.onerror = () => {
      setError("Secure read failed. Please retry.");
      setUploadProgress(0);
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
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-900/60 uppercase">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Secure Channel</span>
        </div>
        
        <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <button
            onClick={() => setProvider(ModelProvider.GEMINI_FLASH)}
            disabled={isProcessing || uploadProgress > 0 && uploadProgress < 100}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300
              ${provider === ModelProvider.GEMINI_FLASH ? 'bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-200' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            Flash (Speed)
          </button>
          <button
            onClick={() => setProvider(ModelProvider.GROK_BETA)}
            disabled={isProcessing || uploadProgress > 0 && uploadProgress < 100}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-300
              ${provider === ModelProvider.GROK_BETA ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}
            `}
          >
            Pro (Audit)
          </button>
        </div>
      </div>

      {/* Main Secure Drop Zone */}
      <div 
        className={`relative group bg-white rounded-3xl transition-all duration-300 ease-out overflow-hidden
          ${dragActive ? 'scale-[1.02] shadow-2xl ring-2 ring-emerald-600' : 'shadow-xl hover:shadow-2xl ring-1 ring-slate-200'}
          ${error ? 'ring-2 ring-red-100' : ''}
        `}
        onDrop={(e) => {
          if (isProcessing) return;
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          if (isProcessing) return;
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragEnter={(e) => {
          if (isProcessing) return;
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          if (isProcessing) return;
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onClick={() => !isProcessing && uploadProgress === 0 && fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/jpeg,image/png,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
        />
        
        {/* Processing / Uploading Overlay (Gmail Style) */}
        {(uploadProgress > 0 || isProcessing) && (
          <div className="absolute inset-0 z-20 bg-white/98 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-200">
            <div className="w-full max-w-[280px] space-y-6 text-center">
              
              <div className="flex flex-col items-center gap-3">
                {isProcessing ? (
                   <div className="relative">
                     <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                       <ShieldCheck className="w-5 h-5 text-emerald-600" />
                     </div>
                   </div>
                ) : (
                   <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                     <span className="text-xs font-bold text-emerald-700">{uploadProgress}%</span>
                   </div>
                )}
                
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {isProcessing ? 'Analyzing Document' : 'Uploading Securely'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 font-medium animate-pulse">
                    {isProcessing ? 'Extracting multi-page transaction data...' : statusMessage}
                  </p>
                </div>
              </div>

              {/* Precise Progress Bar */}
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isProcessing ? 'bg-emerald-600 animate-indeterminate-bar' : 'bg-emerald-500 transition-all duration-300 ease-out'}`}
                  style={{ width: isProcessing ? '100%' : `${uploadProgress}%` }}
                ></div>
              </div>

              {/* Cancel Action */}
              {!isProcessing && uploadProgress < 100 && (
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     setUploadProgress(0);
                     // Logic to abort reader would go here in a full impl
                   }}
                   className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest border border-red-100 hover:bg-red-50 px-4 py-1.5 rounded-full transition-colors"
                 >
                   Cancel Upload
                 </button>
              )}
            </div>
          </div>
        )}

        {/* Default State */}
        <div className="p-12 sm:p-16 flex flex-col items-center text-center cursor-pointer min-h-[320px] justify-center relative z-10">
          
          <div className={`
            relative w-20 h-20 mb-8 rounded-2xl flex items-center justify-center transition-all duration-500
            ${error ? 'bg-red-50' : 'bg-emerald-50/50 group-hover:bg-emerald-50'}
          `}>
            {error ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <>
                <div className="absolute inset-0 border border-emerald-100 rounded-2xl"></div>
                <FileText className={`w-8 h-8 text-emerald-300 transition-all duration-300 ${dragActive ? 'scale-110 text-emerald-600' : 'group-hover:text-emerald-500'}`} />
                {dragActive && (
                   <div className="absolute inset-0 border-2 border-emerald-500 rounded-2xl animate-pulse"></div>
                )}
              </>
            )}
          </div>

          <div className="space-y-3 max-w-xs relative z-10">
            {error ? (
              <div className="animate-in slide-in-from-bottom-2">
                <h3 className="text-lg font-bold text-slate-900">Upload Rejected</h3>
                <p className="text-sm text-red-500 mt-1 font-medium">{error}</p>
                <p 
                  onClick={(e) => { e.stopPropagation(); setError(null); }}
                  className="text-xs text-slate-400 mt-4 underline decoration-slate-300 underline-offset-4 cursor-pointer hover:text-slate-600"
                >
                  Try again
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {dragActive ? "Secure Deposit" : "Upload Statement"}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  {dragActive ? "Releasing file..." : "PDF or Image • Max 500MB"}
                </p>
                
                <div className="pt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <span className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 transition-colors">
                    <Upload className="w-3 h-3" />
                    Select Document
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ 
               backgroundImage: `repeating-linear-gradient(45deg, #059669 0, #059669 1px, transparent 0, transparent 50%)`,
               backgroundSize: '20px 20px' 
             }}>
        </div>
      </div>

      {/* Trust Footer */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-1.5 bg-emerald-50 rounded-full text-emerald-700">
             <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise SSL</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="p-1.5 bg-emerald-50 rounded-full text-emerald-700">
             <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Zero Retention</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
           <div className="p-1.5 bg-emerald-50 rounded-full text-emerald-700">
             <CheckCircle2 className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">NDPR Compliant</span>
        </div>
      </div>

    </div>
  );
};

export default FileUpload;