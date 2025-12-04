export function formatResponse(data: any = null, message: string = '', status = 'success') {
  return {
    status,
    data,
    message,
  };
}
