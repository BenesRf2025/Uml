import React, { useState } from 'react';
import { Header } from './components/Header';
import { DiagramViewer } from './components/DiagramViewer';
import { CodeEditor } from './components/CodeEditor';
import { PromptInput } from './components/PromptInput';
import { ToolPalette } from './components/ToolPalette';
import { StyleControls } from './components/StyleControls';
import { ElementEditor } from './components/ElementEditor';
import { generateUML } from './services/geminiService';
import { PanelLeftClose, PanelLeftOpen, Undo, Redo, FilePlus, Palette } from 'lucide-react';
import { DiagramType, ThemeConfig } from './types';

const TEMPLATES = {
  [DiagramType.Flowchart]: `graph TD
    A[Start] --> B{Is it valid?}
    B -->|Yes| C[Process]
    B -->|No| D[Reject]
    C --> E[End]
    D --> E`,
  [DiagramType.Sequence]: `sequenceDiagram
    autonumber
    participant Client
    participant API as API Gateway
    participant Service as Auth Service
    participant DB as Database

    Client->>API: Login Request (User, Pass)
    activate API
    API->>Service: Validate Credentials
    activate Service
    Service->>DB: Query User
    activate DB
    DB-->>Service: User Data
    deactivate DB
    Service-->>API: Token Generated
    deactivate Service
    API-->>Client: 200 OK (Token)
    deactivate API`,
  [DiagramType.Class]: `classDiagram
    class User {
      +String username
      +String password
      +login()
      +logout()
    }
    class Admin {
      +grantPermission()
    }
    User <|-- Admin : inherits`,
  [DiagramType.State]: `stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : Submit
    Processing --> Success : OK
    Processing --> Error : Fail
    Success --> [*]
    Error --> Idle : Retry`,
  [DiagramType.ER]: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    PRODUCT ||--o{ LINE-ITEM : "included in"`,
  [DiagramType.Gantt]: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    section Design
    Prototype : 2023-01-01, 30d
    Test      : 20d
    section Dev
    Frontend  : 2023-02-01, 45d
    Backend   : 2023-02-15, 60d`,
  [DiagramType.Mindmap]: `mindmap
    root((Project))
      Development
        Frontend
        Backend
      Marketing
        SEO
        Social Media`,
  [DiagramType.UseCase]: `graph LR
    User((Utilisateur))
    Admin((Administrateur))
    
    subgraph Système
        UC1(Se connecter)
        UC2(Gérer les profils)
        UC3(Consulter les rapports)
    end
    
    User --> UC1
    User --> UC3
    Admin --> UC1
    Admin --> UC2
    UC2 -.->|<<include>>| UC1`,
  [DiagramType.Package]: `classDiagram
    namespace Presentation {
      class UIController
      class ViewModel
    }
    namespace BusinessLogic {
      class Service
      class DomainModel
    }
    namespace DataAccess {
      class Repository
      class DatabaseContext
    }
    
    Presentation ..> BusinessLogic
    BusinessLogic ..> DataAccess`,
  [DiagramType.Deployment]: `graph TD
    subgraph Cloud [AWS Cloud]
        node1[Load Balancer]
        subgraph Cluster [App Cluster]
            node2[App Server 1]
            node3[App Server 2]
        end
        db[(Primary DB)]
        cache[(Redis Cache)]
    end
    
    client((Client Browser)) -- HTTPS --> node1
    node1 -- HTTP --> node2
    node1 -- HTTP --> node3
    node2 --> db
    node3 --> db
    node2 -.-> cache`
};

const DIAGRAM_OPTIONS = [
    { label: 'Flowchart (Processus)', value: DiagramType.Flowchart },
    { label: 'Séquence (Interactions)', value: DiagramType.Sequence },
    { label: 'Classe (Structure)', value: DiagramType.Class },
    { label: 'État (Cycle de vie)', value: DiagramType.State },
    { label: 'Cas d\'utilisation (Besoins)', value: DiagramType.UseCase },
    { label: 'Paquetage (Architecture)', value: DiagramType.Package },
    { label: 'Déploiement (Infra)', value: DiagramType.Deployment },
    { label: 'Entité-Relation (Données)', value: DiagramType.ER },
    { label: 'Gantt (Planning)', value: DiagramType.Gantt },
    { label: 'Mindmap (Idées)', value: DiagramType.Mindmap },
];

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#e0e7ff',
  secondaryColor: '#f3f4f6',
  lineColor: '#6366f1',
  textColor: '#1e1b4b',
  curveStyle: 'basis'
};

export default function App() {
  const [code, setCode] = useState<string>(TEMPLATES[DiagramType.Sequence]);
  const [currentType, setCurrentType] = useState<DiagramType>(DiagramType.Sequence);
  const [showEditor, setShowEditor] = useState<boolean>(true);
  const [showStyles, setShowStyles] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<string[]>([TEMPLATES[DiagramType.Sequence]]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(DEFAULT_THEME);

  // Selection state
  const [selectedElement, setSelectedElement] = useState<{id: string, type: 'node' | 'actor' | 'edge' | 'other', text?: string} | null>(null);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const pushToHistory = (newCode: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCode);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCode(newCode);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCode(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCode(history[historyIndex + 1]);
    }
  };

  const handleGenerate = async (prompt: string) => {
    setIsLoading(true);
    try {
      const generatedCode = await generateUML(prompt, code);
      pushToHistory(generatedCode);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as DiagramType;
    setCurrentType(type);
    if (TEMPLATES[type]) {
        pushToHistory(TEMPLATES[type]);
    }
  };

  const handleToolInsert = (snippet: string) => {
    const newCode = code + snippet;
    pushToHistory(newCode);
  };

  const handleRotate = () => {
    // Only works for Flowcharts and similar graphs that support TD/LR
    let newCode = code;
    
    // Toggle Flowchart/Graph
    if (/graph\s+(TD|TB|LR|RL)/.test(code)) {
        newCode = code.replace(/graph\s+(TD|TB|LR|RL)/, (match, dir) => {
            return `graph ${dir === 'TD' || dir === 'TB' ? 'LR' : 'TD'}`;
        });
    } 
    // Toggle State Diagram
    else if (/stateDiagram-v2/.test(code)) {
        if (/direction\s+(LR|TB)/.test(code)) {
             newCode = code.replace(/direction\s+(LR|TB)/, (match, dir) => {
                return `direction ${dir === 'LR' ? 'TB' : 'LR'}`;
             });
        } else {
            // Inject direction
            newCode = code.replace('stateDiagram-v2', 'stateDiagram-v2\n    direction LR');
        }
    }
    
    if (newCode !== code) {
        pushToHistory(newCode);
    }
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleElementClick = (id: string, type: 'node' | 'actor' | 'edge' | 'other', currentText?: string) => {
      setSelectedElement({ id, type, text: currentText });
  };

  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  };

  const handleElementMove = (id: string, x: number, y: number) => {
     let newCode = code;
     // Robust regex using escaped ID
     const safeId = escapeRegExp(id);
     const posRegex = new RegExp(`%%\\s*position:\\s*${safeId}\\s+([-\\d.]+)\\s+([-\\d.]+)`);
     
     if (posRegex.test(newCode)) {
         newCode = newCode.replace(posRegex, `%% position: ${id} ${x.toFixed(1)} ${y.toFixed(1)}`);
     } else {
         // Append to end
         newCode = newCode.trim() + `\n%% position: ${id} ${x.toFixed(1)} ${y.toFixed(1)}`;
     }
     
     pushToHistory(newCode);
  };

  const handleElementDelete = (id: string) => {
      if (!selectedElement) return;

      const lines = code.split('\n');
      let newCode = "";

      if (selectedElement.type === 'edge') {
          // Edge Deletion: Try to find the line with the specific label
          // If no label, it's risky to delete by index, but we can try context (not implemented here for safety)
          if (selectedElement.text) {
              const safeText = escapeRegExp(selectedElement.text);
              // Remove lines that contain the edge text AND some form of arrow/line syntax
              newCode = lines.filter(line => {
                  const hasArrow = /[-=.>]+/.test(line);
                  const hasText = line.includes(selectedElement.text || '');
                  // If it has both arrow and the specific text label, filter it out
                  return !(hasArrow && hasText);
              }).join('\n');
          } else {
             newCode = code; // Safety fallback
             alert("Impossible de supprimer un lien sans texte de manière fiable.");
          }
      } else {
          // Node/Actor Deletion: Remove any line containing the ID as a whole word
          // This matches: "A" in "A --> B", "participant A", "style A fill:..."
          // Use boundary \b to avoid deleting "AB" when deleting "A"
          const regex = new RegExp(`\\b${escapeRegExp(id)}\\b`);
          
          newCode = lines.filter(line => !regex.test(line)).join('\n');
      }

      pushToHistory(newCode);
      setSelectedElement(null);
  };

  const handleElementSave = (id: string, newText: string | undefined, newFill: string | undefined, newTextCol: string | undefined, newBorder: string | undefined, arrowType?: string, borderStyle?: string) => {
      let updatedCode = code;

      // Handle Edge (Link) Editing specifically
      if (selectedElement?.type === 'edge') {
         const oldText = selectedElement.text || '';
         
         // 1. Text & Arrow Type Update
         if (oldText && (newText || arrowType)) {
             const safeOldText = escapeRegExp(oldText);
             const lineRegex = new RegExp(`([-=.>]+)(\\s*)(\\|)(${safeOldText})(\\|)`);
             
             updatedCode = updatedCode.replace(lineRegex, (match, arrow, space, pipe1, content, pipe2) => {
                 const finalArrow = arrowType || arrow;
                 const finalText = newText || content;
                 return `${finalArrow}${space}${pipe1}${finalText}${pipe2}`;
             });
         }

         // 2. Color Update (linkStyle) - Colors the Link/Edge
         // In Mermaid Flowcharts, linkStyle X stroke:color works.
         const supportsLinkStyle = [DiagramType.Flowchart, DiagramType.Deployment, DiagramType.UseCase, DiagramType.State].includes(currentType);
         
         if (supportsLinkStyle && newBorder) {
             const linkIndex = parseInt(id, 10);
             if (!isNaN(linkIndex)) {
                 const linkStyleRegex = new RegExp(`linkStyle\\s+${linkIndex}\\s+.*(\\n|$)`, 'g');
                 updatedCode = updatedCode.replace(linkStyleRegex, '');
                 updatedCode = updatedCode.trim();
                 // Apply stroke color to the link
                 updatedCode += `\nlinkStyle ${linkIndex} stroke:${newBorder},stroke-width:2px,fill:none`;
             }
         }

         pushToHistory(updatedCode);
         setSelectedElement(null);
         return;
      }

      // Handle Nodes/Actors Editing
      // 1. Update Text/Label
      if (newText) {
          if (currentType === DiagramType.Flowchart || currentType === DiagramType.State || currentType === DiagramType.UseCase || currentType === DiagramType.Deployment) {
              const regex = new RegExp(`(${id}\\s*[\\(\\[\\{\\>]+)(.*?)([\\)\\]\\}]+)`, 'g');
              updatedCode = updatedCode.replace(regex, `$1${newText}$3`);
          } else if (currentType === DiagramType.Sequence) {
              const aliasRegex = new RegExp(`(participant\\s+${id}\\s+as\\s+")(.*?)(")`);
              if (aliasRegex.test(updatedCode)) {
                   updatedCode = updatedCode.replace(aliasRegex, `$1${newText}$3`);
              }
          }
      }

      // 2. Update Style (Colors & Border Style)
      const supportsGraphStyle = [
          DiagramType.Flowchart, 
          DiagramType.State, 
          DiagramType.UseCase, 
          DiagramType.Deployment
      ].includes(currentType);

      if (newFill || newTextCol || newBorder || borderStyle) {
          if (supportsGraphStyle) {
              // Flowchart/Graph Style
              const styleRegex = new RegExp(`style\\s+${id}\\s+.*(\\n|$)`, 'g');
              updatedCode = updatedCode.replace(styleRegex, '');
              updatedCode = updatedCode.trim();

              const styles = [];
              if (newFill) styles.push(`fill:${newFill}`);
              if (newBorder) styles.push(`stroke:${newBorder}`);
              if (newTextCol) styles.push(`color:${newTextCol}`);
              if (borderStyle === 'dashed') styles.push('stroke-dasharray: 5 5');
              styles.push('stroke-width:2px');

              if (styles.length > 0) {
                 const newStyleLine = `\nstyle ${id} ${styles.join(',')}`;
                 updatedCode += newStyleLine;
              }
          } else if (currentType === DiagramType.Sequence) {
              // Sequence Diagram Style
              // In Mermaid Sequence, 'stroke' controls the box border AND the lifeline color.
              const className = `cls_${id.replace(/[^a-zA-Z0-9]/g, '_')}`;

              const classDefRegex = new RegExp(`classDef\\s+${className}\\s+.*(\\n|$)`, 'g');
              const classApplyRegex = new RegExp(`class\\s+${id}\\s+${className}(\\n|$)`, 'g');
              
              updatedCode = updatedCode.replace(classDefRegex, '');
              updatedCode = updatedCode.replace(classApplyRegex, '');
              updatedCode = updatedCode.trim();

              const styles = [];
              if (newFill) styles.push(`fill:${newFill}`);
              if (newBorder) styles.push(`stroke:${newBorder}`);
              if (newTextCol) styles.push(`color:${newTextCol}`);
              if (borderStyle === 'dashed') styles.push('stroke-dasharray: 5 5');
              styles.push('stroke-width:2px');

              if (styles.length > 0) {
                  updatedCode += `\nclassDef ${className} ${styles.join(',')}`;
                  updatedCode += `\nclass ${id} ${className}`;
              }
          }
      }

      pushToHistory(updatedCode);
      setSelectedElement(null);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden font-sans">
      <Header onDownloadCode={handleDownloadCode} />

      {/* Toolbar Sub-header */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 justify-between shadow-sm z-20 relative">
        <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-50 rounded-md border border-gray-200 px-2 py-1">
                <FilePlus className="w-4 h-4 text-brand-primary" />
                <select 
                    className="bg-transparent text-sm text-gray-700 font-medium focus:outline-none cursor-pointer"
                    onChange={handleTemplateChange}
                    value={currentType}
                >
                    {DIAGRAM_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors" title="Annuler">
                <Undo className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1.5 rounded hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors" title="Rétablir">
                <Redo className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <button 
                onClick={() => setShowStyles(!showStyles)}
                className={`p-1.5 rounded flex items-center gap-2 hover:bg-gray-100 text-gray-600 transition-colors ${showStyles ? 'bg-blue-50 text-blue-600' : ''}`}
                title="Styles Visuels"
            >
                <Palette className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">Apparence</span>
            </button>
        </div>
        
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => setShowEditor(!showEditor)}
                className={`p-1.5 rounded hover:bg-gray-100 text-gray-600 transition-colors flex items-center gap-2 ${!showEditor ? 'bg-gray-100 text-gray-800' : ''}`}
                title="Basculer l'éditeur de code"
            >
                <span className="text-xs font-medium">Code</span>
                {showEditor ? <PanelLeftClose className="w-4 h-4"/> : <PanelLeftOpen className="w-4 h-4"/>}
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Tool Palette Sidebar */}
        <ToolPalette type={currentType} onInsert={handleToolInsert} />

        {/* Editor Pane */}
        <div 
            className={`transition-all duration-300 ease-in-out border-r border-gray-200 bg-white flex flex-col ${showEditor ? 'w-1/3 min-w-[320px] max-w-[50%]' : 'w-0 overflow-hidden opacity-0'}`}
        >
          <CodeEditor code={code} onChange={handleCodeChange} />
        </div>

        {/* Preview Pane */}
        <div className="flex-1 bg-vp-50 relative flex flex-col overflow-hidden">
          <DiagramViewer 
            code={code} 
            config={themeConfig}
            scale={scale}
            onZoomIn={() => setScale(s => Math.min(s + 0.1, 3))}
            onZoomOut={() => setScale(s => Math.max(s - 0.1, 0.2))}
            onFit={() => setScale(1)}
            onRotate={handleRotate}
            onElementClick={handleElementClick}
            onElementMove={handleElementMove}
          />
          
          {/* Floating Style Controls */}
          {showStyles && (
             <div className="absolute top-4 left-4 z-30 animate-in fade-in slide-in-from-top-4 duration-200">
                <StyleControls config={themeConfig} onChange={setThemeConfig} />
             </div>
          )}

          {/* Element Editor Popover */}
          {selectedElement && (
              <ElementEditor 
                elementId={selectedElement.id}
                initialText={selectedElement.text}
                type={selectedElement.type}
                initialColor={null} // Don't preload color for edges yet as parsing all linkStyles is expensive
                onSave={handleElementSave}
                onDelete={handleElementDelete}
                onClose={() => setSelectedElement(null)}
                // We enable colors for Sequence now
                disableColors={![DiagramType.Flowchart, DiagramType.State, DiagramType.UseCase, DiagramType.Deployment, DiagramType.Sequence].includes(currentType)}
              />
          )}
        </div>
      </div>

      <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
    </div>
  );
}