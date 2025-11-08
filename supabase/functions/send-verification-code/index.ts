import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { email, type, website } = validation.data;
    
    // Honeypot detection - if website field is filled, it's likely a bot
    if (website && website.trim() !== "") {
      console.warn(`[SECURITY] Honeypot triggered for email: ${email}`);
      // Return success to avoid revealing the honeypot
      return new Response(
        JSON.stringify({ message: "Verification code sent successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
    
    console.log(`Sending ${type} verification code to:`, email);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Enhanced rate limiting with exponential backoff tracking
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const { data: recentCodes, error: rateLimitError } = await supabase
      .from("verification_codes")
      .select("id, created_at")
      .eq("email", email)
      .eq("type", type)
      .gte("created_at", oneHourAgo.toISOString())
      .order("created_at", { ascending: false });

    if (rateLimitError) {
      console.error("Error checking rate limit:", rateLimitError);
    } else if (recentCodes) {
      const last5Min = recentCodes.filter(c => c.created_at >= fiveMinutesAgo.toISOString()).length;
      const last15Min = recentCodes.filter(c => c.created_at >= fifteenMinutesAgo.toISOString()).length;
      const last60Min = recentCodes.length;
      
      // Log pattern for monitoring
      console.log(`[RATE_LIMIT_CHECK] Email: ${email}, Last 5min: ${last5Min}, Last 15min: ${last15Min}, Last 60min: ${last60Min}`);
      
      // Exponential backoff: stricter limits for repeated attempts
      if (last5Min >= 3) {
        console.warn(`[SECURITY] Rate limit exceeded (5min) for ${email}`);
        return new Response(
          JSON.stringify({ 
            error: "Too many requests. Please wait 5 minutes before requesting another code." 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      if (last15Min >= 5) {
        console.warn(`[SECURITY] Rate limit exceeded (15min) for ${email}`);
        return new Response(
          JSON.stringify({ 
            error: "Too many requests. Please wait 15 minutes before requesting another code." 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      if (last60Min >= 10) {
        console.warn(`[SECURITY] Suspicious activity detected for ${email} - ${last60Min} requests in 1 hour`);
        return new Response(
          JSON.stringify({ 
            error: "Too many requests. Please wait 1 hour or contact support if you need assistance." 
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing unverified codes for this email and type
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("type", type)
      .eq("verified", false);

    // Store code in database (expires in 15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error: insertError } = await supabase
      .from("verification_codes")
      .insert({
        email,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error storing verification code:", insertError);
      throw insertError;
    }

    // Send email with verification code
    const subject =
      type === "signup"
        ? "Verify Your Email - Registration Code"
        : "Verify Your Login - Security Code";

    const emailResponse = await resend.emails.send({
      from: "Security <onboarding@resend.dev>",
      to: [email],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Email Verification</h1>
          <p style="font-size: 16px; color: #555;">
            ${
              type === "signup"
                ? "Thank you for signing up! Please use the verification code below to complete your registration:"
                : "Please use the verification code below to complete your login:"
            }
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <h2 style="color: #333; font-size: 32px; letter-spacing: 8px; margin: 0;">${code}</h2>
          </div>
          <p style="font-size: 14px; color: #888;">
            This code will expire in 15 minutes.
          </p>
          <p style="font-size: 14px; color: #888;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ message: "Verification code sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
