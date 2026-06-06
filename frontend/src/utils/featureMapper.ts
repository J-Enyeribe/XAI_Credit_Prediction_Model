const displayNames: Record<string, string> = {
  Age: 'Age',
  Income: 'Annual Income',
  LoanAmount: 'Loan Amount',
  CreditScore: 'Credit Score',
  MonthsEmployed: 'Employed (Months)',
  NumCreditLines: 'Credit Lines',
  InterestRate: 'Interest Rate',
  LoanTerm: 'Loan Term',
  DTIRatio: 'DTI Ratio',
  Education: 'Education',
  EmploymentType: 'Employment',
  MaritalStatus: 'Marital Status',
  HasMortgage: 'Mortgage',
  HasDependents: 'Dependents',
  LoanPurpose: 'Loan Purpose',
  HasCoSigner: 'Co-Signer',

  // Self-contained labels for binary category values so both Yes/No aren't confusing
  HasDependents_Yes: 'Has Dependents',
  HasDependents_No: 'No Dependents',
  HasMortgage_Yes: 'Has Mortgage',
  HasMortgage_No: 'No Mortgage',
  HasCoSigner_Yes: 'Has Co-Signer',
  HasCoSigner_No: 'No Co-Signer',
};

export const cleanFeatureName = (name: string): string => {
  // Strip sklearn prefix (num__ or cat__)
  const withoutPrefix = name.replace(/^(num__|cat__)/, '');

  // Direct match — handles numerical features AND binary category overrides
  if (displayNames[withoutPrefix]) return displayNames[withoutPrefix];

  // Categorical feature: format is "Feature_Value" (e.g. "Education_Bachelor's")
  const underscoreIdx = withoutPrefix.indexOf('_');
  if (underscoreIdx > 0) {
    const base = withoutPrefix.substring(0, underscoreIdx);
    const value = withoutPrefix.substring(underscoreIdx + 1).replace(/_/g, ' ');
    const label = displayNames[base] || base;
    return `${label}: ${value}`;
  }

  // Final fallback
  return withoutPrefix.replace(/_/g, ' ');
};
