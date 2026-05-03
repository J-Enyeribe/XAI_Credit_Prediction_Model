import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Loader } from '@react-three/drei';
import { api } from '../api/client';
import type { PredictionResponse, ModelInfoResponse } from '../api/client';
import { cleanFeatureName } from '../utils/featureMapper';
import RiskNucleus from '../components/RiskNucleus';
import EmberParticles from '../components/EmberParticles';
import InfluenceMap from '../components/InfluenceMap';
import ModelHUD from '../components/ModelHUD';

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

const FEATURE_EXPLANATIONS: Record<string, string> = {
  'Age': 'The applicant\'s age. Certain age brackets are statistically associated with different risk profiles.',
  'Annual Income': 'The yearly income of the applicant. Higher income generally provides a better buffer for loan repayment.',
  'Loan Amount': 'The total amount requested. Larger loans typically carry higher risk if not balanced by income.',
  'Credit Score': 'A numerical representation of creditworthiness. High scores indicate a strong history of repayment.',
  'Employment Duration': 'How long the applicant has been employed. Stability in employment reduces the risk of default.',
  'Credit Lines': 'The number of open credit accounts. Too many can indicate over-leverage, while too few might show lack of history.',
  'Interest Rate': 'The cost of borrowing. Higher rates increase the monthly burden on the borrower.',
  'Loan Term': 'The length of the loan. Longer terms may lower monthly payments but increase overall interest risk.',
  'DTI Ratio': 'Debt-to-Income ratio. A key metric showing how much of the monthly income goes toward paying debts.',
  'Education': 'Highest education level attained. Often used as a proxy for earning potential and stability.',
  'Employment Type': 'The nature of employment (e.g., Full-time, Self-employed), reflecting income reliability.',
  'Marital Status': 'The applicant\'s marital status, which can sometimes correlate with financial stability.',
  'Has Dependents': 'Whether the applicant has dependents, which impacts monthly disposable income.',
  'Loan Purpose': 'The reason for the loan, as some purposes are historically riskier than others.',
  'Has Mortgage': 'Whether the applicant already has a mortgage, adding to their existing debt load.',
  'Has Co-Signer': 'The presence of a co-signer provides an additional layer of security for the lender.',
};

const Predictor: React.FC = () => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<{ name: string, value: number } | null>(null);
  const [formData, setFormData] = useState<LoanFormData>({
    Age: '',
    Income: '',
    LoanAmount: '',
    CreditScore: '',
    MonthsEmployed: '',
    NumCreditLines: '',
    InterestRate: '',
    LoanTerm: '',
    DTIRatio: '',
    Education: '',
    EmploymentType: '',
    MaritalStatus: '',
    HasMortgage: '',
    HasDependents: '',
    LoanPurpose: '',
    HasCoSigner: '',
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllDrivers, setShowAllDrivers] = useState(false);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [info] = await Promise.all([
          api.getModelInfo(),
          api.getGlobalImportance(),
        ]);
        setModelInfo(info);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    fetchInitData();
  }, []);

    const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        if (value === '' || value === null || value === undefined) {
          throw new Error(`${label} is required.`);
        }
        const numValue = Number(value);
        if (isNaN(numValue)) {
          throw new Error(`${label} must be a number.`);
        }
        if (min !== undefined && numValue < min) {
          throw new Error(`${label} must be at least ${min}.`);
        }
        if (max !== undefined && numValue > max) {
          throw new Error(`${label} must be no more than ${max}.`);
        }
         (sanitizedData[field] as number) = numValue;

      }

      // Validate categorical fields
      const categoricalFields: (keyof LoanFormData)[] = [
        'Education', 'EmploymentType', 'MaritalStatus', 'HasMortgage', 'HasDependents', 'LoanPurpose', 'HasCoSigner'
      ];
      for (const field of categoricalFields) {
        if (!sanitizedData[field]) {
          throw new Error(`${field} is required.`);
        }
      }

      const result = await api.predict(sanitizedData);
      setPrediction(result);
      setShowAllDrivers(false);
     } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Prediction failed. Please check if the backend is running.';
       alert(errorMessage);
     } finally {

      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const numericFields = [
        'Age', 'Income', 'LoanAmount', 'CreditScore', 'MonthsEmployed', 
        'NumCreditLines', 'InterestRate', 'LoanTerm', 'DTIRatio'
      ];
      
      if (numericFields.includes(name)) {
        const parsed = parseFloat(value);
        return {
          ...prev,
          [name]: value === '' ? '' : (isNaN(parsed) ? value : parsed)
        };
      }
      
      return {
        ...prev,
        [name]: value
      };
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#1A0A06] text-[#FDE8DC] overflow-hidden">
      {/* Left Panel: Form */}
      <div className={`${isPanelCollapsed ? 'w-16 p-0' : 'w-[400px] p-8'} h-full overflow-y-auto bg-[#1A0A06] border-r border-[#E25D30]/20 z-10 transition-all duration-300 relative group flex-shrink-0`}>
        {!isPanelCollapsed && (
          <>
            <h1 className="text-3xl font-bold mb-2 text-[#E25D30]">XAI Credit Risk</h1>
            <p className="text-[#B38A7C] mb-8 text-sm">Enter applicant details to analyze risk.</p>
            
            <form onSubmit={handlePredict} className="space-y-8">
              {/* Section 1: Personal & Demographic */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[#B38A7C] uppercase tracking-wider">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Age</label>
                    <input name="Age" type="number" value={formData.Age} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Education</label>
                    <select name="Education" value={formData.Education} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                      <option value="">Select Education</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's">Bachelor's</option>
                      <option value="Master's">Master's</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Marital Status</label>
                    <select name="MaritalStatus" value={formData.MaritalStatus} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Has Dependents</label>
                    <select name="HasDependents" value={formData.HasDependents} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
            
              {/* Section 2: Employment & Finance */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[#B38A7C] uppercase tracking-wider">Employment & Finance</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Annual Income</label>
                    <input name="Income" type="number" value={formData.Income} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Employment Type</label>
                    <select name="EmploymentType" value={formData.EmploymentType} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                      <option value="">Select Type</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Unemployed">Unemployed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Months Employed</label>
                    <input name="MonthsEmployed" type="number" value={formData.MonthsEmployed} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Credit Score</label>
                    <input name="CreditScore" type="number" value={formData.CreditScore} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                </div>
              </div>
            
              {/* Section 3: Loan Details */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-[#B38A7C] uppercase tracking-wider">Loan Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Loan Amount</label>
                    <input name="LoanAmount" type="number" value={formData.LoanAmount} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Loan Term (Months)</label>
                    <input name="LoanTerm" type="number" value={formData.LoanTerm} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Interest Rate (%)</label>
                    <input name="InterestRate" type="number" value={formData.InterestRate} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">DTI Ratio</label>
                    <input name="DTIRatio" type="number" step="0.01" value={formData.DTIRatio} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Num Credit Lines</label>
                    <input name="NumCreditLines" type="number" value={formData.NumCreditLines} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Loan Purpose</label>
                    <select name="LoanPurpose" value={formData.LoanPurpose} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                      <option value="">Select Purpose</option>
                      <option value="Auto">Auto</option>
                      <option value="Business">Business</option>
                      <option value="Education">Education</option>
                      <option value="Home">Home</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Has Mortgage</label>
                    <select name="HasMortgage" value={formData.HasMortgage} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                      <option value="">Select Option</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#B38A7C] mb-1">Has Co-Signer</label>
                    <select name="HasCoSigner" value={formData.HasCoSigner} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
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
                className="w-full py-3 bg-[#E25D30] hover:bg-[#FB923C] text-[#FDE8DC] font-bold rounded-lg transition-all disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Predict Risk Score'}
              </button>
            </form>
          </>
        )}
        <button 
          onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 right-[-12px] w-6 h-6 bg-[#E25D30] rounded-full flex items-center justify-center text-white text-xs z-20 hover:bg-[#FB923C] transition-colors"
        >
          {isPanelCollapsed ? '→' : '←'}
        </button>
      </div>

       {/* Right Area: 3D Scene & Overlays */}
       <div className="relative flex-1 min-w-0 h-full bg-[#1A0A06]">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 5, 15]} />
          <OrbitControls enablePan={false} minDistance={5} maxDistance={25} />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          
           <RiskNucleus riskScore={prediction?.risk_score || 0} />
           <EmberParticles riskScore={prediction?.risk_score || 0} />
           {prediction && <InfluenceMap explanation={prediction.explanation} onFeatureClick={(name, val) => setSelectedFeature({ name, value: val })} />}
           
           <Loader />
         </Canvas>
 
         {/* Stat Card Overlay */}
         {selectedFeature && (
           <div className="absolute bottom-8 right-8 w-80 p-6 bg-[#1A0A06]/80 backdrop-blur-xl rounded-2xl border border-[#E25D30]/40 animate-in fade-in zoom-in-95 duration-200 z-20 shadow-2xl">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <div className="text-[10px] text-[#E25D30] uppercase tracking-widest font-bold mb-1">Feature Analysis</div>
                 <h3 className="text-xl font-bold text-[#FDE8DC]">{cleanFeatureName(selectedFeature.name)}</h3>
               </div>
               <button 
                 onClick={() => setSelectedFeature(null)}
                 className="text-[#B38A7C] hover:text-[#FDE8DC] transition-colors text-xl"
               >
                 ×
               </button>
             </div>
             
             <div className="flex items-baseline gap-2 mb-4">
               <span className={`text-2xl font-mono font-bold ${selectedFeature.value > 0 ? 'text-[#FB923C]' : 'text-[#FDE8DC]'}`}>
                 {selectedFeature.value > 0 ? `+${selectedFeature.value.toFixed(3)}` : selectedFeature.value.toFixed(3)}
               </span>
               <span className="text-[10px] text-[#B38A7C] uppercase font-semibold">Impact Score</span>
             </div>
             
             <p className="text-sm text-[#B38A7C] leading-relaxed">
               {FEATURE_EXPLANATIONS[cleanFeatureName(selectedFeature.name)] || 'This feature contributes to the overall risk prediction based on historical data patterns.'}
             </p>
             
             <div className="mt-6 pt-4 border-t border-[#E25D30]/20 flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${selectedFeature.value > 0 ? 'bg-[#FB923C]' : 'bg-[#FDE8DC]'}`} />
               <span className="text-[10px] text-[#B38A7C] uppercase tracking-wider">
                 {selectedFeature.value > 0 ? 'Increases Risk Probability' : 'Decreases Risk Probability'}
               </span>
             </div>
           </div>
         )}
 
         {/* Command Center Panel */}
         {prediction && (
          <div className="absolute top-6 left-6 w-72 p-4 bg-[#1A0A06]/60 backdrop-blur-md rounded-lg border border-[#E25D30]/30 animate-in fade-in slide-in-from-left-4">
            <div className="text-[10px] text-[#E25D30] uppercase tracking-widest font-semibold mb-1">Risk Gauge</div>
            <div className="text-4xl font-medium text-[#FDE8DC] mb-1">
              {(prediction.probability * 100).toFixed(2)}%
            </div>
            <div className="text-[10px] text-[#B38A7C] mb-3">Default Probability</div>
            
            <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              prediction.probability <= 0.25 ? 'bg-green-500/20 text-green-400' :
              prediction.probability <= 0.5 ? 'bg-yellow-500/20 text-yellow-400' :
              prediction.probability <= 0.7 ? 'bg-orange-500/20 text-orange-400' :
              'bg-[#E25D30]/20 text-[#FB923C]'
            }`}>
              {prediction.probability <= 0.25 ? 'Low Risk' :
               prediction.probability <= 0.5 ? 'Medium Risk' :
               prediction.probability <= 0.7 ? 'High Risk' :
               'Likely Default'}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E25D30]/20">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[9px] text-[#B38A7C] uppercase tracking-wider">Top Drivers</div>
                <button 
                  onClick={() => setShowAllDrivers(!showAllDrivers)}
                  className="text-[8px] text-[#E25D30] hover:underline"
                >
                  {showAllDrivers ? 'Show Top 3' : 'View All'}
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(prediction.explanation)
                  .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                  .slice(0, showAllDrivers ? undefined : 3)
                  .map(([feature, value]) => (
                    <div key={feature} className="flex justify-between items-center text-[10px] py-0.5">
                       <span className="text-[#B38A7C] truncate mr-2">{cleanFeatureName(feature)}</span>
                       <span className={`font-mono ${value > 0 ? 'text-[#FB923C]' : 'text-[#FDE8DC]'}`}>
                         {value > 0 ? `+${value.toFixed(2)}` : value.toFixed(2)}
                       </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <ModelHUD modelInfo={modelInfo} />
      </div>
    </div>
  );
};

export default Predictor;
