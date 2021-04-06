export const throwError = (message: string, statusCode: number) => {
  /*eslint no-throw-literal: 1*/
  throw {message, statusCode};
};
