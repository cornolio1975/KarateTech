<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Protected Components - Default Baseline Setup

The Kumite Scoreboard (`src/app/dashboard/scoreboard`), Match Console Hub, and Control Panel (`src/app/display`) design and functionality are locked as the **DEFAULT SETUP**.
- DO NOT alter, redesign, or refactor the Kumite Scoreboard, Match Console, or Control Panel layout/styling unless explicitly instructed.
- Preserve all existing WKF Kumite score handling, time management, tatami sync, and spectator display features.


# WKF Senshu Rules
- First unopposed point gets Senshu.
- Simultaneous scoring before timer restarts: No Senshu awarded.
- If Senshu is already locked in (timer has started at least once since award), it is permanently retained by the first owner unless explicitly removed by a penalty. It is NEVER removed if the opponent scores.

# WKF Winner Tiebreaker Rules
- 1. When fighters have the same points when time expires, the fighter with Senshu ON automatically wins by Senshu Advantage.
- 2. If both fighters have Senshu OFF and the same points, the winner is decided by the Superior Point rule (highest value technique achieved).
- 3. If everything is identical, the match goes to Hantei (Referee Decision).
