# Google Sheets MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with Google Sheets, enabling AI agents to read, search, and intelligently modify spreadsheet data.

## Features

- 📊 **Read spreadsheet data** by file, sheet, or specific range
- ✏️ **Smart cell updates** with partial text replacement
- 🔍 **Search and filter** capabilities across sheets
- 📝 **Preserve formatting** and formulas during updates
- 🔐 **Secure OAuth 2.0** authentication
- ⚡ **Batch operations** for efficient bulk updates
- 🛡️ **Type-safe** with full TypeScript support

## Quick Start

### Prerequisites

- Node.js 18+
- Google Cloud Project with Sheets API enabled
- OAuth 2.0 credentials from Google Cloud Console

### Installation

```bash
npm install
```

### Configuration

1. **Enable Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing one
   - Enable "Google Sheets API" and "Google Drive API"
   - Create OAuth 2.0 credentials (Desktop app)

2. **Set up environment variables**

Create a `.env` file:

```bash
# Google OAuth 설정
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback

# 서비스 계정 설정 (선택사항)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./path/to/service-account-key.json

# MCP 서버 설정
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=localhost
```

3. **Start the MCP server**

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

4. **Install the MCP server**

```json
# add this to mcp.json etc.
"google-sheets-mcp-server": {
      "command": "node",
      "args": ["YOUR_PATH/google-sheets-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID":"YOUR_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET":"YOUR_CLIENT_SECRET",
        "GOOGLE_REDIRECT_URI":"http://localhost:3000/oauth/callback",
        "MCP_SERVER_PORT":"3000",
        "MCP_SERVER_HOST":"localhost",
        "NODE_ENV":"development",
        "LOG_LEVEL":"info"
      }
    }
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## Available Tools

### Read Tools
- `sheets_list_files` - List accessible spreadsheets
- `sheets_list_sheets` - List sheets in a spreadsheet
- `sheets_read_data` - Read all data from a sheet
- `sheets_read_range` - Read data from a specific range
- `sheets_search` - Search for text in cells

### Update Tools
- `sheets_update_cell` - Update a single cell
- `sheets_update_range` - Update multiple cells
- `sheets_smart_replace` - Smart text replacement
- `sheets_append_rows` - Add new rows

### Management Tools
- `sheets_create_sheet` - Create a new sheet
- `sheets_delete_sheet` - Delete a sheet
- `sheets_rename_sheet` - Rename a sheet

## Documentation

- [API Reference](docs/api-reference.md) - Complete tool documentation
- [Tutorials](docs/tutorials.md) - Step-by-step guides
- [Contributing](CONTRIBUTING.md) - How to contribute

## Features

- ✅ **OAuth 2.0 Authentication** - Secure Google account integration
- ✅ **Service Account Support** - For automated workflows
- ✅ **Smart Text Replacement** - Partial text updates with context preservation
- ✅ **Batch Operations** - Efficient bulk updates
- ✅ **Error Handling** - Comprehensive error management with retry logic
- ✅ **Rate Limiting** - Built-in API quota management
- ✅ **Type Safety** - Full TypeScript support
- ✅ **Comprehensive Testing** - Unit and integration tests

## Performance

- **Read operations**: < 2 seconds for sheets up to 10,000 cells
- **Write operations**: < 5 seconds for batches up to 1,000 cells
- **Smart replace**: < 3 seconds for sheets up to 5,000 cells
- **Rate limiting**: 60 requests per minute by default

## Security

- OAuth tokens stored securely using system keychain
- All API communications use HTTPS
- No sensitive data logged
- Read-only mode available for sensitive spreadsheets
- Input validation and sanitization

## License

MIT
