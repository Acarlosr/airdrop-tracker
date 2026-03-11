import { useState } from 'react';
import { ChevronDown, Check, AlertCircle, Loader } from 'lucide-react';

/**
 * Componente de sequência de saída segura
 * Mostra passo-a-passo como desmontar uma cadeia Money Lego
 */

export function ExitSequence({
  sequence = [],
  totalValue = 0,
  estimatedTime = null,
  onExecute = null
}) {
  const [expanded, setExpanded] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const handleStepComplete = (stepNumber) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepNumber);
    setCompletedSteps(newCompleted);
  };

  const handleExecuteAll = async () => {
    if (onExecute) {
      setExecuting(true);
      try {
        await onExecute(sequence);
      } finally {
        setExecuting(false);
      }
    }
  };

  if (sequence.length === 0) {
    return (
      <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma sequência de saída disponível</p>
      </div>
    );
  }

  const progressPercentage = (completedSteps.size / sequence.length) * 100;

  return (
    <div className="rounded-lg border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between transition-colors"
        style={{ background: 'var(--surface-2)' }}
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          <div className="text-left">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Como Sair com Segurança?</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {sequence.length} passos • ${totalValue.toFixed(2)}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }}
        />
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Progresso */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              <span>Progresso</span>
              <span>{completedSteps.size}/{sequence.length}</span>
            </div>
            <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-full transition-all"
                style={{
                  background: 'linear-gradient(90deg, var(--success), #5af0a4)',
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          {/* Tempo estimado */}
          {estimatedTime && (
            <div className="rounded p-3 text-xs border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <p style={{ color: 'var(--text-primary)' }}>
                <span className="font-semibold">Tempo estimado:</span>{' '}
                {estimatedTime.estimatedTimeMinutes < 60
                  ? `${Math.round(estimatedTime.estimatedTimeMinutes)} min`
                  : `${estimatedTime.estimatedTimeHours}h`}
              </p>
              <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>{estimatedTime.recommendation}</p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sequence.map((step, idx) => {
              const stepNumber = step.step || idx + 1;
              const isCompleted = completedSteps.has(stepNumber);
              const isHighRisk = step.risco === 'HIGH';

              return (
                <div
                  key={stepNumber}
                  className="border-l-4 p-3 rounded transition-colors"
                  style={{
                    background: isCompleted
                      ? 'rgba(0,230,118,0.08)'
                      : isHighRisk
                        ? 'rgba(255,69,69,0.08)'
                        : 'var(--surface-2)',
                    borderLeftColor: isCompleted
                      ? 'var(--success)'
                      : isHighRisk
                        ? 'var(--danger)'
                        : 'var(--accent)',
                  }}
                >
                  {/* Header do Step */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{
                          background: isCompleted
                            ? 'var(--success)'
                            : isHighRisk
                              ? 'var(--danger)'
                              : 'var(--accent)',
                          color: '#0A0A0F',
                        }}
                      >
                        {isCompleted ? <Check size={16} /> : stepNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                          Passo {stepNumber}: {step.position?.protocolo}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step.action}</p>
                      </div>
                    </div>
                    {isHighRisk && (
                      <span className="inline-block text-xs px-2 py-1 rounded" style={{ background: 'rgba(255,69,69,0.12)', color: 'var(--danger)' }}>
                        Alto Risco
                      </span>
                    )}
                  </div>

                  {/* Detalhes */}
                  <div className="ml-11 space-y-1 text-xs">
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold">Token:</span> {step.position?.token}
                    </p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-semibold">Valor:</span> ${parseFloat(step.position?.valor || 0).toFixed(2)}
                    </p>

                    {!isCompleted && (
                      <button
                        onClick={() => handleStepComplete(stepNumber)}
                        className="mt-2 font-semibold text-xs"
                        style={{ color: 'var(--accent)' }}
                      >
                        ✓ Marcar como completo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={handleExecuteAll}
              disabled={executing || completedSteps.size === sequence.length}
              className="flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors"
              style={
                executing || completedSteps.size === sequence.length
                  ? { background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', cursor: 'not-allowed' }
                  : { background: 'var(--accent)', color: '#0A0A0F' }
              }
            >
              {executing ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  Executando...
                </div>
              ) : completedSteps.size === sequence.length ? (
                '✓ Concluído'
              ) : (
                'Executar Sequência'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExitSequence;
