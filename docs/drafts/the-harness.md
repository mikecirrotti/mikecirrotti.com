---
status: draft
updated: 2026-10-14
intendedPath: /work/the-harness/
---

<!-- Development draft for /preview/the-harness/.
Five excerpts from the existing recordings; audio is hosted separately from git.
Clip timings, source links, and asset URLs are recorded in the-harness-clips.json.
Keep this page out of the production work collection until Mike directs publication.
-->

# The Harness
*A personal learning experiment with AI-generated audio*

<nav class="page-links" aria-label="On this page"><a href="#how-the-learning-develops">Process</a><a href="#the-files-behind-the-learning">Files</a><a href="#selected-excerpts">Listen</a></nav>

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

<p class="listening-summary">Five excerpts · 3 minutes 23 seconds in total</p>

<div class="excerpt-list">
<section class="excerpt-card" aria-labelledby="excerpt-task">
<p class="excerpt-kicker">01 <span>Episode 7 · October 13, 2026</span> <span>1:16</span></p>
<h3 id="excerpt-task">Why a shopping list changes the task</h3>
<p class="excerpt-description">A familiar example introduces how memory and reusable instructions can change what an AI agent has to do.</p>
<audio controls preload="metadata" aria-label="Why a shopping list changes the task">
<source src="https://d2ol7oe51mr4n9.cloudfront.net/user_3KZZbOpFrzVEv4xu2g5sPKdU5c7/20df83b9-7dc2-4d3e-9359-5721b0df8751.mp3" type="audio/mpeg" />
Your browser does not support this audio player.
</audio>
<details>
<summary>Read the excerpt</summary>
<p><strong>Jordan:</strong> The paper's one big idea comes from the design researcher Donald Norman: a good external aid doesn't make you smarter. It changes the task into one you can already do. A shopping list doesn't improve your memory. It turns a hard remembering problem into an easy recognizing problem.</p>
<p><strong>Alex:</strong> So apply that to agents.</p>
<p><strong>Jordan:</strong> That's exactly what the paper does. An unaided language model faces three chronic problems, each solved not by a better model but by moving the burden out of the model and into infrastructure. First, memory. The context window is finite and everything vanishes between sessions, so teams built persistent memory stores — and recalling the past became retrieving it, the shopping-list move. Second, skills. A model re-derives procedures every time, slightly differently each time, so teams packaged procedures into reusable skill documents — improvising every step became composing pre-tested parts. Third, protocols. Tool calls negotiated through free-form prompting are brittle, so teams wrote explicit contracts for how tools get discovered and invoked — fragile negotiation became structured exchange. Memory, skills, protocols — state, expertise, and interaction, each moved outward.</p>
</details>
<p class="excerpt-source"><a href="https://arxiv.org/abs/2604.08224" target="_blank" rel="noopener noreferrer">Read the research review</a></p>
<p class="excerpt-note">A review of agent infrastructure, rather than a new benchmark.</p>
</section>

<section class="excerpt-card" aria-labelledby="excerpt-memory">
<p class="excerpt-kicker">02 <span>Episode 4 · October 12, 2026</span> <span>0:19</span></p>
<h3 id="excerpt-memory">Working memory versus storage</h3>
<p class="excerpt-description">The top of a desk and a filing cabinet explain the difference between the current conversation and information stored for later.</p>
<audio controls preload="metadata" aria-label="Working memory versus storage">
<source src="https://d2ol7oe51mr4n9.cloudfront.net/user_3KZZbOpFrzVEv4xu2g5sPKdU5c7/8da49755-d704-4a82-abbb-89332f47ddb0.mp3" type="audio/mpeg" />
Your browser does not support this audio player.
</audio>
<details>
<summary>Read the excerpt</summary>
<p><strong>Jordan:</strong> The context window is working memory, not storage. Think of it as the top of a desk. The agent only keeps what it's actively thinking about on the desk. Everything durable — memories, commitments, running logs, yesterday's plans — lives in files, in the filing cabinet. And every turn, the agent pulls just the folders it needs.</p>
</details>
<p class="excerpt-source"><a href="/work/engram-wiki/">Related project: Engram Wiki</a></p>
<p class="excerpt-note">An analogy for the agent's file-based memory setup.</p>
</section>

<section class="excerpt-card" aria-labelledby="excerpt-eval">
<p class="excerpt-kicker">03 <span>Episode 6 · October 13, 2026</span> <span>0:40</span></p>
<h3 id="excerpt-eval">Choosing what to test</h3>
<p class="excerpt-description">A coastline analogy explains how selecting examples from one model's failures can give a misleading picture of performance.</p>
<audio controls preload="metadata" aria-label="Choosing what to test">
<source src="https://d2ol7oe51mr4n9.cloudfront.net/user_3KZZbOpFrzVEv4xu2g5sPKdU5c7/50a54220-35c2-46cc-afbf-e4fad6b69059.mp3" type="audio/mpeg" />
Your browser does not support this audio player.
</audio>
<details>
<summary>Read the excerpt</summary>
<p><strong>Alex:</strong> And then there's the insidious one: how you pick the hard cases.</p>
<p><strong>Jordan:</strong> This is my favorite part. Model capability is jagged — picture a coastline, not a flat beach. If you pick hard cases from wherever today's model happens to fail, you're sampling the valleys of one model's coastline. You end up measuring that model's failure fingerprint, not what's actually hard or valuable.</p>
<p><strong>Alex:</strong> So how should you pick them?</p>
<p><strong>Jordan:</strong> Because a person judged them hard. You should be able to say why a task is hard before you let it in. Production failures and bug reports are good sources. But even user traffic can mislead — people try what they expect to work, so a sample drawn straight from traffic can skew easy.</p>
</details>
<p class="excerpt-source"><a href="https://claude.dev/blog/automating-eval-design-and-hillclimbing/" target="_blank" rel="noopener noreferrer">Read Anthropic's evaluation guide</a></p>
<p class="excerpt-note">The excerpt focuses on choosing representative test cases.</p>
</section>

<section class="excerpt-card" aria-labelledby="excerpt-air">
<p class="excerpt-kicker">04 <span>AIR-LLM · October 8, 2026</span> <span>0:31</span></p>
<h3 id="excerpt-air">Exploring a paper that caught my attention</h3>
<p class="excerpt-description">I was curious about AIR-LLM's proposal to receive model weights over radio signals. This excerpt separates the physical measurements from the simulated wireless conditions.</p>
<audio controls preload="metadata" aria-label="Exploring a paper that caught my attention">
<source src="https://d2ol7oe51mr4n9.cloudfront.net/user_3KZZbOpFrzVEv4xu2g5sPKdU5c7/e7cc7c65-8431-48d1-ab78-e361bd3fc6db.mp3" type="audio/mpeg" />
Your browser does not support this audio player.
</audio>
<details>
<summary>Read the excerpt</summary>
<p><strong>Alex:</strong> Alright, but does it actually work, or is this a whiteboard fantasy? What did they measure?</p>
<p><strong>Jordan:</strong> Good question. Let's separate what's verified from what's still simulation. They tested it two ways. First, on real hardware: they took an actual RF mixer, measured it on the bench, and ran the computations through it. Second, the wireless channel — the air between the tower and the phone — was simulated, using ray-traced models of real streets in Paris and Munich. So: real mixer, simulated airwaves.</p>
</details>
<p class="excerpt-source"><a href="https://arxiv.org/abs/2610.00465" target="_blank" rel="noopener noreferrer">Read the AIR-LLM paper</a></p>
<p class="excerpt-note">The paper combines wired RF-mixer measurements with simulated wireless channels.</p>
</section>

<section class="excerpt-card" aria-labelledby="excerpt-cfo">
<p class="excerpt-kicker">05 <span>OpenAI CFO · October 6, 2026</span> <span>0:36</span></p>
<h3 id="excerpt-cfo">Starting with the decision</h3>
<p class="excerpt-description">OpenAI's account of its finance experiments prompted a broader question: which decision does a workflow exist to support?</p>
<audio controls preload="metadata" aria-label="Starting with the decision">
<source src="https://d2ol7oe51mr4n9.cloudfront.net/user_3KZZbOpFrzVEv4xu2g5sPKdU5c7/07f61f68-41b5-46d0-b29f-19d6605af219.mp3" type="audio/mpeg" />
Your browser does not support this audio player.
</audio>
<details>
<summary>Read the excerpt</summary>
<p><strong>Jordan:</strong> Her core move was to stop asking how to make each finance task faster, and start asking which decision the task exists to serve. Begin with a consequential decision, map the data, tools, approvals, and handoffs required to support it, then work backward to figure out which parts the AI can analyze, coordinate, or complete.</p>
<p><strong>Alex:</strong> That's the big idea. She says the real promise isn't closing the books faster. It's giving finance teams more time to shape what happens next, while the outcome can still change. It's about decision latency, the gap between something changing in the business and a leader being able to act on it.</p>
</details>
<p class="excerpt-source"><a href="https://openai.com/index/building-an-ai-native-finance-function/" target="_blank" rel="noopener noreferrer">Read Sarah Friar's account</a></p>
<p class="excerpt-note">The source describes OpenAI's own work and ambitions.</p>
</section>
</div>

These excerpts use AI-generated voices and scripts. They are selected from my personal learning feed, with transcripts and links to the original material.
