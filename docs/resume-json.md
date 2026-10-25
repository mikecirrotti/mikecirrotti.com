# Resume JSON

/resume.json is generated during the Astro static build. Edit career facts in src/data/resume.ts, shared identity in src/lib/identity.ts, and project descriptions in src/content/work/. The generated file is linked from About, the site footer, and llms.txt.

The public copy generalizes employer identities and uses the cleared eight-figure recovery wording. Keep private source notes out of this public repository. The two degrees lead education; the program and single course are additional study. Direct-report counts apply during part of the prior Director role.

scripts/resume.schema.json is a pinned copy of JSON Resume's schema at jsonresume/jsonresume.org commit bbb5e169def0f93d88285d5a220787a7328408c6, packages/schema/schema.json (blob ae830c6b41b80a4a330e25876614c0d70feb79cf). Upstream source: https://github.com/jsonresume/jsonresume.org/blob/bbb5e169def0f93d88285d5a220787a7328408c6/packages/schema/schema.json. The project is MIT licensed.

npm run build validates the final output using scripts/validate-resume.mjs. The dependency-free checker supports all validation keywords in this pinned schema and fails if an unsupported keyword is introduced; it is not a general JSON Schema implementation. No schema download occurs during builds. It also checks direct-report totals, public-data boundaries, and the local portrait asset.
