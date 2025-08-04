// Global type declarations for production builds
/// <reference types="node" />

import { Request, Response } from 'express';

declare global {
  var console: Console;
  var process: NodeJS.Process;
  
  namespace NodeJS {
    interface Process {
      env: ProcessEnv;
    }
    
    interface ProcessEnv {
      [key: string]: string | undefined;
      NODE_ENV?: string;
      PORT?: string;
      DATABASE_URL?: string;
      JWT_SECRET?: string;
    }
  }
}

// Ensure AuthRequest has all Express Request properties
declare module '../types/authRequest' {
  interface AuthRequest extends Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export {};
