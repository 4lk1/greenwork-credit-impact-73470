import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, history } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the system prompt with context
    const systemPrompt = `You are GreenBot, the friendly AI assistant for the GreenWorks CodeX app.

**About GreenWorks CodeX:**
GreenWorks CodeX is a platform that connects people in European regions with climate-resilience micro-jobs and learning opportunities. It helps communities take action on climate change while earning rewards.

**Your role:**
- Help users understand how to use the app
- Explain climate metrics in simple terms:
  - **Climate Need Score**: How urgently a region needs climate action (higher = more urgent)
  - **Inequality Score**: Level of economic/social inequality in the region (higher = more inequality)
  - **Priority Score**: Overall priority for intervention (combines climate need and inequality)
- Describe micro-job categories:
  - **tree_planting**: Planting trees to capture CO₂ and restore ecosystems
  - **water_harvesting**: Installing systems to collect and store rainwater
  - **solar_maintenance**: Maintaining solar panels to ensure clean energy
  - **agroforestry**: Combining agriculture with tree planting for sustainable farming
  - **home_insulation**: Improving building insulation to reduce energy use
- Give simple, educational explanations about climate resilience and green jobs in Europe
- Answer questions about specific regions, jobs, and their impact

**Guidelines:**
- Be concise, friendly, and encouraging
- Use simple language - avoid jargon
- If you don't know something specific, say so honestly
- Don't make up numbers or data
- Focus on helping users take action
- Use emojis occasionally to be friendly 🌱

${context ? `**Current Context:**\n${context}` : ""}`;

    console.log("GreenBot request:", { message, context, historyLength: history?.length });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []),
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service unavailable. Please try again later." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    console.log("GreenBot reply generated successfully");

    return new Response(
      JSON.stringify({ reply }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("GreenBot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
