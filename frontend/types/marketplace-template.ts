// Safe browser view of a versioned Amazon category template imported from XLSM.
export interface MarketplaceTemplateSummary {
  id: string;
  productType: string;
  marketplaceId: string;
  language: string;
  fieldCount: number;
  definitionCount?: number;
  schemaSha256: string;
}

export interface MarketplaceTemplateField {
  column: number;
  key: string;
  pattern: string;
  attribute: string;
  label: string;
  group: string;
  description: string;
  requirement: "REQUIRED" | "CONDITIONAL" | "RECOMMENDED" | "OPTIONAL";
  canonicalPath?: string;
  allowedValues?: string[];
}

export interface MarketplaceTemplate extends MarketplaceTemplateSummary {
  fields: MarketplaceTemplateField[];
  sourceMetadata?: {
    version: number;
    sourceSha256: string;
    definitions: Array<{ pattern: string; row: number; example: string }>;
    suggestedChoiceKeys: string[];
  } | null;
  browseNodes: Array<{ id: string; path: string }>;
  isActive: boolean;
}
