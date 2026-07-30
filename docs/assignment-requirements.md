# Assignment Requirements

## Goal

Build a two-player dice game where all game logic lives in a backend API and a React frontend displays the game.

## Mandatory game rules

- The game has exactly two players.
- Players take alternating turns.
- On a turn, a player rolls two dice.
- A player may roll as many times as desired during the turn.
- Each roll adds the total of both dice to the round score.
- Rolling double six loses the round score and passes the turn.
- Hold adds the round score to the global score.
- Hold passes the turn.
- The first player to reach the winning score wins.
- Players may set the winning score.
- Default winning score is 100.
- A player may start a new game at any time.

## Mandatory backend requirements

- Implement an API with authentication.
- The API manages player identities.
- The API enforces all game rules.
- The API manages game state.
- The API validates turns.
- The API validates actions.
- Only authenticated users may create games.
- Only authenticated users may play games.

## Mandatory frontend requirements

- Use React.
- Authenticate the user.
- Display game state.
- Call the backend API for Roll.
- Call the backend API for Hold.
- Call the backend API for New Game.
- No game logic may live in the frontend.

## Environment simplification

- Simulate both users on the same page.
- Live updates between different browsers or machines are not required.
- WebSockets are not required.

## Optional requirements

- Track how many times a player has won.
- Persist data.
- Add an AI opponent.
- On double six, briefly disable actions and show a message or animation.
- Add sound effects or background music.
- Add other creative improvements.

## Documented interpretation

Approved rule interpretations are stored in `PROJECT_DECISIONS.md`.
