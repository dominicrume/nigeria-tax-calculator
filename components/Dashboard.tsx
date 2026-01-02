import React, { useState } from 'react';
import { Transaction, TransactionType, TaxBreakdown } from '../types';
import { Download, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, Search, FileText } from 'lucide-react';
import { calculateNigerianPIT } from '../services/geminiService';

interface DashboardProps {
  transactions: Transaction[];
}

const Dashboard: React.FC<DashboardProps> = ({ transactions }) => {
  const [currencyFormatter] = useState(new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }));
  const [searchTerm, setSearchTerm] = useState('');

  const totalCredit = transactions
    .filter(t => t.type === TransactionType.CREDIT)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebit = transactions
    .filter(t => t.type === TransactionType.DEBIT)
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate Tax using Nigerian Logic
  const taxData: TaxBreakdown = calculateNigerianPIT(totalCredit);

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.amount.toString().includes(searchTerm)
  );

  const handleExportCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Amount (NGN)'];
    const rows = transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.amount.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'nairasync_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)]">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Inflow</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{currencyFormatter.format(totalCredit)}</h3>
            <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" />
              100%
            </span>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)]">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Expenses</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{currencyFormatter.format(totalDebit)}</h3>
            <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3 mr-1" />
              {(totalCredit > 0 ? (totalDebit/totalCredit)*100 : 0).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200">
          <p className="text-sm font-medium text-slate-400 mb-1">Tax Liability (Est.)</p>
          <h3 className="text-2xl font-bold">{currencyFormatter.format(taxData.totalTax)}</h3>
          <p className="text-xs text-slate-400 mt-2">
            Effective Rate: <span className="text-emerald-400">{taxData.effectiveRate.toFixed(1)}%</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tax Breakdown Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Tax Computation
            </h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between pb-3 border-b border-slate-50">
                <span className="text-slate-500">Gross Income</span>
                <span className="font-medium text-slate-900">{currencyFormatter.format(taxData.grossIncome)}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-50">
                <span className="text-slate-500">Consolidated Relief</span>
                <span className="font-medium text-emerald-600">-{currencyFormatter.format(taxData.consolidatedRelief)}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-50">
                <span className="text-slate-500">Taxable Income</span>
                <span className="font-medium text-slate-900">{currencyFormatter.format(taxData.taxableIncome)}</span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="font-semibold text-slate-700">Total Tax Payable</span>
                <span className="font-bold text-lg text-slate-900">{currencyFormatter.format(taxData.totalTax)}</span>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-xl text-xs text-blue-700 leading-relaxed">
              <strong>Note:</strong> Calculation applies the Nigerian Personal Income Tax Act (PITA) graduated scale on taxable income after standard reliefs.
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between gap-4">
              <h3 className="font-semibold text-slate-900">Transactions</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none w-full sm:w-48 transition-all"
                  />
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Export CSV"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 z-10 text-xs uppercase text-slate-400 font-medium">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map((t, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-mono text-xs">{t.date}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{t.description}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{t.type}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1 font-mono font-medium
                          ${t.type === TransactionType.CREDIT ? 'text-emerald-600' : 'text-slate-900'}
                        `}>
                          {t.type === TransactionType.CREDIT ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 text-slate-400" />}
                          {currencyFormatter.format(t.amount)}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                        No transactions found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
