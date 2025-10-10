# Agent Configuration

## Project Overview - Technology

This is an Expo react native TypeScript project using redux for storage, and testing with Jest.

### Development Commands
- **Development**: `npm start` (Expo dev server), `npm run web` (web version)
    - `npx expo start -d` - Start development server
    - `npm expo export --platform web` - Export static site for production
- **Build**: Use Expo CLI commands for platform-specific builds
- **Test**: `npm run test` (all tests), `npm run test:watch` (watch mode), `npm run test:coverage` (with coverage)
- **Test single file**: `npm test -- src/services/__tests__/sessionService.test.ts`

## Commands

### Code Style
- **TypeScript**: Strict mode enabled, use proper typing for all functions and interfaces
    - Use TypeScript for all new files
- **Style**: Follow existing naming conventions (camelCase for variables, PascalCase for components)
    - Prefer const assertions and strict typing
- **Imports**: Use `@/` for root imports, `src/` for src-relative imports
- **Components**: Export default functions, use PascalCase naming
    - Use functional components with hooks
- **Props**: Define interfaces with `Props` suffix (e.g., `PlayerButtonProps`)
- **State**: Use Redux Toolkit with createSlice, follow existing slice patterns
- **Formatting**: Use double quotes, prefer function declarations over arrows for components
- **File structure**: Keep components in `/src/components/`, services in `/src/services/`

### Error Handling
- Use try-catch for async operations
- Proper TypeScript error types
- Redux error state management in slices

### Architecture
- Expo top-level app structure in `src/app`
- Components in `src/components/`
- Utilities in `src/utils/`
- Types in `src/types/`
- Storage (redux) in `src/store/`

### Dependencies
- Prefer built-in browser APIs when possible
- Always check if dependency already exists before adding new ones
- Use exact versions in package.json

### Testing
- Jest with React Native preset
- Tests are under `__tests__/` folders in `*.test.ts` files
- Use React Testing Library for component tests
- Coverage reports available with `npm run test:coverage`
- Mock external dependencies
- Aim for 80%+ test coverage


## Application Overview

This project is a new cross-platform (web/android/ios) application using the react-native expo framework.
The app is called "PB Sessions" and its intent is to manage a group of people playing pickleball for a series of games (rounds) in a session.
Given a group of players for a session, the goal is to fairly select players for new games within each round.
We also have optional scoring and optional player ratings.

Purpose:

Organizing competitive pickleball games by mixing players for games within each session.
Goals:

- Ensure all players get equal playing time
- Players play with a mix of partners, prioritizing new partners over repeated partnerships
- Sit-out time is distributed fairly across players for the session
- The app is interactive.
- I want to be able to save a group of people used for a session. I want to be able to manage these groups, by adding or removing people. The group of people should have a name.

Sections:

The app consists of the following main areas.

- Player Management:
    - Players are managed independently of groups and sessions
    - Starting path: `src/app/(tabs)/players.tsx`
- Group Management:
    - Players can be assigned to groups, for an easier way of creating players in a new session
    - Starting path: `src/app/(tabs)/groups.tsx`
- Session Management:
    - A session is a gathering of players, who play round-robin style games based on a set of configured players.
    - The session must be populated with available players. For each session we must be able to add players via an entire group, or via each individual player.
    - Once a session is created, we can create a Live Session which is then used to start the first set of games on each court.
    - Starting path: `src/app/(tabs)/sessions.tsx`
    - Court Management:
        - The total number of courts available for each session may vary.
        - A court can be assigned a minimum player rating (optional). This restricts any assigned players to be at or above the minimum court rating.
- Live Session Management:
    - A live session can be started once all the players are selected for a session.
    - For the live session, we begin the process of shuffling players for each set of games across the available courts.
    - Each set of games utitlizes all available courts, mixing the players into a doubles pickleball game for each court.
    - Players are assigned to a side on a court based on:
        - Rating, if applicable (only used if courts are assigned a minimum rating, and all players have an assigned rating)
        - Partner, prioritizing based on lowest number of times played with each new partner
    - For a game on each court, assign two players to the side labelled "Serve", and two to the "Receive" side.
    - Starting path: `src/app/(tabs)/live-session.tsx`
- Configuration
    - for app configuration, help/about, etc
    - Starting path: `src/app/(tabs)/settings.tsx`
