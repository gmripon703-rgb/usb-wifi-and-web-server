import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CornerDownLeft,
  Info,
  ShieldCheck,
  Terminal as TerminalIcon,
  Trash2,
} from 'lucide-react';
import { TerminalCommandResult } from '../types';
import { api } from '../services/api';

export const TerminalView: React.FC = () => {
  const [history, setHistory] = useState<TerminalCommandResult[]>([
    {
      command: 'ip route show',
      exitCode: 0,
      stdout: `default via 192.168.1.1 dev wlan0 proto dhcp src 192.168.1.145 metric 600 \n192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.145 metric 600 \n192.168.50.0/24 dev wlan1 proto kernel scope link src 192.168.50.1`,
      stderr: '',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [commandHistory, setCommandHistory] = useState<string[]>(['ip route show']);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const quickCommands = [
    'ip addr show',
    'ip route show',
    'iw dev',
    'rfkill list',
    'nmcli device status',
    'nft list table inet wifi_dashboard_nat',
    'ping -c 3 1.1.1.1',
    'cat /proc/sys/net/ipv4/ip_forward',
  ];

  const handleRunCommand = async (cmdToRun?: string) => {
    const command = (cmdToRun !== undefined ? cmdToRun : currentInput).trim();
    if (!command || isExecuting) return;

    setIsExecuting(true);
    setCurrentInput('');
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    try {
      const res = await api.executeTerminal(command);
      setHistory((prev) => [...prev, res]);
    } catch (err: unknown) {
      setHistory((prev) => [
        ...prev,
        {
          command,
          exitCode: 1,
          stdout: '',
          stderr: err instanceof Error ? err.message : 'Execution error',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRunCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIndex);
        setCurrentInput(commandHistory[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIndex = historyIndex + 1;
        if (nextIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(nextIndex);
          setCurrentInput(commandHistory[nextIndex]);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white">Controlled Administrative Terminal: </span>
            This console executes allowlisted Linux diagnostic utilities (<code className="text-cyan-400 font-mono">ip</code>, <code className="text-cyan-400 font-mono">iw</code>, <code className="text-cyan-400 font-mono">nmcli</code>, <code className="text-cyan-400 font-mono">nft</code>, <code className="text-cyan-400 font-mono">rfkill</code>, <code className="text-cyan-400 font-mono">ping</code>) with restricted sudo privileges and audit logging.
          </div>
        </div>
      </div>

      {/* Quick Command Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-mono">Quick Utilities:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => handleRunCommand(cmd)}
            disabled={isExecuting}
            className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 font-mono text-[11px] border border-slate-800 transition-colors disabled:opacity-50"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal Window */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono shadow-2xl flex flex-col h-[520px]">
        {/* Terminal Header */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400 select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-xs text-slate-300 font-mono">root@ubuntu-dashboard:~ (restricted)</span>
          </div>
          <button
            onClick={() => setHistory([])}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear terminal window"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text">
          <div className="text-slate-500 leading-relaxed">
            Linux AMD64 Wi-Fi Repeater & AP Management Diagnostic Shell<br />
            Type help or select any quick command above.
          </div>

          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="text-emerald-400 font-bold">admin@ubuntu:~$</span>
                <span className="text-white font-semibold">{item.command}</span>
              </div>
              {item.stdout && (
                <pre className="text-slate-300 whitespace-pre-wrap pl-4 leading-relaxed overflow-x-auto">
                  {item.stdout}
                </pre>
              )}
              {item.stderr && (
                <pre className="text-rose-400 whitespace-pre-wrap pl-4 leading-relaxed overflow-x-auto">
                  {item.stderr}
                </pre>
              )}
            </div>
          ))}

          {isExecuting && (
            <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
              <span>admin@ubuntu:~$</span>
              <span>Running command...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Terminal Prompt Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <span className="text-emerald-400 text-xs font-bold shrink-0">admin@ubuntu:~$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder="Type restricted command (e.g. ip route show, iw dev, ping -c 3 1.1.1.1)..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-slate-600 font-mono"
            autoFocus
          />
          <button
            onClick={() => handleRunCommand()}
            disabled={!currentInput.trim() || isExecuting}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-medium transition-colors disabled:opacity-40"
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
};
