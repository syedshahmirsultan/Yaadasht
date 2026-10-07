# Contributing to Yaadasht

Thank you for helping build a calm, private home for people's memories.

## Before you start

- Read [docs/PRODUCT.md](docs/PRODUCT.md) and [docs/SECURITY.md](docs/SECURITY.md). Changes that conflict with the product principles or weaken the privacy model will not be merged.
- For anything larger than a small fix, open an issue first to discuss the approach.

## Privacy rules for code

1. **Never log user content.** No titles, bodies, tags, filenames, recipients, or request bodies in logs, errors, or analytics.
2. **Encrypted columns are only touched in `src/server/repos/*`** via the crypto field helpers. Never read or write `*_enc` columns elsewhere.
3. **Every query is scoped by the authenticated `user_id`.** Add an access-control test for any new data access path.
4. **No new third-party scripts, SDKs, or network calls** without discussion in an issue.
5. **Do not invent cryptography.** Use the existing crypto module; changes to it require review from a maintainer and tests.
6. **Do not add security claims to copy** ("end-to-end", "zero knowledge", etc.).

## UX rules

- Every screen answers "what does the user want to do here?" and has one obvious primary action.
- Use product vocabulary (memory, collection, write), see PRODUCT.md §3.
- Empty states and errors are written for non-technical people.
- Check keyboard navigation, screen reader labels, dark mode, reduced motion, and a 360px-wide phone.

## Development

See the Getting started section in [README.md](README.md). Before opening a PR:

```bash
npm run typecheck
npm run lint
npm test
```

## Pull requests

- Small, focused PRs with a clear description and screenshots for UI changes.
- Tests pass, `npm run lint` and `npm run typecheck` clean.
- Update docs when behavior or the privacy model changes.
