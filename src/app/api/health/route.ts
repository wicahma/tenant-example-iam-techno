import { NextResponse } from "next/server";
import { env } from "@/config/env.config";

export async function GET() {
  try {
    const resolvedEnv = await env();
    const response = await fetch(`${resolvedEnv.APP.API_URL}/public/health`);
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy",
        message: "Cannot reach IAM Techno backend",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
