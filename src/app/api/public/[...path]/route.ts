import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env.config";
import { getToken } from "@/utils/cookie.util";
import { generateTenantHeaders } from "@/utils/signature.util";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleProxy(request, params, "DELETE");
}

async function handleProxy(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string,
) {
  try {
    const resolvedEnv = await env();
    const resolvedParams = await paramsPromise;
    const path = resolvedParams.path.join("/");
    const url = new URL(request.url);

    // Build target URL
    const targetUrl = `${resolvedEnv.APP.API_URL}/public/${path}${url.search}`;

    // Build headers
    const headers: Record<string, string> = {};

    // Forward content-type
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    // Forward custom headers that the client passes
    const forwardHeaders = [
      "x-username-source",
      "x-response-type",
      "x-reset-provider",
      "x-reset-path",
      "x-password-type",
    ];
    for (const h of forwardHeaders) {
      const val = request.headers.get(h);
      if (val) headers[h] = val;
    }

    // Add Bearer token from cookie
    const token = await getToken();
    if (token?.accessToken) {
      headers["Authorization"] = `Bearer ${token.accessToken}`;
    }

    // Generate tenant verification headers
    const body =
      method !== "GET" && method !== "DELETE"
        ? await request.text().catch(() => undefined)
        : undefined;

    const queryString = url.search || undefined;

    try {
      const tenantHeaders = await generateTenantHeaders(
        method,
        `/public/${path}`,
        body,
        queryString,
      );
      Object.assign(headers, tenantHeaders);
    } catch (err) {
      // If bypass is enabled, continue without tenant headers
      console.warn("Tenant header generation failed:", err);
    }

    // Forward request to backend
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseData = await response.text();

    // Build response
    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

    return nextResponse;
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { status: false, message: "Proxy error", data: null },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, x-username-source, x-response-type, x-reset-provider, x-reset-path, x-password-type",
    },
  });
}
