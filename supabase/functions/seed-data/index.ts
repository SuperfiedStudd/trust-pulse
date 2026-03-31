import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Check if already seeded
    const { count } = await supabase.from("clusters").select("*", { count: "exact", head: true });
    if (count && count > 0) {
      return new Response(JSON.stringify({ message: "Already seeded", count }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ANALYSTS
    await supabase.from("analysts").insert([
      { name: "Sarah Chen", avatar: "SC", cases_count: 12, capacity: 20 },
      { name: "Marcus Johnson", avatar: "MJ", cases_count: 18, capacity: 20 },
      { name: "Priya Patel", avatar: "PP", cases_count: 8, capacity: 15 },
      { name: "Alex Rivera", avatar: "AR", cases_count: 15, capacity: 20 },
    ]);

    // CLUSTERS
    await supabase.from("clusters").insert([
      { id: "CL9823", risk_score: 94, risk_level: "critical", linked_accounts: 12, exposure: 1200, abuse_type: "trial_abuse", top_abuse_reason: "Repeated Free Trials", recommended_action: "Block Trial", owner: "Sarah Chen", status: "pending", last_activity: "12 min ago", trial_signups: 8, refunds: 5, payment_attempts: 14, disputes: 0, ai_summary: 'This cluster shows coordinated free trial abuse using shared payment methods and quick refunds. 12 accounts created within 3 weeks from 2 devices, all using variations of the same email pattern (john.d+[n]@gmail.com). 8 trial signups detected with 5 refund requests within the first 48 hours of each subscription. Payment method PM001 (Visa •••• 4242) is shared across 7 accounts.' },
      { id: "CL9839", risk_score: 91, risk_level: "critical", linked_accounts: 12, exposure: 1450, abuse_type: "trial_abuse", top_abuse_reason: "Repeated Free Trials", recommended_action: "Block Trials", owner: "Marcus Johnson", status: "pending", last_activity: "12 min ago", trial_signups: 10, refunds: 3, payment_attempts: 12, disputes: 1, ai_summary: 'Cluster of 12 accounts using 2 devices to cycle through free trials. Accounts created in rapid succession with similar registration patterns. Virtual card numbers from the same issuer BIN range suggest programmatic card generation.' },
      { id: "CL9833", risk_score: 88, risk_level: "high", linked_accounts: 5, exposure: 850, abuse_type: "refund_cycling", top_abuse_reason: "Refund Abuse", recommended_action: "Block Trial", owner: "Priya Patel", status: "pending", last_activity: "12 min ago", trial_signups: 3, refunds: 9, payment_attempts: 15, disputes: 3, ai_summary: 'Refund cycling pattern: 5 linked accounts systematically request refunds within 48 hours of payment, then re-subscribe with a different payment method. Total of 9 refunds across $134.91 in the last 30 days.' },
      { id: "CL9820", risk_score: 85, risk_level: "high", linked_accounts: 4, exposure: 640, abuse_type: "refund_cycling", top_abuse_reason: "Refund Abuse", recommended_action: "Block Trial", owner: "Alex Rivera", status: "pending", last_activity: "12 min ago", trial_signups: 4, refunds: 7, payment_attempts: 11, disputes: 2, ai_summary: 'Four accounts linked by shared IP and payment method (Mastercard •••• 5500). Each account follows the same pattern: subscribe → use for 6 days → request refund on day 7.' },
      { id: "CL7953", risk_score: 72, risk_level: "medium", linked_accounts: 6, exposure: 450, abuse_type: "promo_abuse", top_abuse_reason: "Multi-account Promo Abuse", recommended_action: "Restrict Promo", owner: "Sarah Chen", status: "reviewing", last_activity: "2 hours ago", trial_signups: 6, refunds: 1, payment_attempts: 8, disputes: 0, ai_summary: '6 accounts exploiting the "SAVE50" promotional code across different email addresses but linked by 3 shared devices. Each account redeems the same 50% discount offer. Total promo value abused: ~$450.' },
      { id: "CL6102", risk_score: 68, risk_level: "medium", linked_accounts: 4, exposure: 320, abuse_type: "payment_reuse", top_abuse_reason: "Suspicious Card Sharing", recommended_action: "Require Verification", owner: "Marcus Johnson", status: "reviewing", last_activity: "4 hours ago", trial_signups: 2, refunds: 2, payment_attempts: 6, disputes: 0, ai_summary: '4 accounts sharing a single prepaid Visa card (•••• 7788). Accounts registered from different IPs but within the same city. May be legitimate family sharing or coordinated abuse.' },
      { id: "CL5501", risk_score: 82, risk_level: "high", linked_accounts: 8, exposure: 880, abuse_type: "device_burst", top_abuse_reason: "Device Burst Signup", recommended_action: "Block Trial", owner: "Priya Patel", status: "pending", last_activity: "45 min ago", trial_signups: 8, refunds: 0, payment_attempts: 3, disputes: 0, ai_summary: '8 accounts created from a single device (DEV013) within a 2-hour window. All accounts initiated free trials with different virtual card numbers from the same BIN range (424242). Consistent with automated trial farming.' },
      { id: "CL4200", risk_score: 35, risk_level: "low", linked_accounts: 2, exposure: 30, abuse_type: "trial_abuse", top_abuse_reason: "Possible Trial Reuse", recommended_action: "Monitor", owner: "Alex Rivera", status: "approved", last_activity: "1 day ago", trial_signups: 2, refunds: 0, payment_attempts: 2, disputes: 0, ai_summary: '2 accounts sharing a device — likely a household with two users. Both accounts converted to paid subscriptions. Low risk of abuse.' },
      { id: "CL8801", risk_score: 79, risk_level: "high", linked_accounts: 7, exposure: 720, abuse_type: "promo_abuse", top_abuse_reason: "Coupon Stacking Abuse", recommended_action: "Restrict Promo", owner: "Sarah Chen", status: "pending", last_activity: "3 hours ago", trial_signups: 5, refunds: 2, payment_attempts: 9, disputes: 0, ai_summary: '7 accounts systematically stacking promotional codes WELCOME20 and SAVE50. Accounts created from 2 devices using disposable email addresses. 5 of 7 accounts never converted to full-price subscription.' },
      { id: "CL3310", risk_score: 55, risk_level: "medium", linked_accounts: 3, exposure: 180, abuse_type: "payment_reuse", top_abuse_reason: "Card Sharing Network", recommended_action: "Require Verification", owner: "Marcus Johnson", status: "reviewing", last_activity: "6 hours ago", trial_signups: 1, refunds: 1, payment_attempts: 4, disputes: 0, ai_summary: '3 accounts sharing 2 payment methods with overlapping registration windows. Geographic spread suggests coordinated but possibly legitimate sharing.' },
    ]);

    // ACCOUNTS - batch insert
    const accountsBatch1 = [
      { id: "ACC001", email: "john.d+1@gmail.com", name: "John D.", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 2, last_activity: "12 min ago", status: "active" },
      { id: "ACC002", email: "john.d+2@gmail.com", name: "John D.", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 1, last_activity: "1 hour ago", status: "active" },
      { id: "ACC003", email: "johnd.plus3@gmail.com", name: "J. Davidson", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "2 hours ago", status: "active" },
      { id: "ACC004", email: "john.d+4@gmail.com", name: "John Davidson", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 2, last_activity: "3 hours ago", status: "active" },
      { id: "ACC005", email: "johnd.5@gmail.com", name: "J.D.", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "4 hours ago", status: "active" },
      { id: "ACC006", email: "john.d+6@gmail.com", name: "John D", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 0, last_activity: "5 hours ago", status: "active" },
      { id: "ACC007", email: "j.davidson7@gmail.com", name: "J. Davidson", cluster_id: "CL9823", risk_level: "high", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "6 hours ago", status: "active" },
      { id: "ACC008", email: "johnd.plus8@gmail.com", name: "John", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "8 hours ago", status: "active" },
      { id: "ACC009", email: "john.d+9@gmail.com", name: "J. D.", cluster_id: "CL9823", risk_level: "high", trial_count: 0, refund_count: 1, payment_count: 1, last_activity: "10 hours ago", status: "active" },
      { id: "ACC010", email: "johnd10@gmail.com", name: "John D", cluster_id: "CL9823", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "12 hours ago", status: "active" },
      { id: "ACC011", email: "john.d+11@gmail.com", name: "J Davidson", cluster_id: "CL9823", risk_level: "critical", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "14 hours ago", status: "active" },
      { id: "ACC012", email: "john.d+12@gmail.com", name: "John D.", cluster_id: "CL9823", risk_level: "critical", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "16 hours ago", status: "active" },
    ];
    const accountsBatch2 = [
      { id: "ACC013", email: "m.smith42@outlook.com", name: "M. Smith", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "12 min ago", status: "active" },
      { id: "ACC014", email: "msmith.new@outlook.com", name: "Mike S.", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "25 min ago", status: "active" },
      { id: "ACC015", email: "michael.s.43@outlook.com", name: "Michael S.", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "30 min ago", status: "active" },
      { id: "ACC016", email: "msmith44@outlook.com", name: "M Smith", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 1, last_activity: "45 min ago", status: "active" },
      { id: "ACC017", email: "m.smith.45@outlook.com", name: "Mike Smith", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "1 hour ago", status: "active" },
      { id: "ACC018", email: "mikes46@outlook.com", name: "Mike", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "1.5 hours ago", status: "active" },
      { id: "ACC019", email: "smith.m47@outlook.com", name: "Smith M.", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 0, last_activity: "2 hours ago", status: "active" },
      { id: "ACC020", email: "m.smith48@outlook.com", name: "M. S.", cluster_id: "CL9839", risk_level: "critical", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "3 hours ago", status: "active" },
      { id: "ACC021", email: "msmith49@outlook.com", name: "Michael", cluster_id: "CL9839", risk_level: "high", trial_count: 0, refund_count: 0, payment_count: 2, last_activity: "4 hours ago", status: "active" },
      { id: "ACC022", email: "mike.s50@outlook.com", name: "Mike S", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "5 hours ago", status: "active" },
      { id: "ACC023", email: "msmith51@outlook.com", name: "M Smith", cluster_id: "CL9839", risk_level: "high", trial_count: 0, refund_count: 1, payment_count: 1, last_activity: "6 hours ago", status: "suspended" },
      { id: "ACC024", email: "m.smith52@outlook.com", name: "M. Smith", cluster_id: "CL9839", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "8 hours ago", status: "active" },
    ];
    const accountsBatch3 = [
      { id: "ACC025", email: "alex.refunder@yahoo.com", name: "Alex R.", cluster_id: "CL9833", risk_level: "high", trial_count: 1, refund_count: 3, payment_count: 4, last_activity: "12 min ago", status: "active" },
      { id: "ACC026", email: "a.refunder2@yahoo.com", name: "A. Robinson", cluster_id: "CL9833", risk_level: "high", trial_count: 1, refund_count: 2, payment_count: 3, last_activity: "1 hour ago", status: "suspended" },
      { id: "ACC027", email: "alexr.new@yahoo.com", name: "Alex Robinson", cluster_id: "CL9833", risk_level: "high", trial_count: 1, refund_count: 2, payment_count: 3, last_activity: "3 hours ago", status: "active" },
      { id: "ACC028", email: "a.rob@yahoo.com", name: "A. Rob", cluster_id: "CL9833", risk_level: "high", trial_count: 0, refund_count: 1, payment_count: 3, last_activity: "5 hours ago", status: "active" },
      { id: "ACC029", email: "arobinson5@yahoo.com", name: "A Robinson", cluster_id: "CL9833", risk_level: "high", trial_count: 0, refund_count: 1, payment_count: 2, last_activity: "8 hours ago", status: "active" },
      { id: "ACC030", email: "refunder.x1@proton.me", name: "Refunder X", cluster_id: "CL9820", risk_level: "high", trial_count: 1, refund_count: 2, payment_count: 3, last_activity: "12 min ago", status: "active" },
      { id: "ACC031", email: "ref.x2@proton.me", name: "Ref X.", cluster_id: "CL9820", risk_level: "high", trial_count: 1, refund_count: 2, payment_count: 3, last_activity: "2 hours ago", status: "active" },
      { id: "ACC032", email: "refunderx3@proton.me", name: "R. X.", cluster_id: "CL9820", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 3, last_activity: "4 hours ago", status: "suspended" },
      { id: "ACC033", email: "r.x4@proton.me", name: "R X", cluster_id: "CL9820", risk_level: "high", trial_count: 1, refund_count: 2, payment_count: 2, last_activity: "6 hours ago", status: "active" },
      { id: "ACC034", email: "emily.test@tempmail.com", name: "Emily T.", cluster_id: "CL7953", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "2 hours ago", status: "active" },
      { id: "ACC035", email: "e.testing@tempmail.com", name: "E. Testing", cluster_id: "CL7953", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "3 hours ago", status: "active" },
      { id: "ACC036", email: "emily.promo@tempmail.com", name: "Emily P.", cluster_id: "CL7953", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "4 hours ago", status: "active" },
      { id: "ACC037", email: "e.deals@tempmail.com", name: "E Deals", cluster_id: "CL7953", risk_level: "medium", trial_count: 1, refund_count: 1, payment_count: 1, last_activity: "5 hours ago", status: "active" },
      { id: "ACC038", email: "em.test2@tempmail.com", name: "Em T.", cluster_id: "CL7953", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "6 hours ago", status: "active" },
      { id: "ACC039", email: "emily.new@tempmail.com", name: "Emily N.", cluster_id: "CL7953", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "8 hours ago", status: "active" },
    ];
    const accountsBatch4 = [
      { id: "ACC040", email: "r.garcia@email.com", name: "R. Garcia", cluster_id: "CL6102", risk_level: "medium", trial_count: 1, refund_count: 1, payment_count: 2, last_activity: "4 hours ago", status: "active" },
      { id: "ACC041", email: "garcia.r2@email.com", name: "Garcia R.", cluster_id: "CL6102", risk_level: "medium", trial_count: 0, refund_count: 0, payment_count: 2, last_activity: "6 hours ago", status: "active" },
      { id: "ACC042", email: "r.g.family@email.com", name: "R.G.", cluster_id: "CL6102", risk_level: "medium", trial_count: 1, refund_count: 1, payment_count: 1, last_activity: "8 hours ago", status: "active" },
      { id: "ACC043", email: "rg.home@email.com", name: "R Garcia", cluster_id: "CL6102", risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "12 hours ago", status: "active" },
      { id: "ACC044", email: "user1@protonmail.com", name: "User 1", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "45 min ago", status: "active" },
      { id: "ACC045", email: "user2@protonmail.com", name: "User 2", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "50 min ago", status: "active" },
      { id: "ACC046", email: "user3@protonmail.com", name: "User 3", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "55 min ago", status: "active" },
      { id: "ACC047", email: "user4@protonmail.com", name: "User 4", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "1 hour ago", status: "active" },
      { id: "ACC048", email: "user5@protonmail.com", name: "User 5", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "1.5 hours ago", status: "active" },
      { id: "ACC049", email: "user6@protonmail.com", name: "User 6", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "1.5 hours ago", status: "active" },
      { id: "ACC050", email: "user7@protonmail.com", name: "User 7", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "2 hours ago", status: "active" },
      { id: "ACC051", email: "user8@protonmail.com", name: "User 8", cluster_id: "CL5501", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "2 hours ago", status: "active" },
      { id: "ACC052", email: "jane.doe@gmail.com", name: "Jane Doe", cluster_id: "CL4200", risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "1 day ago", status: "active" },
      { id: "ACC053", email: "bob.doe@gmail.com", name: "Bob Doe", cluster_id: "CL4200", risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "1 day ago", status: "active" },
      { id: "ACC054", email: "promo.hunter1@mailinator.com", name: "Promo H.", cluster_id: "CL8801", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "3 hours ago", status: "active" },
      { id: "ACC055", email: "deal.seeker2@mailinator.com", name: "Deal S.", cluster_id: "CL8801", risk_level: "high", trial_count: 1, refund_count: 1, payment_count: 1, last_activity: "4 hours ago", status: "active" },
      { id: "ACC056", email: "coupon.fan3@mailinator.com", name: "Coupon F.", cluster_id: "CL8801", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "5 hours ago", status: "active" },
      { id: "ACC057", email: "save.more4@mailinator.com", name: "Save M.", cluster_id: "CL8801", risk_level: "high", trial_count: 0, refund_count: 1, payment_count: 1, last_activity: "6 hours ago", status: "active" },
      { id: "ACC058", email: "promo.abuse5@mailinator.com", name: "P. Abuse", cluster_id: "CL8801", risk_level: "high", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "7 hours ago", status: "active" },
      { id: "ACC059", email: "deal.hunter6@mailinator.com", name: "Deal H.", cluster_id: "CL8801", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "8 hours ago", status: "active" },
      { id: "ACC060", email: "coupon.stack7@mailinator.com", name: "C. Stack", cluster_id: "CL8801", risk_level: "medium", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "10 hours ago", status: "active" },
    ];
    const accountsBatch5 = [
      { id: "ACC061", email: "shared.card1@fastmail.com", name: "Shared C.", cluster_id: "CL3310", risk_level: "medium", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "6 hours ago", status: "active" },
      { id: "ACC062", email: "card.share2@fastmail.com", name: "Card S.", cluster_id: "CL3310", risk_level: "medium", trial_count: 0, refund_count: 1, payment_count: 1, last_activity: "8 hours ago", status: "active" },
      { id: "ACC063", email: "family.pay3@fastmail.com", name: "Family P.", cluster_id: "CL3310", risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "12 hours ago", status: "active" },
      // Standalone accounts
      { id: "ACC064", email: "legit.user1@gmail.com", name: "Sarah M.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 3, last_activity: "1 day ago", status: "active" },
      { id: "ACC065", email: "normal.user2@gmail.com", name: "Tom B.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 5, last_activity: "2 days ago", status: "active" },
      { id: "ACC066", email: "regular.sub3@outlook.com", name: "Lisa K.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 2, last_activity: "3 days ago", status: "active" },
      { id: "ACC067", email: "happy.customer@gmail.com", name: "Mark J.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 8, last_activity: "1 day ago", status: "active" },
      { id: "ACC068", email: "premium.user@yahoo.com", name: "Anna L.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 12, last_activity: "6 hours ago", status: "active" },
      { id: "ACC069", email: "loyal.sub@gmail.com", name: "Chris P.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 1, payment_count: 6, last_activity: "2 days ago", status: "active" },
      { id: "ACC070", email: "monthly.user@outlook.com", name: "Dan W.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 4, last_activity: "1 day ago", status: "active" },
      { id: "ACC071", email: "annual.sub@gmail.com", name: "Nina R.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "5 days ago", status: "active" },
      { id: "ACC072", email: "user.test@hotmail.com", name: "Test U.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 2, last_activity: "3 days ago", status: "active" },
      { id: "ACC073", email: "real.person@gmail.com", name: "Real P.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 7, last_activity: "1 day ago", status: "active" },
      { id: "ACC074", email: "business.acct@company.com", name: "Biz Acct", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 15, last_activity: "4 hours ago", status: "active" },
      { id: "ACC075", email: "subscriber1@gmail.com", name: "Sub One", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 3, last_activity: "2 days ago", status: "active" },
      { id: "ACC076", email: "subscriber2@gmail.com", name: "Sub Two", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 4, last_activity: "3 days ago", status: "active" },
      { id: "ACC077", email: "new.signup@outlook.com", name: "New S.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 0, last_activity: "1 hour ago", status: "active" },
      { id: "ACC078", email: "trial.user@gmail.com", name: "Trial U.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "2 days ago", status: "active" },
      { id: "ACC079", email: "paid.user@yahoo.com", name: "Paid U.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 6, last_activity: "1 day ago", status: "active" },
      { id: "ACC080", email: "longterm@gmail.com", name: "Long T.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 24, last_activity: "12 hours ago", status: "active" },
      { id: "ACC081", email: "enterprise1@corp.com", name: "Enterprise", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 1, last_activity: "1 day ago", status: "active" },
      { id: "ACC082", email: "dev.test@gmail.com", name: "Dev Test", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "4 days ago", status: "active" },
      { id: "ACC083", email: "student.disc@edu.com", name: "Student D.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 1, last_activity: "2 days ago", status: "active" },
      { id: "ACC084", email: "family.plan@gmail.com", name: "Family P.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 3, last_activity: "1 day ago", status: "active" },
      { id: "ACC085", email: "team.lead@company.com", name: "Team L.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 8, last_activity: "6 hours ago", status: "active" },
      { id: "ACC086", email: "startup.founder@gmail.com", name: "Startup F.", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 2, last_activity: "3 days ago", status: "active" },
      { id: "ACC087", email: "designer.pro@outlook.com", name: "Designer P.", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 5, last_activity: "1 day ago", status: "active" },
      { id: "ACC088", email: "marketer@gmail.com", name: "Marketer", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 1, payment_count: 4, last_activity: "2 days ago", status: "active" },
      { id: "ACC089", email: "freelancer@yahoo.com", name: "Freelancer", cluster_id: null, risk_level: "low", trial_count: 1, refund_count: 0, payment_count: 3, last_activity: "5 days ago", status: "active" },
      { id: "ACC090", email: "consultant@gmail.com", name: "Consultant", cluster_id: null, risk_level: "low", trial_count: 0, refund_count: 0, payment_count: 6, last_activity: "1 day ago", status: "active" },
    ];

    await supabase.from("accounts").insert(accountsBatch1);
    await supabase.from("accounts").insert(accountsBatch2);
    await supabase.from("accounts").insert(accountsBatch3);
    await supabase.from("accounts").insert(accountsBatch4);
    await supabase.from("accounts").insert(accountsBatch5);

    // DEVICES
    const devices = [
      { id: "DEV001", fingerprint: "fp_a1b2c3d4e5", type: "Desktop", os: "Windows 11", browser: "Chrome 122", account_count: 7, risk_level: "high", last_seen: "12 min ago" },
      { id: "DEV002", fingerprint: "fp_f6g7h8i9j0", type: "Mobile", os: "iOS 17.3", browser: "Safari", account_count: 5, risk_level: "high", last_seen: "1 hour ago" },
      { id: "DEV003", fingerprint: "fp_k1l2m3n4o5", type: "Desktop", os: "macOS 14", browser: "Firefox 123", account_count: 8, risk_level: "high", last_seen: "12 min ago" },
      { id: "DEV004", fingerprint: "fp_p1q2r3s4t5", type: "Desktop", os: "Windows 10", browser: "Chrome 121", account_count: 4, risk_level: "high", last_seen: "25 min ago" },
      { id: "DEV005", fingerprint: "fp_u1v2w3x4y5", type: "Desktop", os: "Windows 10", browser: "Chrome 121", account_count: 5, risk_level: "high", last_seen: "12 min ago" },
      { id: "DEV006", fingerprint: "fp_z1a2b3c4d5", type: "Mobile", os: "Android 14", browser: "Chrome 122", account_count: 2, risk_level: "high", last_seen: "12 min ago" },
      { id: "DEV007", fingerprint: "fp_e1f2g3h4i5", type: "Desktop", os: "macOS 13", browser: "Safari 17", account_count: 2, risk_level: "high", last_seen: "2 hours ago" },
      { id: "DEV008", fingerprint: "fp_d1e2f3g4h5", type: "Mobile", os: "Android 14", browser: "Chrome", account_count: 3, risk_level: "medium", last_seen: "2 hours ago" },
      { id: "DEV009", fingerprint: "fp_j1k2l3m4n5", type: "Desktop", os: "Windows 11", browser: "Edge 122", account_count: 2, risk_level: "medium", last_seen: "3 hours ago" },
      { id: "DEV010", fingerprint: "fp_o1p2q3r4s5", type: "Mobile", os: "iOS 17.2", browser: "Safari", account_count: 1, risk_level: "medium", last_seen: "4 hours ago" },
      { id: "DEV011", fingerprint: "fp_t1u2v3w4x5", type: "Desktop", os: "macOS 14", browser: "Chrome 122", account_count: 2, risk_level: "medium", last_seen: "4 hours ago" },
      { id: "DEV012", fingerprint: "fp_y1z2a3b4c5", type: "Mobile", os: "Android 13", browser: "Firefox", account_count: 2, risk_level: "medium", last_seen: "5 hours ago" },
      { id: "DEV013", fingerprint: "fp_v1w2x3y4z5", type: "Desktop", os: "Linux", browser: "Headless Chrome", account_count: 8, risk_level: "high", last_seen: "45 min ago" },
      { id: "DEV014", fingerprint: "fp_a5b4c3d2e1", type: "Desktop", os: "Windows 11", browser: "Edge", account_count: 2, risk_level: "low", last_seen: "1 day ago" },
      { id: "DEV015", fingerprint: "fp_h1i2j3k4l5", type: "Desktop", os: "macOS 14", browser: "Chrome 123", account_count: 3, risk_level: "high", last_seen: "3 hours ago" },
      { id: "DEV016", fingerprint: "fp_m1n2o3p4q5", type: "Mobile", os: "iOS 17.4", browser: "Safari", account_count: 4, risk_level: "high", last_seen: "4 hours ago" },
      { id: "DEV017", fingerprint: "fp_r1s2t3u4v5", type: "Desktop", os: "Windows 11", browser: "Chrome 122", account_count: 2, risk_level: "medium", last_seen: "6 hours ago" },
    ];
    await supabase.from("devices").insert(devices);

    // PAYMENT METHODS
    const pms = [
      { id: "PM001", type: "credit", last4: "4242", brand: "Visa", account_count: 7, risk_level: "high", total_transactions: 14, total_refunds: 5 },
      { id: "PM002", type: "credit", last4: "8811", brand: "Visa", account_count: 3, risk_level: "high", total_transactions: 6, total_refunds: 2 },
      { id: "PM003", type: "debit", last4: "3301", brand: "Mastercard", account_count: 2, risk_level: "medium", total_transactions: 4, total_refunds: 1 },
      { id: "PM004", type: "credit", last4: "9912", brand: "Visa", account_count: 6, risk_level: "high", total_transactions: 8, total_refunds: 2 },
      { id: "PM005", type: "credit", last4: "9913", brand: "Visa", account_count: 6, risk_level: "high", total_transactions: 4, total_refunds: 1 },
      { id: "PM006", type: "credit", last4: "2200", brand: "Amex", account_count: 2, risk_level: "high", total_transactions: 6, total_refunds: 4 },
      { id: "PM007", type: "debit", last4: "3302", brand: "Mastercard", account_count: 2, risk_level: "high", total_transactions: 5, total_refunds: 3 },
      { id: "PM008", type: "credit", last4: "5501", brand: "Visa", account_count: 1, risk_level: "medium", total_transactions: 4, total_refunds: 2 },
      { id: "PM009", type: "credit", last4: "5500", brand: "Mastercard", account_count: 4, risk_level: "high", total_transactions: 11, total_refunds: 7 },
      { id: "PM010", type: "debit", last4: "8899", brand: "Visa", account_count: 2, risk_level: "medium", total_transactions: 3, total_refunds: 0 },
      { id: "PM011", type: "credit", last4: "8900", brand: "Visa", account_count: 2, risk_level: "medium", total_transactions: 3, total_refunds: 0 },
      { id: "PM014", type: "prepaid", last4: "7788", brand: "Visa", account_count: 4, risk_level: "medium", total_transactions: 6, total_refunds: 2 },
      { id: "PM015", type: "credit", last4: "4243", brand: "Visa", account_count: 2, risk_level: "high", total_transactions: 1, total_refunds: 0 },
      { id: "PM016", type: "credit", last4: "4244", brand: "Visa", account_count: 2, risk_level: "high", total_transactions: 1, total_refunds: 0 },
      { id: "PM017", type: "credit", last4: "4245", brand: "Visa", account_count: 2, risk_level: "high", total_transactions: 0, total_refunds: 0 },
      { id: "PM020", type: "credit", last4: "1234", brand: "Visa", account_count: 1, risk_level: "low", total_transactions: 3, total_refunds: 0 },
      { id: "PM021", type: "credit", last4: "5678", brand: "Mastercard", account_count: 1, risk_level: "low", total_transactions: 2, total_refunds: 0 },
      { id: "PM022", type: "credit", last4: "6677", brand: "Visa", account_count: 3, risk_level: "high", total_transactions: 5, total_refunds: 1 },
      { id: "PM031", type: "credit", last4: "8888", brand: "Visa", account_count: 2, risk_level: "medium", total_transactions: 4, total_refunds: 0 },
    ];
    await supabase.from("payment_methods").insert(pms);

    // IP ADDRESSES
    const ips = [
      { id: "IP001", address: "192.168.1.x", location: "San Francisco, CA", account_count: 7, risk_level: "high", is_vpn: false, last_seen: "12 min ago" },
      { id: "IP002", address: "192.168.2.x", location: "San Francisco, CA", account_count: 5, risk_level: "high", is_vpn: false, last_seen: "1 hour ago" },
      { id: "IP003", address: "10.0.42.x", location: "New York, NY", account_count: 8, risk_level: "high", is_vpn: true, last_seen: "12 min ago" },
      { id: "IP004", address: "172.16.8.x", location: "Chicago, IL", account_count: 3, risk_level: "high", is_vpn: false, last_seen: "12 min ago" },
      { id: "IP005", address: "172.16.9.x", location: "Chicago, IL", account_count: 2, risk_level: "medium", is_vpn: false, last_seen: "3 hours ago" },
      { id: "IP006", address: "10.0.55.x", location: "Denver, CO", account_count: 4, risk_level: "high", is_vpn: true, last_seen: "12 min ago" },
      { id: "IP007", address: "203.0.113.x", location: "Los Angeles, CA", account_count: 4, risk_level: "medium", is_vpn: true, last_seen: "2 hours ago" },
      { id: "IP008", address: "203.0.114.x", location: "Los Angeles, CA", account_count: 2, risk_level: "medium", is_vpn: false, last_seen: "4 hours ago" },
      { id: "IP009", address: "198.51.100.x", location: "Austin, TX", account_count: 2, risk_level: "medium", is_vpn: false, last_seen: "4 hours ago" },
      { id: "IP010", address: "198.51.101.x", location: "Austin, TX", account_count: 1, risk_level: "low", is_vpn: false, last_seen: "6 hours ago" },
      { id: "IP012", address: "100.64.0.x", location: "Miami, FL", account_count: 8, risk_level: "high", is_vpn: true, last_seen: "45 min ago" },
      { id: "IP013", address: "192.0.2.x", location: "Seattle, WA", account_count: 2, risk_level: "low", is_vpn: false, last_seen: "1 day ago" },
      { id: "IP014", address: "203.0.115.x", location: "Portland, OR", account_count: 3, risk_level: "high", is_vpn: true, last_seen: "3 hours ago" },
      { id: "IP015", address: "198.51.103.x", location: "Boston, MA", account_count: 4, risk_level: "high", is_vpn: false, last_seen: "4 hours ago" },
      { id: "IP016", address: "10.0.60.x", location: "Atlanta, GA", account_count: 2, risk_level: "medium", is_vpn: true, last_seen: "6 hours ago" },
    ];
    await supabase.from("ip_addresses").insert(ips);

    // LINK EDGES
    const edges = [
      { id: "ge1", source_id: "ACC001", target_id: "DEV001", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9823" },
      { id: "ge2", source_id: "ACC002", target_id: "DEV001", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9823" },
      { id: "ge3", source_id: "ACC003", target_id: "DEV002", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9823" },
      { id: "ge4", source_id: "ACC004", target_id: "DEV001", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9823" },
      { id: "ge5", source_id: "ACC001", target_id: "PM001", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9823" },
      { id: "ge6", source_id: "ACC002", target_id: "PM001", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9823" },
      { id: "ge7", source_id: "ACC003", target_id: "PM001", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9823" },
      { id: "ge8", source_id: "ACC001", target_id: "IP001", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL9823" },
      { id: "ge9", source_id: "ACC002", target_id: "IP001", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL9823" },
      { id: "ge10", source_id: "ACC001", target_id: "ACC002", edge_type: "timing_overlap", label: "Timing Overlap", cluster_id: "CL9823" },
      { id: "ge11", source_id: "ACC002", target_id: "ACC003", edge_type: "refund_pattern", label: "Refund Pattern", cluster_id: "CL9823" },
      { id: "ge15", source_id: "ACC013", target_id: "DEV003", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9839" },
      { id: "ge16", source_id: "ACC014", target_id: "DEV003", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9839" },
      { id: "ge17", source_id: "ACC015", target_id: "DEV003", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9839" },
      { id: "ge18", source_id: "ACC013", target_id: "PM004", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9839" },
      { id: "ge19", source_id: "ACC013", target_id: "IP003", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL9839" },
      { id: "ge20", source_id: "ACC013", target_id: "ACC014", edge_type: "timing_overlap", label: "Timing Overlap", cluster_id: "CL9839" },
      { id: "ge24", source_id: "ACC025", target_id: "DEV005", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9833" },
      { id: "ge25", source_id: "ACC026", target_id: "DEV005", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9833" },
      { id: "ge26", source_id: "ACC025", target_id: "PM006", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9833" },
      { id: "ge27", source_id: "ACC025", target_id: "IP004", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL9833" },
      { id: "ge28", source_id: "ACC025", target_id: "ACC026", edge_type: "refund_pattern", label: "Refund Pattern", cluster_id: "CL9833" },
      { id: "ge33", source_id: "ACC030", target_id: "DEV006", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9820" },
      { id: "ge34", source_id: "ACC031", target_id: "DEV006", edge_type: "shared_device", label: "Same Device", cluster_id: "CL9820" },
      { id: "ge35", source_id: "ACC030", target_id: "PM009", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9820" },
      { id: "ge36", source_id: "ACC031", target_id: "PM009", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL9820" },
      { id: "ge37", source_id: "ACC030", target_id: "IP006", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL9820" },
      { id: "ge38", source_id: "ACC030", target_id: "ACC031", edge_type: "refund_pattern", label: "Refund Pattern", cluster_id: "CL9820" },
      { id: "ge42", source_id: "ACC034", target_id: "DEV008", edge_type: "shared_device", label: "Same Device", cluster_id: "CL7953" },
      { id: "ge43", source_id: "ACC035", target_id: "DEV008", edge_type: "shared_device", label: "Same Device", cluster_id: "CL7953" },
      { id: "ge44", source_id: "ACC034", target_id: "PM010", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL7953" },
      { id: "ge45", source_id: "ACC034", target_id: "IP007", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL7953" },
      { id: "ge51", source_id: "ACC040", target_id: "DEV011", edge_type: "shared_device", label: "Same Device", cluster_id: "CL6102" },
      { id: "ge52", source_id: "ACC041", target_id: "DEV011", edge_type: "shared_device", label: "Same Device", cluster_id: "CL6102" },
      { id: "ge53", source_id: "ACC040", target_id: "PM014", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL6102" },
      { id: "ge54", source_id: "ACC041", target_id: "PM014", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL6102" },
      { id: "ge55", source_id: "ACC040", target_id: "IP009", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL6102" },
      { id: "ge59", source_id: "ACC044", target_id: "DEV013", edge_type: "shared_device", label: "Same Device", cluster_id: "CL5501" },
      { id: "ge60", source_id: "ACC045", target_id: "DEV013", edge_type: "shared_device", label: "Same Device", cluster_id: "CL5501" },
      { id: "ge61", source_id: "ACC046", target_id: "DEV013", edge_type: "shared_device", label: "Same Device", cluster_id: "CL5501" },
      { id: "ge62", source_id: "ACC047", target_id: "DEV013", edge_type: "shared_device", label: "Same Device", cluster_id: "CL5501" },
      { id: "ge63", source_id: "ACC048", target_id: "DEV013", edge_type: "shared_device", label: "Same Device", cluster_id: "CL5501" },
      { id: "ge64", source_id: "ACC044", target_id: "PM015", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL5501" },
      { id: "ge65", source_id: "ACC044", target_id: "IP012", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL5501" },
      { id: "ge66", source_id: "ACC044", target_id: "ACC045", edge_type: "timing_overlap", label: "Timing Overlap", cluster_id: "CL5501" },
      { id: "ge74", source_id: "ACC052", target_id: "DEV014", edge_type: "shared_device", label: "Same Device", cluster_id: "CL4200" },
      { id: "ge75", source_id: "ACC053", target_id: "DEV014", edge_type: "shared_device", label: "Same Device", cluster_id: "CL4200" },
      { id: "ge76", source_id: "ACC052", target_id: "PM020", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL4200" },
      { id: "ge77", source_id: "ACC052", target_id: "IP013", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL4200" },
      { id: "ge80", source_id: "ACC054", target_id: "DEV015", edge_type: "shared_device", label: "Same Device", cluster_id: "CL8801" },
      { id: "ge81", source_id: "ACC055", target_id: "DEV015", edge_type: "shared_device", label: "Same Device", cluster_id: "CL8801" },
      { id: "ge82", source_id: "ACC054", target_id: "PM022", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL8801" },
      { id: "ge83", source_id: "ACC054", target_id: "IP014", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL8801" },
      { id: "ge88", source_id: "ACC061", target_id: "DEV017", edge_type: "shared_device", label: "Same Device", cluster_id: "CL3310" },
      { id: "ge89", source_id: "ACC062", target_id: "DEV017", edge_type: "shared_device", label: "Same Device", cluster_id: "CL3310" },
      { id: "ge90", source_id: "ACC061", target_id: "PM031", edge_type: "shared_card", label: "Shared Card", cluster_id: "CL3310" },
      { id: "ge91", source_id: "ACC061", target_id: "IP016", edge_type: "shared_ip", label: "Same IP", cluster_id: "CL3310" },
    ];
    await supabase.from("link_edges").insert(edges);

    // EVENTS
    const events = [
      { id: "ev01", cluster_id: "CL9823", account_id: "ACC012", event_type: "trial_signup", description: "Trial signup — john.d+12@gmail.com", risk_level: "high" },
      { id: "ev02", cluster_id: "CL9823", account_id: "ACC001", event_type: "payment_declined", description: "Payment declined — Visa •••• 4242", risk_level: "medium", amount: 9.99 },
      { id: "ev03", cluster_id: "CL9823", account_id: "ACC002", event_type: "refund", description: "Refund requested — $9.99", risk_level: "high", amount: 9.99 },
      { id: "ev04", cluster_id: "CL9823", account_id: "ACC006", event_type: "trial_signup", description: "Trial signup — john.d+6@gmail.com", risk_level: "high" },
      { id: "ev05", cluster_id: "CL9823", account_id: "ACC007", event_type: "payment", description: "Payment $9.99 — Visa •••• 4242", amount: 9.99 },
      { id: "ev11", cluster_id: "CL9839", account_id: "ACC013", event_type: "trial_signup", description: "Trial signup — m.smith42@outlook.com", risk_level: "high" },
      { id: "ev12", cluster_id: "CL9839", account_id: "ACC014", event_type: "trial_signup", description: "Trial signup — msmith.new@outlook.com", risk_level: "high" },
      { id: "ev13", cluster_id: "CL9839", account_id: "ACC016", event_type: "dispute", description: "Dispute filed — $14.99", risk_level: "high", amount: 14.99 },
      { id: "ev17", cluster_id: "CL9833", account_id: "ACC025", event_type: "refund", description: "Refund requested — $14.99", risk_level: "high", amount: 14.99 },
      { id: "ev18", cluster_id: "CL9833", account_id: "ACC026", event_type: "dispute", description: "Dispute opened — $14.99", risk_level: "high", amount: 14.99 },
      { id: "ev19", cluster_id: "CL9833", account_id: "ACC027", event_type: "payment", description: "Payment $14.99 — Amex •••• 2200", amount: 14.99 },
      { id: "ev23", cluster_id: "CL9820", account_id: "ACC030", event_type: "refund", description: "Refund requested — $9.99", risk_level: "high", amount: 9.99 },
      { id: "ev24", cluster_id: "CL9820", account_id: "ACC031", event_type: "payment", description: "Payment $9.99 — MC •••• 5500", amount: 9.99 },
      { id: "ev27", cluster_id: "CL7953", account_id: "ACC034", event_type: "promo_used", description: "Promo SAVE50 applied — emily.test@tempmail.com", risk_level: "medium" },
      { id: "ev28", cluster_id: "CL7953", account_id: "ACC035", event_type: "promo_used", description: "Promo SAVE50 applied — e.testing@tempmail.com", risk_level: "medium" },
      { id: "ev31", cluster_id: "CL6102", account_id: "ACC040", event_type: "payment", description: "Payment $14.99 — Visa •••• 7788", amount: 14.99 },
      { id: "ev32", cluster_id: "CL6102", account_id: "ACC041", event_type: "account_created", description: "New account — garcia.r2@email.com" },
      { id: "ev34", cluster_id: "CL5501", account_id: "ACC051", event_type: "trial_signup", description: "Trial — user8@protonmail.com", risk_level: "high" },
      { id: "ev35", cluster_id: "CL5501", account_id: "ACC050", event_type: "trial_signup", description: "Trial — user7@protonmail.com", risk_level: "high" },
      { id: "ev36", cluster_id: "CL5501", account_id: "ACC049", event_type: "trial_signup", description: "Trial — user6@protonmail.com", risk_level: "high" },
      { id: "ev40", cluster_id: "CL4200", account_id: "ACC052", event_type: "payment", description: "Payment $9.99 — Visa •••• 1234", amount: 9.99 },
      { id: "ev42", cluster_id: "CL8801", account_id: "ACC054", event_type: "promo_used", description: "Promo WELCOME20 applied", risk_level: "medium" },
      { id: "ev43", cluster_id: "CL8801", account_id: "ACC055", event_type: "promo_used", description: "Promo SAVE50 applied", risk_level: "medium" },
      { id: "ev44", cluster_id: "CL8801", account_id: "ACC056", event_type: "promo_used", description: "Promo WELCOME20 + SAVE50 stacked", risk_level: "high" },
      { id: "ev46", cluster_id: "CL3310", account_id: "ACC061", event_type: "payment", description: "Payment $14.99 — Visa •••• 8888", amount: 14.99 },
      { id: "ev47", cluster_id: "CL3310", account_id: "ACC062", event_type: "refund", description: "Refund requested — $14.99", risk_level: "medium", amount: 14.99 },
    ];
    await supabase.from("events").insert(events);

    // RULE TRIGGERS
    const triggers = [
      { cluster_id: "CL9823", description: "Same device used across 12 accounts", severity: "critical" },
      { cluster_id: "CL9823", description: "Frequent refunds within 7 days of signup", severity: "high" },
      { cluster_id: "CL9823", description: "Email pattern manipulation detected", severity: "high" },
      { cluster_id: "CL9823", description: "Payment method shared across 7+ accounts", severity: "critical" },
      { cluster_id: "CL9823", description: "Trial-to-cancel ratio: 87.5%", severity: "high" },
      { cluster_id: "CL9839", description: "Rapid account creation pattern", severity: "critical" },
      { cluster_id: "CL9839", description: "Same BIN range across payment methods", severity: "high" },
      { cluster_id: "CL9839", description: "Device fingerprint match on 12 accounts", severity: "critical" },
      { cluster_id: "CL9839", description: "Trial conversion rate: 0%", severity: "high" },
      { cluster_id: "CL9833", description: "Refund-to-payment ratio: 60%", severity: "high" },
      { cluster_id: "CL9833", description: "3 disputes filed after denied refunds", severity: "critical" },
      { cluster_id: "CL9833", description: "Same device across all accounts", severity: "high" },
      { cluster_id: "CL9820", description: "Identical refund timing across accounts", severity: "high" },
      { cluster_id: "CL9820", description: "Single payment method for 4 accounts", severity: "high" },
      { cluster_id: "CL9820", description: "Dispute escalation pattern", severity: "high" },
      { cluster_id: "CL7953", description: "Same promo code used 6 times across linked accounts", severity: "high" },
      { cluster_id: "CL7953", description: "Email domain: all use disposable email services", severity: "medium" },
      { cluster_id: "CL6102", description: "Single prepaid card across 4 accounts", severity: "medium" },
      { cluster_id: "CL6102", description: "Prepaid card type raises baseline risk", severity: "medium" },
      { cluster_id: "CL5501", description: "8 signups from 1 device in 2 hours", severity: "critical" },
      { cluster_id: "CL5501", description: "Virtual card numbers from same BIN", severity: "high" },
      { cluster_id: "CL5501", description: "Zero payment conversions", severity: "high" },
      { cluster_id: "CL5501", description: "Automated signup velocity detected", severity: "critical" },
      { cluster_id: "CL4200", description: "Shared device between 2 accounts", severity: "low" },
      { cluster_id: "CL8801", description: "Promo code stacking across linked accounts", severity: "high" },
      { cluster_id: "CL8801", description: "0% conversion to full-price subscription", severity: "high" },
      { cluster_id: "CL3310", description: "Overlapping registration windows", severity: "medium" },
      { cluster_id: "CL3310", description: "Shared payment methods across accounts", severity: "medium" },
    ];
    await supabase.from("rule_triggers").insert(triggers);

    return new Response(JSON.stringify({ message: "Seeded successfully" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
