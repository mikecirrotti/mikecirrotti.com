---
title: Engram Wiki
publishDate: 2026-06-09 00:00:00
img: /assets/engram-wiki.jpg
img_alt: A dark emerald field filled with dim rows of markdown text, most of it unlit, with a single luminous trace curving through it and lighting up the files it passes
description: |
  An open-source pattern for giving an AI assistant durable, persistent memory about your work — a git repository of markdown files an LLM can read to answer as someone who already knows your context.
tags:
  - AI
  - Knowledge Management
  - Open Source
---

Most LLM interactions are stateless. You explain your context, get a response, and start from scratch next time. **Engram Wiki** fixes that by storing your professional knowledge — projects, people, decisions, meeting history, writing style, and communication preferences — as markdown files in a git repository. When those files are available to an AI assistant, the model doesn't just answer questions; it answers them *as someone who already knows your context*.

> Git tracks changes to code. This pattern tracks changes to a person's knowledge-work in a machine-readable format — every commit a snapshot of what you knew, decided, and were paying attention to.

## Why "engram"?

An engram is the physical trace of a memory in the brain — the enduring network of neurons that changes when you experience something, letting you store and recall it later. The repo is the same idea for your work: a durable, machine-readable memory trace an AI can store and recall.

## What it provides

The repository ships intentionally empty — structure, templates, and AI behavioral instructions only, no real content. It establishes a baseline directory model that adapts to any knowledge-work role:

- **daily/** — append-only log of raw signal and observations
- **people/**, **projects/**, **topics/** — living documents on collaborators, initiatives, and durable concepts
- **decisions/** — ADR-style logs, immutable once written
- **preferences/** and **style/** — standing instructions for tone, defaults, and house style
- **templates/**, **indexes/**, **exports/** — scaffolding for consistent, cross-referenced entries

The AI's canonical instructions live in `CLAUDE.md` (read automatically by Claude Code), with a pointer for Copilot-based assistants.

## Acknowledgements

The pattern is an independent reconstruction of ideas from [Andrej Karpathy](https://x.com/karpathy) on LLMs as operating systems with persistent context, and [Nate B Jones](https://x.com/natebjones) on structured personal knowledge management with AI copilots.

The project is open source under the MIT license. View the repository on [GitHub](https://github.com/mikecirrotti/engram-wiki).
