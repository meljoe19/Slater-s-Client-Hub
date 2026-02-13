
import React, { useState } from 'react';
import { Client } from '../types';
import { getGeminiGeocode, parseClientList } from '../services/geminiService';

interface SidebarProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onAddMultipleClients: (clients: Client[]) => void;
  onSelectClient: (client: Client) => void;
  onRestoreDefaults: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ clients, onAddClient, onAddMultipleClients, onSelectClient, onRestoreDefaults }) => {
  const [mode, setMode] = useState<'single' | 'bulk' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    industry: 'Christian School',
    revenue: ''
  });

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const geocode = await getGeminiGeocode(formData.address);
    if (geocode) {
      const newClient: Client = {
        id: Date.now().toString(),
        name: formData.name,
        address: geocode.formattedAddress,
        industry: formData.industry,
        revenue: parseFloat(formData.revenue) || 0,
        latitude: geocode.latitude,
        longitude: geocode.longitude
      };
      onAddClient(newClient);
      setMode('none');
      setFormData({ name: '', address: '', industry: 'Christian School', revenue: '' });
    } else {
      alert("Could not find location.");
    }
    setLoading(false);
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    setProgress('AI is identifying schools and services...');
    
    const parsed = await parseClientList(bulkText);
    if (parsed.length === 0) {
      alert("AI couldn't find any entries. Try: 'School Name: Address'");
      setLoading(false);
      return;
    }

    const newClients: Client[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const p = parsed[i];
      setProgress(`Locating ${i + 1}/${parsed.length}: ${p.name}...`);
      const geocode = await getGeminiGeocode(p.address);
      if (geocode) {
        newClients.push({
          id: `${Date.now()}-${i}`,
          name: p.name,
          address: geocode.formattedAddress,
          industry: p.industry,
          revenue: 0,
          latitude: geocode.latitude,
          longitude: geocode.longitude
        });
      }
    }

    if (newClients.length > 0) {
      onAddMultipleClients(newClients);
      setMode('none');
      setBulkText('');
    } else {
      alert("Failed to geocode any addresses from the list.");
    }
    
    setLoading(false);
    setProgress('');
  };

  return (
    <div className="w-96 flex-shrink-0 bg-[#0a192f] border-r border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl z-20">
      <div className="p-6 border-b border-slate-800 bg-[#112240]/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
            Entry Hub
          </h2>
          <div className="flex gap-2">
             <button 
              onClick={onRestoreDefaults}
              title="Restore Demo Data"
              className="p-2.5 rounded-xl transition-all bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M3 21v-5h5"></path></svg>
            </button>
             <button 
              onClick={() => setMode(mode === 'single' ? 'none' : 'single')}
              title="Add Single Entry"
              className={`p-2.5 rounded-xl transition-all ${mode === 'single' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button 
              onClick={() => setMode(mode === 'bulk' ? 'none' : 'bulk')}
              title="Bulk Import with AI"
              className={`p-2.5 rounded-xl transition-all ${mode === 'bulk' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
            </button>
          </div>
        </div>

        {mode === 'single' && (
          <form onSubmit={handleSubmitSingle} className="space-y-4 bg-[#112240] p-5 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <input
              required
              className="w-full px-4 py-2.5 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder-slate-500 transition-all"
              placeholder="Institution Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input
              required
              className="w-full px-4 py-2.5 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder-slate-500 transition-all"
              placeholder="Street Address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            <div className="flex gap-2">
              <select className="flex-1 px-4 py-2.5 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all cursor-pointer" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})}>
                <option className="bg-[#112240]">Christian School</option>
                <option className="bg-[#112240]">Public School</option>
                <option className="bg-[#112240]">Catholic School</option>
                <option className="bg-[#112240]">Charter</option>
                <option className="bg-[#112240]">Roofing</option>
              </select>
            </div>
            <button disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
              {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Add to Strategy"}
            </button>
          </form>
        )}

        {mode === 'bulk' && (
          <div className="space-y-4 bg-[#112240] p-5 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] mb-1">Bulk Strategy Input</p>
            <textarea
              className="w-full h-32 px-4 py-3 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono placeholder-slate-600 transition-all"
              placeholder="St. Mary's: 123 Church Rd&#10;Lincoln High: 456 Education Ln"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            {progress && <p className="text-[10px] text-amber-500 font-bold animate-pulse tracking-wide">{progress}</p>}
            <button 
              onClick={handleBulkImport}
              disabled={loading || !bulkText.trim()} 
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Parse Intelligence"}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a192f] custom-scrollbar">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2 mb-2">Inventory ({clients.length})</p>
        {clients.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <svg className="mx-auto w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            <p className="text-xs uppercase tracking-widest font-bold">Awaiting Data</p>
          </div>
        ) : (
          clients.map(client => (
            <button
              key={client.id}
              onClick={() => onSelectClient(client)}
              className="w-full p-5 bg-[#112240] border border-slate-800 rounded-2xl hover:border-amber-500/50 hover:bg-[#172a45] transition-all text-left group shadow-sm hover:shadow-xl"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white group-hover:text-amber-500 transition-colors truncate">{client.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{client.address}</p>
                </div>
                <span className="text-[9px] px-2.5 py-1 bg-slate-800 rounded-lg text-amber-500 font-black uppercase tracking-widest border border-amber-500/20 whitespace-nowrap">{client.industry}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
