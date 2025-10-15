import { google } from 'googleapis';
import { OAuth2Client, GoogleAuth } from 'google-auth-library';
import { promises as fs } from 'fs';
import path from 'path';
import { AuthenticationError, RetryableError } from '../types/errors.js';
import { GoogleConfig } from '../types/index.js';

const TOKEN_PATH = path.join(process.cwd(), '/tmp/.tokens.json');

/**
 * Authentication service for Google APIs
 * Handles OAuth 2.0 flow and token management
 */
export class AuthService {
  private authClient: OAuth2Client | GoogleAuth | null = null;
  private config: GoogleConfig;

  constructor(config?: GoogleConfig) {
    this.config = config || this.loadConfigFromEnv();
    this.initializeAuth();
  }

  private loadConfigFromEnv(): GoogleConfig {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth/callback';
    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

    if (serviceAccountPath) {
      return {
        type: 'service_account',
        credentials: serviceAccountPath,
      };
    }

    if (!clientId || !clientSecret) {
      throw new AuthenticationError(
        'Google OAuth credentials not found. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      );
    }

    return {
      type: 'oauth',
      clientId,
      clientSecret,
      redirectUri,
    };
  }

  private initializeAuth(): void {
    if (this.config.type === 'service_account') {
      this.initializeServiceAccount();
    } else {
      this.initializeOAuth2();
    }
  }

  private initializeOAuth2(): void {
    if (!this.config.clientId || !this.config.clientSecret) {
      throw new AuthenticationError('OAuth credentials not provided');
    }

    this.authClient = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  private initializeServiceAccount(): void {
    if (!this.config.credentials) {
      throw new AuthenticationError('Service account credentials path not provided');
    }

    try {
      this.authClient = new GoogleAuth({
        keyFile: this.config.credentials,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.readonly',
        ],
      });
    } catch (error) {
      throw new AuthenticationError(`Failed to initialize service account: ${error}`);
    }
  }

  /**
   * Get authenticated client
   */
  async getAuthenticatedClient(): Promise<OAuth2Client | GoogleAuth> {
    if (!this.authClient) {
      throw new AuthenticationError('Auth client not initialized');
    }

    // For service account, return immediately
    if (this.config.type === 'service_account') {
      return this.authClient;
    }

    // For OAuth flow, check if we have valid tokens
    const tokens = await this.getStoredTokens();
    if (tokens && this.authClient instanceof OAuth2Client) {
      this.authClient.setCredentials(tokens);
      
      // Check if token is expired and refresh if needed
      if (this.isTokenExpired(tokens)) {
        await this.refreshToken();
      }
      
      return this.authClient;
    }

    throw new AuthenticationError('No valid authentication tokens found. Please authenticate first.');
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    if (!this.authClient || this.config.type === 'service_account' || !(this.authClient instanceof OAuth2Client)) {
      throw new AuthenticationError('OAuth2 client not available for authorization URL generation');
    }

    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly',
    ];

    return this.authClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    if (!this.authClient || !(this.authClient instanceof OAuth2Client)) {
      throw new AuthenticationError('OAuth2 client not initialized');
    }

    try {
      const { tokens } = await this.authClient.getToken(code);
      this.authClient.setCredentials(tokens);
      await this.storeTokens(tokens);
    } catch (error) {
      throw new AuthenticationError(`Failed to exchange code for tokens: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<void> {
    if (!this.authClient || !(this.authClient instanceof OAuth2Client)) {
      throw new AuthenticationError('OAuth2 client not initialized');
    }

    try {
      const { credentials } = await this.authClient.refreshAccessToken();
      this.authClient.setCredentials(credentials);
      await this.storeTokens(credentials);
    } catch (error) {
      throw new AuthenticationError(`Failed to refresh token: ${error}`);
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(tokens: any): boolean {
    if (!tokens.expiry_date) {
      return true;
    }
    return Date.now() >= tokens.expiry_date;
  }

  /**
   * Store tokens securely (implement based on your storage preference)
   */
  private async storeTokens(tokens: any): Promise<void> {
    await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
    console.log('Tokens stored to', TOKEN_PATH);
  }

  /**
   * Retrieve stored tokens
   */
  private async getStoredTokens(): Promise<any> {
    try {
      const content = await fs.readFile(TOKEN_PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getAuthenticatedClient();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Revoke authentication tokens
   */
  async revokeTokens(): Promise<void> {
    if (!this.authClient || !(this.authClient instanceof OAuth2Client)) {
      return;
    }

    try {
      await this.authClient.revokeCredentials();
      // Clear stored tokens
      await this.clearStoredTokens();
    } catch (error) {
      console.error('Failed to revoke tokens:', error);
    }
  }

  /**
   * Clear stored tokens
   */
  private async clearStoredTokens(): Promise<void> {
    try {
      await fs.unlink(TOKEN_PATH);
      console.log('Tokens cleared');
    } catch (error) {
      // Ignore errors if file doesn't exist
    }
  }

  /**
   * Get Google Sheets API client
   */
  async getSheetsClient() {
    const auth = await this.getAuthenticatedClient();
    return google.sheets({ version: 'v4', auth });
  }

  /**
   * Get Google Drive API client
   */
  async getDriveClient() {
    const auth = await this.getAuthenticatedClient();
    return google.drive({ version: 'v3', auth });
  }
}


