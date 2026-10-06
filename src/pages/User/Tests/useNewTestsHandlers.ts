// Deprecated: selection handlers moved into Redux-connected components and shared hooks.
// This file remains as a stub to avoid import errors if referenced.
export default function useNewTestsHandlers() {
  return {
    onGlobalSelectChange: (_selected: boolean) => {},
    onSuiteSelectChange: (_suiteId: string, _selected: boolean) => {},
    onCaseSelectionChange: (
      _suiteId: string,
      _caseId: string,
      _selected: boolean,
    ) => {},
    getSuiteCheckboxState: (_suiteId?: string) => 'unchecked' as const,
    isCaseSelected: (_suiteId?: string, _caseId?: string) => false,
  };
}
