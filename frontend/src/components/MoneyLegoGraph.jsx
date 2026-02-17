import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle, DollarSign, Zap } from 'lucide-react';

/**
 * Componente de visualização do grafo Money Lego
 * Mostra cadeias de composição DeFi e pontos críticos
 */

export function MoneyLegoGraph({ graph, onSelectNode = null }) {
  // Converter dados do grafo para nodes e edges
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes = graph.nodes.map((position, index) => {
      const isCritical = graph.riskAnalysis?.some(r => r.nodeId === position.id);
      
      return {
        id: `pos-${position.id}`,
        data: {
          label: position.protocolo_destino,
          token: position.token_destino,
          valor: position.valor_usd,
          isCritical
        },
        position: { x: index * 250, y: index % 2 === 0 ? 0 : 100 },
        style: {
          background: isCritical ? '#ef4444' : '#3b82f6',
          color: '#fff',
          padding: '15px',
          borderRadius: '8px',
          border: isCritical ? '3px solid #dc2626' : '2px solid #1e40af',
          minWidth: '150px',
          fontWeight: 'bold'
        }
      };
    });

    const edges = (graph.edges || []).map((edge, index) => ({
      id: `edge-${index}`,
      source: `pos-${edge.from}`,
      target: `pos-${edge.to}`,
      label: edge.token,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#666' },
      labelBgStyle: { fill: '#fff', color: '#000' }
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event, node) => {
    if (onSelectNode) {
      onSelectNode(node.id);
    }
  }, [onSelectNode]);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Nenhuma cadeia Money Lego detectada</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>

      {/* Legenda */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <p className="text-xs font-bold mb-2">Legenda:</p>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Posição Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Ponto Crítico</span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-xs">
        <h3 className="font-bold text-sm mb-2">Análise da Cadeia</h3>
        <div className="space-y-2 text-xs">
          <div>
            <p className="text-gray-600">Valor Total</p>
            <p className="font-bold text-lg">${graph.totalValue?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-600">Protocolos</p>
            <p className="font-bold">{graph.nodes.length}</p>
          </div>
          {graph.riskAnalysis && graph.riskAnalysis.length > 0 && (
            <div className="bg-red-50 p-2 rounded border border-red-200">
              <div className="flex items-center gap-1 text-red-700">
                <AlertTriangle size={14} />
                <span className="font-bold">{graph.riskAnalysis.length} ponto(s) crítico(s)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MoneyLegoGraph;
