# Yaadasht: Optional AI Memory Search (Phase 7)

AI is a helper for finding and understanding your own memories. Yaadasht must remain complete and useful without it.

---

## 1. Rules

1. **Off by default.** Enabled only by the user in Settings → AI, after reading a plain-language notice and explicitly consenting.
2. **Never send the whole archive.** Only a small number of relevant excerpts are sent per question.
3. **Retrieve first, then answer.** The model only sees what retrieval found.
4. **Cite everything.** Every answer shows the memories it used; each is one tap away.
5. **Never invent memories.** If nothing relevant is found, we say so and do not call the model. The model is instructed to answer only from provided excerpts; citations are validated.
6. **No training.** We only use providers whose API terms exclude training on submitted data.
7. **Revocable.** Turning AI off deletes the semantic index and any stored AI history.

## 2. Example questions

- "What was I working on in September 2026?"
- "What did I learn about AI agents?"
- "What was I struggling with last year?"
- "What was I thinking about five years ago?"

## 3. Flow

```
Question
  │
  ├─ 1. Parse time hints ("September 2026", "last year", "five years ago")
  │     → date range filter on memory_date (plaintext → plain SQL)
  │
  ├─ 2. Retrieve candidates (server, user-scoped)
  │     • keyword: blind-index search (SECURITY §6)
  │     • semantic: embedding similarity (§4)
  │     • merge with reciprocal-rank fusion, apply date/collection filters
  │
  ├─ 3. No good candidates? → "I couldn't find memories about that." (no model call)
  │
  ├─ 4. Build minimal context
  │     • top 8–15 passages (chunks ~300–500 words), not full entries
  │     • each labeled [E1], [E2]… with memory date + collection; no entry IDs,
  │       emails, or other personal identifiers beyond the passage itself
  │     • hard cap on total context tokens
  │
  ├─ 5. Call the model (server-side)
  │     System prompt: answer only from excerpts; cite [E#] for every claim;
  │     if the excerpts don't answer the question, say so; if the question is
  │     ambiguous, ask one short clarifying question instead of guessing.
  │
  ├─ 6. Validate
  │     • every [E#] must map to a passage we sent; unknown citations stripped
  │     • answer with zero valid citations → shown as "not supported by your memories"
  │
  └─ 7. Show answer + source cards (date, collection, excerpt, "Open memory")
```

Before each question (until the user chooses "don't ask again"), the UI shows: *"Yaadasht will send about N short excerpts from your memories to {provider} to answer this."*

## 4. Semantic search without sending the archive to a third party

Most embedding APIs would require sending **every entry** to a third party to build an index, which violates rule 2. So:

- Embeddings are computed **on Yaadasht's own servers** with a small open-source multilingual embedding model (e.g., a MiniLM/BGE/E5-class model run with ONNX Runtime in the worker). No third party sees the archive.
- Embeddings are stored **encrypted** with the user's UDK (`entry_embeddings.vector_enc`), because embedding vectors can leak content via inversion attacks.
- Similarity is computed in memory per request after decrypting that user's vectors. A lifetime archive (~11k entries × ~3 chunks × 384 dims) is ~50 MB of floats, fast to scan; cached briefly per user.
- Semantic search (without the chat part) is also offered as plain "search by meaning" in the search box once AI indexing is enabled, useful even for users who never ask the AI a question.

Additional table (Phase 7):

| `entry_embeddings` | |
|---|---|
| entry_id | uuid FK, on delete cascade |
| user_id | uuid |
| chunk_index | smallint |
| model_id | text (re-embed on model change) |
| vector_enc | bytea |
| updated_at | timestamptz |

## 5. Provider

- Default: Anthropic Claude (current Sonnet-class model, configurable), called from the server with Yaadasht's API key. Data processed under the provider's commercial API terms (no training on API data). We will state the provider's retention policy in the consent notice and not claim "zero retention" unless contractually true.
- Self-hosters can point to any OpenAI-compatible endpoint or a **local model (Ollama)**, making AI fully on-premise.
- Streaming responses; per-user rate limits and a monthly question cap on the hosted service.

## 6. Storage of AI conversations

- **Not stored by default.** Answers live only in the page.
- Optional "Save this answer as a memory" creates a normal (encrypted) entry in a collection the user picks, with its sources linked.

## 7. What the AI provider sees

| Sent | Not sent |
|---|---|
| The question | The rest of the archive |
| Up to ~15 short excerpts | Attachments / media |
| Memory dates and collection names of those excerpts | Email, name, user ID, entry IDs |

## 8. Consent notice (draft)

> **Ask your memories (optional)**
> When you ask a question, Yaadasht searches your memories on our servers and sends only a few short, relevant excerpts to our AI provider ({provider}) to write an answer. Your full archive is never sent. The provider does not use this data to train its models. Every answer shows which memories it used. You can turn this off at any time, which deletes the search-by-meaning index.
>
> [ Turn on ]   [ Not now ]

## 9. Honest limitations

- Language models can still misread or over-generalize excerpts; citations let the user check.
- Excerpts sent to the provider leave Yaadasht's infrastructure (unless self-hosted with a local model).
- Semantic index requires server-side processing of all entries by our own model (not a third party).
