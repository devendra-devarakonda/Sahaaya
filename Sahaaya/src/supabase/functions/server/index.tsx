// Sahaaya Platform - Edge Function Stub
// This is a minimal stub - all functionality has been moved to frontend with mock data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper to create JSON response
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Main request handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter((part) => part !== "");
    
    // Remove function name from path
    const endpoint = pathParts.slice(3).join("/");

    // All endpoints return a message indicating backend is disabled
    return jsonResponse({
      status: "disabled",
      message: "Backend has been disabled. Using frontend mock data only.",
      endpoint: endpoint,
      timestamp: new Date().toISOString(),
    }, 200);

  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(
      {
        error: "Backend disabled",
        message: "This endpoint is not available. Using frontend mock data.",
      },
      200 // Return 200 instead of error to prevent console errors
    );
  }
});
