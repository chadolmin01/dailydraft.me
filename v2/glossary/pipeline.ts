/**
 * M6 End-to-End Pipeline — Single File → Atoms in Graph
 * Glossary v1.1 compliant.
 *
 * This is the spine. Real implementation will split into separate modules,
 * but the full flow lives here for PoC clarity.
 *
 * Flow: Ingestion → Parsing → Classification → Extraction → Linking → Validation
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import {
  ATOM_TYPES,
  RELATION_TYPES,
  FILE_CATEGORIES,
  type Atom,
  type AtomType,
  type Relation,
  type RelationType,
  type File as M6File,
  type FileCategory,
  type Provenance,
  type ExtractionPhase,
  assertNoForbiddenTerms,
  M6_GLOSSARY_VERSION,
} from './glossary';

// ============================================================================
// Setup
// ============================================================================

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inject Glossary into every LLM call
const GLOSSARY_HEADER = readFileSync('./system_prompt_glossary.md', 'utf-8');

const MODEL = 'claude-opus-4-7';
const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dim, matches schema

// ============================================================================
// Pipeline Entry Point
// ============================================================================

export interface PipelineResult {
  file_id: string;
  category: FileCategory;
  atoms_extracted: number;
  relations_created: number;
  atoms_pending_review: number;
  phase_timings: Record<ExtractionPhase, number>;
  errors: string[];
}

export async function processFile(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  tenantId: string,
  uploadedBy: string
): Promise<PipelineResult> {
  const timings: Record<ExtractionPhase, number> = {} as any;
  const errors: string[] = [];

  // Set tenant context for RLS
  await supabase.rpc('set_config', {
    parameter: 'app.tenant_id',
    value: tenantId,
  });

  // Phase 1: Ingestion
  const t1 = Date.now();
  const file = await ingestFile(fileBuffer, filename, mimeType, tenantId, uploadedBy);
  timings['Ingestion'] = Date.now() - t1;

  // Phase 2: Parsing
  const t2 = Date.now();
  const parsedText = await parseFile(file, fileBuffer);
  timings['Parsing'] = Date.now() - t2;

  // Phase 3: Classification
  const t3 = Date.now();
  const category = await classifyFile(parsedText, filename);
  await supabase.from('files').update({ category }).eq('id', file.id);
  timings['Classification'] = Date.now() - t3;

  // Phase 4: Extraction (parallel by AtomType)
  const t4 = Date.now();
  const extractedAtoms = await extractAtoms(parsedText, category, file.id);
  timings['Extraction'] = Date.now() - t4;

  // Phase 5: Linking
  const t5 = Date.now();
  const relations = await linkAtoms(extractedAtoms, tenantId);
  timings['Linking'] = Date.now() - t5;

  // Phase 6: Validation
  const t6 = Date.now();
  const { validAtoms, pendingAtoms } = await validateAtoms(extractedAtoms);
  timings['Validation'] = Date.now() - t6;

  // Persist
  await persistAtoms(validAtoms, pendingAtoms, tenantId);
  await persistRelations(relations, tenantId);

  return {
    file_id: file.id,
    category,
    atoms_extracted: validAtoms.length + pendingAtoms.length,
    relations_created: relations.length,
    atoms_pending_review: pendingAtoms.length,
    phase_timings: timings,
    errors,
  };
}

// ============================================================================
// Phase 1: Ingestion
// ============================================================================

async function ingestFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  tenantId: string,
  uploadedBy: string
): Promise<M6File> {
  // Upload to Supabase Storage
  const storagePath = `${tenantId}/${Date.now()}-${filename}`;
  const { error: uploadError } = await supabase.storage
    .from('m6-files')
    .upload(storagePath, buffer, { contentType: mimeType });

  if (uploadError) throw new Error(`Ingestion failed: ${uploadError.message}`);

  // Detect FileSeries (simple filename pattern matching for PoC)
  const seriesInfo = await detectFileSeries(filename, tenantId);

  // Register File row
  const { data, error } = await supabase
    .from('files')
    .insert({
      tenant_id: tenantId,
      filename,
      mime_type: mimeType,
      size_bytes: buffer.length,
      uploaded_by: uploadedBy,
      storage_url: storagePath,
      series_id: seriesInfo?.series_id ?? null,
      series_position: seriesInfo?.position ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`File registration failed: ${error.message}`);
  return data as M6File;
}

async function detectFileSeries(
  filename: string,
  tenantId: string
): Promise<{ series_id: string; position: number } | null> {
  // Pattern: "ANYTHING_WeekN.ext" or "ANYTHING_NWeek.ext" or "ANYTHING_v1.ext"
  const weekMatch = filename.match(/^(.+?)[_-]?[Ww]eek[_-]?(\d+)/);
  if (!weekMatch) return null;

  const seriesName = weekMatch[1].trim();
  const position = parseInt(weekMatch[2], 10);

  // Find or create series
  let { data: existing } = await supabase
    .from('file_series')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('series_name', seriesName)
    .maybeSingle();

  if (!existing) {
    const { data: created } = await supabase
      .from('file_series')
      .insert({
        tenant_id: tenantId,
        series_name: seriesName,
        detected_by: 'pattern',
      })
      .select('id')
      .single();
    existing = created;
  }

  return { series_id: existing!.id, position };
}

// ============================================================================
// Phase 2: Parsing
// ============================================================================

async function parseFile(file: M6File, buffer: Buffer): Promise<string> {
  // PoC: handle only PDF, DOCX, TXT. HWP via convert-then-parse strategy.
  // Full implementation uses pdf-parse, mammoth, xlsx libraries.

  let text: string;

  switch (file.mime_type) {
    case 'application/pdf': {
      const pdfParse = await import('pdf-parse');
      const result = await pdfParse.default(buffer);
      text = result.text;
      break;
    }
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case 'text/plain':
    case 'text/markdown':
      text = buffer.toString('utf-8');
      break;
    case 'application/x-hwp':
    case 'application/haansofthwp':
      throw new Error(
        'HWP direct parsing not supported in PoC. Convert to PDF first.'
      );
    default:
      throw new Error(`Unsupported mime type: ${file.mime_type}`);
  }

  // Store parsed text
  await supabase
    .from('files')
    .update({
      parsed_text: text,
      parsing_completed_at: new Date().toISOString(),
    })
    .eq('id', file.id);

  return text;
}

// ============================================================================
// Phase 3: Classification
// ============================================================================

async function classifyFile(text: string, filename: string): Promise<FileCategory> {
  const preview = text.slice(0, 1500); // first 1500 chars usually enough

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: GLOSSARY_HEADER + `

You are the Classification phase of the M6 extraction pipeline.
Given a parsed File, assign it to exactly one FileCategory.`,
    tools: [
      {
        name: 'classify_file',
        description: 'Assign the File to one FileCategory.',
        input_schema: {
          type: 'object',
          required: ['category', 'confidence', 'rationale'],
          properties: {
            category: {
              type: 'string',
              enum: [...FILE_CATEGORIES],
            },
            confidence: {
              type: 'number',
              minimum: 0,
              maximum: 1,
            },
            rationale: {
              type: 'string',
              description: 'One-sentence reason for this classification.',
            },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'classify_file' },
    messages: [
      {
        role: 'user',
        content: `Filename: ${filename}\n\nFirst 1500 chars:\n${preview}`,
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Classification failed: no tool_use in response');
  }

  const result = toolUse.input as { category: FileCategory; confidence: number };
  return result.category;
}

// ============================================================================
// Phase 4: Extraction (parallel by AtomType)
// ============================================================================

// Map FileCategory → AtomTypes to prioritize during extraction
const EXTRACTION_PRIORITY: Record<FileCategory, AtomType[]> = {
  '공문': ['Requirement', 'Deadline', 'Constraint', 'Entity'],
  '사업계획서': ['Narrative', 'Metric', 'Entity', 'Deliverable'],
  '실적보고서': ['Metric', 'Narrative', 'Deliverable', 'Entity'],
  '회의록': ['Event', 'Decision', 'Question', 'Entity'],
  '정산서류': ['Metric', 'Constraint', 'Entity'],
  '규정/지침': ['Reference', 'Definition', 'Constraint'],
  '공지/안내': ['Event', 'Deadline', 'Entity'],
  '기타': [...ATOM_TYPES], // try all
};

type AtomCandidate = Omit<Atom, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'status'>;

async function extractAtoms(
  text: string,
  category: FileCategory,
  fileId: string
): Promise<AtomCandidate[]> {
  const targetTypes = EXTRACTION_PRIORITY[category];

  // Parallel extraction — one LLM call per AtomType (Super JSON Mode pattern)
  const extractionPromises = targetTypes.map((atomType) =>
    extractAtomsOfType(text, atomType, fileId)
  );

  const results = await Promise.all(extractionPromises);
  return results.flat();
}

async function extractAtomsOfType(
  text: string,
  atomType: AtomType,
  fileId: string
): Promise<AtomCandidate[]> {
  const typeGuide = ATOM_TYPE_EXTRACTION_GUIDES[atomType];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: GLOSSARY_HEADER + `

You are the Extraction phase of M6, focused on extracting ONLY Atoms of type "${atomType}".

${typeGuide}

CRITICAL RULES:
1. Every Atom MUST have raw_text from the source document (verbatim quote).
2. content must be independently meaningful (≤ 500 chars).
3. Do NOT extract anything that doesn't fit the exact definition of "${atomType}".
4. If unsure, lower the confidence score. Atoms below 0.7 will go to pending_review.
5. If NO Atoms of this type exist, return an empty array.`,
    tools: [
      {
        name: `extract_${atomType.toLowerCase()}_atoms`,
        description: `Extract all Atoms of type ${atomType} from the document.`,
        input_schema: {
          type: 'object',
          required: ['atoms'],
          properties: {
            atoms: {
              type: 'array',
              items: {
                type: 'object',
                required: ['content', 'raw_text', 'location', 'confidence', 'attributes'],
                properties: {
                  content: {
                    type: 'string',
                    maxLength: 500,
                    description: 'Independently meaningful statement of the Atom.',
                  },
                  raw_text: {
                    type: 'string',
                    description: 'Verbatim quote from the source document.',
                  },
                  location: {
                    type: 'string',
                    description: 'Page, section, or line reference in the source.',
                  },
                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                  },
                  attributes: {
                    type: 'object',
                    description: `Type-specific attributes for ${atomType}.`,
                  },
                },
              },
            },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: `extract_${atomType.toLowerCase()}_atoms` },
    messages: [
      {
        role: 'user',
        content: text.slice(0, 50000), // cap to prevent token overflow
      },
    ],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') return [];

  const result = toolUse.input as {
    atoms: Array<{
      content: string;
      raw_text: string;
      location: string;
      confidence: number;
      attributes: Record<string, unknown>;
    }>;
  };

  // Convert to AtomCandidate with proper Provenance
  return result.atoms.map((a) => {
    const candidate: AtomCandidate = {
      type: atomType,
      content: a.content,
      attributes: a.attributes,
      provenance: {
        source: {
          file_id: fileId,
          location: a.location,
          raw_text: a.raw_text,
        },
        extracted_by: {
          model: MODEL,
          extractor_version: `m6-extractor-v${M6_GLOSSARY_VERSION}`,
          extracted_at: new Date().toISOString(),
        },
      },
      confidence: a.confidence,
    };
    assertNoForbiddenTerms(candidate, `extracted ${atomType} Atom`);
    return candidate;
  });
}

// AtomType-specific extraction guides
const ATOM_TYPE_EXTRACTION_GUIDES: Record<AtomType, string> = {
  Requirement: `
A Requirement is a SPECIFIC, ACTIONABLE obligation that someone must fulfill.
MUST have: action verb (제출하다, 작성하다, 개최하다, ...) + clear object + responsible party (implied or explicit).
NON-EXAMPLES: background info, descriptions of past events, general principles without specific action.`,

  Deadline: `
A Deadline is a specific time-bound obligation.
MUST have: specific date/time + reference to a Requirement it constrains.
Extract as separate Atom even if mentioned alongside a Requirement.`,

  Constraint: `
A Constraint is a restriction on format, content, or process.
Examples: "PDF only", "10페이지 이내", "USB로 별도 제출", "한글 파일 사용 금지".`,

  Deliverable: `
A Deliverable is a tangible artifact (file, document, presentation) produced or to be produced.
MUST reference: who produced it (or will), when, what format.`,

  Metric: `
A Metric is a quantitative measurement with full context.
MUST include: value + unit + time reference + subject being measured.
REJECT incomplete metrics: "87" alone is not a Metric. "2026-1학기 캡스톤디자인 참여 학생 87명" is.`,

  Narrative: `
A Narrative is a qualitative description of progress, activity, or finding.
Subject + verb + time reference + specifics. Not vague summaries.`,

  Event: `
An Event is something that happened or will happen at a specific time.
MUST have: date/time + participants or subjects + nature of the event.`,

  Question: `
A Question is an explicit inquiry directed at someone.
Capture: who asked, who is being asked, when, what about.`,

  Decision: `
A Decision is a recorded judgment/conclusion with a decider and (ideally) rationale.
MUST capture: who decided, what was decided, when. Rationale is optional but valuable.`,

  Reference: `
A Reference is a citation of a specific regulation, rule, law, guideline, or prior document.
MUST capture: the source (학칙 제X조, 시행세칙 N항, 작년 공문, etc.) and the specific provision.`,

  Definition: `
A Definition is a domain-specific term being explicitly defined.
Capture: the term + its definition. Useful for building the institutional glossary.`,

  Entity: `
An Entity is a named person, team, or organization referenced in the document.
Capture: name + role (if mentioned) + affiliation.`,
};

// ============================================================================
// Phase 5: Linking
// ============================================================================

async function linkAtoms(
  newAtoms: AtomCandidate[],
  tenantId: string
): Promise<Omit<Relation, 'id' | 'tenant_id' | 'created_at'>[]> {
  if (newAtoms.length < 2) return [];

  // Compute embeddings for new Atoms
  const embeddings = await computeEmbeddings(newAtoms.map((a) => a.content));

  // Phase 5a: within-file Relations (LLM finds relations among newly extracted Atoms)
  const withinFileRelations = await findRelationsAmongNewAtoms(newAtoms);

  // Phase 5b: cross-Graph Relations (embedding similarity → LLM confirmation)
  const crossGraphRelations = await findRelationsWithExistingGraph(
    newAtoms,
    embeddings,
    tenantId
  );

  return [...withinFileRelations, ...crossGraphRelations];
}

async function computeEmbeddings(texts: string[]): Promise<number[][]> {
  // OpenAI embeddings (Anthropic doesn't provide embedding API yet)
  const { OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

async function findRelationsAmongNewAtoms(
  atoms: AtomCandidate[]
): Promise<Omit<Relation, 'id' | 'tenant_id' | 'created_at'>[]> {
  // Build summary for LLM
  const atomSummary = atoms
    .map((a, i) => `[${i}] (${a.type}) ${a.content}`)
    .join('\n');

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: GLOSSARY_HEADER + `

You are the Linking phase. Find Relations among the Atoms below.
Use ONLY the 10 RelationTypes. Use the index numbers [N] to refer to Atoms.`,
    tools: [
      {
        name: 'extract_relations',
        description: 'Extract Relations between the given Atoms.',
        input_schema: {
          type: 'object',
          required: ['relations'],
          properties: {
            relations: {
              type: 'array',
              items: {
                type: 'object',
                required: ['from_index', 'to_index', 'type', 'confidence'],
                properties: {
                  from_index: { type: 'integer', minimum: 0 },
                  to_index: { type: 'integer', minimum: 0 },
                  type: { type: 'string', enum: [...RELATION_TYPES] },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                },
              },
            },
          },
        },
      },
    ],
    tool_choice: { type: 'tool', name: 'extract_relations' },
    messages: [{ role: 'user', content: atomSummary }],
  });

  const toolUse = response.content.find((c) => c.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') return [];

  const result = toolUse.input as {
    relations: Array<{
      from_index: number;
      to_index: number;
      type: RelationType;
      confidence: number;
    }>;
  };

  // We'll resolve actual atom_ids after Atoms are persisted.
  // For now return placeholder structure with indices encoded.
  // (In real code, persist Atoms first then resolve indices to UUIDs.)
  return result.relations.map((r) => ({
    from_atom_id: `__INDEX_${r.from_index}__`,
    to_atom_id: `__INDEX_${r.to_index}__`,
    type: r.type,
    confidence: r.confidence,
    extracted_by: 'llm' as const,
  }));
}

async function findRelationsWithExistingGraph(
  newAtoms: AtomCandidate[],
  embeddings: number[][],
  tenantId: string
): Promise<Omit<Relation, 'id' | 'tenant_id' | 'created_at'>[]> {
  const relations: Omit<Relation, 'id' | 'tenant_id' | 'created_at'>[] = [];

  for (let i = 0; i < newAtoms.length; i++) {
    // Find similar existing Atoms via pgvector
    const { data: similar } = await supabase.rpc('match_atoms', {
      query_embedding: embeddings[i],
      match_threshold: 0.80, // lowered from 0.85 per feedback
      match_count: 5,
      tenant_filter: tenantId,
    });

    if (!similar || similar.length === 0) continue;

    // Ask LLM to determine if there's a Relation
    // (Implementation omitted for PoC brevity; pattern same as within-file)
  }

  return relations;
}

// ============================================================================
// Phase 6: Validation
// ============================================================================

const CONFIDENCE_THRESHOLD = 0.7;

async function validateAtoms(atoms: AtomCandidate[]): Promise<{
  validAtoms: AtomCandidate[];
  pendingAtoms: AtomCandidate[];
}> {
  const validAtoms: AtomCandidate[] = [];
  const pendingAtoms: AtomCandidate[] = [];

  for (const atom of atoms) {
    // Validation rules:
    // 1. content must appear (semantically) in raw_text
    // 2. confidence must meet threshold
    // 3. content length <= 500
    // 4. Provenance present

    const checks = [
      atom.content.length <= 500,
      atom.provenance.source.raw_text.length > 0,
      atom.confidence >= CONFIDENCE_THRESHOLD,
      // Hallucination check: content keywords should appear in raw_text
      atomContentGroundedInRawText(atom),
    ];

    if (checks.every((c) => c)) {
      validAtoms.push(atom);
    } else {
      pendingAtoms.push(atom);
    }
  }

  return { validAtoms, pendingAtoms };
}

function atomContentGroundedInRawText(atom: AtomCandidate): boolean {
  // Simple grounding check: at least one content noun phrase appears in raw_text.
  // Real implementation uses embedding similarity between content and raw_text.
  const contentWords = atom.content
    .split(/\s+/)
    .filter((w) => w.length > 2);
  const rawText = atom.provenance.source.raw_text;
  const overlapCount = contentWords.filter((w) => rawText.includes(w)).length;
  return overlapCount / contentWords.length >= 0.3; // 30% word overlap minimum
}

// ============================================================================
// Persistence
// ============================================================================

async function persistAtoms(
  validAtoms: AtomCandidate[],
  pendingAtoms: AtomCandidate[],
  tenantId: string
): Promise<Map<string, string>> {
  // Returns index → uuid map for relation resolution
  const indexToUuid = new Map<string, string>();

  const allAtoms = [
    ...validAtoms.map((a) => ({ ...a, status: 'active' as const })),
    ...pendingAtoms.map((a) => ({ ...a, status: 'pending_review' as const })),
  ];

  const embeddings = await computeEmbeddings(allAtoms.map((a) => a.content));

  for (let i = 0; i < allAtoms.length; i++) {
    const atom = allAtoms[i];
    const { data, error } = await supabase
      .from('atoms')
      .insert({
        tenant_id: tenantId,
        type: atom.type,
        content: atom.content,
        attributes: atom.attributes,
        provenance: atom.provenance,
        confidence: atom.confidence,
        status: atom.status,
        embedding: embeddings[i],
      })
      .select('id')
      .single();

    if (error) {
      console.error(`Failed to persist Atom: ${error.message}`);
      continue;
    }
    indexToUuid.set(`__INDEX_${i}__`, data.id);
  }

  return indexToUuid;
}

async function persistRelations(
  relations: Omit<Relation, 'id' | 'tenant_id' | 'created_at'>[],
  tenantId: string
): Promise<void> {
  // In real code, resolve __INDEX_N__ placeholders using indexToUuid map.
  // Omitted here for brevity.
  for (const rel of relations) {
    if (rel.from_atom_id.startsWith('__INDEX_')) continue; // skip unresolved
    await supabase.from('atom_relations').insert({
      tenant_id: tenantId,
      ...rel,
    });
  }
}

// ============================================================================
// CLI Entry (for PoC testing)
// ============================================================================

if (require.main === module) {
  const [, , filePath, tenantId, uploadedBy] = process.argv;

  if (!filePath || !tenantId || !uploadedBy) {
    console.error('Usage: npx tsx pipeline.ts <file> <tenant_id> <user_id>');
    process.exit(1);
  }

  const buffer = readFileSync(filePath);
  const filename = filePath.split('/').pop()!;
  const mimeType = filename.endsWith('.pdf')
    ? 'application/pdf'
    : filename.endsWith('.docx')
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'text/plain';

  processFile(buffer, filename, mimeType, tenantId, uploadedBy)
    .then((result) => {
      console.log('\nM6 Pipeline Result:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error('Pipeline error:', err);
      process.exit(1);
    });
}
