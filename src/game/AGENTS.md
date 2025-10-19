# Agent Guidelines for Game Modules

- Keep modifier key lists and builder maps in alphabetical order. When adding new modifiers, insert them alphabetically to preserve predictable UI ordering.
- Place modifier-specific logic inside the corresponding modifier directory/file rather than central overlays.
- Prefer single quotes for strings unless a double quote is necessary for clarity or escaping.

## Coding Practices

- In general, run tests after making a change and try to resolve any problems or warnings they surface.
- Write new unit tests for utilities and reusable functions and ensure common edge cases are covered.
- Avoid monolithic files; put mod (gameplay modifier) specific code into the mod file structure rather than expanding `pong.ts`.

## Agent Self Reflection

- Use this section to record high-level concepts, patterns, or approaches that future agents should follow or adapt.
- Always provide a summary of any updates made to this AGENTS.md so future agents can quickly understand the changes.
