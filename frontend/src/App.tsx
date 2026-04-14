import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Loader } from '@react-three/drei';
import { api } from './api/client';
import type { PredictionResponse, GlobalImportanceResponse, ModelInfoResponse } from './api/client';
import RiskNucleus from './components/RiskNucleus';
import EmberParticles from './components/EmberParticles';
import InfluenceMap from './components/InfluenceMap';
import ModelHUD from './components/ModelHUD';

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

const App: React.FC = () => {
  const [formData, setFormData] = useState<LoanFormData>({
    Age: 30,
    Income: 50000,
    LoanAmount: 10000,
    CreditScore: 700,
    MonthsEmployed: 60,
    NumCreditLines: 3,
    InterestRate: 5.0,
    LoanTerm: 36,
    DTIRatio: 0.3,
    Education: 'Bachelor\'s',
    EmploymentType: 'Full-time',
    MaritalStatus: 'Married',
    HasMortgage: 'No',
    HasDependents: 'No',
    LoanPurpose: 'Home Improvement',
    HasCoSigner: 'No',
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [globalImportance, setGlobalImportance] = useState<GlobalImportanceResponse['global_importance']>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAllDrivers, setShowAllDrivers] = useState(false);

  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [info, importance] = await Promise.all([
          api.getModelInfo(),
          api.getGlobalImportance(),
        ]);
        setModelInfo(info);
        setGlobalImportance(importance.global_importance);
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
      const numericFields: (keyof LoanFormData)[] = [
        'Age', 'Income', 'LoanAmount', 'CreditScore', 'MonthsEmployed', 
        'NumCreditLines', 'InterestRate', 'LoanTerm', 'DTIRatio'
      ];
      
      numericFields.forEach(field => {
        if (typeof sanitizedData[field] === 'string' && sanitizedData[field] === '') {
          (sanitizedData[field] as any) = 0;
        }
      });

      const result = await api.predict(sanitizedData);
      setPrediction(result);
      setShowAllDrivers(false);
    } catch (error) {
      alert('Prediction failed. Please check if the backend is running.');
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
      <div className="w-1/3 h-full overflow-y-auto p-8 bg-[#1A0A06] border-r border-[#E25D30]/20 z-10">
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
                  <option value="High School">High School</option>
                  <option value="Bachelor's">Bachelor's</option>
                  <option value="Master's">Master's</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B38A7C] mb-1">Marital Status</label>
                <select name="MaritalStatus" value={formData.MaritalStatus} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B38A7C] mb-1">Has Dependents</label>
                <select name="HasDependents" value={formData.HasDependents} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
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
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#B38A7C] mb-1">Has Co-Signer</label>
                <select name="HasCoSigner" value={formData.HasCoSigner} onChange={handleInputChange} className="w-full bg-[#431407] border border-[#E25D30]/30 rounded p-2 text-sm text-[#FDE8DC]">
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
      </div>

      {/* Right Area: 3D Scene & Overlays */}
      <div className="relative flex-1 h-full bg-[#1A0A06]">
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 5, 15]} />
          <OrbitControls enablePan={false} minDistance={5} maxDistance={25} />
          <Environment preset="city" />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          
          <RiskNucleus riskScore={prediction?.risk_score || 0} />
          <EmberParticles riskScore={prediction?.risk_score || 0} />
          {prediction && <InfluenceMap explanation={prediction.explanation} />}
          
          <Loader />
        </Canvas>

        {/* Command Center Panel */}
        {prediction && (
          <div className="absolute top-6 left-6 w-72 p-4 bg-[#1A0A06]/60 backdrop-blur-md rounded-lg border border-[#E25D30]/30 animate-in fade-in slide-in-from-left-4">
            <div className="text-[10px] text-[#E25D30] uppercase tracking-widest font-semibold mb-1">Risk Gauge</div>
            <div className="text-4xl font-medium text-[#FDE8DC] mb-1">
              {(prediction.probability * 100).toFixed(2)}%
            </div>
            <div className="text-[10px] text-[#B38A7C] mb-3">Default Probability</div>
            
            <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
              prediction.prediction === 'Good Credit' ? 'bg-green-500/20 text-green-400' : 'bg-[#E25D30]/20 text-[#FB923C]'
            }`}>
              {prediction.prediction === 'Good Credit' ? 'Low Risk' : 'Likely Default'}
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
                      <span className="text-[#B38A7C] truncate mr-2">{feature}</span>
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

export default App;







