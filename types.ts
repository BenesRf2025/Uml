import React from 'react';

export enum DiagramType {
  Sequence = 'sequenceDiagram',
  Class = 'classDiagram',
  State = 'stateDiagram-v2',
  ER = 'erDiagram',
  Flowchart = 'graph TD',
  Gantt = 'gantt',
  Mindmap = 'mindmap',
  Pie = 'pie',
  UseCase = 'useCase', // Mermaid uses 'graph' or specific block syntax, but we treat it logically
  Package = 'package', // Usually classDiagram with namespaces
  Deployment = 'deployment' // Usually flowchart or classDiagram with nodes
}

export interface DiagramState {
  code: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface GenerateRequest {
  prompt: string;
  currentCode?: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  lineColor: string;
  textColor: string;
  curveStyle: 'basis' | 'linear' | 'cardinal' | 'step';
}

export interface ToolItem {
  icon: React.ElementType;
  label: string;
  snippet: string;
  description: string;
}