// ============================================================
// TRUST GRAPH - SEEDED DEMO DATA AND TYPES
// All data is coherent and represents 5 abuse scenarios.
// Note: This file provides both types and seeded data for demo environments.
// ============================================================

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AbuseType = 'trial_abuse' | 'promo_abuse' | 'refund_cycling' | 'payment_reuse' | 'device_burst';
export type ReviewStatus = 'pending' | 'reviewing' | 'blocked' | 'approved' | 'escalated';
export type EntityType = 'account' | 'device' | 'payment_method' | 'ip' | 'email_domain';
export type EdgeType = 'shared_device' | 'shared_card' | 'shared_ip' | 'timing_overlap' | 'refund_pattern';

export interface Cluster {
  id: string;
  riskScore: number;
  riskLevel: RiskLevel;
  linkedAccounts: number;
  exposure: number;
  abuseType: AbuseType;
  topAbuseReason: string;
  recommendedAction: string;
  owner: string;
  status: ReviewStatus;
  lastActivity: string;
  accounts: string[];
  devices: string[];
  paymentMethods: string[];
  ips: string[];
  trialSignups: number;
  refunds: number;
  paymentAttempts: number;
  disputes: number;
  aiSummary: string;
  riskTriggers: string[];
  timeline: TimelineEvent[];
}

export interface Account {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  riskLevel: RiskLevel;
  clusterId: string;
  trialCount: number;
  refundCount: number;
  paymentCount: number;
  lastActivity: string;
  status: 'active' | 'suspended' | 'blocked';
}

export interface Device {
  id: string;
  fingerprint: string;
  type: string;
  os: string;
  browser: string;
  accountCount: number;
  riskLevel: RiskLevel;
  lastSeen: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  accountCount: number;
  riskLevel: RiskLevel;
  totalTransactions: number;
  totalRefunds: number;
}

export interface IPRecord {
  id: string;
  address: string;
  location: string;
  accountCount: number;
  riskLevel: RiskLevel;
  isVPN: boolean;
  lastSeen: string;
}

export interface TimelineEvent {
  id: string;
  type: 'trial_signup' | 'payment' | 'refund' | 'payment_declined' | 'account_created' | 'dispute' | 'promo_used' | 'device_linked';
  description: string;
  timestamp: string;
  riskLevel?: RiskLevel;
}

export interface GraphNode {
  id: string;
  type: EntityType | 'cluster' | 'refund' | 'trial';
  label: string;
  riskLevel: RiskLevel;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
}

export interface PolicyConfig {
  riskThreshold: number;
  reviewCapacity: number;
  trialAbuseWeight: number;
  refundCyclingWeight: number;
  paymentReuseWeight: number;
  deviceBurstWeight: number;
  promoAbuseWeight: number;
}

// ============================================================
// ANALYSTS
// ============================================================
export const analysts = [
  { id: 'a1', name: 'Sarah Chen', avatar: 'SC', cases: 12, capacity: 20 },
  { id: 'a2', name: 'Marcus Johnson', avatar: 'MJ', cases: 18, capacity: 20 },
  { id: 'a3', name: 'Priya Patel', avatar: 'PP', cases: 8, capacity: 15 },
  { id: 'a4', name: 'Alex Rivera', avatar: 'AR', cases: 15, capacity: 20 },
];

// ============================================================
// CLUSTERS - 5 ABUSE SCENARIOS
// ============================================================
export const clusters: Cluster[] = [
  {
    id: 'CL9823',
    riskScore: 94,
    riskLevel: 'high',
    linkedAccounts: 12,
    exposure: 1200,
    abuseType: 'trial_abuse',
    topAbuseReason: 'Repeated Free Trials',
    recommendedAction: 'Block Trial',
    owner: 'Sarah Chen',
    status: 'pending',
    lastActivity: '12 min ago',
    accounts: ['ACC001', 'ACC002', 'ACC003', 'ACC004', 'ACC005', 'ACC006', 'ACC007', 'ACC008', 'ACC009', 'ACC010', 'ACC011', 'ACC012'],
    devices: ['DEV001', 'DEV002'],
    paymentMethods: ['PM001', 'PM002', 'PM003'],
    ips: ['IP001', 'IP002'],
    trialSignups: 8,
    refunds: 5,
    paymentAttempts: 14,
    disputes: 0,
    aiSummary: 'This cluster shows coordinated free trial abuse using shared payment methods and quick refunds. 12 accounts created within 3 weeks from 2 devices, all using variations of the same email pattern (john.d+[n]@gmail.com). 8 trial signups detected with 5 refund requests within the first 48 hours of each subscription. Payment method PM001 (Visa •••• 4242) is shared across 7 accounts.',
    riskTriggers: [
      'Same device used across 12 accounts',
      'Frequent refunds within 7 days of signup',
      'Email pattern manipulation detected',
      'Payment method shared across 7+ accounts',
      'Trial-to-cancel ratio: 87.5%'
    ],
    timeline: [
      { id: 'e1', type: 'trial_signup', description: 'Trial signup — john.d+12@gmail.com', timestamp: '7 min ago', riskLevel: 'high' },
      { id: 'e2', type: 'payment_declined', description: 'Payment declined — Visa •••• 4242', timestamp: '8 min ago', riskLevel: 'medium' },
      { id: 'e3', type: 'refund', description: 'Refund requested — $9.99', timestamp: '5 min ago', riskLevel: 'high' },
      { id: 'e4', type: 'payment_declined', description: 'Payment declined — Visa •••• 8811', timestamp: '7 min ago', riskLevel: 'medium' },
      { id: 'e5', type: 'payment_declined', description: 'Payment declined — Mastercard •••• 3301', timestamp: '7 min ago' },
      { id: 'e6', type: 'refund', description: 'Refund request — $9.99', timestamp: '1 hour ago', riskLevel: 'high' },
      { id: 'e7', type: 'trial_signup', description: 'Trial signup — johnd.plus11@gmail.com', timestamp: '2 hours ago' },
      { id: 'e8', type: 'account_created', description: 'New account created from Device DEV001', timestamp: '3 hours ago' },
    ],
  },
  {
    id: 'CL9839',
    riskScore: 91,
    riskLevel: 'high',
    linkedAccounts: 12,
    exposure: 1200,
    abuseType: 'trial_abuse',
    topAbuseReason: 'Repeated Free Trials',
    recommendedAction: 'Block Trials',
    owner: 'Marcus Johnson',
    status: 'pending',
    lastActivity: '12 min ago',
    accounts: ['ACC013', 'ACC014', 'ACC015', 'ACC016', 'ACC017', 'ACC018', 'ACC019', 'ACC020', 'ACC021', 'ACC022', 'ACC023', 'ACC024'],
    devices: ['DEV003', 'DEV004'],
    paymentMethods: ['PM004', 'PM005'],
    ips: ['IP003'],
    trialSignups: 10,
    refunds: 3,
    paymentAttempts: 12,
    disputes: 1,
    aiSummary: 'Cluster of 12 accounts using 2 devices to cycle through free trials. Accounts created in rapid succession with similar registration patterns. Virtual card numbers from the same issuer BIN range suggest programmatic card generation.',
    riskTriggers: [
      'Rapid account creation pattern',
      'Same BIN range across payment methods',
      'Device fingerprint match on 12 accounts',
      'Trial conversion rate: 0%'
    ],
    timeline: [
      { id: 'e9', type: 'trial_signup', description: 'Trial signup — m.smith42@outlook.com', timestamp: '12 min ago', riskLevel: 'high' },
      { id: 'e10', type: 'trial_signup', description: 'Trial signup — msmith.new@outlook.com', timestamp: '25 min ago', riskLevel: 'high' },
      { id: 'e11', type: 'payment_declined', description: 'Payment declined — Visa •••• 9912', timestamp: '30 min ago' },
      { id: 'e12', type: 'dispute', description: 'Dispute filed — $14.99', timestamp: '1 hour ago', riskLevel: 'high' },
    ],
  },
  {
    id: 'CL9833',
    riskScore: 88,
    riskLevel: 'high',
    linkedAccounts: 12,
    exposure: 1200,
    abuseType: 'refund_cycling',
    topAbuseReason: 'Refund Abuse',
    recommendedAction: 'Block Trial',
    owner: 'Priya Patel',
    status: 'pending',
    lastActivity: '12 min ago',
    accounts: ['ACC025', 'ACC026', 'ACC027', 'ACC028', 'ACC029'],
    devices: ['DEV005'],
    paymentMethods: ['PM006', 'PM007', 'PM008'],
    ips: ['IP004', 'IP005'],
    trialSignups: 3,
    refunds: 9,
    paymentAttempts: 15,
    disputes: 3,
    aiSummary: 'Refund cycling pattern: 5 linked accounts systematically request refunds within 48 hours of payment, then re-subscribe with a different payment method. Total of 9 refunds across $134.91 in the last 30 days. Escalating to dispute when refunds are denied.',
    riskTriggers: [
      'Refund-to-payment ratio: 60%',
      '3 disputes filed after denied refunds',
      'Same device across all accounts',
      'Payment method rotation pattern'
    ],
    timeline: [
      { id: 'e13', type: 'refund', description: 'Refund requested — $14.99', timestamp: '12 min ago', riskLevel: 'high' },
      { id: 'e14', type: 'dispute', description: 'Dispute opened — $14.99', timestamp: '1 hour ago', riskLevel: 'high' },
      { id: 'e15', type: 'payment', description: 'Payment $14.99 — Amex •••• 2200', timestamp: '2 days ago' },
      { id: 'e16', type: 'refund', description: 'Refund approved — $14.99', timestamp: '4 days ago' },
    ],
  },
  {
    id: 'CL9820',
    riskScore: 85,
    riskLevel: 'high',
    linkedAccounts: 12,
    exposure: 1200,
    abuseType: 'refund_cycling',
    topAbuseReason: 'Refund Abuse',
    recommendedAction: 'Block Trial',
    owner: 'Alex Rivera',
    status: 'pending',
    lastActivity: '12 min ago',
    accounts: ['ACC030', 'ACC031', 'ACC032', 'ACC033'],
    devices: ['DEV006', 'DEV007'],
    paymentMethods: ['PM009'],
    ips: ['IP006'],
    trialSignups: 4,
    refunds: 7,
    paymentAttempts: 11,
    disputes: 2,
    aiSummary: 'Four accounts linked by shared IP and payment method (Mastercard •••• 5500). Each account follows the same pattern: subscribe → use for 6 days → request refund on day 7. Two accounts escalated to disputes after initial refund denials.',
    riskTriggers: [
      'Identical refund timing across accounts',
      'Single payment method for 4 accounts',
      'Same IP address cluster',
      'Dispute escalation pattern'
    ],
    timeline: [
      { id: 'e17', type: 'refund', description: 'Refund requested — $9.99', timestamp: '12 min ago', riskLevel: 'high' },
      { id: 'e18', type: 'payment', description: 'Payment $9.99 — MC •••• 5500', timestamp: '7 days ago' },
    ],
  },
  {
    id: 'CL7953',
    riskScore: 72,
    riskLevel: 'medium',
    linkedAccounts: 6,
    exposure: 450,
    abuseType: 'promo_abuse',
    topAbuseReason: 'Multi-account Promo Abuse',
    recommendedAction: 'Restrict Promo',
    owner: 'Sarah Chen',
    status: 'reviewing',
    lastActivity: '2 hours ago',
    accounts: ['ACC034', 'ACC035', 'ACC036', 'ACC037', 'ACC038', 'ACC039'],
    devices: ['DEV008', 'DEV009', 'DEV010'],
    paymentMethods: ['PM010', 'PM011', 'PM012', 'PM013'],
    ips: ['IP007', 'IP008'],
    trialSignups: 6,
    refunds: 1,
    paymentAttempts: 8,
    disputes: 0,
    aiSummary: '6 accounts exploiting the "SAVE50" promotional code across different email addresses but linked by 3 shared devices. Each account redeems the same 50% discount offer. Total promo value abused: ~$450.',
    riskTriggers: [
      'Same promo code used 6 times across linked accounts',
      '3 devices shared between 6 accounts',
      'Account creation within 48-hour window',
      'Email domain pattern: all use disposable email services'
    ],
    timeline: [
      { id: 'e19', type: 'promo_used', description: 'Promo SAVE50 applied — emily.test@tempmail.com', timestamp: '2 hours ago', riskLevel: 'medium' },
      { id: 'e20', type: 'promo_used', description: 'Promo SAVE50 applied — e.testing@tempmail.com', timestamp: '3 hours ago', riskLevel: 'medium' },
      { id: 'e21', type: 'account_created', description: 'Account created from Device DEV008', timestamp: '4 hours ago' },
    ],
  },
  {
    id: 'CL6102',
    riskScore: 68,
    riskLevel: 'medium',
    linkedAccounts: 4,
    exposure: 320,
    abuseType: 'payment_reuse',
    topAbuseReason: 'Suspicious Card Sharing',
    recommendedAction: 'Require Verification',
    owner: 'Marcus Johnson',
    status: 'reviewing',
    lastActivity: '4 hours ago',
    accounts: ['ACC040', 'ACC041', 'ACC042', 'ACC043'],
    devices: ['DEV011', 'DEV012'],
    paymentMethods: ['PM014'],
    ips: ['IP009', 'IP010', 'IP011'],
    trialSignups: 2,
    refunds: 2,
    paymentAttempts: 6,
    disputes: 0,
    aiSummary: '4 accounts sharing a single prepaid Visa card (•••• 7788). Accounts registered from different IPs but within the same city. May be legitimate family sharing or coordinated abuse — recommend verification before blocking.',
    riskTriggers: [
      'Single prepaid card across 4 accounts',
      'Different IPs but same geographic area',
      'Prepaid card type raises baseline risk'
    ],
    timeline: [
      { id: 'e22', type: 'payment', description: 'Payment $14.99 — Visa •••• 7788', timestamp: '4 hours ago' },
      { id: 'e23', type: 'account_created', description: 'New account — r.garcia@email.com', timestamp: '1 day ago' },
    ],
  },
  {
    id: 'CL5501',
    riskScore: 82,
    riskLevel: 'high',
    linkedAccounts: 8,
    exposure: 880,
    abuseType: 'device_burst',
    topAbuseReason: 'Device Burst Signup',
    recommendedAction: 'Block Trial',
    owner: 'Priya Patel',
    status: 'pending',
    lastActivity: '45 min ago',
    accounts: ['ACC044', 'ACC045', 'ACC046', 'ACC047', 'ACC048', 'ACC049', 'ACC050', 'ACC051'],
    devices: ['DEV013'],
    paymentMethods: ['PM015', 'PM016', 'PM017', 'PM018', 'PM019'],
    ips: ['IP012'],
    trialSignups: 8,
    refunds: 0,
    paymentAttempts: 3,
    disputes: 0,
    aiSummary: '8 accounts created from a single device (DEV013) within a 2-hour window. All accounts initiated free trials with different virtual card numbers from the same BIN range (424242). This pattern is consistent with automated trial farming using generated card numbers.',
    riskTriggers: [
      '8 signups from 1 device in 2 hours',
      'Virtual card numbers from same BIN',
      'Zero payment conversions',
      'Automated signup velocity detected'
    ],
    timeline: [
      { id: 'e24', type: 'trial_signup', description: 'Trial — user8@protonmail.com', timestamp: '45 min ago', riskLevel: 'high' },
      { id: 'e25', type: 'trial_signup', description: 'Trial — user7@protonmail.com', timestamp: '50 min ago', riskLevel: 'high' },
      { id: 'e26', type: 'trial_signup', description: 'Trial — user6@protonmail.com', timestamp: '1 hour ago', riskLevel: 'high' },
      { id: 'e27', type: 'device_linked', description: 'Device DEV013 linked to 6th account', timestamp: '1.5 hours ago', riskLevel: 'medium' },
    ],
  },
  {
    id: 'CL4200',
    riskScore: 35,
    riskLevel: 'low',
    linkedAccounts: 2,
    exposure: 30,
    abuseType: 'trial_abuse',
    topAbuseReason: 'Possible Trial Reuse',
    recommendedAction: 'Monitor',
    owner: 'Alex Rivera',
    status: 'approved',
    lastActivity: '1 day ago',
    accounts: ['ACC052', 'ACC053'],
    devices: ['DEV014'],
    paymentMethods: ['PM020', 'PM021'],
    ips: ['IP013'],
    trialSignups: 2,
    refunds: 0,
    paymentAttempts: 2,
    disputes: 0,
    aiSummary: '2 accounts sharing a device — likely a household with two users. Both accounts converted to paid subscriptions. Low risk of abuse.',
    riskTriggers: ['Shared device between 2 accounts'],
    timeline: [
      { id: 'e28', type: 'payment', description: 'Payment $9.99 — Visa •••• 1234', timestamp: '1 day ago' },
      { id: 'e29', type: 'trial_signup', description: 'Trial converted to paid', timestamp: '8 days ago' },
    ],
  },
];

// ============================================================
// ACCOUNTS
// ============================================================
export const accounts: Account[] = [
  { id: 'ACC001', email: 'john.d+1@gmail.com', name: 'John D.', createdAt: '2026-03-05', riskLevel: 'high', clusterId: 'CL9823', trialCount: 1, refundCount: 1, paymentCount: 2, lastActivity: '12 min ago', status: 'active' },
  { id: 'ACC002', email: 'john.d+2@gmail.com', name: 'John D.', createdAt: '2026-03-06', riskLevel: 'high', clusterId: 'CL9823', trialCount: 1, refundCount: 1, paymentCount: 1, lastActivity: '1 hour ago', status: 'active' },
  { id: 'ACC003', email: 'johnd.plus3@gmail.com', name: 'J. Davidson', createdAt: '2026-03-07', riskLevel: 'high', clusterId: 'CL9823', trialCount: 1, refundCount: 0, paymentCount: 1, lastActivity: '2 hours ago', status: 'active' },
  { id: 'ACC013', email: 'm.smith42@outlook.com', name: 'M. Smith', createdAt: '2026-03-10', riskLevel: 'high', clusterId: 'CL9839', trialCount: 1, refundCount: 0, paymentCount: 0, lastActivity: '12 min ago', status: 'active' },
  { id: 'ACC014', email: 'msmith.new@outlook.com', name: 'Mike S.', createdAt: '2026-03-10', riskLevel: 'high', clusterId: 'CL9839', trialCount: 1, refundCount: 0, paymentCount: 1, lastActivity: '25 min ago', status: 'active' },
  { id: 'ACC025', email: 'alex.refunder@yahoo.com', name: 'Alex R.', createdAt: '2026-02-20', riskLevel: 'high', clusterId: 'CL9833', trialCount: 1, refundCount: 3, paymentCount: 4, lastActivity: '12 min ago', status: 'active' },
  { id: 'ACC026', email: 'a.refunder2@yahoo.com', name: 'A. Robinson', createdAt: '2026-02-22', riskLevel: 'high', clusterId: 'CL9833', trialCount: 1, refundCount: 2, paymentCount: 3, lastActivity: '1 hour ago', status: 'suspended' },
  { id: 'ACC034', email: 'emily.test@tempmail.com', name: 'Emily T.', createdAt: '2026-03-20', riskLevel: 'medium', clusterId: 'CL7953', trialCount: 1, refundCount: 0, paymentCount: 1, lastActivity: '2 hours ago', status: 'active' },
  { id: 'ACC040', email: 'r.garcia@email.com', name: 'R. Garcia', createdAt: '2026-03-15', riskLevel: 'medium', clusterId: 'CL6102', trialCount: 1, refundCount: 1, paymentCount: 2, lastActivity: '4 hours ago', status: 'active' },
  { id: 'ACC044', email: 'user1@protonmail.com', name: 'User 1', createdAt: '2026-03-26', riskLevel: 'high', clusterId: 'CL5501', trialCount: 1, refundCount: 0, paymentCount: 0, lastActivity: '45 min ago', status: 'active' },
  { id: 'ACC052', email: 'jane.doe@gmail.com', name: 'Jane Doe', createdAt: '2026-03-01', riskLevel: 'low', clusterId: 'CL4200', trialCount: 1, refundCount: 0, paymentCount: 1, lastActivity: '1 day ago', status: 'active' },
  { id: 'ACC053', email: 'bob.doe@gmail.com', name: 'Bob Doe', createdAt: '2026-03-02', riskLevel: 'low', clusterId: 'CL4200', trialCount: 1, refundCount: 0, paymentCount: 1, lastActivity: '1 day ago', status: 'active' },
];

// ============================================================
// DEVICES
// ============================================================
export const devices: Device[] = [
  { id: 'DEV001', fingerprint: 'fp_a1b2c3d4e5', type: 'Desktop', os: 'Windows 11', browser: 'Chrome 122', accountCount: 7, riskLevel: 'high', lastSeen: '12 min ago' },
  { id: 'DEV002', fingerprint: 'fp_f6g7h8i9j0', type: 'Mobile', os: 'iOS 17.3', browser: 'Safari', accountCount: 5, riskLevel: 'high', lastSeen: '1 hour ago' },
  { id: 'DEV003', fingerprint: 'fp_k1l2m3n4o5', type: 'Desktop', os: 'macOS 14', browser: 'Firefox 123', accountCount: 8, riskLevel: 'high', lastSeen: '12 min ago' },
  { id: 'DEV005', fingerprint: 'fp_u1v2w3x4y5', type: 'Desktop', os: 'Windows 10', browser: 'Chrome 121', accountCount: 5, riskLevel: 'high', lastSeen: '12 min ago' },
  { id: 'DEV008', fingerprint: 'fp_d1e2f3g4h5', type: 'Mobile', os: 'Android 14', browser: 'Chrome', accountCount: 3, riskLevel: 'medium', lastSeen: '2 hours ago' },
  { id: 'DEV011', fingerprint: 'fp_p1q2r3s4t5', type: 'Desktop', os: 'macOS 14', browser: 'Chrome 122', accountCount: 2, riskLevel: 'medium', lastSeen: '4 hours ago' },
  { id: 'DEV013', fingerprint: 'fp_v1w2x3y4z5', type: 'Desktop', os: 'Linux', browser: 'Headless Chrome', accountCount: 8, riskLevel: 'high', lastSeen: '45 min ago' },
  { id: 'DEV014', fingerprint: 'fp_a5b4c3d2e1', type: 'Desktop', os: 'Windows 11', browser: 'Edge', accountCount: 2, riskLevel: 'low', lastSeen: '1 day ago' },
];

// ============================================================
// PAYMENT METHODS
// ============================================================
export const paymentMethods: PaymentMethod[] = [
  { id: 'PM001', type: 'credit', last4: '4242', brand: 'Visa', accountCount: 7, riskLevel: 'high', totalTransactions: 14, totalRefunds: 5 },
  { id: 'PM004', type: 'credit', last4: '9912', brand: 'Visa', accountCount: 6, riskLevel: 'high', totalTransactions: 8, totalRefunds: 2 },
  { id: 'PM006', type: 'credit', last4: '3301', brand: 'Mastercard', accountCount: 2, riskLevel: 'high', totalTransactions: 6, totalRefunds: 4 },
  { id: 'PM009', type: 'credit', last4: '5500', brand: 'Mastercard', accountCount: 4, riskLevel: 'high', totalTransactions: 11, totalRefunds: 7 },
  { id: 'PM010', type: 'debit', last4: '8899', brand: 'Visa', accountCount: 2, riskLevel: 'medium', totalTransactions: 3, totalRefunds: 0 },
  { id: 'PM014', type: 'prepaid', last4: '7788', brand: 'Visa', accountCount: 4, riskLevel: 'medium', totalTransactions: 6, totalRefunds: 2 },
  { id: 'PM020', type: 'credit', last4: '1234', brand: 'Visa', accountCount: 1, riskLevel: 'low', totalTransactions: 3, totalRefunds: 0 },
];

// ============================================================
// IPs
// ============================================================
export const ipRecords: IPRecord[] = [
  { id: 'IP001', address: '192.168.1.x', location: 'San Francisco, CA', accountCount: 7, riskLevel: 'high', isVPN: false, lastSeen: '12 min ago' },
  { id: 'IP003', address: '10.0.42.x', location: 'New York, NY', accountCount: 8, riskLevel: 'high', isVPN: true, lastSeen: '12 min ago' },
  { id: 'IP004', address: '172.16.8.x', location: 'Chicago, IL', accountCount: 3, riskLevel: 'high', isVPN: false, lastSeen: '12 min ago' },
  { id: 'IP007', address: '203.0.113.x', location: 'Los Angeles, CA', accountCount: 4, riskLevel: 'medium', isVPN: true, lastSeen: '2 hours ago' },
  { id: 'IP009', address: '198.51.100.x', location: 'Austin, TX', accountCount: 2, riskLevel: 'medium', isVPN: false, lastSeen: '4 hours ago' },
  { id: 'IP012', address: '100.64.0.x', location: 'Miami, FL', accountCount: 8, riskLevel: 'high', isVPN: true, lastSeen: '45 min ago' },
  { id: 'IP013', address: '192.0.2.x', location: 'Seattle, WA', accountCount: 2, riskLevel: 'low', isVPN: false, lastSeen: '1 day ago' },
];

// ============================================================
// TRUST GRAPH NODES & EDGES FOR CL9823
// ============================================================
export const graphNodes: GraphNode[] = [
  // Accounts
  { id: 'ACC001', type: 'account', label: 'john.d+1@gmail.com', riskLevel: 'high', x: 200, y: 150 },
  { id: 'ACC002', type: 'account', label: 'john.d+2@gmail.com', riskLevel: 'high', x: 100, y: 300 },
  { id: 'ACC003', type: 'account', label: 'johnd.plus3@gmail.com', riskLevel: 'high', x: 350, y: 300 },
  { id: 'ACC013', type: 'account', label: 'm.smith42@outlook.com', riskLevel: 'high', x: 500, y: 200 },
  // Devices
  { id: 'DEV001', type: 'device', label: 'Device fp_a1b2', riskLevel: 'high', x: 150, y: 50 },
  { id: 'DEV002', type: 'device', label: 'Device fp_f6g7', riskLevel: 'high', x: 350, y: 50 },
  // Payment methods
  { id: 'PM001', type: 'payment_method', label: 'Visa •••• 4242', riskLevel: 'high', x: 50, y: 200 },
  { id: 'PM004', type: 'payment_method', label: 'Visa •••• 9912', riskLevel: 'high', x: 500, y: 350 },
  // IPs
  { id: 'IP001', type: 'ip', label: '192.168.1.x', riskLevel: 'high', x: 250, y: 400 },
  { id: 'IP003', type: 'ip', label: '10.0.42.x (VPN)', riskLevel: 'high', x: 450, y: 100 },
];

export const graphEdges: GraphEdge[] = [
  { id: 'ge1', source: 'ACC001', target: 'DEV001', type: 'shared_device', label: 'Same Device' },
  { id: 'ge2', source: 'ACC002', target: 'DEV001', type: 'shared_device', label: 'Same Device' },
  { id: 'ge3', source: 'ACC003', target: 'DEV002', type: 'shared_device', label: 'Same Device' },
  { id: 'ge4', source: 'ACC001', target: 'PM001', type: 'shared_card', label: 'Shared Card' },
  { id: 'ge5', source: 'ACC002', target: 'PM001', type: 'shared_card', label: 'Shared Card' },
  { id: 'ge6', source: 'ACC003', target: 'PM001', type: 'shared_card', label: 'Shared Card' },
  { id: 'ge7', source: 'ACC001', target: 'IP001', type: 'shared_ip', label: 'Same IP' },
  { id: 'ge8', source: 'ACC002', target: 'IP001', type: 'shared_ip', label: 'Same IP' },
  { id: 'ge9', source: 'ACC003', target: 'IP001', type: 'shared_ip', label: 'Same IP' },
  { id: 'ge10', source: 'ACC013', target: 'DEV002', type: 'shared_device', label: 'Same Device' },
  { id: 'ge11', source: 'ACC013', target: 'PM004', type: 'shared_card', label: 'Shared Card' },
  { id: 'ge12', source: 'ACC013', target: 'IP003', type: 'shared_ip', label: 'Same IP' },
  { id: 'ge13', source: 'ACC001', target: 'ACC002', type: 'timing_overlap', label: 'Timing Overlap' },
  { id: 'ge14', source: 'ACC002', target: 'ACC003', type: 'refund_pattern', label: 'Refund Pattern' },
];

// ============================================================
// FLAGGED ACCOUNTS TREND DATA
// ============================================================
export const flaggedAccountsTrend = [
  { date: 'Mon', count: 42, blocked: 18 },
  { date: 'Tue', count: 58, blocked: 22 },
  { date: 'Wed', count: 35, blocked: 15 },
  { date: 'Thu', count: 71, blocked: 31 },
  { date: 'Fri', count: 63, blocked: 28 },
  { date: 'Sat', count: 29, blocked: 12 },
  { date: 'Sun', count: 22, blocked: 9 },
];

export const abuseTypeBreakdown = [
  { type: 'Trial Abuse', count: 142, percentage: 44 },
  { type: 'Refund Cycling', count: 78, percentage: 24 },
  { type: 'Promo Abuse', count: 52, percentage: 16 },
  { type: 'Payment Reuse', count: 31, percentage: 10 },
  { type: 'Device Burst', count: 17, percentage: 6 },
];

// ============================================================
// RECOMMENDED ACTIONS
// ============================================================
export const recommendedActions = [
  { id: 'ra1', action: 'Review high-risk trial clusters', priority: 'high' as RiskLevel, count: 3 },
  { id: 'ra2', action: 'Block suspicious refund patterns', priority: 'high' as RiskLevel, count: 2 },
  { id: 'ra3', action: 'Investigate device burst from Miami', priority: 'medium' as RiskLevel, count: 1 },
  { id: 'ra4', action: 'Update promo code restrictions', priority: 'medium' as RiskLevel, count: 1 },
];

// ============================================================
// RECENT ACTIVITY
// ============================================================
export const recentActivity = [
  { id: 'act1', message: 'CL9823 flagged — 12 linked accounts detected', time: '12 min ago', type: 'alert' as const },
  { id: 'act2', message: 'Sarah Chen blocked trial for CL5501', time: '30 min ago', type: 'action' as const },
  { id: 'act3', message: 'New device burst detected in Miami', time: '45 min ago', type: 'alert' as const },
  { id: 'act4', message: 'Policy update: refund threshold changed to 3', time: '1 hour ago', type: 'system' as const },
  { id: 'act5', message: 'Marcus Johnson resolved CL4200 as legitimate', time: '2 hours ago', type: 'action' as const },
  { id: 'act6', message: 'CL7953 promo abuse cluster identified', time: '3 hours ago', type: 'alert' as const },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================
export const abuseTypeLabels: Record<AbuseType, string> = {
  trial_abuse: 'Trial Abuse',
  promo_abuse: 'Promo Abuse',
  refund_cycling: 'Refund Cycling',
  payment_reuse: 'Payment Reuse',
  device_burst: 'Device Burst',
};

export const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

export const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case 'critical': return 'risk-badge-critical';
    case 'high': return 'risk-badge-high';
    case 'medium': return 'risk-badge-medium';
    case 'low': return 'risk-badge-low';
  }
};
