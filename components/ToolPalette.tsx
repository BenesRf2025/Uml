import React from 'react';
import { DiagramType, ToolItem } from '../types';
import { 
  User, Box, ArrowRight, Database, Code, 
  GitCommit, Activity, FileText, Layers, 
  Settings, Hexagon, Circle, Diamond, Server, Folder
} from 'lucide-react';

interface ToolPaletteProps {
  type: DiagramType;
  onInsert: (snippet: string) => void;
}

const TOOLS: Record<string, ToolItem[]> = {
  [DiagramType.Sequence]: [
    { icon: User, label: 'Acteur', snippet: '\n    actor NewActor as "Nouvel Acteur"', description: 'Ajouter un participant humain' },
    { icon: Box, label: 'Participant', snippet: '\n    participant NewPart as "Composant"', description: 'Ajouter un système ou service' },
    { icon: Database, label: 'Base de données', snippet: '\n    participant DB as "Database"\n    Note over DB: Stockage', description: 'Ajouter une DB' },
    { icon: ArrowRight, label: 'Message Sync', snippet: '\n    Alice->>Bob: Message Synchrone', description: 'Appel bloquant' },
    { icon: Activity, label: 'Message Async', snippet: '\n    Alice-)Bob: Message Asynchrone', description: 'Appel non-bloquant' },
    { icon: Code, label: 'Note', snippet: '\n    Note right of Alice: Note importante', description: 'Annotation' },
    { icon: Layers, label: 'Boucle (Loop)', snippet: '\n    loop Chaque minute\n        Alice->>Bob: Ping\n    end', description: 'Répétition' },
    { icon: GitCommit, label: 'Alternative (Alt)', snippet: '\n    alt Succès\n        Alice->>Bob: OK\n    else Erreur\n        Alice->>Bob: Fail\n    end', description: 'Condition' },
  ],
  [DiagramType.Class]: [
    { icon: Box, label: 'Classe', snippet: '\n    class NouvelleClasse {\n      +String attribut\n      +methode()\n    }', description: 'Définir une classe' },
    { icon: Code, label: 'Interface', snippet: '\n    class IService {\n      <<interface>>\n      +execute()\n    }', description: 'Définir une interface' },
    { icon: ArrowRight, label: 'Héritage', snippet: '\n    ClassA <|-- ClassB : Extends', description: 'Relation parent-enfant' },
    { icon: Activity, label: 'Composition', snippet: '\n    ClassA *-- ClassB : Compose', description: 'Relation forte' },
    { icon: Layers, label: 'Agrégation', snippet: '\n    ClassA o-- ClassB : Aggregates', description: 'Relation faible' },
  ],
  [DiagramType.Flowchart]: [
    { icon: Circle, label: 'Début/Fin', snippet: '\n    Start((Début))', description: 'Noeud rond' },
    { icon: Box, label: 'Processus', snippet: '\n    Proc[Action]', description: 'Rectangle' },
    { icon: Diamond, label: 'Décision', snippet: '\n    Dec{Condition?}', description: 'Losange' },
    { icon: Database, label: 'Donnée', snippet: '\n    Data[(Database)]', description: 'Cylindre' },
    { icon: ArrowRight, label: 'Lien simple', snippet: '\n    A --> B', description: 'Flèche' },
    { icon: Settings, label: 'Sous-graphe', snippet: '\n    subgraph Groupe\n    A --> B\n    end', description: 'Grouper des éléments' },
  ],
  [DiagramType.UseCase]: [
    { icon: User, label: 'Acteur', snippet: '\n    User((Acteur))', description: 'Utilisateur système' },
    { icon: Circle, label: 'Cas', snippet: '\n    UC1(Se connecter)', description: 'Cas d\'utilisation' },
    { icon: ArrowRight, label: 'Lien', snippet: '\n    User --> UC1', description: 'Association simple' },
    { icon: Layers, label: 'Include', snippet: '\n    UC1 -.->|<<include>>| UC2', description: 'Inclusion obligatoire' },
    { icon: Activity, label: 'Extend', snippet: '\n    UC2 -.->|<<extend>>| UC1', description: 'Extension optionnelle' },
    { icon: Box, label: 'Système', snippet: '\n    subgraph System\n    UC1\n    end', description: 'Frontière du système' },
  ],
  [DiagramType.Package]: [
    { icon: Folder, label: 'Package', snippet: '\n    namespace Core {\n      class Utils\n    }', description: 'Groupe logique' },
    { icon: Box, label: 'Classe', snippet: '\n    class MyClass', description: 'Élément contenu' },
    { icon: ArrowRight, label: 'Dépendance', snippet: '\n    PkgA ..> PkgB : import', description: 'Relation' },
  ],
  [DiagramType.Deployment]: [
    { icon: Server, label: 'Noeud', snippet: '\n    node Server[Serveur Web]', description: 'Matériel ou environnement' },
    { icon: Database, label: 'Base de données', snippet: '\n    database DB[(PostgreSQL)]', description: 'Stockage persistant' },
    { icon: Box, label: 'Composant', snippet: '\n    artifact App.jar', description: 'Artefact logiciel' },
    { icon: ArrowRight, label: 'Lien', snippet: '\n    Server -- TCP/IP --> DB', description: 'Connexion réseau' },
    { icon: Layers, label: 'Cloud', snippet: '\n    subgraph Cloud\n    Server\n    end', description: 'Zone réseau' },
  ]
};

export const ToolPalette: React.FC<ToolPaletteProps> = ({ type, onInsert }) => {
  // Map specific types to underlying mermaid engine types if needed for tools, 
  // but here we defined specific tools for the new types.
  const tools = TOOLS[type] || TOOLS[DiagramType.Flowchart];

  return (
    <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4 z-10 shadow-sm overflow-y-auto max-h-screen">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 text-center transform -rotate-90 w-20 h-4 mt-4">
        Boîte à outils
      </div>
      
      {tools.map((tool, idx) => (
        <button
          key={idx}
          onClick={() => onInsert(tool.snippet)}
          className="group relative p-3 rounded-xl hover:bg-blue-50 text-gray-500 hover:text-brand-primary transition-all border border-transparent hover:border-blue-100"
          title={tool.label}
        >
          <tool.icon className="w-6 h-6" />
          
          {/* Tooltip mimicking visual paradigm hover info */}
          <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
            <span className="font-bold">{tool.label}</span>
            <span className="block text-[10px] text-gray-300 font-normal">{tool.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
};