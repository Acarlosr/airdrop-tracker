import logger from '../utils/logger.js';

/**
 * Money Lego Service - Gerencia cadeias de composição DeFi
 * Detecta, valida e analisa riscos em cadeias de tokens derivativos
 */

export class MoneyLegoService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Criar uma posição Money Lego
   * Vincula token derivativo a outro protocolo
   */
  async createMoneyLegoPosition({
    airdropId,
    walletAddress,
    tokenOrigem,
    protocoloOrigem,
    posicaoOrigemId,
    tokenDestino,
    protocoloDestino,
    valor,
    dataEntrada = new Date(),
    riscoCascata = false
  }) {
    try {
      const result = await this.db.query(
        `INSERT INTO money_lego_positions 
        (airdrop_id, wallet_address, token_origem, protocolo_origem, posicao_origem_id,
         token_destino, protocolo_destino, valor_usd, data_entrada, risco_cascata, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ativa', NOW())
        RETURNING *`,
        [
          airdropId, walletAddress, tokenOrigem, protocoloOrigem, posicaoOrigemId,
          tokenDestino, protocoloDestino, valor, dataEntrada, riscoCascata
        ]
      );

      logger.info(`Money Lego position created: ${protocoloOrigem} → ${protocoloDestino}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating Money Lego position:', error);
      throw error;
    }
  }

  /**
   * Construir grafo de dependências (DAG)
   * Retorna estrutura de cadeia e identificar pontos críticos
   */
  async buildDependencyGraph(airdropId, walletAddress) {
    try {
      // Buscar todas as posições Money Lego
      const result = await this.db.query(
        `SELECT * FROM money_lego_positions 
        WHERE airdrop_id = $1 AND wallet_address = $2 AND status = 'ativa'
        ORDER BY data_entrada ASC`,
        [airdropId, walletAddress]
      );

      const positions = result.rows;
      if (positions.length === 0) {
        return { nodes: [], edges: [], rootNodes: [] };
      }

      // Construir grafo
      const graph = this.constructGraph(positions);

      // Identificar pontos críticos (raízes do grafo)
      const rootNodes = positions.filter(p => !p.posicao_origem_id);

      // Detectar risco cascata
      const riskAnalysis = this.analyzeRisks(graph);

      return {
        nodes: positions,
        edges: graph.edges,
        rootNodes,
        riskAnalysis,
        totalValue: positions.reduce((sum, p) => sum + parseFloat(p.valor_usd || 0), 0)
      };
    } catch (error) {
      logger.error('Error building dependency graph:', error);
      throw error;
    }
  }

  /**
   * Analisar riscos de cascata
   * Identifica nós críticos cuja falha afeta toda a cadeia
   */
  analyzeRisks(graph) {
    const risks = [];
    const dependencyCount = {};

    // Contar quantas posições dependem de cada nó
    graph.edges.forEach(edge => {
      if (!dependencyCount[edge.from]) {
        dependencyCount[edge.from] = 0;
      }
      dependencyCount[edge.from]++;
    });

    // Identificar nós críticos (alto número de dependências)
    Object.entries(dependencyCount).forEach(([nodeId, count]) => {
      if (count >= 2) {
        risks.push({
          nodeId,
          criticality: 'HIGH',
          dependentCount: count,
          message: `Esta posição é crítica: ${count} protocolos dependem dela`
        });
      }
    });

    return risks;
  }

  /**
   * Construir estrutura interna do grafo
   */
  constructGraph(positions) {
    const edges = [];

    positions.forEach(position => {
      if (position.posicao_origem_id) {
        edges.push({
          from: position.posicao_origem_id,
          to: position.id,
          protocol: position.protocolo_origem,
          token: position.token_origem,
          derivedToken: position.token_destino
        });
      }
    });

    return { edges };
  }

  /**
   * Calcular sequência segura de saída (desmontar cadeia)
   * Retorna ordem das transações para resgatar sem perder fundos
   */
  async calculateExitSequence(airdropId, walletAddress) {
    try {
      const graph = await this.buildDependencyGraph(airdropId, walletAddress);

      if (graph.nodes.length === 0) {
        return { sequence: [], totalSteps: 0 };
      }

      // Ordenar posições por profundidade (leaf nodes primeiro)
      const sequence = this.topologicalSort(graph.nodes, graph.edges);

      const steps = sequence.map((posId, index) => {
        const position = graph.nodes.find(p => p.id === posId);
        return {
          step: index + 1,
          position: {
            id: position.id,
            protocolo: position.protocolo_destino,
            token: position.token_destino,
            valor: position.valor_usd
          },
          action: `Withdraw ${position.token_destino} from ${position.protocolo_destino}`,
          risco: position.risco_cascata ? 'HIGH' : 'LOW'
        };
      });

      logger.info(`Exit sequence calculated: ${steps.length} steps`);
      return { sequence: steps, totalSteps: steps.length };
    } catch (error) {
      logger.error('Error calculating exit sequence:', error);
      throw error;
    }
  }

  /**
   * Ordenação topológica (folhas primeiro)
   * Garante que retiramos em ordem correta
   */
  topologicalSort(nodes, edges) {
    const inDegree = {};
    const adjList = {};

    // Inicializar
    nodes.forEach(node => {
      inDegree[node.id] = 0;
      adjList[node.id] = [];
    });

    // Construir grafo reverso (queremos sair de folhas para raízes)
    edges.forEach(edge => {
      adjList[edge.to] = adjList[edge.to] || [];
      adjList[edge.to].push(edge.from);
      inDegree[edge.from] = (inDegree[edge.from] || 0) + 1;
    });

    // Kahn's algorithm
    const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0);
    const result = [];

    while (queue.length > 0) {
      const node = queue.shift();
      result.push(node);

      (adjList[node] || []).forEach(neighbor => {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result.reverse();
  }

  /**
   * Detectar looping automático
   * Identifica padrões de borrow circular do mesmo ativo
   */
  async detectLooping(walletAddress, protocol, asset) {
    try {
      const result = await this.db.query(
        `SELECT * FROM defi_positions 
        WHERE wallet_address = $1 
        AND protocolo = $2 
        AND (tipo = 'lending' OR tipo = 'borrowing')
        AND token = $3
        ORDER BY data_entrada ASC`,
        [walletAddress, protocol, asset]
      );

      const positions = result.rows;

      // Detectar padrão: lending → borrowing → lending
      const loopingDetected = this.analyzeLoopingPattern(positions);

      if (loopingDetected.isLooping) {
        logger.info(`Looping detected: ${asset} on ${protocol}`);
      }

      return {
        isLooping: loopingDetected.isLooping,
        layers: loopingDetected.layers,
        totalExposure: loopingDetected.totalExposure,
        totalDebt: loopingDetected.totalDebt,
        multiplier: loopingDetected.multiplier
      };
    } catch (error) {
      logger.error('Error detecting looping:', error);
      throw error;
    }
  }

  /**
   * Analisar padrão de looping
   */
  analyzeLoopingPattern(positions) {
    let isLooping = false;
    let layers = 0;
    let totalExposure = 0;
    let totalDebt = 0;

    let lastType = null;
    for (const pos of positions) {
      if (lastType === 'lending' && pos.tipo === 'borrowing') {
        layers++;
        isLooping = true;
      } else if (lastType === 'borrowing' && pos.tipo === 'lending') {
        layers++;
      }

      if (pos.tipo === 'lending') {
        totalExposure += parseFloat(pos.valor_usd || 0);
      } else if (pos.tipo === 'borrowing') {
        totalDebt += parseFloat(pos.valor_usd || 0);
      }

      lastType = pos.tipo;
    }

    return {
      isLooping: layers >= 2,
      layers,
      totalExposure,
      totalDebt,
      multiplier: (totalExposure / (totalExposure - totalDebt)).toFixed(2)
    };
  }

  /**
   * Alertar sobre risco cascata
   */
  async checkCascadeRisk(airdropId, walletAddress, healthFactor = null) {
    try {
      const graph = await this.buildDependencyGraph(airdropId, walletAddress);

      if (graph.riskAnalysis.length === 0) {
        return { hasCascadeRisk: false, alerts: [] };
      }

      const alerts = graph.riskAnalysis.map(risk => ({
        type: 'CASCADE_RISK',
        severity: 'HIGH',
        positionId: risk.nodeId,
        message: risk.message,
        affectedPositions: risk.dependentCount,
        totalValueAtRisk: graph.totalValue,
        recommendation: 'Consider exiting the chain or hedging the critical position'
      }));

      return {
        hasCascadeRisk: true,
        alerts,
        suggestedAction: `/sair ${airdropId}`
      };
    } catch (error) {
      logger.error('Error checking cascade risk:', error);
      throw error;
    }
  }

  /**
   * Estimar tempo para desmontar cadeia
   */
  estimateUnwindTime(exitSequence) {
    // Tempo médio por transação: 1-2 minutos
    // Com confirmações e delays entre protocolos: 5-10 min por step
    const avgTimePerStep = 7.5; // minutos
    const totalTime = exitSequence.length * avgTimePerStep;

    return {
      totalSteps: exitSequence.length,
      estimatedTimeMinutes: totalTime,
      estimatedTimeHours: (totalTime / 60).toFixed(1),
      recommendation: totalTime > 60 ? 'Considere planejamento com antecedência' : 'Rápido para desmontar'
    };
  }
}

export default MoneyLegoService;
