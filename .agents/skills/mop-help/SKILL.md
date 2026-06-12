# mop-help

Use this skill when the user asks what to do next, feels unsure, asks for a plan,
or asks which agent/workflow/artifact should be used.

## Behavior

1. Read `.MOP/STATE.json`.
2. Respect auth and Agent Router gates from `.MOP/PROTOCOL.md`.
3. Run:

```bash
node .MOP/scripts/mop-workflow.mjs help --actor <codename> --task "<user task>"
```

4. Explain the next step in the user's language.
5. Include:
   - primary agent role
   - party roles if needed
   - next artifact
   - next artifact category/path pattern
   - readiness gate if coding is being requested
   - adversarial review if risk is high

## Rules

- Do not invent a workflow phase if the helper returns one.
- Keep artifacts under `.MOP/artifacts/<category>/<artifact-slug>/<type>.md`.
- Treat the current workspace root as the project root. Do not suggest a nested
  project wrapper folder unless the user explicitly asks for a monorepo or
  multiple apps.
- If implementation is requested and readiness is not clear, ask clarification
  before coding.
- If Party Mode is active, show `PARTY MODE` before agent dialogue.
- Keep the answer practical: tell the user what happens next and why.
