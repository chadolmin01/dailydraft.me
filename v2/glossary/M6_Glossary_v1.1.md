# M6 Glossary v1.1

> Canonical terminology for the M6 atomic workspace system.
> All future documentation, code, and conversation MUST use these exact terms.
>
> **v1.1 changes**: Propositioner → Extractor. Quadruple moved to Future Concepts.
> Document concept reserved for v2 (File-only in v1). All Open Questions closed.

---

## Foundational References

This glossary inherits vocabulary from four research lineages:

| Lineage | Paper / Source | Inherited Terms |
|---|---|---|
| **Atomic Proposition** | arXiv 2512.08398 (Dec 2025) | Atomic Proposition, Triple, Hierarchical Structure |
| **Propositioner** | arXiv 2604.02866 (Apr 2026) | Extractor (called Propositioner in research), Triplet Extraction |
| **Semantic Model** | Cassi et al. (2024) | Semantic Model, Ontology, Knowledge Graph |
| **Ontology-Grounded LLM** | arXiv 2510.26898 (2025) | Citation Gate, Domain Glossary Injection |

We extend these with M6-specific terms where the research vocabulary doesn't cover our needs.

---

## How to Read This Glossary

Each entry follows this structure:

```
TermName  (한국어 보조 라벨 only if needed for UI)
  Definition: precise one-sentence definition
  Plural/forms: relevant variants
  Replaces: legacy/ambiguous terms this term supersedes
  Related: pointers to adjacent terms
  Example: concrete instance
```

**Rule: When speaking or writing about M6, use the EnglishTermName. Never substitute. If a term is needed in Korean UI, the UI label is defined explicitly in section 7.**

---

## Tier 1 — Semantic Model (The Dictionary)

The foundational vocabulary. These terms define WHAT can exist in M6. They change rarely.

### 1.1 `Atom`

- **Definition**: An indivisible, semantically autonomous unit of information extracted from a Source, carrying its own Provenance.
- **Replaces**: 원자, atomic proposition, atomic unit, AKU, chunk, entity, fact, piece, element
- **Related**: `AtomType`, `Provenance`, `Source`
- **Example**: `{ type: "Metric", content: "2026-1학기 캡스톤디자인 참여 학생 87명", ... }`
- **Why this name**: "Atom" is the shortest, most accepted term in 2025-2026 research. "AKU" is too acronymic for daily use. "Atomic Proposition" is academically precise but verbose; reserved for formal academic references only.

### 1.2 `AtomType`

- **Definition**: One of the 12 fixed categories an Atom may belong to.
- **Plural/forms**: AtomType (singular), the AtomType Set (the collection of 12)
- **Replaces**: atom_type, 원자 종류, atom kind, atom category
- **Values**: `Requirement`, `Deadline`, `Constraint`, `Deliverable`, `Metric`, `Narrative`, `Event`, `Question`, `Decision`, `Reference`, `Definition`, `Entity`
- **Mutability**: FROZEN in v1. Changes require formal versioning of the Semantic Model.

### 1.3 `Relation`

- **Definition**: A typed, directed edge connecting two Atoms, carrying its own confidence and Provenance.
- **Plural/forms**: Relation (singular), RelationSet (a collection)
- **Replaces**: edge, link, connection, 관계, association
- **Related**: `RelationType`, `Atom`
- **Why this name**: "Relation" is the standard term across RDF, graph databases, and ontology research. "Edge" is graph-theoretic but loses the typed nature.

### 1.4 `RelationType`

- **Definition**: One of the 10 fixed categories a Relation may belong to.
- **Values**: `requires`, `fulfills`, `references`, `assigned_to`, `produced_by`, `temporally_after`, `responds_to`, `triggers`, `approves`, `evolves_to`
- **Mutability**: FROZEN in v1.

### 1.5 `Triple`

- **Definition**: A formal `(subject Atom, RelationType, object Atom)` structure used as the unit of knowledge representation in the Graph.
- **Replaces**: triplet, fact, statement
- **Notation**: `(A) --[relType]--> (B)`
- **Example**: `(Requirement: "정량보고서 제출") --[fulfills]--> (Deliverable: "3팀 1주차 PDF")`

---

## Tier 2 — Ontology (The Grammar)

Rules for how Atoms can combine. Domain-specific, evolvable.

### 2.1 `Ontology`

- **Definition**: The complete set of valid combination patterns between AtomTypes and RelationTypes for a given domain.
- **Replaces**: schema, taxonomy (when used for combination rules)
- **Relationship to Rule**: An Ontology DEFINES what is grammatically valid. A Rule USES the Ontology to compose Outputs. Think: Ontology = grammar book, Rule = sentence template.
- **Note**: Ontology is NOT the dictionary. The dictionary is the Semantic Model (Tier 1). Ontology is what arrangements of dictionary words make valid sentences.

### 2.2 `Rule`

- **Definition**: A declarative specification of how Atoms are filtered, aggregated, or composed to produce an Output.
- **Replaces**: composition rule, recipe, formula
- **Structure**: YAML-based declarative form + optional Code module + optional Prompt template
- **Why this name**: "Rule" is universally understood. Alternatives like "Recipe" or "Template" carry the wrong connotation (cooking, single-shot).
- **Example**: "Weekly Progress Report Rule" specifies which Atoms to gather and how to assemble them.

### 2.3 `Output`

- **Definition**: A user-facing artifact produced by applying a Rule to the current Graph state.
- **Replaces**: 결과물, deliverable (when used in the rule-output sense), report, result
- **Critical distinction**: Do NOT confuse `Output` (Tier 2 concept) with `Deliverable` (an AtomType). A Deliverable is an Atom representing a file produced by a team. An Output is something M6 generates for the manager.

### 2.4 `Composition`

- **Definition**: The act of executing a Rule to produce an Output from current Atoms.
- **Function signature**: `compose(rule, graph, context) -> Output`
- **Why this name (not Generation)**: M6 COMBINES existing Atoms; it does not GENERATE new content from scratch. "Generation" implies creation ex nihilo, which is exactly what we want to avoid.
- **Note**: Composition is dynamic. The same Rule executed at different times produces different Outputs because the Graph changes.

### 2.5 `Molecule` *(reserved, not active in v1)*

- **Status**: RESERVED. Do not use in v1.
- **Future definition**: A recurring pattern of co-occurring Atoms that the system or user names for convenience.
- **Why reserved**: To prevent confusion with `Atom` and `Output`. If a "Molecule" concept emerges in v2, it will be precisely defined then.

---

## Tier 3 — Knowledge Graph (The Instance)

The actual data. Grows constantly.

### 3.1 `Graph`

- **Definition**: The current materialized set of all Atoms and Relations for a given Tenant.
- **Replaces**: knowledge graph, KG, data, atom pool, atom graph
- **Why this name**: "Graph" is shorter than "Knowledge Graph", less acronym-prone than "KG", and accurate. The Tenant scoping makes it unambiguous.
- **Scope**: Always scoped by `tenant_id`. There is no global Graph; each Tenant has its own.

### 3.2 `Tenant`

- **Definition**: An isolated organizational unit (e.g., one university's startup center, one accelerator cohort) with its own Graph.
- **Replaces**: organization, customer, workspace owner
- **Scope**: All DB tables carry `tenant_id`. RLS enforces isolation.

### 3.3 `Workspace`

- **Definition**: The user-facing application surface where a Tenant's members interact with M6.
- **Replaces**: app, platform, dashboard, UI
- **Note**: One Tenant has exactly one Workspace. One Workspace serves one Tenant.

---

## Tier 4 — Source Layer (Where Atoms Come From)

### 4.1 `File`

- **Definition**: A single uploaded artifact (PDF, HWP, DOCX, XLSX, image, etc.) with fixed binary content. In v1, File is the primary source unit.
- **Replaces**: 파일, attachment, upload, document (in v1)
- **Key fields**: `file_id`, `mime_type`, `uploaded_at`, `uploaded_by`, `tenant_id`, `series_id`, `series_position`
- **v1 simplification**: File is the only source unit. Multi-file logical groupings are reserved for v2.

### 4.2 `Document` *(reserved, not active in v1)*

- **Status**: RESERVED. Do not use in v1.
- **Future definition**: A logical content unit potentially spanning one or more Files.
- **Why reserved**: In v1, every File is conceptually one Document. Introducing both terms creates ambiguity. v2 may need this distinction when reports span multiple files.

### 4.3 `FileSeries`

- **Definition**: A time-ordered sequence of Files representing the same conceptual artifact evolving over time.
- **Replaces**: version chain, document timeline, weekly reports
- **Example**: "FLIP_3팀_시장조사" series contains Week1, Week2, Week3 Files.
- **Auto-detection rules**: filename pattern, folder location, same uploader, similar title.
- **Note**: Previously called `DocumentSeries` in v1.0. Renamed for consistency with v1 File-centric model.

### 4.4 `Provenance`

- **Definition**: The complete trace of where an Atom came from — File, location within File, raw text fragment, extraction model, extraction time.
- **Replaces**: source, citation, attribution, origin, audit trail
- **Required**: Every Atom MUST have Provenance. Atoms without Provenance are invalid.
- **Why critical**: Trust. Auditability. Re-extraction when models improve.

### 4.5 `Source`

- **Definition**: A field within Provenance pointing to the specific location (File + offset/page/section) where an Atom was extracted.
- **Note**: `Source` is a component of `Provenance`. Not synonymous.

---

## Tier 5 — Extraction Pipeline (The Process)

How Files become Atoms.

### 5.1 `Ingestion`

- **Definition**: The phase where a File enters M6 and its metadata is registered.
- **Phase number**: 1 (of 6)

### 5.2 `Parsing`

- **Definition**: The phase where File binary is converted to text + structural metadata (sections, tables, page numbers).
- **Phase number**: 2

### 5.3 `Classification`

- **Definition**: The phase where a parsed File is assigned to a `FileCategory`.
- **Phase number**: 3
- **FileCategory values**: `공문`, `사업계획서`, `실적보고서`, `회의록`, `정산서류`, `규정/지침`, `공지/안내`, `기타`

### 5.4 `Extractor`

- **Definition**: The LLM-driven module that decomposes a parsed File's text into candidate Atoms.
- **Replaces**: propositioner, atom extractor, decomposer, atomizer
- **Academic note**: In research literature (arXiv 2604.02866), this concept is called "Propositioner". M6 uses "Extractor" for code-level clarity. When discussing academic foundations, "Propositioner (Extractor)" is acceptable.
- **Phase number**: 4

### 5.5 `Linking`

- **Definition**: The phase where newly extracted Atoms are connected to existing Atoms in the Graph via Relations.
- **Phase number**: 5

### 5.6 `Validation`

- **Definition**: The phase where extracted Atoms and Relations are checked against the Semantic Model and self-consistency rules. Failed items become `pending_review`.
- **Phase number**: 6

---

## Tier 6 — Reliability Layer (The Trust)

How M6 ensures correctness.

### 6.1 `Confidence`

- **Definition**: A numerical score [0, 1] expressing the LLM's certainty about an extracted Atom or Relation.
- **Threshold**: Atoms below 0.7 enter `pending_review`. Configurable per Tenant.

### 6.2 `Pending Review`

- **Definition**: A status flag indicating an Atom or Relation requires human confirmation before becoming part of the active Graph.
- **Replaces**: draft, unverified, candidate

### 6.3 `Citation`

- **Definition**: A reference within an Output back to one or more Atoms (and their Provenance) that supported a claim.
- **Required**: Every claim in an Output MUST have at least one Citation. Claims without Citations are removed.

### 6.4 `Hallucination`

- **Definition**: An LLM-generated claim that is not supported by any Atom's Provenance.
- **Detection**: Self-validation phase compares Output claims against cited Atom Provenance.

---

## Tier 7 — UI Labels (Korean Mapping)

The user-visible Korean labels for technical terms. **Use these ONLY in UI text shown to managers. Code, docs, and our conversations use the English terms above.**

| English (Code) | Korean (UI Label) | Notes |
|---|---|---|
| Atom | (보통 숨김) | Managers don't see "Atom" directly |
| Requirement | 요구사항 | |
| Deadline | 마감일 | |
| Constraint | 제약조건 | |
| Deliverable | 산출물 | |
| Metric | 수치 | "지표" 도 고려, 일단 수치 |
| Narrative | 진행 서술 | "내러티브" 는 어색함 |
| Event | 일정 | "이벤트" 보다 자연스러움 |
| Question | 질문 | |
| Decision | 결정 | |
| Reference | 근거 | |
| Definition | 용어 | |
| Entity | 주체 | |
| Output | 결과물 | |
| Rule | 규칙 | |
| Composition | 생성 | "조합" 도 고려, 일단 생성 |
| Workspace | 작업공간 | |
| Tenant | (보통 숨김) | 관리자 화면에서만 "기관" |
| File | 파일 | |
| FileSeries | 파일 시리즈 | |
| Provenance | 출처 | |
| Confidence | 신뢰도 | |
| Pending Review | 검토 대기 | |
| Citation | 인용 | |

---

## Forbidden Synonyms

Do NOT use these in M6 documentation or code. They cause confusion.

| Forbidden | Use Instead | Why |
|---|---|---|
| 분자 / Molecule (v1) | Output or Rule | Reserved for v2; ambiguous in v1 |
| Document (v1) | File | Reserved for v2; File-only in v1 |
| Propositioner (in code) | Extractor | Too academic; use Extractor in code |
| chunk | Atom or text segment | "Chunk" is RAG-specific, narrower than Atom |
| KG | Graph | Acronyms cause confusion in conversation |
| AKU | Atom | Acronym; the field has consolidated to "Atom" |
| Quadruple (v1) | Triple + Provenance | Quadruple is v2 future concept |
| token | (avoid in product context) | LLM-internal term; not part of M6 vocabulary |
| record | Atom or row | Ambiguous between DB row and domain record |
| item | Atom | Too generic |
| entry | Atom or File | Too generic |
| 데이터 (raw "data") | specify: Atom, File, Graph, etc. | Always specify which kind |
| ontology의 한국어 "분류 체계" | Ontology (use English) | "분류 체계" can mean Taxonomy OR Ontology |
| taxonomy | AtomType Set (if referring to the 12) or Ontology (if referring to combination rules) | Ambiguous |

---

## Code-Level Conventions

When these terms appear in code:

| Concept | Variable name | Table name | Type name |
|---|---|---|---|
| Atom | `atom`, `atoms` | `atoms` | `Atom` |
| AtomType | `atom_type` | (enum) | `AtomType` |
| Relation | `relation` | `atom_relations` | `Relation` |
| Triple | `triple` | (derived view) | `Triple` |
| Graph | `graph` | (logical, not a table) | `Graph` |
| Tenant | `tenant_id` | `tenants` | `Tenant` |
| File | `file` | `files` | `File` |
| FileSeries | `series` | `file_series` | `FileSeries` |
| Rule | `rule` | `output_rules` | `Rule` |
| Output | `output` | `outputs` | `Output` |
| Provenance | `provenance` (jsonb field) | (column in `atoms`) | `Provenance` |
| Extractor | `extractor` | (no table) | `Extractor` |

---

## Appendix A — Future Concepts (Reserved Vocabulary)

Terms researched and considered, but NOT active in v1. Will be evaluated for v2.

### A.1 `Quadruple`

- **Status**: RESERVED. Do not use in v1.
- **Research source**: arXiv 2508.03438 (Aug 2025)
- **Definition (if activated)**: A Triple extended with a Context, allowing it to stand alone interpretable. Form: `(subject, predicate, object, context)`.
- **Why deferred**: In v1, `Provenance` carries sufficient context. Quadruple would only be needed if Provenance proves insufficient during build. Validate empirically.

### A.2 `Document`

- **Status**: RESERVED. See Tier 4.2.

### A.3 `Molecule`

- **Status**: RESERVED. See Tier 2.5.

### A.4 `Atomic Proposition` (formal academic term)

- **Status**: Academic reference only. Not used in code or daily conversation.
- **Use case**: When citing research foundations, e.g., "M6's Atom corresponds to the Atomic Proposition concept from arXiv 2512.08398."

---

## Version History

- **v1.0** (2026-05-22) — Initial canonical glossary. Locks Tier 1 (Semantic Model).
- **v1.1** (2026-05-22) — Feedback incorporated:
  - Propositioner → Extractor (academic reference preserved)
  - Quadruple moved to Future Concepts
  - Document reserved for v2, File-only in v1
  - DocumentSeries → FileSeries (consistency)
  - All v1.0 Open Questions closed
  - Added "Why this name" justifications for Relation, Graph, Rule, Composition

---

## Closed Open Questions (from v1.0)

1. ~~Is `Composition` the right name, or should it be `Generation`?~~ **Resolved: Composition.** M6 combines existing Atoms; Generation implies ex-nihilo creation.
2. ~~Should `Document` and `File` collapse to one term for v1 simplicity?~~ **Resolved: Yes.** File is primary in v1. Document reserved for v2.
3. ~~Is `Propositioner` too jargon-y for code?~~ **Resolved: Yes.** Extractor in code, Propositioner as academic reference only.

---

## Glossary is Locked

v1.1 is LOCKED for the duration of PoC build (5 days).

Changes require:
1. Explicit acknowledgement from Lee
2. Update of this file
3. Propagation to `glossary.ts` and `system_prompt_glossary.md`
4. Version bump (v1.2, v1.3, ...)

No silent changes. No "I'll fix it later." Single source of truth.
