"use client";

import React, { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('Ready');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-bold text-center">AI Kubernetes Agent</h1>
        <p className="text-xl text-gray-600 text-center">Troubleshoot Kubernetes with AI</p>
        
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors"
          onClick={() => alert('Investigation started (Placeholder)')}
        >
          Investigate Cluster
        </button>

        <div className="mt-12 p-4 border border-gray-200 rounded-md bg-white shadow-sm w-64 text-center">
          <p className="text-sm font-semibold uppercase text-gray-500">System Status</p>
          <p className="text-lg font-bold text-green-600">{status}</p>
        </div>
      </div>
    </main>
  );
}
