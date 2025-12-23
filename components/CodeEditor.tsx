import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50">
        <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Éditeur Source (Mermaid)</h2>
        <button 
          onClick={handleCopy} 
          className="text-gray-500 hover:text-brand-primary transition-colors flex items-center space-x-1 text-xs"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copié' : 'Copier'}</span>
        </button>
      </div>
      <textarea
        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none focus:ring-0 text-gray-800 bg-white leading-relaxed"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Le code Mermaid apparaîtra ici..."
      />
    </div>
  );
};