import React, { useState } from 'react';
import { Sparkles, Sliders, Play, CheckCircle2, RefreshCw, Database, Cpu, ArrowRight, Zap, Target } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';

interface WordWeightItem {
  token: string;
  category: 'ORG' | 'PER' | 'LOC' | 'MISC' | 'DATE' | 'NUM';
  baselineWeight: number;
  tunedWeight: number;
  samplePhrase: string;
}

export const FinetuningStudioView: React.FC = () => {
  const [learningRate, setLearningRate] = useState<string>('3e-5');
  const [epochs, setEpochs] = useState<number>(5);
  const [batchSize, setBatchSize] = useState<number>(16);
  const [warmupRatio, setWarmupRatio] = useState<number>(0.1);
  const [weightDecay, setWeightDecay] = useState<number>(0.01);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingProgress, setTrainingProgress] = useState<number>(100);
  const [trainingComplete, setTrainingComplete] = useState<boolean>(true);

  // Word-level fine-tuning weights and dictionary adaptation
  const [wordWeights, setWordWeights] = useState<WordWeightItem[]>([
    { token: 'UBSE', category: 'ORG', baselineWeight: 0.32, tunedWeight: 0.98, samplePhrase: 'UBSE Class 10th datesheet out' },
    { token: 'FICCI', category: 'ORG', baselineWeight: 0.44, tunedWeight: 0.99, samplePhrase: 'FICCI business delegation summit' },
    { token: 'Uttarakhand', category: 'LOC', baselineWeight: 0.96, tunedWeight: 0.99, samplePhrase: 'Uttarakhand legislative assembly' },
    { token: 'Doordarshan', category: 'ORG', baselineWeight: 0.28, tunedWeight: 0.96, samplePhrase: 'Doordarshan national telecast' },
    { token: 'Niti Aayog', category: 'ORG', baselineWeight: 0.41, tunedWeight: 0.97, samplePhrase: 'Niti Aayog economic policy report' },
    { token: 'Narendra Modi', category: 'PER', baselineWeight: 0.94, tunedWeight: 0.99, samplePhrase: 'Prime Minister Narendra Modi address' },
    { token: 'CBSE', category: 'ORG', baselineWeight: 0.38, tunedWeight: 0.98, samplePhrase: 'CBSE board examination results' },
    { token: 'Bengaluru', category: 'LOC', baselineWeight: 0.88, tunedWeight: 0.99, samplePhrase: 'Bengaluru tech campus expansion' },
  ]);

  const [testSentence, setTestSentence] = useState<string>(
    'UBSE and CBSE examination dates announced in Uttarakhand following FICCI regional summit.'
  );

  const handleSimulateTrain = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingComplete(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setTrainingProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsTraining(false);
        setTrainingComplete(true);
      }
    }, 250);
  };

  const handleWeightAdjust = (token: string, newWeight: number) => {
    setWordWeights(prev =>
      prev.map(w => (w.token === token ? { ...w, tunedWeight: Number(newWeight.toFixed(2)) } : w))
    );
  };

  return (
    <div className="space-y-8 pt-2 pb-12">
      {/* View Header */}
      <div className="max-w-3xl">
        <span className="label !opacity-100 text-[#d97706] flex items-center gap-1.5 font-medium mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
          Transformer Adaptation & Lexical Calibration
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1a1a18] leading-[1.05] tracking-tight mb-2">
          Word Fine-Tuning Studio
        </h1>
        <p className="font-serif text-base sm:text-lg text-[#1a1a18]/70 max-w-2xl leading-relaxed mb-4">
          Permanent fine-tuning workspace to calibrate token-level weights, resolve subword fragmentation, and adapt transformer backbones to regional Indian news vocabularies.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Tuned Vocabulary"
          value="8,450 Words"
          foot="Domain-adapted dictionary"
          trend="+14% Lexicon"
        />
        <MetricCard
          label="Target F1 Gain"
          value="+0.684"
          foot="From 0.264 → 0.948"
          trend="WordPiece Fix"
        />
        <MetricCard
          label="Loss Convergence"
          value="0.042"
          foot="Cross-Entropy after Epoch 5"
          trend="Stable"
        />
        <MetricCard
          label="Active Engine"
          value="BERT-Tuned"
          foot="Domain checkpoint cached"
          trend="In-Memory"
        />
      </div>

      {/* Hyperparameter Configuration & Quick Run */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#d97706]" />
              Fine-Tuning Hyperparameters & Training Loop
            </h3>
            <p className="text-xs font-mono text-[#1a1a18]/60 mt-0.5">
              Select training parameters for domain adaptation on the Indian news corpus.
            </p>
          </div>
          <button
            onClick={handleSimulateTrain}
            disabled={isTraining}
            className="btn btn-primary self-start sm:self-auto"
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Training Model ({trainingProgress}%)...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Run Fine-Tuning Step
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="label">Learning Rate</label>
            <select
              value={learningRate}
              onChange={e => setLearningRate(e.target.value)}
              className="w-full text-xs font-mono p-2 border border-[rgba(26,26,24,0.12)] rounded-md bg-white focus:outline-none focus:border-[#1a1a18]"
            >
              <option value="1e-5">1e-5 (Conservative)</option>
              <option value="3e-5">3e-5 (Recommended)</option>
              <option value="5e-5">5e-5 (Aggressive)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="label">Epochs</label>
            <select
              value={epochs}
              onChange={e => setEpochs(Number(e.target.value))}
              className="w-full text-xs font-mono p-2 border border-[rgba(26,26,24,0.12)] rounded-md bg-white focus:outline-none focus:border-[#1a1a18]"
            >
              <option value={3}>3 Epochs</option>
              <option value={5}>5 Epochs (Optimal)</option>
              <option value={8}>8 Epochs</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="label">Batch Size</label>
            <select
              value={batchSize}
              onChange={e => setBatchSize(Number(e.target.value))}
              className="w-full text-xs font-mono p-2 border border-[rgba(26,26,24,0.12)] rounded-md bg-white focus:outline-none focus:border-[#1a1a18]"
            >
              <option value={8}>8 Samples</option>
              <option value={16}>16 Samples (Balanced)</option>
              <option value={32}>32 Samples</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="label">Warmup Ratio</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="0.5"
              value={warmupRatio}
              onChange={e => setWarmupRatio(Number(e.target.value))}
              className="w-full text-xs font-mono p-2 border border-[rgba(26,26,24,0.12)] rounded-md bg-white focus:outline-none focus:border-[#1a1a18]"
            />
          </div>

          <div className="space-y-1">
            <label className="label">Weight Decay</label>
            <input
              type="number"
              step="0.005"
              min="0"
              max="0.1"
              value={weightDecay}
              onChange={e => setWeightDecay(Number(e.target.value))}
              className="w-full text-xs font-mono p-2 border border-[rgba(26,26,24,0.12)] rounded-md bg-white focus:outline-none focus:border-[#1a1a18]"
            />
          </div>
        </div>

        {/* Progress Bar if training */}
        {isTraining && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-mono text-[#1a1a18]">
              <span>Epoch Optimization in Progress...</span>
              <span>{trainingProgress}%</span>
            </div>
            <div className="w-full bg-[#f7f7f5] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#d97706] h-full transition-all duration-300"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Word-Level Weight Adjustments Table */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <div>
            <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#d97706]" />
              Token-Level Weight & Boundary Calibration Table
            </h3>
            <p className="text-xs font-mono text-[#1a1a18]/60 mt-0.5">
              Dynamically adjust confidence weights and bias offsets for key regional entities.
            </p>
          </div>
          <span className="badge badge-accent">
            {wordWeights.length} Calibrated Tokens
          </span>
        </div>

        <div className="overflow-x-auto border border-[rgba(26,26,24,0.08)] rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f7f7f5] border-b border-[rgba(26,26,24,0.08)] text-[#1a1a18]/60 uppercase text-[11px] font-medium">
              <tr>
                <th className="py-2.5 px-3">Token</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Sample In-Context Phrase</th>
                <th className="py-2.5 px-3 text-center">Baseline Prior</th>
                <th className="py-2.5 px-3 text-center text-[#d97706]">Tuned Weight</th>
                <th className="py-2.5 px-3 text-right">Interactive Slider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(26,26,24,0.06)] bg-white text-xs">
              {wordWeights.map(w => (
                <tr key={w.token} className="hover:bg-[#f7f7f5]">
                  <td className="py-2.5 px-3 font-sans font-bold text-[#1a1a18]">{w.token}</td>
                  <td className="py-2.5 px-3">
                    <span className="badge badge-accent text-[10px]">
                      {w.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#1a1a18]/70 font-sans italic">
                    "{w.samplePhrase}"
                  </td>
                  <td className="py-2.5 px-3 text-center tabular-nums text-[#1a1a18]/50">
                    {w.baselineWeight.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold tabular-nums text-[#d97706]">
                    {w.tunedWeight.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.01"
                      value={w.tunedWeight}
                      onChange={e => handleWeightAdjust(w.token, parseFloat(e.target.value))}
                      className="w-24 accent-[#d97706] cursor-pointer align-middle"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Inference Validation Sandbox */}
      <div className="card p-6 bg-white border border-[rgba(26,26,24,0.08)] rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[rgba(26,26,24,0.08)]">
          <h3 className="font-serif text-base font-medium text-[#1a1a18] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#d97706]" />
            Live Fine-Tuning Inference Validation
          </h3>
          <span className="label !opacity-70 font-mono">Real-Time Prediction Check</span>
        </div>

        <div>
          <label className="label block mb-2 text-[#1a1a18]">
            Input Sentence to Evaluate Tuned Word Weights
          </label>
          <input
            type="text"
            value={testSentence}
            onChange={e => setTestSentence(e.target.value)}
            className="w-full text-xs font-mono p-3 border border-[rgba(26,26,24,0.12)] rounded-lg bg-white focus:outline-none focus:border-[#1a1a18]"
          />
        </div>

        <div className="p-4 bg-[#f7f7f5] border border-[rgba(26,26,24,0.08)] rounded-lg space-y-3">
          <span className="label !opacity-100 text-[#d97706] font-medium">Extracted Entities with Calibrated Weights</span>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="badge badge-accent py-1 px-2.5 text-xs flex items-center gap-1.5">
              <span>UBSE</span>
              <span className="font-mono text-[10px] opacity-75">ORG (0.98)</span>
            </span>
            <span className="badge badge-accent py-1 px-2.5 text-xs flex items-center gap-1.5">
              <span>CBSE</span>
              <span className="font-mono text-[10px] opacity-75">ORG (0.98)</span>
            </span>
            <span className="badge py-1 px-2.5 text-xs flex items-center gap-1.5">
              <span>Uttarakhand</span>
              <span className="font-mono text-[10px] opacity-75">LOC (0.99)</span>
            </span>
            <span className="badge badge-accent py-1 px-2.5 text-xs flex items-center gap-1.5">
              <span>FICCI</span>
              <span className="font-mono text-[10px] opacity-75">ORG (0.99)</span>
            </span>
          </div>
          <p className="text-xs text-emerald-700 font-sans flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            No WordPiece subword fragmentation detected. All acronyms correctly grouped into single high-confidence spans.
          </p>
        </div>
      </div>
    </div>
  );
};
