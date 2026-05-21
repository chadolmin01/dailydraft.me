/**
 * M6 Glossary v1.1 — TypeScript Type Enforcement
 *
 * This file is the SINGLE SOURCE OF TRUTH for M6 terminology in code.
 * Any code that uses M6 concepts MUST import types from this file.
 *
 * Do NOT define alternative names. Do NOT use forbidden synonyms.
 * See M6_Glossary_v1.1.md for the full canonical definitions.
 */

// ============================================================================
// Tier 1 — Semantic Model
// ============================================================================

/**
 * The 12 fixed AtomTypes. FROZEN in v1.
 * Adding a new type requires Semantic Model version bump.
 */
export const ATOM_TYPES = [
  'Requirement',
  'Deadline',
  'Constraint',
  'Deliverable',
  'Metric',
  'Narrative',
  'Event',
  'Question',
  'Decision',
  'Reference',
  'Definition',
  'Entity',
] as const;

export type AtomType = (typeof ATOM_TYPES)[number];

/**
 * The 10 fixed RelationTypes. FROZEN in v1.
 */
export const RELATION_TYPES = [
  'requires',
  'fulfills',
  'references',
  'assigned_to',
  'produced_by',
  'temporally_after',
  'responds_to',
  'triggers',
  'approves',
  'evolves_to',
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

// ============================================================================
// Tier 4 — Source Layer
// ============================================================================

/**
 * Where an Atom came from. Required on every Atom.
 * An Atom without Provenance is INVALID.
 */
export interface Provenance {
  /** Source field — pointer to specific location within a File */
  source: {
    file_id: string;
    /** Free-form location identifier: page number, section ID, cell ref, line range */
    location: string;
    /** The original text fragment from which this Atom was extracted */
    raw_text: string;
  };
  /** Which model/version extracted this Atom */
  extracted_by: {
    model: string;        // e.g. "claude-opus-4-7"
    extractor_version: string; // e.g. "m6-extractor-v1.1"
    extracted_at: string; // ISO 8601 timestamp
  };
}

export type FileCategory =
  | '공문'
  | '사업계획서'
  | '실적보고서'
  | '회의록'
  | '정산서류'
  | '규정/지침'
  | '공지/안내'
  | '기타';

export const FILE_CATEGORIES: readonly FileCategory[] = [
  '공문',
  '사업계획서',
  '실적보고서',
  '회의록',
  '정산서류',
  '규정/지침',
  '공지/안내',
  '기타',
] as const;

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Atom — indivisible unit of meaning. The fundamental data unit of M6.
 */
export interface Atom {
  id: string;                    // UUID
  tenant_id: string;             // RLS scope
  type: AtomType;
  content: string;               // <= 500 chars, independently meaningful
  attributes: Record<string, unknown>; // type-specific extra fields
  provenance: Provenance;
  confidence: number;            // [0, 1]
  status: AtomStatus;
  series_atom_id?: string;       // Atoms that evolve over time share this
  valid_from?: string;           // ISO 8601
  valid_to?: string;             // ISO 8601, null = currently valid
  created_at: string;
  updated_at: string;
}

export type AtomStatus = 'active' | 'pending_review' | 'superseded' | 'rejected';

/**
 * Relation — typed directed edge between two Atoms.
 */
export interface Relation {
  id: string;
  tenant_id: string;
  from_atom_id: string;
  to_atom_id: string;
  type: RelationType;
  confidence: number;
  extracted_by: 'llm' | 'human' | 'rule';
  created_at: string;
}

/**
 * Triple — formal (subject, predicate, object) view over Atoms and Relations.
 * Derived, not stored directly.
 */
export interface Triple {
  subject: Atom;
  predicate: RelationType;
  object: Atom;
}

// ============================================================================
// Tier 4 — File and FileSeries
// ============================================================================

export interface File {
  id: string;
  tenant_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by: string;            // user_id
  series_id?: string;             // null if standalone
  series_position?: number;       // position within series, 1-indexed
  category?: FileCategory;        // assigned during Classification phase
  storage_url: string;            // Supabase Storage path
}

export interface FileSeries {
  id: string;
  tenant_id: string;
  series_name: string;            // e.g. "FLIP_3팀_시장조사"
  detected_by: 'pattern' | 'manual';
  created_at: string;
}

// ============================================================================
// Tier 2 — Ontology Layer (Rule & Output)
// ============================================================================

export interface Rule {
  id: string;
  tenant_id: string;
  name: string;                   // e.g. "weekly_progress_report"
  description: string;
  yaml_definition: string;        // declarative filter/aggregate logic
  code_module?: string;           // optional path to TS module for complex logic
  prompt_template?: string;       // optional LLM prompt for narrative parts
  version: number;
  created_at: string;
}

export interface Output {
  id: string;
  tenant_id: string;
  rule_id: string;
  rule_version: number;
  content: string;                // rendered markdown/HTML
  citations: Citation[];          // every claim must have a citation
  composed_at: string;
  composed_by: string;            // user_id who triggered Composition
}

export interface Citation {
  claim_id: string;               // local ID within Output
  atom_ids: string[];             // Atoms supporting this claim
}

// ============================================================================
// Tier 5 — Pipeline Phase Markers
// ============================================================================

export const EXTRACTION_PHASES = [
  'Ingestion',
  'Parsing',
  'Classification',
  'Extraction',
  'Linking',
  'Validation',
] as const;

export type ExtractionPhase = (typeof EXTRACTION_PHASES)[number];

// ============================================================================
// Tier 3 — Tenant
// ============================================================================

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
}

// ============================================================================
// Forbidden Term Detection (for runtime checks if needed)
// ============================================================================

export const FORBIDDEN_TERMS_IN_CODE = [
  'AKU',
  'Propositioner',     // use Extractor instead
  'Molecule',          // reserved for v2
  'Document',          // use File in v1
  'DocumentSeries',    // use FileSeries
  'Quadruple',         // reserved for v2
  'Chunk',             // use Atom or text_segment
  'KG',                // use Graph
] as const;

/**
 * Compile-time-ish guard. Throws at runtime if forbidden term used in payload.
 * Use sparingly — TypeScript types should catch most cases at compile.
 */
export function assertNoForbiddenTerms(payload: unknown, context: string): void {
  const serialized = JSON.stringify(payload);
  for (const term of FORBIDDEN_TERMS_IN_CODE) {
    if (serialized.includes(term)) {
      throw new Error(
        `[M6 Glossary v1.1] Forbidden term "${term}" detected in ${context}. ` +
        `See M6_Glossary_v1.1.md for the correct term.`
      );
    }
  }
}

// ============================================================================
// Glossary Version Constant
// ============================================================================

export const M6_GLOSSARY_VERSION = '1.1';
export const M6_GLOSSARY_LOCKED = true;
