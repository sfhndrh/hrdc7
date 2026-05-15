export type Role = "ADMIN" | "TRAINER" | "CLIENT";

export type TrainerStatus = "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

export type SubStatus =
  | "PENDING_PAYMENT"
  | "PROOF_UPLOADED"
  | "ACTIVE"
  | "EXPIRED"
  | "REJECTED";

export interface AiVerification {
  id: string;
  trainerId: string;
  overallPassed: boolean;
  confidenceScore: number;
  flags: string[];
  certIsHrdc: boolean | null;
  certName: string | null;
  certNumber: string | null;
  certIssueDate: string | null;
  certExpiryDate: string | null;
  certDomain: string | null;
  certExpired: boolean | null;
  certHasSeal: boolean | null;
  certTampered: boolean | null;
  nameMatchesReg: boolean | null;
  aiRecommendation: "APPROVE" | "REJECT" | "MANUAL_REVIEW" | null;
  summary: string | null;
  rawResponse: object;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  trainerId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface VerificationResult {
  overallPassed: boolean;
  confidenceScore: number;
  flags: string[];
  certCheck: {
    isHrdcCertificate: boolean;
    nameOnCert: string;
    certNumber: string;
    issueDate: string;
    expiryDate: string;
    trainingDomain: string;
    isExpired: boolean;
    hasOfficialSeal: boolean;
    suspectedTampered: boolean;
  };
  nameMatchesRegistration: boolean;
  aiRecommendation: "APPROVE" | "REJECT" | "MANUAL_REVIEW";
  summary: string;
  rawResponse: object;
}
