# Agent Guidelines for Game Modules

- Keep modifier key lists and builder maps in alphabetical order. When adding new modifiers, insert them alphabetically to preserve predictable UI ordering.
- Place modifier-specific logic inside the corresponding modifier directory/file rather than central overlays.
- Prefer single quotes for strings unless a double quote is necessary for clarity or escaping.

## Coding Practices

- In general, run tests after making a change and try to resolve any problems or warnings they surface.
- Write new unit tests for utilities and reusable functions and ensure common edge cases are covered.
- Avoid monolithic files; put mod (gameplay modifier) specific code into the mod file structure rather than expanding `pong.ts`.

## Dev Panel
Make sure all mod options in devConfig.json are exposed and editable in the dev panel with reasonable ranges for sliders.
When the value is clicked/ tapped, devs should be able to manually enter a number

Here are some general slider range guidelines:
Size multipliers: 0.01 - 10x
Speeds: 0 px/s - 1000 px/s
Durations: 0-30 sec
Delay: 0-30 sec
Offset: -1000 - 1000 px
Scale: 0.01 - 10x
Font size 8 - 144 px
Spacing: -1000 - 1000 px
Thickness: 0.1 - 100 px
Rate: 0.1 - 60 Hz
Return Angle: 0-90 deg
Rotation Angle: 0-360 deg
Rotation rate: -1080 - 1080 deg/sec
General Angle: 0-360 deg
Gap Size: 0-1000 px
Relative limit: 0-10x
Acceleration: -1000 - 1000 px/s²
Sample length: 0 - 10000 samples
Radius: 0-1000 px
Growth Rate: 0-100 px/s
Gravity: -10,000,000 - 10,000,000 f
Gravity Falloff: 0-1000 px
Visual Radius: 0-1000 px
Count: 0-1000
Pairs: 0-100
Cooldown: 0-10 s

## Agent Self Reflection

- Use this section to record high-level concepts, patterns, or approaches that future agents should follow or adapt.
- Always provide a summary of any updates made to this AGENTS.md so human developers can review and understand the changes.
