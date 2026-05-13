export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | {
      success: false;
      data: null;
      message: string;
      errors?: unknown;
      statusCode?: number;
    };

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  if (typeof message === "string") return { success: true, data, message };
  return { success: true, data };
}

export function fail(
  message: string,
  errors?: unknown,
  statusCode?: number,
): ApiResponse<null> {
  if (typeof statusCode === "number") {
    return { success: false, data: null, message, errors, statusCode };
  }
  return { success: false, data: null, message, errors };
}

