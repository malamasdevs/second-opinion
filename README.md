# second opinion

Two AI models review every pull request. The second one reviews the first one's review.

Claude reads the diff and reviews it. Then a different model reads the same diff
**plus Claude's review**, and reports what it missed, got wrong, or overstated.
Posts as one comment that updates itself on every push.

Different models have different blind spots. That's the whole idea.

---

## Setup

Two minutes, two files.

**1.** Copy `review.mjs` and `.github/workflows/second-opinion.yml` into your repo.

**2.** Add two repository secrets — Settings → Secrets and variables → Actions:

```
ANTHROPIC_API_KEY
OPENAI_API_KEY
```

**3.** Open a PR.

Optional repository *variables* to change models without touching the code:
`CLAUDE_MODEL` (default `claude-opus-5-5`) and `OPENAI_MODEL` (default `gpt-5.5`).

---

## What it costs

A 90 kB diff is about 25k input tokens. Review output, including thinking, is
roughly 1.5k. At Anthropic's published rates, the Claude pass costs:

| model | per PR | 50 PRs/mo | 200 PRs/mo |
|---|---|---|---|
| `claude-opus-5-5` | $0.130 | $6.50 | $26.00 |
| `claude-sonnet-5-5` | $0.065 | $3.25 | $13.00 |
| `claude-haiku-4-5` | $0.033 | $1.62 | $6.50 |

Add the second pass on top — it sends the same diff plus a short review, so
budget roughly the same again depending on which model you point it at.

Per-seat alternatives, for comparison. CodeRabbit Essentials is $24/developer/month
billed annually:

| team | per month | per year |
|---|---|---|
| 1 dev | $24 | $288 |
| 5 devs | $120 | $1,440 |
| 10 devs | $240 | $2,880 |

The shape that matters: **per-seat pricing scales with headcount, token pricing
scales with pull requests.** A ten-person team that opens 50 PRs a month pays
$240/month for a seat-based tool and roughly $13–20 running this. A solo dev
opening 10 PRs a month pays $24 versus well under a dollar.

Every run prints its exact token usage in the PR comment, so you can check this
against your own repo instead of trusting the table.

---

## What's in the box

```
review.mjs                            both passes, ~140 lines
.github/workflows/second-opinion.yml  the workflow
```

You own the prompts. They're plain strings in `review.mjs` — tune them to your
codebase, your conventions, the mistakes your team actually makes. That's the
part a SaaS tool can't give you.

---

## Safety

Carried over from running this on real repos:

- **The diff and PR description are untrusted input.** Both models are told so
  explicitly and both receive the content fenced, so an injected "ignore your
  instructions" line in a diff reads as payload, not prompt.
- **`base_ref` never touches a shell.** It's passed through `env:` and quoted.
  A branch name can legally contain `$`, backticks or `;`, so interpolating
  `${{ github.base_ref }}` into a `run:` block is a script-injection sink.
- **`pull_request`, never `pull_request_target`** — the latter hands secrets to
  fork PRs.
- **Fork PRs and drafts are skipped.** Forks don't get secrets anyway.
- **Diff capped at 90 kB**, lockfiles excluded, so one enormous PR can't run up
  a bill. `concurrency` cancels superseded runs when someone pushes repeatedly.
- **Advisory only.** It comments. It cannot approve, and it never blocks a merge.

Set a hard monthly spend limit in both provider dashboards as the real backstop.

---

## Licence

MIT. Fork it, change the prompts, make it yours.
