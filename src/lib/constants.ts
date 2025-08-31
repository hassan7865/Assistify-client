export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  
  // Agent endpoints
  GET_AGENTS: '/api/v1/auth/agents',
  CREATE_AGENT: '/api/v1/auth/agents',
  
  // Chat endpoints
  VISITOR_MESSAGES: '/api/v1/chat/visitor-messages',
  CLOSE_SESSION: '/api/v1/chat/close-session',
  
  // Visitor endpoints
  VISITORS: '/api/v1/visitors',
  
  // WebSocket base
  WS_BASE: process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:8000',
} as const;


export enum UserRoleEnum {
  CLIENT_ADMIN = "client_admin",
  CLIENT_AGENT = "client_agent",
}




