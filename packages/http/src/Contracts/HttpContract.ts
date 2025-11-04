export { HttpContext } from '@h3ravel/shared'

export type RequestMethod = 'HEAD' | 'GET' | 'PUT' | 'DELETE' | 'TRACE' | 'OPTIONS' | 'PURGE' | 'POST' | 'CONNECT' | 'PATCH';

export type RequestObject = Record<string, any>