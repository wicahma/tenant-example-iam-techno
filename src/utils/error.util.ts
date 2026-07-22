"use server";

import { APIBaseResponse } from "@/types/api.types";
import { AxiosError } from "axios";

/**
 * Extract a user-friendly error message from an Axios error.
 */
export async function extractErrorMessage(error: unknown): Promise<string> {
  if (error instanceof AxiosError) {
    const data = error.response?.data;

    // Validation errors: flatten field errors
    if (data?.message === "Validation failed" && data?.errors) {
      const messages = Object.values(data.errors as Record<string, string[]>)
        .flat()
        .join(", ");
      return messages;
    }

    // Backend error message
    if (data?.message) {
      return data.message;
    }

    // HTTP status fallback
    if (error.response?.status) {
      return `Request failed with status ${error.response.status}`;
    }

    return error.message || "Network error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Format validation errors into a flat record.
 */
export function formatValidationErrors(
  errors: Record<string, string[]>,
): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const [field, messages] of Object.entries(errors)) {
    formatted[field] = messages.join(", ");
  }
  return formatted;
}

/**
 * Wrap an API call and return a standardized APIBaseResponse on error.
 */
export async function wrapApiError<T>(
  fn: () => Promise<APIBaseResponse<T>>,
): Promise<APIBaseResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    const message = await extractErrorMessage(error);
    return {
      status: false,
      message,
      data: undefined,
    };
  }
}
