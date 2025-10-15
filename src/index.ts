// Google Sheets MCP Server - Main Entry Point
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { GoogleSheetsService } from './services/google-sheets-service.js';
import { AuthService } from './auth/auth-service.js';
import { createTools } from './tools/index.js';
import { ErrorHandler } from './utils/error-handler.js';

// Load environment variables
config();

/**
 * Google Sheets MCP Server
 * Provides tools for reading, searching, and modifying Google Sheets data
 */
class GoogleSheetsMCPServer {
  private server: Server;
  private googleSheetsService: GoogleSheetsService;
  private authService: AuthService;

  constructor() {
    this.server = new Server(
      {
        name: 'google-sheets-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.authService = new AuthService();
    this.googleSheetsService = new GoogleSheetsService(this.authService);
    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: createTools(this.googleSheetsService, this.authService),
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Route to appropriate tool handler
        const result = await this.handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return ErrorHandler.handleError(error);
      }
    });
  }

  private async handleToolCall(name: string, args: any): Promise<any> {
    const tools = createTools(this.googleSheetsService, this.authService);
    const tool = tools.find(t => t.name === name);
    
    if (!tool || typeof tool.handler !== 'function') {
      throw new Error(`Tool ${name} not found or handler is not a function`);
    }
    
    return await (tool.handler as (args: any) => Promise<any>)(args);
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Sheets MCP Server started');
  }
}

// Start the server
const server = new GoogleSheetsMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
