import React from 'react';
import { Palette, PaintBucket, Type, Activity } from 'lucide-react';
import { ThemeConfig } from '../types';

interface StyleControlsProps {
  config: ThemeConfig;
  onChange: (newConfig: ThemeConfig) => void;
}

export const StyleControls: React.FC<StyleControlsProps> = ({ config, onChange }) => {
  const handleChange = (key: keyof ThemeConfig, value: string) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Palette className="w-3 h-3" /> Styles Visuels
      </h3>
      
      <div className="space-y-3">
        {/* Colors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div> Principal
            </label>
            <input 
              type="color" 
              value={config.primaryColor}
              onChange={(e) => handleChange('primaryColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div> Secondaire
            </label>
            <input 
              type="color" 
              value={config.secondaryColor}
              onChange={(e) => handleChange('secondaryColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Lignes
            </label>
            <input 
              type="color" 
              value={config.lineColor}
              onChange={(e) => handleChange('lineColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
            />
          </div>
           <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 flex items-center gap-2">
              <Type className="w-3 h-3" /> Texte
            </label>
            <input 
              type="color" 
              value={config.textColor}
              onChange={(e) => handleChange('textColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
            />
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Curve Style */}
        <div className="flex flex-col gap-1">
           <label className="text-xs text-gray-600">Forme des liens</label>
           <select 
             value={config.curveStyle} 
             onChange={(e) => handleChange('curveStyle', e.target.value as any)}
             className="text-xs border border-gray-300 rounded p-1 bg-gray-50 focus:outline-none focus:border-brand-primary"
           >
             <option value="basis">Courbe (Basis)</option>
             <option value="linear">Droit (Linear)</option>
             <option value="cardinal">Fluide (Cardinal)</option>
             <option value="step">Escalier (Step)</option>
           </select>
        </div>
      </div>
    </div>
  );
};