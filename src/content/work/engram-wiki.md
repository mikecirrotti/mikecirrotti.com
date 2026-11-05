---
title: Engram Wiki
publishDate: 2026-06-09 00:00:00
img: /assets/engram-wiki.jpg
img_alt: A dark emerald field filled with dim rows of markdown text, most of it unlit, with a single luminous trace curving through it and lighting up the files it passes
description: |
  An open-source pattern for giving any AI assistant durable, persistent memory about your work: plain markdown in a git repository, readable by any client, locked into none.
tags:
  - AI
  - Knowledge Management
  - Open Source
---

Most LLM interactions are stateless. You explain your context, get a response, and start from scratch next time. Every new session, every new tool, every new model, you re-explain who you are, what you are working on, and how you like things done.

**Engram Wiki** stores your professional knowledge (projects, people, decisions, meeting history, writing style, communication preferences) as markdown files in a git repository. When those files are available to an AI assistant, it answers as someone who already knows your context.

> Git tracks changes to code. This pattern tracks changes to a person's knowledge-work in a machine-readable format, so every commit is a snapshot of what you knew, decided, and were paying attention to.

The name comes from neuroscience. An engram is the physical trace of a memory in the brain, the network of neurons that changes when you experience something so you can recall it later. The repo is meant to be that kind of trace for your work.

## Platform-agnostic memory

The files are plain markdown in a git repository, with no proprietary format and no platform-specific database. Any AI client that can read files can use the wiki as its memory layer: Claude Code, Codex, ChatGPT Work, VS Code with GitHub Copilot, Cursor, or whatever comes next.

A single file, `AGENTS.md`, carries the standing instructions that apply regardless of which assistant is running. Claude Code imports it from `CLAUDE.md`, Codex reads it natively, ChatGPT Work gets it through the GitHub connector, and Copilot follows a pointer file to it. The triggered workflows (the morning ritual, meeting capture, drafting) are skills in the open [Agent Skills](https://agentskills.io) format, one `SKILL.md` per folder, so the same file works in every client that supports it instead of being rewritten for each one.

Switch clients, use several in the same week, try something new. The wiki is still there, and the next assistant should pick up where the last one left off, with the git history as the audit trail.

## What it provides

The repository ships intentionally empty, with structure, templates, scripts and AI instructions only and no real content. The directory model is a baseline that should adapt to most knowledge-work roles:

- `daily/`: an append-only log of raw signal and observations
- `people/`, `projects/`, `topics/`: living documents on collaborators, initiatives and durable concepts
- `decisions/`: ADR-style logs (architecture decision records, borrowed from software teams), immutable once written
- `preferences/` and `style/`: standing instructions for tone and defaults, and a layered house style that grows from use
- `inbox.md`: raw capture, where the assistant adds a line the moment a decision or a new fact comes up in conversation, since a session can end before anyone gets around to a summary
- `now.md`: a generated snapshot of projects in motion, open loops and recent decisions, rebuilt nightly and read at the start of every session
- `templates/`, `indexes/`, `exports/`, `bin/`: scaffolding for consistent, cross-referenced entries, plus the standard-library Python scripts that build the generated files

The style files are a layered system meant to build a calibrated picture of your voice over time. `voice.md` is how you write, `tells.md` is what makes prose read as machine-generated, `target.md` is where concision and voice fidelity pull in different directions, and `corpus/` holds unedited samples of your own writing as calibration data. `slopcheck.py` scores a draft against those files before it leaves the repo. It reports and never rewrites, and it ships tuned to my writing, so the first job in a new wiki is recalibrating it against your own samples.

Most of that starts empty. A feedback-to-wiki skill turns your comments on a draft into new rules, and a weekly audit looks for gaps. Over time every assistant that reads the wiki should learn how you sound, and not only what you want to say.

## Where each rule lives

The part I'd point other people to first is a test for where an instruction belongs, because a rule filed in the wrong place quietly fails to load in the sessions that need it. Name the sessions where the rule should apply. If the answer is all of them, it goes in a file every client reads at the start (`AGENTS.md` or `preferences/`). If it is only when drafting, or only in a meeting, it goes in a skill that loads on that trigger. The repo includes the case that produced the test, a spelling rule that held in every drafted letter and drifted in shell-script comments, because it had been filed behind the drafting trigger.

There is a third answer, for rules with no judgment in them, i.e. ones that must never be broken. Those go in `hooks/policy/` as scripts. They run at every commit and again on GitHub, and they block a change that edits a past decision or a corpus sample, leaves out a note's `type:`, or writes an ambiguous wikilink. An instruction asks the assistant to remember, and a hook (a script git runs before it accepts a commit) checks whether it did. Test suites for the hooks and for `slopcheck.py` ship in `sandbox/tests/`.

## Acknowledgments

The overall pattern is an independent reconstruction of ideas from [Andrej Karpathy](https://x.com/karpathy) on LLMs as operating systems with persistent context (his [LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)), and [Nate B Jones](https://x.com/natebjones) on structured personal knowledge management with AI copilots ([Open Brain](https://github.com/NateBJones-Projects/OB1)).

Other people's work shaped specific parts. The style system and `slopcheck.py` borrow from five public anti-slop projects and four research papers, and `style/tells.md` says what came from each. The hooks and the rule-placement test build on Nate's [harness audit](https://natesnewsletter.substack.com/p/ai-harness-audit). `now.md` borrows from Meta's Muse agent, which injects a curated memory file into every turn.

The project is open source under the MIT license. View the repository on [GitHub](https://github.com/mikecirrotti/engram-wiki).
