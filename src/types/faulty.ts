export enum FaultyStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
}

export type ReportIssueRequest = {
  tabId: string;
  description: string;
  image?: File | null;
};
