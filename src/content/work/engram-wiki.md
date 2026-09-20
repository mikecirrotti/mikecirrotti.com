---
title: Engram Wiki
publishDate: 2026-06-09 00:00:00
img: /assets/engram-wiki.jpg
img_alt: A dark emerald field filled with dim rows of markdown text, most of it unlit, with a single luminous trace curving through it and lighting up the files it passes
description: |
  An open-source pattern for giving any AI assistant durable, persistent memory about your work — plain markdown in a git repository, readable by any client, locked into none.
tags:
  - AI
  - Knowledge Management
  - Open Source
---

Most LLM interactions are stateless. You explain your context, get a response, and start from scratch next time. Every new session, every new tool, every new model — you re-explain who you are, what you are working on, and how you like things done.

**Engram Wiki** stores your professional knowledge — projects, people, decisions, meeting history, writing style, communication preferences — as markdown files in a git repository. When those files are available to an AI assistant, it answers as someone who already knows your context.

> Git tracks changes to code. This pattern tracks changes to a person's knowledge-work in a machine-readable format — every commit a snapshot of what you knew, decided, and were paying attention to.

## Platform-agnostic memory

The files are plain markdown in a git repository. No proprietary format, no vendor lock-in, no platform-specific database. Any AI client that can read files can use this wiki as its memory layer: Claude Code, Codex, ChatGPT Work, VS Code with GitHub Copilot, Cursor, or whatever comes next.

The instruction architecture makes this portable. A single file, `AGENTS.md`, carries the standing instructions that apply regardless of which assistant is running. Claude Code imports it from `CLAUDE.md`; Codex reads it natively; ChatGPT Work reads it through the GitHub connector; Copilot reads a pointer file that leads to it. One set of rules, readable everywhere, with thin client-specific adapters where needed.

Switch clients, use several in the same week, try something new. The wiki is still there, and the next assistant picks up where the last one left off. The git history is the audit trail.

## Why "engram"?

An engram is the physical trace of a memory in the brain — the enduring network of neurons that changes when you experience something, letting you store and recall it later. The repo is the same idea for your work: a durable, machine-readable memory trace an AI can store and recall.

## What it provides

The repository ships intentionally empty — structure, templates, and AI behavioral instructions only, no real content. It establishes a baseline directory model that adapts to any knowledge-work role:

- **daily/** — append-only log of raw signal and observations
- **people/**, **projects/**, **topics/** — living documents on collaborators, initiatives, and durable concepts
- **decisions/** — ADR-style logs, immutable once written
- **preferences/** and **style/** — standing instructions for tone, defaults, and a layered house style that grows from use
- **templates/**, **indexes/**, **exports/** — scaffolding for consistent, cross-referenced entries

### The style system

The style files go beyond formatting rules. They are a layered system designed to accumulate a calibrated picture of your voice over time: how you write (`voice.md`), what makes writing read as machine-generated (`tells.md`), where concision and voice fidelity pull in different directions (`target.md`), and unedited samples of your own real writing as immutable calibration data (`corpus/`).

The system starts mostly empty. A feedback-to-wiki skill extracts conventions from your draft feedback, and a style-audit skill catches gaps on a weekly pass. Over time, the assistant learns how you sound saying it, not just what you want to say.

## Acknowledgements

The pattern is an independent reconstruction of ideas from [Andrej Karpathy](https://x.com/karpathy) on LLMs as operating systems with persistent context, and [Nate B Jones](https://x.com/natebjones) on structured personal knowledge management with AI copilots.

The project is open source under the MIT license. View the repository on [GitHub](https://github.com/mikecirrotti/engram-wiki).
