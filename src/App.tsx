import React, { useState, useEffect } from 'react';
import { RecommendationResponse, ScoredPlayer } from './types';
import { Header } from './components/Header';
import { MetricsColumn } from './components/MetricsColumn';
import { PitchView } from './components/PitchView';
import { DataGrid } from './components/DataGrid';
import { OptimizerPositioning } from './components/OptimizerPositioning';
import { TransferView } from './components/TransferView';
import { EngineDiagnostics } from './components/EngineDiagnostics';
import { FixtureList } from './components/FixtureList';
import { PerformanceView } from './components/PerformanceView';
import { AIAgentView } from './components/AIAgentView';
import { ChipAdvisor } from './components/ChipAdvisor';
import { PlayerCard } from './components/PlayerCard';
import { RefreshCw, Camera } from 'lucide-react';

export function App() {
  const [riskMode, setRiskMode] = useState<'safe' | 'risky' | 'value'>('safe');
  const [fuel, setFuel] = useState<'native' | 'csv' | 'eye-test'>('native');
  const [scenario, setScenario] = useState<'quant' | 'template'>('quant');
  const [tab, setTab] = useState<'optimizer' | 'pitch' | 'picks' | 'transfers' | 'chips' | 'performance' | 'agent'>('pitch');
  const [budget, setBudget] = useState(100.0);
  const [teamId, setTeamId] = useState('');

  const [lockedPlayerIds, setLockedPlayerIds] = useState<number[]>([]);
  const [excludedPlayerIds, setExcludedPlayerIds] = useState<number[]>([]);

  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<ScoredPlayer | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        riskMode,
        scenario,
        budget: budget.toString(),
        tier: 'ai-agent',
        fuel,
        lockedPlayerIds: lockedPlayerIds.join(','),
        excludedPlayerIds: excludedPlayerIds.join(',')
      });

      const res = await fetch(`/api/recommendations?${query.toString()}`);
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const json: RecommendationResponse = await res.json();
      setData(json);
    } catch (err: any) {
      console.error("[UEFA App Fetch Error]:", err.message);
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [riskMode, scenario, budget, fuel, lockedPlayerIds, excludedPlayerIds]);

  const toggleLock = (id: number) => {
    if (lockedPlayerIds.includes(id)) {
      setLockedPlayerIds(lockedPlayerIds.filter(x => x !== id));
    } else {
      setLockedPlayerIds([...lockedPlayerIds, id]);
      setExcludedPlayerIds(excludedPlayerIds.filter(x => x !== id));
    }
  };

  const toggleExclude = (id: number) => {
    if (excludedPlayerIds.includes(id)) {
      setExcludedPlayerIds(excludedPlayerIds.filter(x => x !== id));
    } else {
      setExcludedPlayerIds([...excludedPlayerIds, id]);
      setLockedPlayerIds(lockedPlayerIds.filter(x => x !== id));
    }
  };

  const handleSyncTeam = async (explicitId?: string) => {
    const target = explicitId || teamId;
    if (!target) {
      alert("Please enter a valid Manager Team ID to sync.");
      return;
    }
    setTeamId(target);
    setLoading(true);
    try {
      const res = await fetch(`/api/sync/${target}?riskMode=${riskMode}`);
      if (!res.ok) throw new Error('Failed to sync manager team squad');
      await fetchData();
      setTab('pitch');
      alert(`⚡ Team ID #${target} synchronized successfully! Strategic recommendations and pitch layout updated.`);
    } catch (err: any) {
      alert(`Team sync error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">Optimizing Strategy...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] p-4 sm:p-6 font-sans">
      {error && (
        <div className="max-w-[1400px] mx-auto mb-4 p-4 bg-rose-500/10 border border-rose-500/50 rounded-2xl text-rose-400 text-xs font-mono">
          <span className="font-bold uppercase mr-2">[Engine Error]:</span> {error}
        </div>
      )}

      {/* 12-Column Grid matching fpl-admin exact structure */}
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-4 auto-rows-min">
        {/* Header (Col 12) */}
        <Header
          data={data}
          riskMode={riskMode}
          setRiskMode={setRiskMode}
          fuel={fuel}
          setFuel={setFuel}
          scenario={scenario}
          setScenario={setScenario}
        />

        {/* Left Metrics Column (Col 1-3) */}
        <MetricsColumn
          data={data}
          riskMode={riskMode}
          scenario={scenario}
          setScenario={setScenario}
          onSyncTeamId={handleSyncTeam}
        />

        {/* Center Primary Content Area (Col 4-9 -> col-span-12 lg:col-span-6) */}
        <div className="col-span-12 lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-3xl overflow-hidden relative shadow-xl min-h-[600px] backdrop-blur-md">
          <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.1) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.1) 40px)` }}></div>

          <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col">
            {/* Navigation Tabs Row */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8">
              <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto justify-center">
                {(['optimizer', 'pitch', 'picks', 'transfers', 'chips', 'performance', 'agent'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      tab === t
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Snapshot & Team Sync Inputs */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full md:w-auto">
                <button
                  onClick={() => alert("Snapshot saved successfully!")}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black uppercase text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Snapshot</span>
                </button>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="TEAM ID"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-[10px] font-mono text-cyan-400 w-24 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => handleSyncTeam()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-lg transition-colors"
                  >
                    SYNC TEAM
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Views */}
            {tab === 'optimizer' && <OptimizerPositioning />}
            {tab === 'pitch' && (
              <PitchView
                data={data}
                onSelectPlayer={setSelectedPlayer}
                scenario={scenario}
                setScenario={setScenario}
              />
            )}
            {tab === 'picks' && (
              <DataGrid
                data={data}
                lockedPlayerIds={lockedPlayerIds}
                excludedPlayerIds={excludedPlayerIds}
                onToggleLock={toggleLock}
                onToggleExclude={toggleExclude}
              />
            )}
            {tab === 'transfers' && (
              <TransferView
                data={data}
                riskMode={riskMode}
                setRiskMode={(mode: string) => setRiskMode(mode as 'safe' | 'risky' | 'value')}
                budget={budget}
                setBudget={setBudget}
                onSelectPlayer={setSelectedPlayer}
                lockedPlayerIds={lockedPlayerIds}
                setLockedPlayerIds={setLockedPlayerIds}
                excludedPlayerIds={excludedPlayerIds}
                setExcludedPlayerIds={setExcludedPlayerIds}
                onSyncTeam={handleSyncTeam}
              />
            )}
            {tab === 'chips' && <ChipAdvisor data={data} />}
            {tab === 'performance' && <PerformanceView data={data} />}
            {tab === 'agent' && <AIAgentView data={data} />}
          </div>
        </div>

        {/* Right Column (Col 10-12 -> col-span-12 lg:col-span-3) */}
        <div className="col-span-12 lg:col-span-3 grid grid-cols-1 gap-4">
          {/* Top Value Picks Card */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-5 flex flex-col shadow-sm backdrop-blur-md">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Top Value Picks (PPM)</h2>
            <div className="space-y-3 flex-grow">
              {data?.topPicks?.mid?.slice(0, 5).map((p, i) => (
                <div key={p.id} className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-200">{p.web_name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{p.position} | €{p.cost.toFixed(1)}M</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-bold text-cyan-400">{(p.ppm || 0).toFixed(2)}</span>
                    <div className="text-[8px] text-slate-500 uppercase font-bold">Pts/€M</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fixtures Schedule */}
          <FixtureList data={data} />
        </div>
      </div>

      {/* Player Modal */}
      <PlayerCard player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
    </div>
  );
}

export default App;
