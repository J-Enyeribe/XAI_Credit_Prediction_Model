export const featureMap: Record<string, string> = {
  'num__Age': 'Age',
  'num__Income': 'Annual Income',
  'num__LoanAmount': 'Loan Amount',
  'num__CreditScore': 'Credit Score',
  'num__MonthsEmployed': 'Employment Duration',
  'num__NumCreditLines': 'Credit Lines',
  'num__InterestRate': 'Interest Rate',
  'num__LoanTerm': 'Loan Term',
  'num__DTIRatio': 'DTI Ratio',
};

export const cleanFeatureName = (name: string): string => {
  if (featureMap[name]) return featureMap[name];
  
  // Fallback for one-hot encoded categorical features
  // Example: cat__Education_Bachelor's -> Education: Bachelor's
  return name
    .replace('num__', '')
    .replace('cat__', '')
    .replace(/_/g, ' ')
    .replace(/^([a-z]+) (.*)$/, (_, group, value) => `${group}: ${value}`);
};
