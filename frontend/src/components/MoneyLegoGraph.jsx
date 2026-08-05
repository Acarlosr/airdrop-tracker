import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { AlertTriangle } from 'lucide-react';

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
          background: isCritical ? '#ef4444' : '#f0a020',
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

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event, node) => {
    if (onSelectNode) {
      onSelectNode(node.id);
    }
  }, [onSelectNode]);

  if (!graph || graph.nodes.length === 0) {
    return (
      <div
        className="w-full h-full flex items-center justify-center rounded-lg border-2 border-dashed"
        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
      >
        <p style={{ color: 'var(--text-secondary)' }}>Nenhuma cadeia Money Lego detectada</p>
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
      <div
        className="absolute bottom-4 left-4 rounded-lg p-4 z-10 border"
        style={{ background: 'rgba(5,5,9,0.92)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Legenda:</p>
        <div className="space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
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
      <div
        className="absolute top-4 right-4 rounded-lg p-4 z-10 max-w-xs border"
        style={{ background: 'rgba(5,5,9,0.92)', borderColor: 'var(--border)' }}
      >
        <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>Análise da Cadeia</h3>
        <div className="space-y-2 text-xs">
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Valor Total</p>
            <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>${graph.totalValue?.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-secondary)' }}>Protocolos</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{graph.nodes.length}</p>
          </div>
          {graph.riskAnalysis && graph.riskAnalysis.length > 0 && (
            <div className="p-2 rounded border" style={{ background: 'rgba(255,69,69,0.08)', borderColor: 'rgba(255,69,69,0.35)' }}>
              <div className="flex items-center gap-1" style={{ color: 'var(--danger)' }}>
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
