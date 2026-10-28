# PHI CHARTS agent skills

Agent Skills that teach an AI coding assistant how to use `phi-charts` correctly - the real API surface, the eight-tier bundle model, and the foot-guns that are not obvious from the type signatures.

## Install

```sh
npx skills add https://github.com/Sairaj2807/phi-charts
```

Install a single skill instead of all of them:

```sh
npx skills add https://github.com/Sairaj2807/phi-charts --skill phi-charts
```

Works with Claude Code, Cursor, Codex, Copilot, Gemini CLI, Windsurf, Zed and the other agents the `skills` CLI supports.

## What is installed

| Skill | Kind | Use it for |
|---|---|---|
| `phi-charts` | Reference hub | Mental model, tiers, core API, triage table, and 23 deep reference files under `references/`. |
| `phi-chart-setup` | Task | Scaffold a first chart into an existing project, host detection included. |
| `phi-chart-indicator` | Task | Add one of the 112 built-in indicators, restyle it, or author a custom or Tier-2 one. |
| `phi-chart-terminal` | Task | Build a full trading terminal: live data, indicators, drawings, order lines, depth, layout persistence. |
| `phi-chart-plugin` | Task | Author a primitive, drawing tool, chart type, or indicator descriptor. |
| `phi-chart-debug` | Task | Diagnose a chart that renders wrong, will not repaint, or throws. |

The hub skill loads on its own when the agent recognises an phi-charts task. The task skills are meant to be invoked by name.

## Reference files

`phi-charts/references/` holds the depth, kept out of the always-loaded hub so the hub stays cheap to read:

`core-api`, `chart-types`, `scales-and-panes`, `themes-and-styling`, `data-and-time`, `feeds-and-live`, `events-and-state`, `indicators`, `transforms`, `drawing-tools`, `primitives-and-plugins`, `replay-and-compare`, `chart-linking`, `settings-and-menus`, `trading`, `trade-tier`, `profiles-and-orderflow`, `react-integration`, `vue-integration`, `bundling-and-tiers`, `widget`, `interactions`, `pitfalls`, [host-integration](phi-charts/references/host-integration.md).

The host reference covers async ownership, hidden startup, replay and history writers,
registration, CSP boundaries and browser validation. The references target 2.1.9 and
include the 2.0 drawing migration; verify the installed version before using newer APIs.
The interaction and widget references cover proportional wheel input, animated autoscale
and responsive mobile controls, including the boundary between a custom host and widget chrome.

## Maintaining these

Every API name, option key, event name, indicator id and default in these files is verified against `src/` and `dist/*.d.ts` rather than written from memory. When the library's public surface changes, update the reference file in the same pull request - a skill that describes an API that no longer exists is worse than no skill, because the agent will trust it.

In a source checkout, run `npm run skills:coverage` against a current build, check
relative links and frontmatter, and exercise realistic task prompts using only the
skill references. Export coverage detects missing names; scenario checks catch
contradictory lifecycle advice and incomplete examples.

The library's own docs live at https://sairaj2807.github.io/phi-charts/ and in `website/`. These skills are not a replacement for them; they are the compressed, assertion-shaped form an agent needs in context.
