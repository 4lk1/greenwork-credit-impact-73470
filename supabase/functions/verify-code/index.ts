import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const requestSchema = z.object({
  email: z.string().email().max(255),
  code: z.string().regex(/^\d{6}$/, "Code must be exactly 6 digits"),
  type: z.enum(["signup", "login"]),
  // Honeypot field - should always be empty for legitimate requests
  website: z.string().optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request data",
          details: validation.error.issues.map(i => i.message)
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { email, code, type, website } = validation.data;
    
    // Honeypot detection - if website field is filled, it's likely a bot
    if (website && website.trim() !== "") {
      console.warn(`[SECURITY] Honeypot triggered for email: ${email}`);
      // Return generic error to avoid revealing the honeypot
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Invalid or expired verification code",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log(`Verifying ${type} code for:`, email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Enhanced rate limiting with exponential backoff for failed verifications
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const { data: recentAttempts, error: rateLimitError } = await supabase
      .from("verification_codes")
      .select("id, verified, created_at")
      .eq("email", email)
      .eq("type", type)
      .gte("created_at", oneHourAgo.toISOString())
      .order("created_at", { ascending: false });

    if (!rateLimitError && recentAttempts) {
      const last15MinFailed = recentAttempts.filter(
        a => !a.verified && a.created_at >= fifteenMinutesAgo.toISOString()
      ).length;
      const last60MinFailed = recentAttempts.filter(a => !a.verified).length;
      
      // Log pattern for monitoring
      console.log(`[RATE_LIMIT_CHECK] Email: ${email}, Failed last 15min: ${last15MinFailed}, Failed last 60min: ${last60MinFailed}`);
      
      // Exponential backoff for repeated failed attempts
      if (last15MinFailed >= 5) {
        console.warn(`[SECURITY] Too many failed attempts (15min) for ${email}`);
        return new Response(
          JSON.stringify({ 
            error: "Too many failed attempts. Please wait 15 minutes or request a new code." 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      if (last60MinFailed >= 10) {
        console.warn(`[SECURITY] Suspicious verification activity for ${email} - ${last60MinFailed} failed attempts in 1 hour`);
        return new Response(
          JSON.stringify({ 
            error: "Too many failed attempts. Please wait 1 hour or request a new verification code." 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Find the verification code
    const { data: verificationData, error: selectError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("type", type)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (selectError || !verificationData) {
      console.warn(`[SECURITY] Invalid/expired code attempt for ${email} - code: ${code.substring(0, 2)}****`);
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Invalid or expired verification code",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Mark code as verified
    const { error: updateError } = await supabase
      .from("verification_codes")
      .update({ verified: true })
      .eq("id", verificationData.id);

    if (updateError) {
      console.error("Error marking code as verified:", updateError);
      throw updateError;
    }

    console.log("Code verified successfully");

    return new Response(
      JSON.stringify({ verified: true, message: "Code verified successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-code function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
