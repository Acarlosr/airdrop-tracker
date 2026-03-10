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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">Nenhuma sequência de saída disponível</p>
      </div>
    );
  }

  const progressPercentage = (completedSteps.size / sequence.length) * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600" />
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Como Sair com Segurança?</h3>
            <p className="text-xs text-gray-600">
              {sequence.length} passos • ${totalValue.toFixed(2)}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-600 transition-transform ${expanded ? 'rotate-180' : ''
            }`}
        />
      </button>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Progresso */}
          <div>
            <div className="flex justify-between text-xs font-medium text-gray-700 mb-2">
              <span>Progresso</span>
              <span>{completedSteps.size}/{sequence.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Tempo estimado */}
          {estimatedTime && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
              <p className="text-gray-700">
                <span className="font-semibold">Tempo estimado:</span>{' '}
                {estimatedTime.estimatedTimeMinutes < 60
                  ? `${Math.round(estimatedTime.estimatedTimeMinutes)} min`
                  : `${estimatedTime.estimatedTimeHours}h`}
              </p>
              <p className="text-gray-600 mt-1">{estimatedTime.recommendation}</p>
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
                  className={`border-l-4 p-3 rounded transition-colors ${isCompleted
                      ? 'bg-green-50 border-l-green-500'
                      : isHighRisk
                        ? 'bg-red-50 border-l-red-500'
                        : 'bg-gray-50 border-l-blue-500'
                    }`}
                >
                  {/* Header do Step */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isCompleted
                            ? 'bg-green-500'
                            : isHighRisk
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                      >
                        {isCompleted ? <Check size={16} /> : stepNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          Passo {stepNumber}: {step.position?.protocolo}
                        </p>
                        <p className="text-xs text-gray-600">{step.action}</p>
                      </div>
                    </div>
                    {isHighRisk && (
                      <span className="inline-block bg-red-200 text-red-800 text-xs px-2 py-1 rounded">
                        Alto Risco
                      </span>
                    )}
                  </div>

                  {/* Detalhes */}
                  <div className="ml-11 space-y-1 text-xs">
                    <p className="text-gray-600">
                      <span className="font-semibold">Token:</span> {step.position?.token}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-semibold">Valor:</span> ${parseFloat(step.position?.valor || 0).toFixed(2)}
                    </p>

                    {!isCompleted && (
                      <button
                        onClick={() => handleStepComplete(stepNumber)}
                        className="mt-2 text-blue-600 hover:text-blue-800 font-semibold text-xs"
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
          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button
              onClick={handleExecuteAll}
              disabled={executing || completedSteps.size === sequence.length}
              className={`flex-1 py-2 px-4 rounded font-semibold text-sm transition-colors ${executing || completedSteps.size === sequence.length
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                }`}
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
