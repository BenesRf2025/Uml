import React, { useState } from 'react';
import { Sparkles, SendHorizontal, Loader2 } from 'lucide-react';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onGenerate(prompt);
      setPrompt('');
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 shadow-xl z-20">
      <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-center gap-2">
        <div className="absolute left-4 text-brand-primary animate-pulse">
           {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </div>
        
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Décrivez votre diagramme (ex: 'Séquence : API Gateway appelle Auth Service...')..."
          className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all text-sm shadow-sm"
          disabled={isLoading}
        />
        
        <button 
          type="submit"
          disabled={!prompt.trim() || isLoading}
          className="absolute right-2 p-1.5 bg-brand-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-brand-primary transition-colors"
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </form>
      <div className="max-w-4xl mx-auto mt-2 flex gap-2 overflow-x-auto pb-1 text-xs text-gray-500 no-scrollbar">
          <span className="whitespace-nowrap px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setPrompt("Séquence: Processus d'inscription utilisateur avec validation email")}>📝 Séquence Inscription</span>
          <span className="whitespace-nowrap px-3 py-1 bg-gray-100 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setPrompt("Diagramme de classe pour un système de gestion scolaire")}>🎓 Classes École</span>
          <span className="whitespace-nowrap px-3 py-1 bg-gray-100 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setPrompt("Graph TD: Workflow de publication d'article")}>📰 Workflow Article</span>
          <span className="whitespace-nowrap px-3 py-1 bg-gray-100 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => setPrompt("Mindmap stratégie SEO 2024")}>🧠 Mindmap SEO</span>
      </div>
    </div>
  );
};