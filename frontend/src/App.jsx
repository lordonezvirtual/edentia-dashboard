import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { 
  Building2, Users, FileText, Activity, DollarSign, MapPin, 
  RefreshCw, CheckCircle2, AlertCircle, Clock, Plus, X, 
  Download, Sparkles, MessageSquare, Send, ArrowRight, TrendingUp,
  Cpu, LayoutDashboard, Brain, FolderKanban, ShieldCheck, Sun, Moon
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState({
    summary: { total_leads: 0, total_propuestas: 0, total_diagnosticos: 0, total_proyectos_ganados: 0, facturacion_estimada: 0 },
    geography: [],
    tokens: { claude: 0, gemini: 0 }
  });
  
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [runningAgents, setRunningAgents] = useState(false);
  const [currentRunningAgent, setCurrentRunningAgent] = useState('');
  const [newLeadForm, setNewLeadForm] = useState({
    empresa: '', ciudad: 'Pereira', contacto_nombre: '', 
    correo: '', whatsapp: '', sitio_web: '', servicio_edentia_sugerido: 'Forge'
  });

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: '¡Hola! Soy el asistente IA de Edentia. ¿En qué puedo ayudarte a analizar sobre los leads, propuestas o consumos de tokens hoy?' }
  ]);

  // Fetch Data
  const fetchData = async () => {
    try {
      const [leadsRes, propRes, diagRes, projRes, logsRes, metricsRes] = await Promise.all([
        fetch(`${API_BASE}/leads`).then(r => r.json()),
        fetch(`${API_BASE}/propuestas`).then(r => r.json()),
        fetch(`${API_BASE}/diagnosticos`).then(r => r.json()),
        fetch(`${API_BASE}/proyectos`).then(r => r.json()),
        fetch(`${API_BASE}/logs`).then(r => r.json()),
        fetch(`${API_BASE}/metrics`).then(r => r.json())
      ]);

      setLeads(leadsRes);
      setProposals(propRes);
      setDiagnostics(diagRes);
      setProjects(projRes);
      setLogs(logsRes);
      setMetrics(metricsRes);

      // Auto-select first lead if none selected
      if (leadsRes.length > 0 && !selectedLeadId) {
        setSelectedLeadId(leadsRes[0].lead_id);
      }
    } catch (err) {
      console.error('Error fetching data from API:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Run Agents Pipeline
  const handleRunAgents = async (e, specificLeadId = null) => {
    setRunningAgents(true);
    const agentNames = [
      'Agent_01_LeadFinder (Prospección geográfica)',
      'Agent_02_DeepScraper (Barrido digital y dolor)',
      'Agent_03_ProposalBuilder (Estructurando propuesta Word)',
      'Agent_04_FollowUpNotifier (Agendando seguimiento)',
      'Agent_05_InterviewDiagnostic (Procesando notas de entrevista)',
      'Agent_06_FormalProposalEngine (Cotización formal y alcances)',
      'Agent_07_PreInvoiceGenerator (Orden de Trabajo y pre-factura)',
      'Agent_08_ProjectPlanArchitect (Planificando WBS en Excel)',
      'Agent_09_AccountContinuity (Analizando venta cruzada)'
    ];

    // Simulate stepping through agents in UI
    for (let i = 0; i < agentNames.length; i++) {
      setCurrentRunningAgent(agentNames[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      const res = await fetch(`${API_BASE}/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: specificLeadId })
      }).then(r => r.json());

      if (res.success) {
        fetchData();
        setSelectedLeadId(res.lead_id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunningAgents(false);
      setCurrentRunningAgent('');
    }
  };

  // Add Lead
  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm)
      }).then(r => r.json());

      if (res.lead_id) {
        setShowAddLeadModal(false);
        setNewLeadForm({
          empresa: '', ciudad: 'Pereira', contacto_nombre: '', 
          correo: '', whatsapp: '', sitio_web: '', servicio_edentia_sugerido: 'Forge'
        });
        fetchData();
        setSelectedLeadId(res.lead_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chatbot Query Handler
  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Process natural query locally based on state data
    const query = chatInput.toLowerCase();
    let reply = "";

    if (query.includes('pereira') || query.includes('leads de pereira')) {
      const pereiraLeads = leads.filter(l => l.ciudad.toLowerCase() === 'pereira');
      reply = `He encontrado ${pereiraLeads.length} leads en Pereira: ${pereiraLeads.map(l => l.empresa).join(', ')}.`;
    } else if (query.includes('ganado') || query.includes('proyectos')) {
      const activeProj = projects.map(p => `${p.empresa} (${p.orden_trabajo_ref})`).join(', ');
      reply = `Los proyectos ganados en ejecución actualmente son: ${activeProj || 'Ninguno aún'}.`;
    } else if (query.includes('token') || query.includes('consumo') || query.includes('modelo')) {
      reply = `El consumo total es de ${metrics.tokens.claude.toLocaleString()} tokens para Claude y ${metrics.tokens.gemini.toLocaleString()} tokens para Gemini.`;
    } else if (query.includes('servicios') || query.includes('portafolio')) {
      reply = `El portafolio de Edentia cuenta con Aegis (Gobernanza IA), Forge (Automatización agéntica), Aura (XR y gemelos digitales) y Synapse (Interfaces gestuales/neuronales).`;
    } else {
      reply = `De acuerdo con la base de datos de trazabilidad comercial, contamos con ${leads.length} leads registrados y una facturación proyectada de $${parseFloat(metrics.summary.facturacion_estimada).toLocaleString()} COP. ¿Quieres que ejecute el pipeline de prospección para buscar más leads?`;
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: reply }]);
    }, 500);
  };

  // ECharts Configurations
  const getGeoChartOption = () => {
    const data = metrics.geography.map(g => ({ name: g.ciudad, value: parseInt(g.count) }));
    return {
      tooltip: { trigger: 'item' },
      series: [
        {
          name: 'Distribución',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: darkMode ? '#0c0c0f' : '#ffffff',
            borderWidth: 2
          },
          label: { show: true, color: darkMode ? '#fafafa' : '#09090b' },
          data: data.length > 0 ? data : [{ name: 'Sin datos', value: 0 }]
        }
      ],
      color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    };
  };

  const getTokenChartOption = () => {
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          data: ['Claude', 'Gemini'],
          axisLine: { lineStyle: { color: darkMode ? '#3f3f46' : '#e4e4e7' } },
          axisLabel: { color: darkMode ? '#a1a1aa' : '#71717a' }
        }
      ],
      yAxis: [
        {
          type: 'value',
          splitLine: { lineStyle: { color: darkMode ? '#1e1e24' : '#f4f4f5' } },
          axisLabel: { color: darkMode ? '#a1a1aa' : '#71717a' }
        }
      ],
      series: [
        {
          name: 'Tokens Usados',
          type: 'bar',
          barWidth: '60%',
          data: [metrics.tokens.claude, metrics.tokens.gemini],
          itemStyle: {
            color: function (params) {
              return params.dataIndex === 0 ? '#8b5cf6' : '#3b82f6';
            },
            borderRadius: [4, 4, 0, 0]
          }
        }
      ]
    };
  };

  // Get active selected lead
  const selectedLead = leads.find(l => l.lead_id === selectedLeadId);
  const leadProposal = proposals.find(p => p.lead_id === selectedLeadId);
  const leadDiagnostic = diagnostics.find(d => d.lead_id === selectedLeadId);
  const leadProject = projects.find(pr => pr.lead_id === selectedLeadId);

  // Status badgifier helper
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ganado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">Ganado</span>;
      case 'Propuesta_Enviada':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">Propuesta Enviada</span>;
      case 'Contactado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">Contactado</span>;
      case 'Prospecto_Calificado':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">Calificado</span>;
      case 'Perdido':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">Perdido</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">Encontrado</span>;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      
      {/* HEADER */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0f] sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Brain className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">EDENTIA</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Plataforma de Trazabilidad Comercial & Orquestación Agéntica</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 text-xs bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center space-x-1">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-300">Aegis, Forge, Aura, Synapse Online</span>
              </div>
            </div>
            
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* KPI CARDS ROW */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Leads</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.summary.total_leads}</h3>
              <span className="inline-flex items-center text-[10px] mt-2 font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3 mr-1" /> +15%
              </span>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Building2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Propuestas</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.summary.total_propuestas}</h3>
              <span className="inline-flex items-center text-[10px] mt-2 font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                Activas
              </span>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Diagnósticos</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.summary.total_diagnosticos}</h3>
              <span className="inline-flex items-center text-[10px] mt-2 font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                100% Analizados
              </span>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ganados</p>
              <h3 className="text-2xl font-bold mt-1">{metrics.summary.total_proyectos_ganados}</h3>
              <span className="inline-flex items-center text-[10px] mt-2 font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                Conversión 40%
              </span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c0c0f] p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between col-span-2 md:col-span-1">
            <div>
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Facturación Est.</p>
              <h3 className="text-xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                ${parseFloat(metrics.summary.facturacion_estimada).toLocaleString()} COP
              </h3>
              <span className="text-[10px] text-zinc-400 block mt-2">Valor de Pipeline</span>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </section>

        {/* MAIN BODY SPLIT */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          
          {/* LEFT 2/3 COLUMN: CONTENT TABS */}
          <div className="w-full lg:w-2/3 flex flex-col space-y-6">
            
            <div className="bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex-1">
              
              {/* TAB NAVIGATION */}
              <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0e0e12] px-4">
                <button 
                  onClick={() => setActiveTab('pipeline')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'pipeline' 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Embudo Comercial</span>
                </button>
                <button 
                  onClick={() => setActiveTab('agents')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'agents' 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <Cpu className="h-4 w-4" />
                  <span>Monitoreo Agéntico</span>
                </button>
                <button 
                  onClick={() => setActiveTab('projects')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'projects' 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  <FolderKanban className="h-4 w-4" />
                  <span>Proyectos & Entregables</span>
                </button>
              </div>

              {/* TAB PANELS */}
              <div className="p-6">
                
                {/* TAB 1: PIPELINE COMERCIAL */}
                {activeTab === 'pipeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold">Prospectos en Seguimiento</h4>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setShowAddLeadModal(true)}
                          className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Agregar Lead</span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                          <tr>
                            <th className="px-4 py-3">Empresa</th>
                            <th className="px-4 py-3">Ciudad</th>
                            <th className="px-4 py-3">Contacto</th>
                            <th className="px-4 py-3">Sugerencia</th>
                            <th className="px-4 py-3">Estado</th>
                            <th className="px-4 py-3 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                          {leads.map((lead) => (
                            <tr 
                              key={lead.lead_id}
                              onClick={() => setSelectedLeadId(lead.lead_id)}
                              className={`cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                                selectedLeadId === lead.lead_id ? 'bg-blue-50/70 dark:bg-blue-900/10' : ''
                              }`}
                            >
                              <td className="px-4 py-3 font-semibold">{lead.empresa}</td>
                              <td className="px-4 py-3">{lead.ciudad}</td>
                              <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{lead.contacto_nombre}</td>
                              <td className="px-4 py-3">
                                <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
                                  {lead.servicio_edentia_sugerido}
                                </span>
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(lead.estado)}</td>
                              <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={(e) => handleRunAgents(e, lead.lead_id)}
                                  disabled={runningAgents}
                                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                                >
                                  Correr Pipeline
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TAB 2: CENTRO DE MONITOREO AGÉNTICO */}
                {activeTab === 'agents' && (
                  <div className="space-y-6">
                    {/* STATUS DE LOS AGENTES */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Estado de los 9 Agentes del Sistema</h4>
                      <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
                        {[
                          { id: '01', name: 'LeadFinder' },
                          { id: '02', name: 'DeepScraper' },
                          { id: '03', name: 'ProposalBuilder' },
                          { id: '04', name: 'FollowUp' },
                          { id: '05', name: 'Diagnostic' },
                          { id: '06', name: 'FormalProposal' },
                          { id: '07', name: 'PreInvoice' },
                          { id: '08', name: 'ProjectArchitect' },
                          { id: '09', name: 'Continuity' }
                        ].map((ag, index) => {
                          const isActive = runningAgents && currentRunningAgent.includes(`Agent_${ag.id}`);
                          return (
                            <div 
                              key={ag.id} 
                              className={`p-3 rounded-lg border text-center flex flex-col justify-between items-center transition-all ${
                                isActive 
                                  ? 'border-blue-500 bg-blue-500/10 shadow-lg glow-border' 
                                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30'
                              }`}
                            >
                              <div className="relative flex items-center justify-center">
                                <span className={`h-2.5 w-2.5 rounded-full inline-block ${
                                  isActive ? 'bg-blue-500 animate-ping' : 'bg-emerald-500'
                                }`}></span>
                              </div>
                              <span className="text-[10px] font-mono mt-2 text-zinc-400">Agent_{ag.id}</span>
                              <span className="text-xs font-bold leading-tight block mt-1 truncate max-w-full">{ag.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* CONTROL Y LOG DE AUDITORÍA */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* LOGS CONSOLE */}
                      <div className="md:col-span-2 flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Consola de Trazabilidad Agéntica (BD)</h4>
                          <button 
                            onClick={() => handleRunAgents()}
                            disabled={runningAgents}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            <RefreshCw className={`h-3 w-3 ${runningAgents ? 'animate-spin' : ''}`} />
                            <span>Prospectar Pereira</span>
                          </button>
                        </div>

                        {/* CONSOLE */}
                        <div className="bg-zinc-950 text-zinc-300 font-mono p-4 rounded-xl border border-zinc-800 text-[11px] h-64 overflow-y-auto space-y-2.5 shadow-inner">
                          {runningAgents && (
                            <div className="text-blue-400 animate-pulse">
                              &gt;&gt; [PROCESSING] {currentRunningAgent}...
                            </div>
                          )}
                          {logs.map((log) => (
                            <div key={log.log_id} className="border-b border-zinc-900 pb-1.5">
                              <span className="text-zinc-600 dark:text-zinc-500">[{new Date(log.fecha_ejecucion).toLocaleTimeString()}]</span>{' '}
                              <span className="text-purple-400 font-bold">{log.agente_nombre}</span>{' '}
                              <span className="text-zinc-500">({log.modelo_llm})</span>{' '}
                              <span className="text-blue-400">Lead #{log.lead_id} ({log.empresa})</span>:{' '}
                              <span className="text-zinc-300">{log.accion_realizada}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EFFICIENCY CHART */}
                      <div className="flex flex-col space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Consumo de Tokens</h4>
                        <div className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex-1 flex flex-col justify-center">
                          <div className="h-48">
                            <ReactECharts option={getTokenChartOption()} style={{ height: '100%' }} />
                          </div>
                          <div className="text-center text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                            Claude ({metrics.tokens.claude.toLocaleString()} tokens) vs Gemini ({metrics.tokens.gemini.toLocaleString()} tokens)
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* TAB 3: PROYECTOS & ENTREGABLES */}
                {activeTab === 'projects' && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold">Proyectos Activos & Planes Operativos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((project) => (
                        <div key={project.proyecto_id} className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase">
                                {project.servicio_edentia_sugerido}
                              </span>
                              <h5 className="text-base font-bold mt-2">{project.empresa}</h5>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Ref: {project.orden_trabajo_ref}</p>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                              {project.estado_proyecto.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="mt-4 border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-3">
                            <div className="flex justify-between text-xs text-zinc-500">
                              <span>Monto Total:</span>
                              <span className="font-bold text-zinc-950 dark:text-zinc-50">
                                ${parseFloat(project.monto_total).toLocaleString()} COP
                              </span>
                            </div>

                            <div className="flex justify-between text-xs text-zinc-500">
                              <span>Periodo:</span>
                              <span>
                                {new Date(project.fecha_inicio).toLocaleDateString()} a {new Date(project.fecha_fin_estimada).toLocaleDateString()}
                              </span>
                            </div>

                            {/* DOWNLOAD ACTION LINKS */}
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <a 
                                href={`http://localhost:5000${leadProposal ? leadProposal.ruta_archivo_word : '#'}`} 
                                download 
                                className="flex items-center justify-center space-x-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Propuesta Word</span>
                              </a>
                              <a 
                                href={`http://localhost:5000${project.ruta_excel_plan}`} 
                                download 
                                className="flex items-center justify-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>Cronograma Excel</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* LOWER STATS BAR */}
            <div className="bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-zinc-400" />
                <div>
                  <h5 className="text-sm font-bold">Desglose Geográfico</h5>
                  <p className="text-xs text-zinc-400">Total leads por ciudades</p>
                </div>
              </div>
              <div className="h-32 w-64">
                <ReactECharts option={getGeoChartOption()} style={{ height: '100%', width: '100%' }} />
              </div>
            </div>

          </div>

          {/* RIGHT 1/3 COLUMN: LEAD DETAIL & UP-SELLING */}
          <div className="w-full lg:w-1/3 flex flex-col space-y-6">
            
            {/* SELECTED LEAD FILE CARD */}
            {selectedLead ? (
              <div className="bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex-1 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex justify-between items-start border-b border-zinc-200 dark:border-zinc-800 pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">{selectedLead.empresa}</h4>
                      <a href={`https://${selectedLead.sitio_web}`} target="_blank" className="text-xs text-blue-500 hover:underline">{selectedLead.sitio_web}</a>
                    </div>
                    {getStatusBadge(selectedLead.estado)}
                  </div>

                  <div className="space-y-4 mt-4">
                    
                    {/* LEADS CORE DATA */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-400 block">Contacto Clave</span>
                        <span className="font-semibold">{selectedLead.contacto_nombre}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">Ubicación</span>
                        <span className="font-semibold">{selectedLead.ciudad}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400 block">Correo Electrónico</span>
                        <span className="font-semibold select-all">{selectedLead.correo}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-400 block">WhatsApp / Teléfono</span>
                        <span className="font-semibold select-all">{selectedLead.whatsapp}</span>
                      </div>
                    </div>

                    {/* SCRAPING FINDINGS BOX */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Análisis Digital (Agent_02)</span>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">{selectedLead.hallazgos_scraping}</p>
                    </div>

                    {/* DIAGNOSTIC MATRIX */}
                    {leadDiagnostic && (
                      <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Diagnóstico de Madurez (Agent_05)</span>
                          <span className="text-[10px] font-semibold text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            Nivel: {leadDiagnostic.nivel_madurez_ia}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 italic">
                          &quot;{leadDiagnostic.transcripcion_entrevista.slice(0, 100)}...&quot;
                        </p>
                        
                        <div className="text-[11px] space-y-1">
                          <div className="text-zinc-400">Arquitectura Sugerida:</div>
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {leadDiagnostic.analisis_ia_diagnostico?.arquitectura_sugerida}
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

                {/* UP-SELLING recommendations */}
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 dark:border-blue-900/30 rounded-lg p-4 relative overflow-hidden">
                    <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Continuidad de Cuenta (Agent_09)</span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-2">
                      {selectedLead.servicio_edentia_sugerido === 'Forge' && 'Ofrecer Edentia Aegis para asegurar la gobernanza, observabilidad y control de los modelos de IA integrados.'}
                      {selectedLead.servicio_edentia_sugerido === 'Aura' && 'Ofrecer Edentia Synapse (decodificación neuronal mediante Mudra Band) para control de gestos interactivo sin contacto físico.'}
                      {selectedLead.servicio_edentia_sugerido === 'Aegis' && 'Ofrecer Edentia Forge para construir nuevos agentes inteligentes autónomos que respondan a las anomalías de los modelos.'}
                      {selectedLead.servicio_edentia_sugerido === 'Synapse' && 'Ofrecer interfaces Aura XR integradas para entrenamiento inmersivo del personal.'}
                    </p>
                    <button className="flex items-center text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-3 hover:underline">
                      <span>Generar propuesta de cross-selling</span>
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center text-center flex-1">
                <Building2 className="h-12 w-12 text-zinc-400 mb-2" />
                <h5 className="font-bold">Ningún Lead Seleccionado</h5>
                <p className="text-xs text-zinc-500 mt-1">Haz clic sobre un lead de la tabla comercial para ver su ficha técnica.</p>
              </div>
            )}

          </div>

        </div>

      </main>

      {/* FLOAT BUTTON: IA CHAT PANEL */}
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-105"
        >
          {chatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </button>
      </div>

      {/* IA CHAT PANEL SLIDE-OUT */}
      {chatOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-80 h-96 bg-white dark:bg-[#0c0c0f] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col justify-between">
          <div className="bg-zinc-50 dark:bg-[#0f0f13] border-b border-zinc-200 dark:border-zinc-800 p-3 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-bold">Asistente IA Edentia (Gemini)</span>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
          </div>

          {/* CHAT MESSAGES */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
            {chatMessages.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[80%] p-2.5 rounded-lg leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'ml-auto bg-blue-600 text-white rounded-tr-none' 
                    : 'mr-auto bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* INPUT BAR */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-2 flex items-center space-x-1">
            <input 
              type="text" 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              placeholder="Consulta a la IA sobre la BD..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleSendChatMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD LEAD */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-zinc-50 dark:bg-[#0e0e12] border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex justify-between items-center">
              <h5 className="font-bold">Nuevo Prospecto de Negocio</h5>
              <button 
                onClick={() => setShowAddLeadModal(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Nombre de la Empresa</label>
                <input 
                  type="text" required
                  value={newLeadForm.empresa}
                  onChange={(e) => setNewLeadForm({...newLeadForm, empresa: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Ciudad</label>
                  <select 
                    value={newLeadForm.ciudad}
                    onChange={(e) => setNewLeadForm({...newLeadForm, ciudad: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Pereira">Pereira</option>
                    <option value="Bogotá">Bogotá</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Medellín">Medellín</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Línea Edentia</label>
                  <select 
                    value={newLeadForm.servicio_edentia_sugerido}
                    onChange={(e) => setNewLeadForm({...newLeadForm, servicio_edentia_sugerido: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Aegis">Aegis (Gobernanza)</option>
                    <option value="Forge">Forge (Agentes)</option>
                    <option value="Aura">Aura (XR)</option>
                    <option value="Synapse">Synapse (Neuro)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Contacto Clave</label>
                <input 
                  type="text" required
                  value={newLeadForm.contacto_nombre}
                  onChange={(e) => setNewLeadForm({...newLeadForm, contacto_nombre: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Correo Corporativo</label>
                <input 
                  type="email" required
                  value={newLeadForm.correo}
                  onChange={(e) => setNewLeadForm({...newLeadForm, correo: e.target.value})}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">WhatsApp</label>
                  <input 
                    type="text" required
                    value={newLeadForm.whatsapp}
                    onChange={(e) => setNewLeadForm({...newLeadForm, whatsapp: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5 uppercase">Sitio Web</label>
                  <input 
                    type="text" required
                    value={newLeadForm.sitio_web}
                    onChange={(e) => setNewLeadForm({...newLeadForm, sitio_web: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors mt-6 shadow-md"
              >
                Registrar Lead e Iniciar Pipeline
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
