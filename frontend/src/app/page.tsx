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
  const [currentInvId, setCurrentInvId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [history, setHistory] = useState<Investigation[]>([]);
  const router = useRouter();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await insforge.auth.getCurrentUser();
      if (!user) {
        router.push('/login');
      } else {
        setUser(user);
        fetchHistory();
        setupRealtime();
      }
    } catch (error) {
      console.error('Auth check failed', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    const { data } = await insforge.database
      .from('investigations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) setHistory(data);
  };

  const setupRealtime = () => {
    const channelName = 'investigation';
    
    insforge.realtime.subscribe(channelName);

    const handleProgress = (payload: any) => {
      if (payload.meta.channel === channelName) {
        setProgress((prev) => [...prev, payload.message]);
      }
    };
    
    insforge.realtime.on('progress', handleProgress);
    
    return () => {
      insforge.realtime.off('progress', handleProgress);
      insforge.realtime.unsubscribe(channelName);
    };
  };

  const handleLogout = async () => {
    await insforge.auth.signOut();
    router.push('/login');
  };

  const startInvestigation = async () => {
    setInvestigating(true);
    setProgress([]);
    setDiagnosis(null);
    setCurrentInvId(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/investigate`);
      if (response.data.status === 'success') {
        setDiagnosis(response.data.diagnosis);
        setCurrentInvId(response.data.investigation_id);
        fetchHistory();
      }
    } catch (error) {
      console.error('Investigation failed', error);
      setProgress((prev) => [...prev, 'Error: Investigation failed.']);
    } finally {
      setInvestigating(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 text-gray-900">
      <div className="z-10 max-w-5xl w-full flex flex-col gap-8">
        <header className="flex justify-between items-center border-b pb-4">
          <h1 className="text-3xl font-bold">AI Kubernetes Agent</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">Logout</button>
          </div>
        </header>

        <section className="flex flex-col items-center gap-6 bg-white p-12 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-700">Troubleshoot Kubernetes with AI</h2>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:bg-blue-300 disabled:transform-none"
            onClick={startInvestigation}
            disabled={investigating}
          >
            {investigating ? 'Investigating...' : 'Investigate Cluster'}
          </button>
          <p className="text-sm text-gray-500">System Status: <span className="text-green-600 font-bold">Ready</span></p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Progress Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Investigation Progress</h3>
            <div className="space-y-2">
              {progress.map((msg, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-green-500">✓</span>
                  {msg}
                </div>
              ))}
              {investigating && (
                <div className="animate-pulse text-blue-600 text-sm font-medium">Processing...</div>
              )}
              {progress.length === 0 && !investigating && (
                <p className="text-gray-400 text-sm italic">No active investigation</p>
              )}
            </div>
          </div>

          {/* Diagnosis Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Diagnosis</h3>
            {diagnosis ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Root Cause</p>
                  <p className="text-md font-bold text-red-600">{diagnosis.root_cause}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400">Explanation</p>
                  <p className="text-sm text-gray-700">{diagnosis.explanation}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md border border-green-100">
                  <p className="text-xs font-semibold uppercase text-green-700">Suggested Fix</p>
                  <p className="text-sm text-green-800">{diagnosis.fix}</p>
                </div>
                <div className="bg-gray-900 p-3 rounded-md overflow-x-auto">
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Command</p>
                  <code className="text-xs text-blue-300">{diagnosis.kubectl_command}</code>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase text-gray-400">Confidence:</p>
                  <span className={`text-sm font-bold ${diagnosis.confidence > 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {diagnosis.confidence}%
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic">Complete an investigation to see results</p>
            )}
          </div>
        </div>

        {/* History Section */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4 border-b pb-2">Recent Investigations</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-gray-400 uppercase text-xs border-b">
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Root Cause</th>
                  <th className="pb-2">Namespace</th>
                  <th className="pb-2">Confidence</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.length > 0 ? history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="py-3 font-medium">{item.root_cause || 'In Progress...'}</td>
                    <td className="py-3">{item.namespace}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {item.confidence || 0}%
                      </span>
                    </td>
                    <td className="py-3 text-green-600 font-medium">{item.status}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400 italic">No investigation history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
