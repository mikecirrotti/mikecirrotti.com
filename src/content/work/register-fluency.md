---
title: Register Fluency
publishDate: 2026-10-12 00:00:00
img: /assets/register-fluency.svg
img_alt: Three mixer knobs labeled by small icons for strategy, analytics and technical build, each turning to a different setting
description: |
  The site for my writing on AI and data, built by three AI tools working from one shared memory: a private wiki that held the plan and every decision before the first page existed.
tags:
  - AI
  - Writing
  - Web
---

[Register Fluency](https://registerfluency.com) is where I practice explaining ideas from AI and data in language people outside those fields can use, mostly for readers who work near or with these tools rather than build them. Writing the posts is part of how I learn. The site carries two newsletters, [*Language of AI*](https://registerfluency.com/language-of-ai/) and *Language of Data*.

The name comes from the example the homepage opens with. A doctor talks through a planned procedure with a colleague, explains it to the patient, and later settles the arrangements with hospital administrators. All three conversations are accurate, and each one is in a different register.

I'm not an engineer and I didn't write this site's code by hand. Three AI tools did most of the building, and what let them share the work was a private instance of [Engram Wiki](/work/engram-wiki/), where the plan and every decision were written down before the first page existed.

Every tool started from the same files. The build plan is split into phases, and each step ends with a "you should see" line, so whoever picks it up can check the result before moving on. Decisions sit in their own records and are never edited afterward (a later call gets a new file that points back at the old one), which keeps one session from quietly undoing another's work. The site's README settles which side wins, and when the site and the wiki disagree, the site is what changes.

So I could switch tools partway through without re-explaining anything. The next session read the same plan and picked up where the last one stopped.

## Who built what

- Claude Code built most of the site: the Astro scaffold, the *Language of AI* page with its first seven posts, the logo and favicon, the About page and the *Language of Data* page.
- ChatGPT Work built the homepage on its own preview branch: the doctor's three conversations, with ordinary scrolling driving the video, the captions and a set of knobs borrowed from the logo. Claude Code then prepared it for release, removing the pages that only existed for review.
- Higgsfield generated the homepage's two video clips. Every readable word stays real page text rather than lettering baked into the footage, and the clips are served from the site's own files, so a visitor's browser never calls Higgsfield.

Motion is optional. A "View without motion" link shows all three conversations as plain text. The page also switches to that version by itself when a device asks for less animation, the screen is too short or the video fails to load.

## Decisions I'd make again

The posts mirror LinkedIn word for word. Each one is a native page with its original publish date and a link back to LinkedIn for replies. I ruled out the official embed, which is a window onto LinkedIn's page inside mine: it loads their scripts and trackers, renders in their styling and goes blank if the post changes.

Visuals get rebuilt rather than pasted in. One post ran on LinkedIn with an image quoting six people on how roles are converging; here it's native text in the site's own palette, with each quote's source linked where one exists.

A page ships when its content exists. There's no "coming soon" anywhere on the site, so the *Language of Data* page went up together with its first post.
