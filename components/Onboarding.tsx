import React, { useState } from 'react';
import { Shield, ScanLine, Calculator, ChevronRight, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <ScanLine className="w-12 h-12 text-emerald-700" />,
      title: "Upload Statement",
      desc: "Securely upload your bank statement. We now support institutional-grade files up to 500MB and 500+ pages."
    },
    {
      icon: <Calculator className="w-12 h-12 text-blue-600" />,
      title: "Fiscal Analysis",
      desc: "Our engine accurately extracts transaction data and computes liability based on the latest Finance Act & PITA regulations."
    },
    {
      icon: <Shield className="w-12 h-12 text-emerald-900" />,
      title: "Data Sovereignty",
      desc: "Your financial data is processed in a secure, ephemeral environment. We ensure strict NDPR compliance and zero data retention."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-950/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in border border-emerald-100">
        <div className="p-1 bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-500"></div>
        
        <div className="p-8">
          <div className="flex justify-end">
            <button onClick={onComplete} className="text-slate-400 hover:text-emerald-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center mt-2">
            <div className="mb-6 p-4 bg-emerald-50 rounded-2xl">
              {steps[step].icon}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{steps[step].title}</h2>
            <p className="text-slate-500 leading-relaxed font-medium">
              {steps[step].desc}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-emerald-700' : 'w-2 bg-slate-200'}`} 
                />
              ))}
            </div>

            <button 
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else onComplete();
              }}
              className="flex items-center gap-2 bg-emerald-900 text-white px-6 py-2.5 rounded-lg hover:bg-emerald-800 transition-colors font-bold text-xs uppercase tracking-wider"
            >
              {step === steps.length - 1 ? "Enter Portal" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;