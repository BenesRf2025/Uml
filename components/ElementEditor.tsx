import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Type, PaintBucket, Square, ArrowRight, Move, MousePointer2, Minus, MoreHorizontal, Trash2 } from 'lucide-react';

interface ElementEditorProps {
  elementId: string;
  initialText?: string;
  initialColor?: string;
  disableColors?: boolean;
  onSave: (id: string, newText: string | undefined, newColor: string | undefined, newTextColor: string | undefined, newBorderColor: string | undefined, arrowType?: string, borderStyle?: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  type: 'node' | 'actor' | 'edge' | 'other';
}

export const ElementEditor: React.FC<ElementEditorProps> = ({ 
  elementId, initialText, initialColor, disableColors = false, onSave, onDelete, onClose, type 
}) => {
  const [text, setText] = useState(initialText || '');
  const [fillColor, setFillColor] = useState(initialColor || '#ECECFF');
  const [textColor, setTextColor] = useState('#000000');
  const [borderColor, setBorderColor] = useState(type === 'edge' ? initialColor || '#333333' : '#333333');
  const [arrowType, setArrowType] = useState('-->');
  const [borderStyle, setBorderStyle] = useState('solid'); // 'solid' or 'dashed'
  
  // Draggable state
  const [position, setPosition] = useState({ x: window.innerWidth - 320, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  // Reset state when selection changes
  useEffect(() => {
    setText(initialText || (type === 'edge' ? 'Lien' : elementId));
    if (type === 'edge' && initialColor) {
        setBorderColor(initialColor);
    }
    // We don't easily know the current dash array from the SVG without complex parsing, so default to solid
    setBorderStyle('solid'); 
  }, [elementId, initialText, type, initialColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(elementId, text, fillColor, textColor, borderColor, arrowType, borderStyle);
  };

  const handleDelete = () => {
      onDelete(elementId);
  };

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorRef.current) {
        const rect = editorRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setIsDragging(true);
    }
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
              setPosition({
                  x: e.clientX - dragOffset.x,
                  y: e.clientY - dragOffset.y
              });
          }
      };
      
      const handleMouseUp = () => {
          setIsDragging(false);
      };

      if (isDragging) {
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
      }

      return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, dragOffset]);

  const isEdge = type === 'edge';
  const isActor = type === 'actor';

  return (
    <div 
        ref={editorRef}
        style={{ left: position.x, top: position.y }}
        className={`fixed w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 transition-shadow ${isDragging ? 'cursor-grabbing shadow-xl ring-2 ring-brand-primary/20' : ''}`}
    >
      <div 
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl cursor-grab active:cursor-grabbing select-none"
      >
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
          {isEdge ? <ArrowRight className="w-3 h-3 text-brand-primary" /> : <MousePointer2 className="w-3 h-3 text-brand-primary" />}
          {isEdge ? 'Propriétés du Lien' : `Éditer : ${elementId}`}
        </h3>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50" 
                title="Supprimer l'élément"
                onMouseDown={(e) => e.stopPropagation()}
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <div className="w-px h-3 bg-gray-300"></div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors" onMouseDown={(e) => e.stopPropagation()}>
                <X className="w-4 h-4" />
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4" onMouseDown={(e) => e.stopPropagation()}>
        {/* Text Input */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Type className="w-3 h-3" /> {isEdge ? 'Étiquette du lien' : 'Nom / Texte'}
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
            placeholder="Texte..."
          />
        </div>

        {/* Arrow Type Selector (Only for Edges) */}
        {isEdge && (
           <div className="space-y-1">
             <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
               <ArrowRight className="w-3 h-3" /> Style de flèche
             </label>
             <div className="grid grid-cols-2 gap-2">
               <button type="button" onClick={() => setArrowType('-->')} className={`px-2 py-1 text-xs border rounded ${arrowType === '-->' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}>Normal --&gt;</button>
               <button type="button" onClick={() => setArrowType('-.->')} className={`px-2 py-1 text-xs border rounded ${arrowType === '-.->' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}>Pointillé -. -&gt;</button>
               <button type="button" onClick={() => setArrowType('==>')} className={`px-2 py-1 text-xs border rounded ${arrowType === '==>' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}>Gras ==&gt;</button>
               <button type="button" onClick={() => setArrowType('---')} className={`px-2 py-1 text-xs border rounded ${arrowType === '---' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200'}`}>Ligne ---</button>
             </div>
           </div>
        )}

        {/* Border Style Selector (Only for Nodes/Actors) */}
        {!isEdge && !disableColors && (
           <div className="space-y-1">
             <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
               <MoreHorizontal className="w-3 h-3" /> {isActor ? 'Style de ligne de vie' : 'Style de trait'}
             </label>
             <div className="flex gap-2">
               <button 
                 type="button" 
                 onClick={() => setBorderStyle('solid')} 
                 className={`flex-1 py-1.5 px-2 text-xs border rounded flex items-center justify-center gap-2 ${borderStyle === 'solid' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                 title="Ligne continue"
               >
                 <Minus className="w-4 h-4" /> Continu
               </button>
               <button 
                 type="button" 
                 onClick={() => setBorderStyle('dashed')} 
                 className={`flex-1 py-1.5 px-2 text-xs border rounded flex items-center justify-center gap-2 ${borderStyle === 'dashed' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                 title="Ligne pointillée (Stroke Dasharray)"
               >
                 <MoreHorizontal className="w-4 h-4" /> Pointillé
               </button>
             </div>
           </div>
        )}

        {/* Color Pickers Grid */}
        {!disableColors && (
          <div className="grid grid-cols-3 gap-2">
              {!isEdge && (
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                          <PaintBucket className="w-3 h-3" /> Fond
                      </label>
                      <input
                          type="color"
                          value={fillColor}
                          onChange={(e) => setFillColor(e.target.value)}
                          className="w-full h-8 p-0 border-0 rounded cursor-pointer"
                          title="Couleur de remplissage"
                      />
                  </div>
              )}
              {!isEdge && (
                  <div className="space-y-1">
                      <label className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                          <Type className="w-3 h-3" /> Texte
                      </label>
                      <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-full h-8 p-0 border-0 rounded cursor-pointer"
                          title="Couleur du texte"
                      />
                  </div>
              )}
              <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                      <Square className="w-3 h-3" /> {isEdge ? 'Ligne' : (isActor ? 'Ligne/Bord' : 'Bordure')}
                  </label>
                  <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-full h-8 p-0 border-0 rounded cursor-pointer"
                      title={isEdge ? "Couleur du lien" : "Couleur de la ligne de vie et bordure"}
                  />
              </div>
          </div>
        )}
        
        {disableColors && (
          <div className="bg-blue-50 text-blue-800 text-[10px] p-2 rounded border border-blue-100">
            Le style n'est pas supporté pour ce type d'élément.
          </div>
        )}

        <div className="pt-2 border-t border-gray-100 flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fermer
          </button>
          <button 
            type="submit" 
            className="px-3 py-1.5 text-xs font-medium text-white bg-brand-primary hover:bg-blue-600 rounded-lg shadow-sm flex items-center gap-1 transition-colors"
          >
            <Check className="w-3 h-3" /> Appliquer
          </button>
        </div>
      </form>
    </div>
  );
};