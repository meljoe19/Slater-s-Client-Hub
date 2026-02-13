
import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import { Client, StrategicInsight } from './types';
import { getStrategicAnalysis, querySchoolAssistant } from './services/geminiService';

const INITIAL_DATA: Client[] = [
  {
    id: 'slater-1',
    name: 'Slater Strategies',
    address: '774 SW Sail Ter, Port St. Lucie, FL 34953',
    industry: 'Business Services',
    revenue: 0,
    latitude: 27.2796,
    longitude: -80.3920
  },
  {
    id: 'white-pines-1',
    name: 'White Pines Learning',
    address: 'Port St. Lucie, FL',
    industry: 'Charter',
    revenue: 0,
    latitude: 27.2850,
    longitude: -80.3500
  },
  {
    id: 'oakwood-1',
    name: 'Oakwood Christian Academy',
    address: 'Port St. Lucie, FL',
    industry: 'Christian School',
    revenue: 0,
    latitude: 27.2500,
    longitude: -80.3800
  }
];

const App: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(INITIAL_DATA);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [insight, setInsight] = useState<StrategicInsight | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showInsight, setShowInsight] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiAssistantLoading, setIsAiAssistantLoading] = useState(false);
  const [aiAssistantResponse, setAiAssistantResponse] = useState<string | null>(null);

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lower) || 
      c.industry.toLowerCase().includes(lower)
    );
  }, [clients, searchTerm]);

  const handleAddClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
    setInsight(null);
  };

  const handleAddMultipleClients = (newClients: Client[]) => {
    setClients(prev => [...newClients, ...prev]);
    setInsight(null);
  };

  const handleRestoreDefaults = () => {
    setClients(INITIAL_DATA);
    setInsight(null);
    setSearchTerm('');
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
  };

  const fetchAnalysis = async () => {
    if (clients.length === 0) return;
    setAnalyzing(true);
    const data = await getStrategicAnalysis(clients);
    if (data) {
      setInsight(data);
      setShowInsight(true);
    }
    setAnalyzing(false);
  };

  const handleAiQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsAiAssistantLoading(true);
    const response = await querySchoolAssistant(searchTerm, filteredClients);
    setAiAssistantResponse(response);
    setIsAiAssistantLoading(false);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a192f] overflow-hidden font-sans text-slate-200">
      <Sidebar 
        clients={filteredClients} 
        onAddClient={handleAddClient} 
        onAddMultipleClients={handleAddMultipleClients}
        onSelectClient={handleSelectClient}
        onRestoreDefaults={handleRestoreDefaults}
      />
      
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header with Search and AI features */}
        <header className="absolute top-0 left-0 right-0 z-10 p-4 flex flex-col md:flex-row gap-4 items-center justify-between pointer-events-none">
          <div className="flex gap-4 pointer-events-auto shrink-0">
            <div className="bg-[#112240]/90 backdrop-blur shadow-2xl border border-slate-700/50 rounded-2xl px-6 py-3 flex items-center gap-6">
              <div className="border-r border-slate-700 pr-6">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Total Entities</p>
                <p className="text-xl font-bold text-white">{clients.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Visible</p>
                <p className="text-xl font-bold text-white">{filteredClients.length}</p>
              </div>
            </div>
          </div>

          {/* Centered Search Bar */}
          <div className="pointer-events-auto flex-1 max-w-xl mx-4">
            <div className="relative group w-full">
              <input 
                type="text"
                placeholder="Search names or industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#112240]/90 backdrop-blur-sm border border-slate-700 shadow-2xl rounded-2xl px-12 py-3.5 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-white placeholder-slate-400"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              
              <button 
                onClick={handleAiQuery}
                disabled={isAiAssistantLoading}
                title="Ask Gemini about these results"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {isAiAssistantLoading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pointer-events-auto shrink-0">
             <button 
              onClick={fetchAnalysis}
              disabled={analyzing || clients.length === 0}
              className="bg-amber-600 text-white px-5 py-3.5 rounded-2xl font-bold shadow-xl hover:bg-amber-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
            >
              {analyzing ? (
                <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
              )}
              {analyzing ? "Analyzing..." : "Strategy Insight"}
            </button>
          </div>
        </header>

        <div className="flex-1">
          <MapComponent 
            clients={filteredClients} 
            onMarkerClick={handleSelectClient} 
            center={[27.2730, -80.3582]}
          />
        </div>

        {/* AI Assistant Response Popover */}
        {aiAssistantResponse && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 px-4">
             <div className="bg-[#112240] rounded-3xl shadow-2xl border border-slate-700 p-6 relative">
                <button 
                  onClick={() => setAiAssistantResponse(null)}
                  className="absolute top-4 right-4 p-1 hover:bg-slate-700 rounded-full transition-colors text-slate-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-amber-500 p-1.5 rounded-lg text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                  </div>
                  <h4 className="font-bold text-white tracking-tight">Gemini Strategy Assistant</h4>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {aiAssistantResponse}
                </div>
             </div>
          </div>
        )}

        {showInsight && insight && (
          <div className="absolute bottom-6 left-6 right-6 z-20 bg-[#112240]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700 p-8 max-h-[45vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-amber-500">✨</span> Gemini Regional Insights
                </h3>
                <p className="text-slate-300 leading-relaxed max-w-3xl">{insight.summary}</p>
              </div>
              <button onClick={() => setShowInsight(false)} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
                   Opportunities
                </h4>
                <ul className="space-y-3">
                  {insight.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-amber-500 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                   Location Clusters
                </h4>
                <div className="flex flex-wrap gap-2">
                  {insight.hotspots.map((spot, i) => (
                    <span key={i} className="text-xs bg-[#172a45] text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/20 font-semibold tracking-wide">{spot}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                   Growth Notes
                </h4>
                <ul className="space-y-3">
                  {insight.riskAreas.map((risk, i) => (
                    <li key={i} className="text-sm text-slate-400 flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
