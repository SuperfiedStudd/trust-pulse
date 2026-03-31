// Edge Function: ingest-event
// Accepts raw abuse/risk events from external systems with dedupe support.
// Pipeline flow: raw_events → (compute-scores) → derived_features → score_results
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IngestPayload {
  event_type: string;
  event_time?: string;
  entity_type: string;
  entity_id: string;
  cluster_id?: string;
  source_system?: string;
  payload_json?: Record<string, unknown>;
  dedupe_key?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();

    // Support single event or batch
    const events: IngestPayload[] = Array.isArray(body) ? body : [body];

    if (events.length === 0) {
      return new Response(
        JSON.stringify({ error: "No events provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const validTypes = [
      "signup_created", "free_trial_started", "promo_redeemed",
      "payment_method_attached", "refund_requested", "refund_completed",
      "dispute_opened", "login_attempt", "device_seen", "ip_seen",
      "account_link_detected", "payment_completed", "payment_declined",
    ];

    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const evt of events) {
      if (!evt.event_type || !evt.entity_type || !evt.entity_id) {
        failed++;
        errors.push(`Missing required fields for event: ${JSON.stringify(evt).slice(0, 100)}`);
        continue;
      }

      // Build dedupe key if not provided
      const dedupeKey = evt.dedupe_key || 
        `${evt.event_type}:${evt.entity_id}:${evt.event_time || new Date().toISOString()}`;

      const row = {
        event_type: evt.event_type,
        event_time: evt.event_time || new Date().toISOString(),
        entity_type: evt.entity_type,
        entity_id: evt.entity_id,
        cluster_id: evt.cluster_id || null,
        source_system: evt.source_system || "webhook",
        payload_json: evt.payload_json || {},
        dedupe_key: dedupeKey,
        ingestion_status: "processed",
      };

      const { error } = await supabase.from("raw_events").insert(row);

      if (error) {
        // Unique constraint violation = dedupe hit, count as success
        if (error.code === "23505") {
          processed++;
        } else {
          failed++;
          errors.push(error.message);
        }
      } else {
        processed++;
      }
    }

    return new Response(
      JSON.stringify({ processed, failed, errors: errors.slice(0, 5) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
