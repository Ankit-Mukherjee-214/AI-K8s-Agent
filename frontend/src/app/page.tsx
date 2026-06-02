"use client";

import React, { useState, useEffect } from 'react';
import { insforge } from '@/services/insforge';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Diagnosis {
  root_cause: string;
  explanation: string;
  fix: string;
  kubectl_command: string;
  confidence: number;
}

interface Investigation {
  id: string;
  created_at: string;
  root_cause: string;
  namespace: string;
  confidence: number;
  status: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [investigating, setInvestigating] = useState(false);
  const [currentInvestigationId, setCurrentInvestigationId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Investigation[]>([]);
  const [clusters, setClusters] = useState<string[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    checkUser();
  }, []);

  // Polling for progress updates when investigating
  useEffect(() => {
    let interval: any;
    if (investigating && currentInvestigationId) {
      console.log(`Starting polling for investigation: ${currentInvestigationId}`);
      // Fetch immediately once
      fetchCurrentStatus();
      
      interval = setInterval(() => {
        fetchCurrentStatus();
      }, 2000);
    }
    return () => {
      if (interval) {
        console.log('Stopping polling');
        clearInterval(interval);
      }
    };
  }, [investigating, currentInvestigationId]);

  const fetchCurrentStatus = async () => {
    if (!currentInvestigationId) return;

    try {
      // 1. Fetch progress logs
      const { data: progressData, error: pError } = await insforge.database
        .from('investigation_progress')
        .select('message')
        .eq('investigation_id', currentInvestigationId)
        .order('created_at', { ascending: true });

      if (pError) {
        console.error('Error fetching progress:', pError);
      } else if (progressData) {
        setProgress(progressData.map((p: any) => p.message));
      }

      // 2. Fetch investigation status/diagnosis
      const { data: investigationData, error: iError } = await insforge.database
        .from('investigations')
        .select('*')
        .eq('id', currentInvestigationId)
        .single();

      if (iError) {
        console.error('Error fetching investigation:', iError);
      } else if (investigationData && investigationData.status === 'completed') {
        console.log('Investigation completed, setting diagnosis');
        setDiagnosis({
          root_cause: investigationData.root_cause,
          explanation: investigationData.explanation,
          fix: investigationData.fix,
          kubectl_command: investigationData.kubectl_command,
          confidence: investigationData.confidence
        });
        setInvestigating(false);
        fetchHistory();
      }
    } catch (err) {
      console.error('Unexpected error in polling:', err);
    }
  };

  const fetchClusters = async () => {
    try {
      console.log('Fetching clusters from:', `${API_BASE_URL}/clusters`);
      const response = await axios.get(`${API_BASE_URL}/clusters`);
      if (response.data.status === 'success') {
        console.log('Clusters fetched successfully:', response.data.clusters);
        setClusters(response.data.clusters || []);
        if (response.data.clusters && response.data.clusters.length > 0) {
          setSelectedCluster(response.data.clusters[0]);
        }
      } else {
        console.error('Failed to fetch clusters:', response.data.error);
      }
    } catch (err) {
      console.error('Connection error fetching clusters:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      console.log('Fetching investigation history...');
      const { data, error } = await insforge.database
        .from('investigations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
      } else {
        console.log('History fetched successfully:', data?.length, 'records');
        setHistory(data || []);
      }
    } catch (err) {
      console.error('Unexpected error fetching history:', err);
    }
  };

  const checkUser = async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error || !data?.user) {
        router.push('/login');
      } else {
        setUser(data.user);
        fetchHistory();
        fetchClusters();
      }
    } catch (err) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await insforge.auth.signOut();
    router.push('/login');
  };

  const startInvestigation = async () => {
    setInvestigating(true);
    setProgress([]);
    setDiagnosis(null);
    setError(null);
    setCurrentInvestigationId(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/investigate`, {
        cluster: selectedCluster,
        user_id: user.id
      });
      
      if (response.data.status === 'success') {
        setCurrentInvestigationId(response.data.investigation_id);
        fetchHistory();
      } else {
        setError(response.data.error || 'Investigation failed');
        setInvestigating(false);
      }
    } catch (err) {
      setError('Connection to backend failed. Please try again.');
      setInvestigating(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100">
      <div className="z-10 max-w-7xl w-full flex flex-col gap-6 md:gap-8">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-md border border-slate-200 px-6 py-4 rounded-2xl shadow-sm sticky top-4 z-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">K8s Agent</h1>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Diagnostic Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700">{user?.email?.split('@')[0]}</span>
              <span className="text-[10px] font-medium text-slate-400">{user?.email}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>
            <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider">Sign Out</button>
          </div>
        </header>

        <section className="relative overflow-hidden bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-sm">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-8 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">System Investigation</h2>
              <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed">Select your target Kubernetes cluster to initiate an automated AI-driven root cause analysis.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full max-w-2xl bg-slate-50 p-2 rounded-3xl border border-slate-200">
              <div className="flex-1 relative group">
                <select 
                  value={selectedCluster} 
                  onChange={(e) => setSelectedCluster(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-slate-700 font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  {clusters.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}
                  {clusters.length === 0 && <option>No clusters found</option>}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <button 
                className="bg-indigo-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
                onClick={startInvestigation}
                disabled={investigating || !selectedCluster}
              >
                {investigating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing...
                  </>
                ) : 'Launch Investigation'}
              </button>
            </div>
            
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span>Cluster Connected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                <span>AI Engine Online</span>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <div>
              <p className="text-sm font-bold text-red-800">Connection Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Process Log</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Activity</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded-lg">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {progress.length > 0 ? progress.map((msg, idx) => (
                <div key={idx} className={`flex items-start gap-3 text-sm animate-in fade-in slide-in-from-left-2 duration-300 ${idx === progress.length - 1 ? 'font-bold text-indigo-600' : 'text-slate-600'}`}>
                  <div className={`mt-1 rounded-full p-1 ${msg.startsWith('Error') ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                    {msg.startsWith('Error') ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                  <span className="leading-relaxed">{msg}</span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <p className="text-sm font-medium text-slate-400">Initialize a scan to populate logs</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Diagnosis & Recommendation</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Reasoning Output</p>
              </div>
              {diagnosis && (
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Confidence</span>
                    <span className={`text-sm font-black ${diagnosis.confidence > 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{diagnosis.confidence}%</span>
                  </div>
                  <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-1000 ${diagnosis.confidence > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{width: `${diagnosis.confidence}%`}}></div>
                  </div>
                </div>
              )}
            </div>
            
            {diagnosis ? (
              <div className="space-y-8 overflow-y-auto max-h-[600px] pr-4 custom-scrollbar animate-in zoom-in-95 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Primary Root Cause</label>
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                      <p className="text-lg font-bold text-rose-700 leading-tight">{diagnosis.root_cause}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">System Context</label>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[10px] font-black border border-indigo-100 uppercase tracking-wider">Kubernetes</span>
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black border border-slate-200 uppercase tracking-wider">Namespace: {selectedCluster}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Detailed Explanation</label>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-200"></div>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">{diagnosis.explanation}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Recommended Action</label>
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <p className="text-emerald-900 font-bold leading-relaxed relative z-10">{diagnosis.fix}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Remediation Command</label>
                    <button 
                      onClick={() => navigator.clipboard.writeText(diagnosis.kubectl_command)} 
                      className="group flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Copy Command</span>
                      <svg className="w-3 h-3 text-indigo-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                  <div className="bg-slate-900 p-6 rounded-2xl overflow-hidden group relative border border-slate-800 shadow-xl">
                    <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar-dark pb-2">
                      <code className="text-sm text-indigo-300 font-mono whitespace-nowrap block">{diagnosis.kubectl_command}</code>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-40 py-20 grayscale">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200 blur-3xl rounded-full scale-150 opacity-20 animate-pulse"></div>
                  <svg className="w-32 h-32 text-slate-200 relative" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-xl font-bold tracking-tight text-slate-400 uppercase tracking-widest">Awaiting Analysis</p>
                  <p className="text-sm text-slate-300 font-medium">Results will be generated upon successful scan completion</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Investigation Archive</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">Audit log of all past diagnostic executions.</p>
            </div>
            <button 
              onClick={fetchHistory} 
              className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 px-5 py-2.5 rounded-2xl transition-all border border-slate-200 group"
            >
              <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.001 0 01-15.357-2m15.357 2H15" /></svg>
              <span className="text-xs font-bold uppercase tracking-wider">Sync Archive</span>
            </button>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50/30">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-100">
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Deployment Context</th>
                  <th className="px-8 py-5">Identified Issue</th>
                  <th className="px-8 py-5 text-center">Confidence Index</th>
                  <th className="px-8 py-5">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.length > 0 ? history.map((item) => (
                  <tr key={item.id} className="bg-white hover:bg-slate-50/50 transition-colors group cursor-default">
                    <td className="px-8 py-5 whitespace-nowrap text-slate-400 tabular-nums font-medium text-xs">
                      {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-indigo-400 transition-colors"></div>
                        <span className="font-bold text-slate-700">{item.namespace || 'global-context'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="max-w-xs truncate">
                        <span className="font-bold text-slate-800">{item.root_cause || <span className="italic font-normal text-slate-300">Analysis In Progress...</span>}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 rounded-full text-[10px] font-black border transition-all duration-300 group-hover:scale-110 shadow-sm
                        ${item.confidence > 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}">
                        {item.confidence || 0}%
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${item.status === 'completed' ? 'text-indigo-500' : 'text-amber-500 animate-pulse'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'completed' ? 'bg-indigo-500' : 'bg-amber-500'}`}></div>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        <p className="text-lg font-bold uppercase tracking-[0.2em]">Archive Empty</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }

        .custom-scrollbar-dark::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>
    </main>
  );
}
