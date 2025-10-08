# Pickleball Sessions

## Overview

A cross-platform (web/iOS/Android) React Native Expo application for managing social or competitive pickleball sessions
with fair player rotation, team balancing, and comprehensive session tracking.


### Goals:

- Equal playing time: Ensure players get equal playing time. Players are designated to sit out randomly, after taking playing time into account.
- Partner mix: Players play with a mix of partners, prioritizing new partners over repeated partnerships
- Offline - uses local storage, does not require an internet connection


### Key Features

1. Player Management
- Add, edit, delete players
- Player search
- Optional support for player ratings
    - Player ratings can be used to assign to courts with minimum rating threshold
- Optional support for player contact information
- Import, export (CSV format)

2. Group Management
- Manage groups of players, to simplify starting new pickleball sessions

3. Session Creation
- Create a new session each time you head out on the court
- Flexible player selection: Add players via groups or individually
- Court configuration:
    - Add/remove/disable courts
    - Optional: minimum rating requirements per court. This feature can be turned on to setup court(s) to only allow players to be assigned by a minimum rating. Let the competitive people have some higher level play.

4. Live Session Management
- Manage games in round-robin format
- Optional game scoring
- Session statistics
- Game curation:
    - Easily swap any players around when creating new game rounds
- Player features:
    - Add new player(s) to any live session
    - Pause any player if they must leave the session or sit out a few games
- Fixed Partnerships:
    - Players can be linked together in a partnership at any time during a session
    - 
