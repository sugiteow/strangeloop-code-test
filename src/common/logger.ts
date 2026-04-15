/*
 * Just do console.log here for simplicity.  Don't really need any sophisticated logging library here for now.
 * */
export const logger = {
  info: (...args: unknown[]): void => console.log(...args),
  error: (...args: unknown[]): void => console.error(...args),
};
