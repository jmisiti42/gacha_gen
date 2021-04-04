export const throwError = (message: string, statusCode: number) => {
    throw { message, statusCode };
}