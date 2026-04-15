export type Nominee = {
  id: string;
  phone: string;
  name: string | null;
};

export type Session = {
  token: string;
  nominee: Nominee;
};

export type Message = {
  role: "user" | "assistant" | "agent" | "system";
  content: string;
  agentName?: string;
  language?: string;
  timestamp?: string;
};

export type Policy = {
  insurerName: string;
  policyNumber: string;
  policyType: string;
  sumAssured?: number;
  documentsRequired?: string[];
  documentsUploaded?: string[];
  claimLetterGenerated?: boolean;
  claimStatus?: string;
};

export type DocumentRecord = {
  _id: string;
  caseId: string;
  policyId?: string;
  documentType: string;
  originalName: string;
  mimeType: string;
  size: number;
  validationStatus: string;
  validationNote?: string;
  createdAt?: string;
};

export type AgentState = {
  discovered_policies?: Policy[];
  document_checklists?: Record<string, string>;
  document_requirements?: Record<string, string[]>;
  documents_validated?: Record<string, Record<string, string>>;
  claim_letters_generated?: Record<
    string,
    {
      insurer: string;
      policy_number: string;
      generated_at: string;
      letter: string;
    }
  >;
  next_action?: string;
  current_agent?: string;
  ready_for_drafting?: boolean;
};

export type CaseRecord = {
  _id: string;
  language: string;
  phase: string;
  deceased: {
    name: string;
    aadhaar?: string;
    pan?: string;
    dateOfDeath?: string;
    employer?: string;
    city?: string;
    state?: string;
  };
  policies: Policy[];
  conversationHistory: Message[];
  agentState?: AgentState;
  documents?: DocumentRecord[];
  updatedAt?: string;
  createdAt?: string;
};
