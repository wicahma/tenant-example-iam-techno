import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env.config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleOAuthProxy(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  return handleOAuthProxy(request, params, "POST");
}

async function handleOAuthProxy(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string,
) {
  try {
    const resolvedEnv = await env();
    const resolvedParams = await paramsPromise;
    const path = resolvedParams.path.join("/");
    const url = new URL(request.url);

    // Build target URL — support both /oauth/* and /.well-known/*
    const prefix = path.startsWith(".well-known") ? "" : "oauth/";
    const targetUrl = `${resolvedEnv.APP.API_URL}/${prefix}${path}${url.search}`;

    // Build headers
    const headers: Record<string, string> = {
      APIKey: resolvedEnv.APP.API_KEY,
    };

    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    // Forward Authorization header if present
    const auth = request.headers.get("authorization");
    if (auth) {
      headers["Authorization"] = auth;
    }

    // Read body
    const body =
      method !== "GET"
        ? await request.text().catch(() => undefined)
        : undefined;

    const fetchOptions: RequestInit = {
      method,
      headers,
    };
    if (body) fetchOptions.body = body;

    const response = await fetch(targetUrl, fetchOptions);
    const responseData = await response.text();

    const nextResponse = new NextResponse(responseData, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });

    return nextResponse;
  } catch (error) {
    console.error("OAuth proxy error:", error);
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
