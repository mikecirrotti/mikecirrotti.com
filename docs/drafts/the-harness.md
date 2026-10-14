---
status: draft
updated: 2026-10-14
intendedPath: /work/the-harness/
---

<!-- Editorial draft only. Kept outside src/content/work so it is not a published work entry.
Latest consolidated wording from the October 14 conversation, including five examples and the Engram Wiki connection.
One preview excerpt from Episode 4 has been cut (source 31.20–50.45 seconds), hosted separately from git, and added with its transcript. Other excerpts remain unproduced. Public use still needs source verification and editorial review.
Suggested clip passages:
1. Ep 7: from "The paper's one big idea comes from the design researcher Donald Norman" through "each moved outward."
2. Ep 4: from "The context window is working memory, not storage" through "pulls just the folders it needs."
3. Ep 6: from "And then there's the insidious one: how you pick the hard cases" through "can skew easy."
4. AIR-LLM: the "does it actually work" exchange distinguishing the real mixer from the simulated wireless channel.
5. OpenAI CFO: the passage about starting with a consequential decision and working backward.
Sources and the earlier three-clip editorial proposal are in the private wiki's exports/2026-10-14-the-harness-portfolio-proposal.md on chatgpt/the-harness-portfolio-2026-10-14. That proposal predates this consolidated page; this file is the latest page draft.
Review: no employer/client/internal-system disclosures in page text; no production-engineering ownership or measured learning-gain claims. Voice checker: one heading-density advisory, appropriate to five example cards; one repeated-word advisory retained to preserve the requested draft wording. US-English check clean.
-->

# The Harness
*A personal learning experiment with AI-generated audio*

I use an AI agent to turn questions about AI systems into short audio conversations I can listen to in the morning. The topics follow what I'm trying to understand, from how agents remember information to how their performance gets tested.

I'm not an engineer, and part of my learning is getting comfortable with the infrastructure around the model. A useful explanation needs to unpack the terminology and give me an example I can work through.

The format is a conversation between two synthetic hosts. Each episode focuses on one idea, connects it to a practical question, and ends with something to think about.

## How the learning develops

Sometimes I ask the agent a question about something I'm trying to understand. Other times, I share a paper or article that interests me or raises new questions. It records these in a backlog, alongside context about my interests and learning goals.

As I learn, I write back what I'm still confused about and where I want to go deeper. The agent reads those open questions before selecting stories, so upcoming episodes can revisit a difficult concept or connect new material to something we've already covered.

Some episodes come from my requested reading; others come from research the agent does around those interests. I direct the learning through questions, reading material, and feedback. The agent handles research and audio production, along with preparing the reference notes.

## Connecting the audio to Engram Wiki

Each episode is accompanied by a transcript, an overview, and source links. These records are prepared with each episode and collected into my wiki through a weekly review.

The reference material becomes part of [Engram Wiki](/work/engram-wiki/), my personal knowledge system and another project featured on this site. The Harness adds material to that collection, giving me something to revisit and providing reference context for future conversations with AI assistants.

For example, one episode explored the agent's own memory system. A later episode connected that example to a paper about moving information and procedures outside the model. That progression interests me: returning to a familiar example as I learn more about the machinery behind it.

## The files behind the learning

The context lives in Markdown files I can inspect and update. The agent's working files hold the questions and episode queue; Engram Wiki preserves the reference material across tools.

<div class="learning-files" aria-label="Selected files in the agent workspace and Engram Wiki">
<section class="file-panel">
<h3>Agent workspace</h3>
<ul class="file-tree">
<li><span>learning/</span><ul><li><code>open-questions.md</code><small>What I'm still trying to understand; read before story selection.</small></li></ul></li>
<li><span>Episode planning</span><ul><li><code>requested-topics-backlog.md</code><small>Questions, papers, and articles queued for future episodes.</small></li><li><code>episode-log.md</code><small>What has aired, with listening links and sources.</small></li></ul></li>
<li><span>Each episode</span><ul><li><code>script.txt</code><small>The dialogue used to generate the audio.</small></li><li><span>Weekly wiki staging</span><small>Prepared transcript and index entry awaiting the weekly review.</small></li></ul></li>
</ul>
</section>
<section class="file-panel">
<h3>Engram Wiki</h3>
<ul class="file-tree">
<li><span>topics/</span><ul><li><code>the-harness.md</code><small>The show's purpose and format.</small></li><li><code>the-harness-episodes.md</code><small>Episode overviews, source links, and paths to transcripts.</small></li></ul></li>
<li><span>exports/the-harness/transcripts/</span><ul><li><span>One Markdown transcript per episode</span><small>The conversation preserved for later reading and reference.</small></li></ul></li>
</ul>
<p class="file-review">Prepared records reach the wiki through a weekly batch review and approval.</p>
</section>
</div>

After listening or reading, I write back the questions that remain. Those updates help shape the next episode. The wiki records remain available as reference context when I return to the subject, including with a different AI assistant.

## Selected excerpts

### Why a shopping list changes the task

A familiar example introduces how memory and reusable instructions can change what an AI agent has to do.

*From "Change the Task, Not the Model," October 13, 2026.*

### Working memory versus storage

The top of a desk and a filing cabinet explain the difference between the current conversation and information stored for later.

*From "The Filing Cabinet and the Librarian," October 12, 2026.*

<div class="audio-example">
<p class="audio-meta">Episode 4 · 19-second excerpt · AI-generated voice</p>
<audio controls preload="none" aria-label="Working memory versus storage, a 19-second excerpt from The Harness">
<source src="https://d2ol7oe51mr4n9.cloudfront.net/user_3KZZbOpFrzVEv4xu2g5sPKdU5c7/03577022-2db5-442f-bea7-70ab5d226bfb.mp3" type="audio/mpeg" />
Your browser does not support this audio player.
</audio>
<details>
<summary>Read the excerpt</summary>
<p>The context window is working memory, not storage. Think of it as the top of a desk. The agent only keeps what it's actively thinking about on the desk. Everything durable — memories, commitments, running logs, yesterday's plans — lives in files, in the filing cabinet. And every turn, the agent pulls just the folders it needs.</p>
</details>
</div>

### Choosing what to test

A coastline analogy explains how selecting examples from one model's failures can give a misleading picture of performance.

*From "Don't Fool Yourself," October 13, 2026.*

### Exploring a paper that caught my attention

AIR-LLM explores whether model weights could arrive over radio signals, allowing a device to perform parts of the computation without storing the entire model. I was curious about what that might mean for where AI runs. The episode unpacked the proposed mechanism and distinguished the hardware experiment from simulated conditions and infrastructure that doesn't yet exist.

*From "AIR-LLM — The Model That Lives in the Air," October 8, 2026.*

### Starting with the decision

An account of OpenAI's finance experiments prompted a broader question: which decisions are being made with stale information? The episode explored working backward from a decision to the information and workflow needed to support it, while distinguishing the company's ambitions from demonstrated outcomes.

*From "OpenAI's CFO Rebuilt Finance Around AI," October 6, 2026.*

These excerpts use AI-generated voices and scripts. They are selected examples from a personal learning feed, with transcripts and sources available alongside the audio.
