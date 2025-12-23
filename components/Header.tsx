import React from 'react';
import { Network, FileDown, Share2, Settings, User } from 'lucide-react';

interface HeaderProps {
  onDownloadCode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onDownloadCode }) => {
  return (
    <header className="h-14 bg-vp-900 text-white flex items-center justify-between px-4 border-b border-vp-700 shadow-md z-20 sticky top-0">
      <div className="flex items-center space-x-3">
        <div className="bg-brand-primary p-1.5 rounded-lg shadow-lg shadow-brand-primary/20">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold text-sm tracking-wide">UML GENIUS</h1>
          <span className="text-[10px] text-vp-300 uppercase tracking-wider">Visual Architect</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
         <div className="bg-vp-800/50 px-3 py-1 rounded text-xs text-vp-200 border border-vp-700 hidden md:block backdrop-blur-sm">
           Mode: Édition Standard
         </div>
      </div>

      <div className="flex items-center space-x-4">
        <button 
            onClick={onDownloadCode}
            className="p-2 hover:bg-vp-800 rounded-md transition-colors text-vp-300 hover:text-white flex items-center gap-2 group" 
            title="Exporter le code source (.mmd)"
        >
          <FileDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-medium hidden lg:inline">Exporter Code</span>
        </button>
        <button className="p-2 hover:bg-vp-800 rounded-md transition-colors text-vp-300 hover:text-white" title="Partager">
          <Share2 className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-vp-700 mx-2"></div>
        <button className="flex items-center space-x-2 hover:bg-vp-800 px-2 py-1.5 rounded-md transition-colors">
            <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-xs font-bold ring-2 ring-vp-700">U</div>
        </button>
      </div>
    </header>
  );
};