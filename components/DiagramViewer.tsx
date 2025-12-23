import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize, Move, ImageDown, MousePointerClick, Grab, RotateCw } from 'lucide-react';
import { ThemeConfig } from '../types';

interface DiagramViewerProps {
  code: string;
  config: ThemeConfig;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onRotate?: () => void;
  onElementClick?: (id: string, type: 'node' | 'actor' | 'edge' | 'other', currentText?: string) => void;
  onElementMove?: (id: string, x: number, y: number) => void;
}

export const DiagramViewer: React.FC<DiagramViewerProps> = ({ 
  code, config, scale, onZoomIn, onZoomOut, onFit, onRotate, onElementClick, onElementMove
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Canvas Panning state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Element Dragging state
  const [draggingNode, setDraggingNode] = useState<{ id: string, startX: number, startY: number, initialTransformX: number, initialTransformY: number } | null>(null);
  
  // Refs for logic
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const elementOffsets = useRef<Map<string, {x: number, y: number}>>(new Map());
  
  // Refs for animation optimization
  const rafRef = useRef<number | null>(null);
  const latestDragPos = useRef({ x: 0, y: 0 });

  // Parse positions from code comments "%% position: ID X Y"
  useEffect(() => {
    elementOffsets.current.clear();
    const positionRegex = /%%\s*position:\s*([\w-]+)\s+([-\d.]+)\s+([-\d.]+)/g;
    let match;
    while ((match = positionRegex.exec(code)) !== null) {
        const id = match[1];
        const x = parseFloat(match[2]);
        const y = parseFloat(match[3]);
        if (!isNaN(x) && !isNaN(y)) {
            elementOffsets.current.set(id, { x, y });
        }
    }
  }, [code]);

  // Re-initialize mermaid when config changes
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: config.primaryColor,
        primaryTextColor: config.textColor,
        primaryBorderColor: config.secondaryColor,
        lineColor: config.lineColor,
        secondaryColor: config.secondaryColor,
        tertiaryColor: '#ffffff',
      },
      flowchart: { curve: config.curveStyle, htmlLabels: true },
      sequence: { actorMargin: 50 },
      fontFamily: 'Inter, sans-serif'
    });
  }, [config]);

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      if (!code) {
        setSvgContent('');
        return;
      }
      
      try {
        const id = `mermaid-${Date.now()}`;
        if(code.trim().length === 0) return;

        mermaid.mermaidAPI.reset();
        
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        if (isMounted) {
          setError("Erreur de syntaxe UML. Veuillez vérifier le code.");
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, config]);

  // Helper to get robust ID
  const getElementId = (element: HTMLElement) => {
      if (element.dataset.id) return element.dataset.id;
      const parts = element.id.split('-');
      if (parts.length > 1) {
          return parts[1]; 
      }
      return element.id;
  };

  // Helper to parse transform attribute
  const getTransform = (element: HTMLElement) => {
      const transform = element.getAttribute('transform');
      if (!transform) return { x: 0, y: 0 };
      
      const match = /translate\(([^,)\s]+)[,\s]*\s*([^)]*)\)/.exec(transform);
      if (match) {
          return {
              x: parseFloat(match[1]) || 0,
              y: parseFloat(match[2]) || 0
          };
      }
      return { x: 0, y: 0 };
  };

  // Apply stored offsets to SVG elements after render
  useEffect(() => {
      if (!containerRef.current || elementOffsets.current.size === 0) return;

      const svgElement = containerRef.current.querySelector('svg');
      if (!svgElement) return;

      const nodes = svgElement.querySelectorAll('.node, .actor');
      nodes.forEach(node => {
          const htmlNode = node as HTMLElement;
          const cleanId = getElementId(htmlNode);
          const offset = elementOffsets.current.get(cleanId);
          
          if (offset) {
              const current = getTransform(htmlNode);
              htmlNode.setAttribute('transform', `translate(${current.x + offset.x}, ${current.y + offset.y})`);
          }
      });
  }, [svgContent]);

  // Window event listeners for dragging with requestAnimationFrame
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isPointerDownRef.current) return;
      
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
          hasMovedRef.current = true;
          
          if (draggingNode) {
              // Calculate target position based on total delta
              const scaledDeltaX = (e.clientX - draggingNode.startX) / scale;
              const scaledDeltaY = (e.clientY - draggingNode.startY) / scale;
              
              const newX = draggingNode.initialTransformX + scaledDeltaX;
              const newY = draggingNode.initialTransformY + scaledDeltaY;

              // Store latest position for rAF
              latestDragPos.current = { x: newX, y: newY };

              // Schedule DOM update if not already pending
              if (!rafRef.current) {
                  rafRef.current = requestAnimationFrame(() => {
                      const svgElement = containerRef.current?.querySelector('svg');
                      const nodeEl = svgElement?.getElementById(draggingNode.id);
                      if (nodeEl) {
                          nodeEl.setAttribute('transform', `translate(${latestDragPos.current.x}, ${latestDragPos.current.y})`);
                      }
                      rafRef.current = null;
                  });
              }
          } else {
              setIsPanning(true);
              // Panning updates react state, so we don't use rAF here to avoid sync issues with render
              setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
          }
      }
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleWindowMouseUp = (e: MouseEvent) => {
      isPointerDownRef.current = false;
      
      // Cancel any pending animation frame
      if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
      }
      
      if (draggingNode && hasMovedRef.current) {
         const totalDeltaX = (e.clientX - draggingNode.startX) / scale;
         const totalDeltaY = (e.clientY - draggingNode.startY) / scale;
         
         const nodeEl = document.getElementById(draggingNode.id);
         const cleanId = nodeEl ? getElementId(nodeEl) : draggingNode.id; 

         const prevOffset = elementOffsets.current.get(cleanId) || { x: 0, y: 0 };
         
         const finalX = prevOffset.x + totalDeltaX;
         const finalY = prevOffset.y + totalDeltaY;
         
         if (onElementMove) {
             onElementMove(cleanId, finalX, finalY);
         }
      }

      setDraggingNode(null);
      setTimeout(() => setIsPanning(false), 50);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [draggingNode, scale, onElementMove]);

  // Attach listeners to SVG elements
  useEffect(() => {
    if (!containerRef.current) return;
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const attachSmartHandlers = (element: HTMLElement, type: 'node' | 'actor' | 'edge', elementIdOverride?: string) => {
        const cleanId = elementIdOverride || getElementId(element);
        
        let text = '';
        if (type === 'node') {
             const textEl = element.querySelector('.nodeLabel') || element.querySelector('span');
             text = textEl?.textContent || cleanId;
        } else if (type === 'actor') {
             const textEl = element.querySelector('text') || element.querySelector('tspan');
             text = textEl?.textContent || cleanId;
        } else {
             const textEl = element.querySelector('span') || element.querySelector('text');
             text = textEl?.textContent || '';
        }

        element.style.cursor = 'move'; 
        element.onmousedown = (e) => {
            if(e.button !== 0) return;
            e.stopPropagation(); 
            
            isPointerDownRef.current = true;
            hasMovedRef.current = false;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            
            const current = getTransform(element);

            setDraggingNode({
                id: element.id,
                startX: e.clientX,
                startY: e.clientY,
                initialTransformX: current.x,
                initialTransformY: current.y
            });
        };
        
        element.onclick = (e) => {
            e.stopPropagation();
            if (!hasMovedRef.current && onElementClick) {
                onElementClick(cleanId, type, text);
            }
        };
    };

    // 1. Flowchart Nodes
    const nodes = svgElement.querySelectorAll('.node');
    nodes.forEach(node => {
      attachSmartHandlers(node as HTMLElement, 'node');
    });

    // 2. Sequence Actors & Lifelines
    const actors: {id: string, el: HTMLElement, x: number}[] = [];
    const actorElements = svgElement.querySelectorAll('.actor, [id^="actor-"]');
    
    // First pass: Identify Actors and their visual center
    actorElements.forEach(el => {
        let target = el as HTMLElement;
        if(target.tagName !== 'g' && target.parentElement?.tagName === 'g') {
            target = target.parentElement as HTMLElement;
        }
        if (!target.id) target.id = `actor-${Math.random().toString(36).substr(2, 9)}`;
        
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        
        actors.push({ id: target.id, el: target, x: centerX });
        attachSmartHandlers(target, 'actor');
    });

    // Second pass: Find vertical lines (lifelines) and link them to actors
    const lines = svgElement.querySelectorAll('line');
    lines.forEach(line => {
        const lineRect = line.getBoundingClientRect();
        // Check if line is roughly vertical
        if (lineRect.height > lineRect.width) {
            const lineX = lineRect.left + lineRect.width / 2;
            
            // Find closest actor
            const closestActor = actors.find(a => Math.abs(a.x - lineX) < 10); // 10px tolerance
            
            if (closestActor) {
                // Determine if this line is already styled (dashed) for UI feedback if needed
                // But mainly we want to make it clickable to open the actor editor
                const htmlLine = line as unknown as HTMLElement;
                htmlLine.style.cursor = 'pointer';
                htmlLine.onclick = (e) => {
                   e.stopPropagation();
                   e.preventDefault();
                   if (onElementClick && !isPanning) { // Ensure we aren't panning
                       const textEl = closestActor.el.querySelector('text') || closestActor.el.querySelector('tspan');
                       const text = textEl?.textContent || getElementId(closestActor.el);
                       onElementClick(getElementId(closestActor.el), 'actor', text);
                   }
                };
                
                // Optional: visual hover effect
                htmlLine.onmouseenter = () => { htmlLine.style.strokeWidth = '4px'; };
                htmlLine.onmouseleave = () => { htmlLine.style.strokeWidth = ''; };
            }
        }
    });

    // 3. Edges (Click only)
    const edgeLabels = svgElement.querySelectorAll('.edgeLabel');
    edgeLabels.forEach((label, index) => {
        const htmlLabel = label as HTMLElement;
        htmlLabel.style.cursor = 'pointer';
        htmlLabel.onmousedown = (e) => e.stopPropagation();
        htmlLabel.onclick = (e) => {
             e.stopPropagation();
             const textEl = htmlLabel.querySelector('span') || htmlLabel.querySelector('text');
             if (onElementClick) onElementClick(index.toString(), 'edge', textEl?.textContent || '');
        };
    });

  }, [svgContent, onElementClick, isPanning]);

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram_edited.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPointerDownRef.current = true;
    hasMovedRef.current = false; 
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleFitView = () => {
      setPan({x: 0, y: 0});
      onFit();
  };

  return (
    <div className="relative w-full h-full bg-vp-50 overflow-hidden flex flex-col select-none">
       {/* Toolbar */}
       <div className="absolute top-4 right-4 flex flex-col gap-2 bg-white shadow-lg rounded-lg border border-gray-200 p-1 z-10">
          <button onClick={onZoomIn} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Zoom In">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={onZoomOut} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Zoom Out">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={handleFitView} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Centrer la vue">
            <Maximize className="w-5 h-5" />
          </button>
          {onRotate && (
             <button onClick={onRotate} className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors" title="Pivoter (Vertical/Horizontal)">
                <RotateCw className="w-5 h-5" />
             </button>
          )}
          <div className="h-px bg-gray-200 mx-2 my-1"></div>
          <button onClick={handleDownloadSvg} className="p-2 hover:bg-brand-primary hover:text-white rounded text-gray-600 transition-colors" title="Télécharger Image Propre (SVG)">
            <ImageDown className="w-5 h-5" />
          </button>
       </div>
       
       {/* Hint Overlay */}
       <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
          <div className="bg-white/80 backdrop-blur text-xs text-gray-500 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
            <MousePointerClick className="w-3 h-3 text-brand-primary" />
            <span>Cliquez sur les éléments</span>
          </div>
          <div className="bg-white/80 backdrop-blur text-xs text-gray-500 px-3 py-1.5 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
            <Grab className="w-3 h-3 text-brand-primary" />
            <span>Glissez pour ajuster la position</span>
          </div>
       </div>

      <div 
        className={`flex-1 overflow-hidden flex items-center justify-center p-8 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        ref={containerRef}
        onMouseDown={handleMouseDown}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center text-red-500 p-6 bg-white rounded-xl border border-red-100 shadow-sm max-w-md text-center">
             <span className="font-semibold mb-2">Impossible de rendre le diagramme</span>
             <p className="text-sm text-gray-500 mb-4">Il y a une erreur dans la syntaxe Mermaid.</p>
             <pre className="text-xs bg-red-50 p-3 rounded border border-red-100 text-left w-full overflow-x-auto">{error}</pre>
          </div>
        ) : svgContent ? (
          <div 
            dangerouslySetInnerHTML={{ __html: svgContent }} 
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, 
              transformOrigin: 'center center',
              transition: (isPanning || draggingNode) ? 'none' : 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              pointerEvents: 'none' // Visual wrapper
            }}
            className="shadow-xl bg-white p-8 rounded-lg"
          />
        ) : (
          <div className="text-gray-400 flex flex-col items-center select-none">
            <Move className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-medium text-lg text-gray-300">Votre architecture prend vie ici</p>
          </div>
        )}
      </div>
      
      {/* CSS fix to allow pointer events on SVG children */}
      <style>{`
        .node, .actor, .edgeLabel, g > rect, g > text, line {
          pointer-events: auto !important;
          touch-action: none;
        }
      `}</style>
    </div>
  );
};