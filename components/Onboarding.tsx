import React, { useState } from 'react';
import { Shield, ScanLine, Calculator, ChevronRight, X } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <ScanLine className="w-12 h-12 text-emerald-600" />,
      title: "Upload Statement",
      desc: "Upload your bank statement. We accept PDF, JPG, and PNG formats (max 10MB)."
    },
    {
      icon: <Calculator className="w-12 h-12 text-blue-600" />,
      title: "AI Analysis",
      desc: "Our engine (Gemini or Grok) extracts transactions and applies Nigerian Tax Law (CRA & Tax Bands) to calculate your liability."
    },
    {
      icon: <Shield className="w-12 h-12 text-purple-600" />,
      title: "Bank-Grade Privacy",
      desc: "Your financial data is processed in ephemeral memory. We do not store your bank statements or personal details."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        <div className="p-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>
        
        <div className="p-8">
          <div className="flex justify-end">
            <button onClick={onComplete} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center mt-2">
            <div className="mb-6 p-4 bg-slate-50 rounded-full">
              {steps[step].icon}
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{steps[step].title}</h2>
            <p className="text-slate-500 leading-relaxed">
              {steps[step].desc}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-emerald-600' : 'w-2 bg-slate-200'}`} 
                />
              ))}
            </div>

            <button 
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else onComplete();
              }}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm"
            >
              {step === steps.length - 1 ? "Get Started" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;