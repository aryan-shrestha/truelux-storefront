# <Feature name>

Status: Planned

Last updated: YYYY-MM-DD

---

## Goal

What problem does this feature solve?

Keep this short.

---

## Scope

What is included in this implementation?

- ...
- ...
- ...

What is explicitly outside the scope?

- ...
- ...

---

## Context

What existing code, architecture, or API behaviour is relevant?

Mention the important routes, components, `lib` modules, API endpoints, decisions,
or external systems that future implementation work needs to understand.

---

## Planned

The intended implementation:

- ...
- ...
- ...

---

## Implemented

Only record behavior that actually exists in the code.

- `app/<route>/page.tsx` — ...
- `components/<area>/<Component>.tsx` — ...
- `lib/<domain>/<module>.ts` — ...
- `lib/api/<module>.ts` — ...
- `<module>.test.ts` — ...

---

## Remaining

Anything incomplete, intentionally deferred, or blocked.

If nothing remains:

```text
None.
```

If blocked, explain why:

```text
- Add X after Y is available because ...
```

Do not hide incomplete work.

---

## Decisions

Record decisions that future implementation work needs to preserve.

### Decision: <short title>

**Decision**

...

**Reason**

...

**Consequence**

...

---

## Gotchas

Record surprising behavior, constraints, or implementation details that are easy
for a future engineer or AI agent to miss.

Examples:

- This component renders empty on the server because it reads `localStorage`.
- The API returns a bare array here, not a pagination envelope.
- This route must not load third-party scripts because the URL carries a credential.
- Hydration breaks without an explicit time zone.

Only record durable knowledge.

---

## Routes

Document the URLs this feature owns.

```text
/path/[param]        rendering strategy, and why
```

State which are server-rendered, which are dynamic, and which are indexed.

If the feature owns no routes:

```text
None.
```

---

## API

Which backend endpoints this feature calls, from where, and how failures are
handled.

### Calls

```text
GET /api/v1/...        server, revalidate 300
POST /api/v1/...       browser, no-store
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| ... | ... |

Do not duplicate [integrations/backend-api.md](../integrations/backend-api.md);
link to it. Do not duplicate the code table in
[architecture.md](../architecture.md#error-handling) either.

If the feature calls no endpoint:

```text
None.
```

---

## State and data

Document what this feature stores and where, using the three tiers in
[architecture.md](../architecture.md#state):

- URL search params
- `localStorage`, with the key and its schema version
- React state

Include the storage key, the shape, and what happens when parsing fails.

If the feature holds no state:

```text
None.
```

---

## Accessibility

Document the decisions a reviewer could not infer from the markup.

Examples:

- keyboard interaction model for a custom control
- what is announced, and by which live region
- why an element is a link rather than a button
- focus management across a navigation or a dialog

---

## Tests

Record the tests that verify the feature.

- `<path>.test.ts` — ...
- `tests/e2e/<name>.spec.ts` — ...

Include important scenarios rather than every test name.

---

## Files

List the important files involved in the feature.

```text
app/<route>/
components/<area>/
lib/<domain>/
```

---

## Future context

Only record information that will save a future session from rediscovering
something important.

Do not write a chronological implementation diary.
