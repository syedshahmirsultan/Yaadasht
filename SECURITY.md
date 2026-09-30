# Security Policy

Yaadasht stores people's most personal writing. We take reports seriously.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Email **security@yaadasht.com** with:
- a description of the issue and its impact,
- steps to reproduce or a proof of concept,
- any suggested fix.

We aim to acknowledge reports within 3 business days and to keep you updated until a fix is released. We are happy to credit researchers who wish to be named.

Please do not access, modify, or retain other users' data while testing; use your own accounts or a self-hosted instance.

## Scope

In scope: the Yaadasht application code in this repository and the hosted service at yaadasht.com.
Out of scope: Clerk, cloud providers, and email providers themselves (report to them directly), denial-of-service, social engineering.

## Security model

The full threat model, encryption design, and known limitations are documented in [docs/SECURITY.md](docs/SECURITY.md). In short: user content is encrypted at the application level before storage with per-user keys held outside the database, but Yaadasht is **not** end-to-end encrypted: the running server can decrypt content.
