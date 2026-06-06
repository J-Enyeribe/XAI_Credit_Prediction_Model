import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Loader } from '@react-three/drei';
import { predictWithXAI, getFullFairnessReport, type LoanApplication, type XAIBundle } from '../api/client';
import { cleanFeatureName } from '../utils/featureMapper';
import RiskNucleus from '../components/RiskNucleus';
import EmberParticles from '../components/EmberParticles';
import InfluenceMap from '../components/InfluenceMap';
import WaterfallExplanation from '../components/WaterfallExplanation';
import CounterfactualPanel from '../components/CounterfactualPanel';
import FairnessDashboard from '../components/FairnessDashboard';
import { Info, Activity, Route, ShieldCheck } from 'lucide-react';

interface LoanFormData {
  Age: number | string;
  Income: number | string;
  LoanAmount: number | string;
  CreditScore: number | string;
  MonthsEmployed: number | string;
  NumCreditLines: number | string;
  InterestRate: number | string;
  LoanTerm: number | string;
  DTIRatio: number | string;
  Education: string;
  EmploymentType: string;
  MaritalStatus: string;
  HasMortgage: string;
  HasDependents: string;
  LoanPurpose: string;
  HasCoSigner: string;
}

const Predictor: React.FC = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isAnalysisPanelCollapsed, setIsAnalysisPanelCollapsed] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<{ name: string, value: number } | null>(null);
  const [formData, setFormData] = useState<LoanFormData>({
    Age: '', Income: '', LoanAmount: '', CreditScore: '', MonthsEmployed: '',
    NumCreditLines: '', InterestRate: '', LoanTerm: '', DTIRatio: '',
    Education: '', EmploymentType: '', MaritalStatus: '', HasMortgage: '',
    HasDependents: '', LoanPurpose: '', HasCoSigner: '',
  });

  const [xaiBundle, setXaiBundle] = useState<XAIBundle | null>(null);
  const [fairnessReport, setFairnessReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'decision' | 'path' | 'fairness'>('decision');

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const fairness = await getFullFairnessReport();
        setFairnessReport(fairness);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchInitData();
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActiveTab('decision');
    try {
      const sanitizedData = { ...formData };
      const numericFields: { field: keyof LoanFormData, min?: number, max?: number, label: string }[] = [
        { field: 'Age', min: 18, max: 120, label: 'Age' },
        { field: 'Income', min: 0, label: 'Annual Income' },
        { field: 'LoanAmount', min: 0, label: 'Loan Amount' },
        { field: 'CreditScore', min: 300, max: 850, label: 'Credit Score' },
        { field: 'MonthsEmployed', min: 0, label: 'Months Employed' },
        { field: 'NumCreditLines', min: 0, label: 'Num Credit Lines' },
        { field: 'InterestRate', min: 0, label: 'Interest Rate' },
        { field: 'LoanTerm', min: 1, label: 'Loan Term' },
        { field: 'DTIRatio', min: 0, max: 10, label: 'DTI Ratio' }
      ];
      
       for (const { field, min, max, label } of numericFields) {
         const value = sanitizedData[field];
         if (value === '' || value === null || value === undefined) throw new Error(`${label} is required.`);
         const numValue = Number(value);
         if (isNaN(numValue)) throw new Error(`${label} must be a number.`);
         if (numValue < 0) throw new Error(`${label} cannot be negative.`);
         if (min !== undefined && numValue < min) throw new Error(`${label} must be at least ${min}.`);
         if (max !== undefined && numValue > max) throw new Error(`${label} must be no more than ${max}.`);
         (sanitizedData[field] as number) = numValue;
       }
    
      const categoricalFields: (keyof LoanFormData)[] = [
        'Education', 'EmploymentType', 'MaritalStatus', 'HasMortgage', 'HasDependents', 'LoanPurpose', 'HasCoSigner'
      ];
      for (const field of categoricalFields) {
        if (!sanitizedData[field]) throw new Error(`${field} is required.`);
      }
    
      const bundle = await predictWithXAI(sanitizedData as LoanApplication);
      setXaiBundle(bundle);
      setIsPanelCollapsed(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Prediction failed.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const numericFields = ['Age', 'Income', 'LoanAmount', 'CreditScore', 'MonthsEmployed', 'NumCreditLines', 'InterestRate', 'LoanTerm', 'DTIRatio'];
      
      let updatedData = { ...prev };
      
      if (name === 'EmploymentType' && value === 'Unemployed') {
        updatedData.Income = 0;
      }

      if (numericFields.includes(name)) {
        const parsed = parseFloat(value);
        updatedData[name] = value === '' ? '' : (isNaN(parsed) ? value : parsed);
      } else {
        updatedData[name] = value;
      }
      
      return updatedData;
    });
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-dark)] text-[var(--text-main)] overflow-hidden">
      {/* Left Panel: Form */}
      <div
        className={`${
          isPanelCollapsed ? 'w-16' : 'max-w-[400px] w-[25%] p-[var(--space-base)]'
        } h-full overflow-y-auto bg-[var(--bg-dark)] border-r [border:var(--border-thin)] z-10 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative group flex-shrink-0`}
      >
        {!isPanelCollapsed && (
          <>
            <h1 className="text-3xl font-bold mb-2 text-[var(--accent)]">XAI Credit Risk Form</h1>
            <p className="text-[var(--text-muted)] mb-[var(--space-base)] text-sm">Enter applicant details to analyze risk.</p>
            
            <form onSubmit={handlePredict} className="space-y-[var(--space-base)]">
              <div className="space-y-[var(--space-tight)]">
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Personal Information</h2>
                <div className="grid grid-cols-2 gap-[var(--space-tight)]">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Age</label>
                    <input name="Age" type="number" value={formData.Age} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Education Level</label>
                    <select name="Education" value={formData.Education} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Education</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master's">Master's</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Marital Status</label>
                    <select name="MaritalStatus" value={formData.MaritalStatus} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Has Dependents</label>
                    <select name="HasDependents" value={formData.HasDependents} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-[var(--space-tight)]">
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Employment & Finance</h2>
                <div className="grid grid-cols-2 gap-[var(--space-tight)]">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Annual Income</label>
                     <input name="Income" type="number" value={formData.Income} onChange={handleInputChange} disabled={formData.EmploymentType === 'Unemployed'} className={`w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${formData.EmploymentType === 'Unemployed' ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Employment Type</label>
                    <select name="EmploymentType" value={formData.EmploymentType} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Months Employed</label>
                    <input name="MonthsEmployed" type="number" value={formData.MonthsEmployed} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Credit Score</label>
                    <input name="CreditScore" type="number" value={formData.CreditScore} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                </div>
              </div>
              <div className="space-y-[var(--space-tight)]">
                <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Loan Details</h2>
                <div className="grid grid-cols-2 gap-[var(--space-tight)]">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Loan Amount</label>
                    <input name="LoanAmount" type="number" value={formData.LoanAmount} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Loan Term (Months)</label>
                    <input name="LoanTerm" type="number" value={formData.LoanTerm} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Interest Rate (%)</label>
                    <input name="InterestRate" type="number" value={formData.InterestRate} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Debt To Income Ratio</label>
                    <input name="DTIRatio" type="number" step="0.01" value={formData.DTIRatio} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Number of Credit Lines</label>
                    <input name="NumCreditLines" type="number" value={formData.NumCreditLines} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Loan Purpose</label>
                    <select name="LoanPurpose" value={formData.LoanPurpose} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Purpose</option>
                      <option value="Auto">Auto</option>
                      <option value="Business">Business</option>
                      <option value="Education">Education</option>
                      <option value="Home">Home</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Has Mortgage</label>
                    <select name="HasMortgage" value={formData.HasMortgage} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Has Co-Signer</label>
                    <select name="HasCoSigner" value={formData.HasCoSigner} onChange={handleInputChange} className="w-full bg-[var(--bg-card)] border border-[var(--accent)]/30 rounded p-2 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[var(--accent)] hover:bg-carbon_black-200 text-[var(--text-main)] font-bold rounded-lg transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? 'Analyzing...' : 'Predict Risk Score'}
              </button>
            </form>
          </>
        )}
        <button 
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 right-[-12px] w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center text-white text-xs z-20 hover:bg-carbon_black-200 transition-colors active:scale-90"
          aria-label={isPanelCollapsed ? 'Expand form panel' : 'Collapse form panel'}
        >
          {isPanelCollapsed ? '→' : '←'}
        </button>
      </div>
      
      {/* Center Panel: 3D Canvas */}
      <div className="relative flex-1 min-w-0 h-full bg-[var(--bg-dark)]">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 5, 15]} />
          <OrbitControls enablePan={false} minDistance={5} maxDistance={25} />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          
          <RiskNucleus riskScore={xaiBundle?.prediction.risk_score || 0} />
          <EmberParticles riskScore={xaiBundle?.prediction.risk_score || 0} />
          {xaiBundle && <InfluenceMap explanation={xaiBundle.prediction.explanation} onFeatureClick={(name, val) => setSelectedFeature({ name, value: val })} />}
        </Canvas>
        {/* Loader renders HTML — must be outside Canvas */}
        <Loader />
      </div>

      {/* Right Panel: XAI Control Center */}
      {xaiBundle && (
        <div className={`${
          isAnalysisPanelCollapsed ? 'w-16' : 'max-w-[500px] w-[30%]'
        } h-full bg-[var(--bg-dark)] border-l [border:var(--border-thin)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col relative flex-shrink-0`}
        >
          {isAnalysisPanelCollapsed ? (
            <div className="flex flex-col items-center gap-3 pt-4">
               {[
                 { id: 'decision', label: 'Decision', icon: Activity },
                 { id: 'path', label: 'Path Forward', icon: Info },
                 { id: 'fairness', label: 'Fairness', icon: ShieldCheck },
               ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setIsAnalysisPanelCollapsed(false); }}
                  className={`p-2 rounded-lg transition-all active:scale-90 ${
                    activeTab === tab.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/50'
                  }`}
                  aria-label={tab.label}
                >
                  <tab.icon size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Tabs Header */}
              <div className="flex gap-1 p-3 bg-[var(--bg-dark)]/80 backdrop-blur-md border-b [border:var(--border-thin)] flex-shrink-0">
                 {[
                   { id: 'decision', label: 'Decision', icon: Activity },
                   { id: 'path', label: 'Path Forward', icon: Info },
                   { id: 'fairness', label: 'Fairness', icon: ShieldCheck },
                 ].map(tab => (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                         activeTab === tab.id ? 'bg-[var(--accent)] text-white shadow-md scale-105' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card)]/50'
                       }`}
                     >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-[var(--space-base)] bg-[var(--bg-dark)]/60 backdrop-blur-md">
                <div aria-live="polite" className="sr-only">
                  {loading ? 'Calculating explanations...' : 'Explanations loaded.'}
                </div>
                
                  {activeTab === 'decision' && (
                    <div className="space-y-[var(--space-base)] h-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[var(--text-main)]">Risk Analysis</h3>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                          xaiBundle.prediction.probability <= 0.5 ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                        }`}>
                          {xaiBundle.prediction.prediction}
                        </div>
                      </div>
                      <div className="p-6 bg-[var(--bg-card)]/20 rounded-xl border-l-4 border-l-[var(--accent)] border [border:var(--border-thin)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-12 -mt-12 transition-all group-hover:bg-[var(--accent)]/10"></div>
                        <div className="relative z-10">
                          <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-1 tracking-widest">Default Probability</div>
                          <div className="text-5xl font-mono font-bold text-[var(--text-main)] tracking-tighter">
                            {(xaiBundle.prediction.probability * 100).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1 h-1 bg-rose-500 rounded-full"></span>
                            Risk Increasers
                          </h4>
                          <div className="space-y-[var(--space-tight)]">
                            {(xaiBundle.prediction.explanation?.top_features || [])
                              .filter(f => f.shap_value > 0)
                              .sort((a, b) => b.shap_value - a.shap_value)
                              .map((f, i) => (
                                <div key={i} className="flex justify-between items-center p-2.5 bg-rose-500/5 rounded-lg border [border:var(--border-thin)]">
                                  <span className="text-xs text-[var(--text-main)]">{cleanFeatureName(f.raw_feature)}</span>
                                  <span className="font-mono text-xs font-bold text-rose-600">
                                    +{f.shap_value.toFixed(3)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                            Risk Decreasers
                          </h4>
                          <div className="space-y-[var(--space-tight)]">
                            {(xaiBundle.prediction.explanation?.top_features || [])
                              .filter(f => f.shap_value < 0)
                              .sort((a, b) => a.shap_value - b.shap_value)
                              .map((f, i) => (
                                <div key={i} className="flex justify-between items-center p-2.5 bg-emerald-500/5 rounded-lg border [border:var(--border-thin)]">
                                  <span className="text-xs text-[var(--text-main)]">{cleanFeatureName(f.raw_feature)}</span>
                                  <span className="font-mono text-xs font-bold text-emerald-600">
                                    {f.shap_value.toFixed(3)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                      
                      {selectedFeature && (
                        <div className="p-4 bg-[var(--bg-dark)]/80 backdrop-blur-md rounded-2xl border [border:var(--border-strong)] shadow-2xl animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-[10px] text-[var(--accent)] uppercase tracking-widest font-bold mb-1">Feature Analysis</div>
                              <h3 className="text-lg font-bold text-[var(--text-main)]">{cleanFeatureName(selectedFeature.name)}</h3>
                            </div>
                            <button onClick={() => setSelectedFeature(null)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" aria-label="Close feature analysis">×</button>
                          </div>
                          <div className="flex items-baseline gap-2 mb-3">
                            <span className={`text-2xl font-mono font-bold ${selectedFeature.value > 0 ? 'text-carbon_black-100' : 'text-[var(--text-main)]'}`}>
                              {selectedFeature.value > 0 ? `+${selectedFeature.value.toFixed(3)}` : selectedFeature.value.toFixed(3)}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Impact Score</span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            This feature contributes to the overall risk prediction based on historical data patterns.
                          </p>
                        </div>
                      )}
                      
                      {!selectedFeature && (
                        <div className="text-center p-6 text-[var(--text-muted)] italic text-xs">
                          Click a satellite in the 3D view to analyze specific feature impact.
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'path' && (
                    xaiBundle.counterfactual ? (
                      <CounterfactualPanel 
                        suggestions={xaiBundle.counterfactual.suggestions} 
                        originalProb={xaiBundle.prediction.probability}
                        newProb={xaiBundle.counterfactual.new_probability}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[var(--text-muted)] italic text-sm">
                        No counterfactual suggestions available for this profile.
                      </div>
                    )
                  )}
                 
                 {activeTab === 'fairness' && fairnessReport && (
                   <FairnessDashboard report={fairnessReport} />
                 )}
              </div>
            </div>
          )}

          {/* Collapse Toggle */}
          <button 
            onClick={() => setIsAnalysisPanelCollapsed(!isAnalysisPanelCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 left-[-12px] w-6 h-6 bg-[var(--accent)] rounded-full flex items-center justify-center text-white text-xs z-20 hover:bg-carbon_black-200 transition-colors active:scale-90"
            aria-label={isAnalysisPanelCollapsed ? 'Expand analysis panel' : 'Collapse analysis panel'}
          >
            {isAnalysisPanelCollapsed ? '←' : '→'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Predictor;