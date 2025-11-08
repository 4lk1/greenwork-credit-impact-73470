import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendVerificationRequest {
  email: string;
  type: "signup" | "login";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type }: SendVerificationRequest = await req.json();

    console.log(`Sending ${type} verification code to:`, email);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
