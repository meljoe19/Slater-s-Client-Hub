
import React, { useState } from 'react';
import { Client } from '../types';
import { getGeminiGeocode, parseClientList } from '../services/geminiService';

interface SidebarProps {
  clients: Client[];
  onAddClient: (client: Client) => void;
  onAddMultipleClients: (clients: Client[]) => void;
  onUpdateClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onSelectClient: (client: Client) => void;
  onRestoreDefaults: () => void;
  onClearAll: () => void;
  onDownload: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  clients, 
  onAddClient, 
  onAddMultipleClients, 
  onUpdateClient, 
  onDeleteClient,
  onSelectClient, 
  onRestoreDefaults,
  onClearAll,
  onDownload
}) => {
  const [mode, setMode] = useState<'single' | 'bulk' | 'edit' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
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

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    const originalClient = clients.find(c => c.id === editingId);
    
    let latitude = originalClient?.latitude || 0;
    let longitude = originalClient?.longitude || 0;
    let formattedAddress = formData.address;

    if (originalClient && originalClient.address !== formData.address) {
      setProgress('Updating location coordinates...');
      const geocode = await getGeminiGeocode(formData.address);
      if (geocode) {
        latitude = geocode.latitude;
        longitude = geocode.longitude;
        formattedAddress = geocode.formattedAddress;
      } else {
        alert("Geocoding failed. Reverting to original position.");
      }
    }

    const updatedClient: Client = {
      id: editingId,
      name: formData.name,
      address: formattedAddress,
      industry: formData.industry,
      revenue: parseFloat(formData.revenue) || 0,
      latitude,
      longitude
    };

    onUpdateClient(updatedClient);
    setMode('none');
    setEditingId(null);
    setFormData({ name: '', address: '', industry: 'Christian School', revenue: '' });
    setLoading(false);
    setProgress('');
  };

  const handleStartEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setMode('edit');
    setEditingId(client.id);
    setFormData({
      name: client.name,
      address: client.address,
      industry: client.industry,
      revenue: client.revenue.toString()
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Remove this entry from strategy map?")) {
      onDeleteClient(id);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setLoading(true);
    setProgress('AI Parsing in progress...');
    
    const parsed = await parseClientList(bulkText);
    if (parsed.length === 0) {
      alert("AI extraction failed. Format example: 'Name: Address'");
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
      alert("Failed to geocode entries.");
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
          <div className="flex gap-1.5">
             <button 
              onClick={onDownload}
              title="Export Strategy Data"
              className="p-2 rounded-xl transition-all bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
             <button 
              onClick={onRestoreDefaults}
              title="Restore Defaults"
              className="p-2 rounded-xl transition-all bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
            </button>
             <button 
              onClick={() => {
                setMode(mode === 'single' ? 'none' : 'single');
                setEditingId(null);
                setFormData({ name: '', address: '', industry: 'Christian School', revenue: '' });
              }}
              className={`p-2 rounded-xl transition-all ${mode === 'single' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
              title="Add Single"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button 
              onClick={() => {
                setMode(mode === 'bulk' ? 'none' : 'bulk');
                setEditingId(null);
              }}
              className={`p-2 rounded-xl transition-all ${mode === 'bulk' ? 'bg-amber-500 text-white' : 'bg-slate-800 text-amber-500 hover:bg-slate-700'}`}
              title="Bulk Import"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
            </button>
          </div>
        </div>

        {(mode === 'single' || mode === 'edit') && (
          <form onSubmit={mode === 'edit' ? handleSubmitEdit : handleSubmitSingle} className="space-y-4 bg-[#112240] p-5 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em]">{mode === 'edit' ? 'Edit Existing Node' : 'New Strategic Node'}</p>
              {mode === 'edit' && (
                <button 
                  type="button"
                  onClick={() => { setMode('none'); setEditingId(null); }}
                  className="text-slate-500 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}
            </div>
            <input
              required
              className="w-full px-4 py-2.5 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder-slate-500"
              placeholder="Institution Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input
              required
              className="w-full px-4 py-2.5 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none placeholder-slate-500"
              placeholder="Street Address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
            <div className="flex gap-2">
              <select className="flex-1 px-4 py-2.5 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})}>
                <option className="bg-[#112240]">Christian School</option>
                <option className="bg-[#112240]">Public School</option>
                <option className="bg-[#112240]">Catholic School</option>
                <option className="bg-[#112240]">Charter</option>
                <option className="bg-[#112240]">Roofing</option>
                <option className="bg-[#112240]">Business Services</option>
              </select>
            </div>
            {progress && <p className="text-[10px] text-amber-500 font-bold animate-pulse tracking-wide text-center">{progress}</p>}
            <button disabled={loading} className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
              {loading ? <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (mode === 'edit' ? "Apply Changes" : "Commit to Strategy")}
            </button>
          </form>
        )}

        {mode === 'bulk' && (
          <div className="space-y-4 bg-[#112240] p-5 rounded-2xl border border-slate-700 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] mb-1">Bulk Strategy Input</p>
            <textarea
              className="w-full h-32 px-4 py-3 bg-[#0a192f] border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none font-mono placeholder-slate-600"
              placeholder="St. Mary's: 123 Church Rd&#10;Lincoln High: 456 Education Ln"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />
            {progress && <p className="text-[10px] text-amber-500 font-bold animate-pulse tracking-wide text-center">{progress}</p>}
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
        <div className="flex items-center justify-between px-2 mb-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Inventory ({clients.length})</p>
           {clients.length > 0 && (
             <button 
              onClick={onClearAll}
              className="text-[9px] text-slate-600 hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
             >
               Clear Map
             </button>
           )}
        </div>
        
        {clients.length === 0 ? (
          <div className="text-center py-20 opacity-30">
            <svg className="mx-auto w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            <p className="text-xs uppercase tracking-widest font-bold">Strategy Layer Empty</p>
          </div>
        ) : (
          clients.map(client => (
            <div
              key={client.id}
              onClick={() => onSelectClient(client)}
              className={`w-full p-5 bg-[#112240] border rounded-2xl hover:bg-[#172a45] transition-all text-left group shadow-sm hover:shadow-xl relative cursor-pointer ${editingId === client.id ? 'border-amber-500 shadow-amber-500/10' : 'border-slate-800 hover:border-amber-500/50'}`}
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white group-hover:text-amber-500 transition-colors truncate">{client.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{client.address}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[9px] px-2.5 py-1 bg-slate-800 rounded-lg text-amber-500 font-black uppercase tracking-widest border border-amber-500/20 whitespace-nowrap">{client.industry}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => handleStartEdit(client, e)}
                      className="p-1.5 bg-slate-800 text-slate-400 hover:text-amber-500 rounded-lg transition-all border border-slate-700 hover:border-amber-500/30"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button 
                      onClick={(e) => handleDelete(client.id, e)}
                      className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all border border-slate-700 hover:border-red-400/30"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
