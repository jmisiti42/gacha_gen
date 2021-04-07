export const throwError = (message: string, statusCode: number) => {
  throw new Error(JSON.stringify({message, statusCode}));
};
