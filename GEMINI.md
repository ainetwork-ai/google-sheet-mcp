# GEMINI.md

## Project Overview

This project is a Model Context Protocol (MCP) server that provides an interface to interact with Google Sheets. It allows AI agents to read, search, and modify spreadsheet data using a defined set of tools. The server is built with TypeScript and utilizes the `googleapis` library to communicate with the Google Sheets API. Authentication is handled through OAuth 2.0.

The project is structured with a clear separation of concerns:
- `src/index.ts`: The main entry point for the server.
- `src/services/google-sheets-service.ts`: The core logic for interacting with the Google Sheets API.
- `src/auth/auth-service.ts`: Handles authentication with Google.
- `src/tools/index.ts`: Defines the tools available to the AI agent.
- `src/types/`: Contains type definitions for the project.
- `src/utils/`: Provides utility functions for error handling, retry logic, and sheet manipulation.

## Building and Running

### Prerequisites

- Node.js 18+
- Google Cloud Project with Sheets API enabled
- OAuth 2.0 credentials from Google Cloud Console

### Installation

```bash
npm install
```

### Configuration

Create a `.env` file in the root of the project with the following content:

```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback
```

### Running the Server

To run the server in development mode with live reloading:

```bash
npm run dev
```

To build the project for production:

```bash
npm run build
```

To run the production build:

```bash
npm start
```

### Running Tests

To run the test suite:

```bash
npm test
```

## Development Conventions

### Coding Style

The project uses ESLint and Prettier for code linting and formatting. To check for linting errors:

```bash
npm run lint
```

To automatically fix linting errors:

```bash
npm run lint:fix
```

To format the code:

```bash
npm run format
```

### Testing

The project uses Jest for testing. Test files are located in the `tests/` directory and follow the `*.test.ts` naming convention. The configuration can be found in `jest.config.js`.

### Type Safety

The project is written in TypeScript and enforces strict type checking. The TypeScript configuration can be found in `tsconfig.json`.
