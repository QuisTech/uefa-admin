import React, { useState } from 'react';
import { RecommendationResponse } from '../types';
import { Bot, Send, Sparkles, User, Shield } from 'lucide-react';

interface AIAgentViewProps {
  data: RecommendationResponse | null;
}

export const AIAgentView: React.FC<AIAgentViewProps> = ({ data }) => {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    {
      sender: 'agent',
      text: `Hello! I am your UEFA Champions League Quant AI Agent. I have analyzed live player stats, ball recoveries, Player of the Match rates, and Top 1k Manager Herd consensus for Matchday ${data?.nextEventId || 1}. Ask me anything about captaincy, transfers, or team selection!`
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);

    setTimeout(() => {
      let reply = "Based on our Quant LP Solver, Mbappé and Haaland remain top captaincy options due to high xG and 2x multiplier scaling. Reallocating budget to ball-recovery midfielders like Barella or Valverde also yields consistent baseline returns.";
      if (/captain|cap/i.test(userMsg)) {
        reply = `For Matchday ${data?.nextEventId || 1}, our engine recommends ${data?.captain.web_name || 'K. Mbappé'} as Captain (${data?.captain.xP.toFixed(1)} xP) with ${data?.viceCaptain.web_name || 'E. Haaland'} as Vice-Captain.`;
      } else if (/transfer|sell|buy/i.test(userMsg)) {
        reply = `In SAFE mode, we prioritize market defense by locking in top consensus Starting Weapons (${data?.topManagerInsight?.eliteConsensusPicks.slice(0, 3).join(', ') || 'Mbappé, Haaland, Yamal'}) while targeting differential value enablers for flexibility.`;
      }

      setMessages(prev => [...prev, { sender: 'agent', text: reply }]);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            AI Optimizer Agent / Beta Pilot
          </h2>
          <p className="text-xs text-slate-400">
            Conversational LLM reasoning combined with mathematical simulation
          </p>
        </div>
      </div>

      {/* Chat Box */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 h-[480px] flex flex-col justify-between">
        <div className="overflow-y-auto space-y-3 p-2 pr-4 flex-1">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                msg.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-cyan-400 border border-slate-700'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-3 rounded-2xl text-xs max-w-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-200'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
          <input
            type="text"
            placeholder="Ask your AI Quant Agent..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={handleSend}
            className="p-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-md transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
