import { useState, useMemo, useEffect } from "react";
import { Sparkles, Save } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useClusters, usePolicyConfig, useUpdatePolicyConfig } from "@/hooks/useSupabaseData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface PolicyState {
  riskThreshold: number;
  reviewCapacity: number;
  trialWeight: number;
  refundWeight: number;
  paymentWeight: number;
  deviceWeight: number;
  promoWeight: number;
}

function configToPolicy(cfg: any): PolicyState {
  return {
    riskThreshold: cfg?.risk_threshold ?? 70,
    reviewCapacity: cfg?.review_capacity ?? 50,
    trialWeight: Number(cfg?.trial_weight ?? 1) * 100,
    refundWeight: Number(cfg?.refund_weight ?? 1) * 100,
    paymentWeight: Number(cfg?.payment_reuse_weight ?? 0.9) * 100,
    deviceWeight: Number(cfg?.device_burst_weight ?? 1.2) * 100,
    promoWeight: Number(cfg?.promo_weight ?? 0.8) * 100,
  };
}

function useSimulatePolicy(policy: PolicyState, totalClusters: number, totalAccounts: number, totalExposure: number) {
  return useMemo(() => {
    const sensitivity = policy.riskThreshold / 100;
    const weightAvg = (policy.trialWeight + policy.refundWeight + policy.paymentWeight + policy.deviceWeight + policy.promoWeight) / (5 * 100);

    const baseCatchRate = Math.min(99, Math.round(60 + (1 - sensitivity) * 35 + weightAvg * 5));
    const baseFP = Math.max(0.5, Number((1.5 + (1 - sensitivity) * 8 + weightAvg * 2).toFixed(1)));
    const queueVolume = Math.round((policy.reviewCapacity / 100) * (totalClusters * 5 + (1 - sensitivity) * totalAccounts * 0.3));
    const revenueSaved = Math.round(totalExposure * (baseCatchRate / 100) * 0.8);
    const conversionLoss = Number((0.3 + (1 - sensitivity) * 2.5).toFixed(1));

    return { abuseCaught: baseCatchRate, falsePositives: baseFP, queueVolume, revenueSaved, conversionLoss };
  }, [policy, totalClusters, totalAccounts, totalExposure]);
}

export default function PolicySimulator() {
  const { data: clusters, isLoading: clustersLoading } = useClusters();
  const { data: config, isLoading: configLoading } = usePolicyConfig();
  const updateConfig = useUpdatePolicyConfig();

  const savedPolicy = useMemo(() => configToPolicy(config), [config]);
  const [proposed, setProposed] = useState<PolicyState | null>(null);

  // Initialize proposed from saved config once loaded
  useEffect(() => {
    if (config && !proposed) {
      const p = configToPolicy(config);
      // Start proposed slightly more aggressive to show diff
      setProposed({ ...p, riskThreshold: Math.max(10, p.riskThreshold - 15), trialWeight: Math.min(200, p.trialWeight + 10) });
    }
  }, [config, proposed]);

  const currentProposed = proposed || savedPolicy;

  const totalClusters = clusters?.length || 0;
  const totalAccounts = clusters?.reduce((s, c) => s + c.linked_accounts, 0) || 0;
  const totalExposure = clusters?.reduce((s, c) => s + Number(c.exposure), 0) || 0;

  const savedMetrics = useSimulatePolicy(savedPolicy, totalClusters, totalAccounts, totalExposure);
  const proposedMetrics = useSimulatePolicy(currentProposed, totalClusters, totalAccounts, totalExposure);

  const comparisonData = [
    { metric: 'Abuse Caught %', saved: savedMetrics.abuseCaught, proposed: proposedMetrics.abuseCaught },
    { metric: 'False Positive %', saved: savedMetrics.falsePositives, proposed: proposedMetrics.falsePositives },
    { metric: 'Queue Volume', saved: savedMetrics.queueVolume, proposed: proposedMetrics.queueVolume },
  ];

  const tradeoffData = Array.from({ length: 10 }, (_, i) => {
    const threshold = 10 + i * 10;
    const p = { ...currentProposed, riskThreshold: threshold };
    const sensitivity = p.riskThreshold / 100;
    const weightAvg = (p.trialWeight + p.refundWeight + p.paymentWeight + p.deviceWeight + p.promoWeight) / (5 * 100);
    return {
      threshold: `${threshold}%`,
      caught: Math.min(99, Math.round(60 + (1 - sensitivity) * 35 + weightAvg * 5)),
      fp: Math.max(0.5, Number((1.5 + (1 - sensitivity) * 8 + weightAvg * 2).toFixed(1))),
    };
  });

  const updateProposed = (key: keyof PolicyState, value: number) => {
    setProposed(p => ({ ...(p || savedPolicy), [key]: value }));
  };

  const handleSaveProposed = async () => {
    try {
      await updateConfig.mutateAsync({
        risk_threshold: currentProposed.riskThreshold,
        review_capacity: currentProposed.reviewCapacity,
        trial_weight: currentProposed.trialWeight / 100,
        refund_weight: currentProposed.refundWeight / 100,
        payment_reuse_weight: currentProposed.paymentWeight / 100,
        device_burst_weight: currentProposed.deviceWeight / 100,
        promo_weight: currentProposed.promoWeight / 100,
      });
      toast.success("Proposed policy saved as new baseline");
      setProposed(null); // will re-derive from saved
    } catch { toast.error("Failed to save policy"); }
  };

  const isLoading = clustersLoading || configLoading;

  if (isLoading) {
    return <div className="space-y-6 max-w-[1400px]"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-3 gap-6"><Skeleton className="h-96" /><Skeleton className="h-96 col-span-2" /></div></div>;
  }

  const isDiff = JSON.stringify(savedPolicy) !== JSON.stringify(currentProposed);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Policy Simulator</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Model tradeoffs based on {totalClusters} clusters, {totalAccounts} linked accounts, ${totalExposure.toLocaleString()} total exposure
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Saved baseline values come from Settings and the scoring pipeline uses the same config on recompute.</p>
        </div>
        <div className="flex items-center gap-2">
          {isDiff && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-risk-medium-bg text-[hsl(var(--risk-medium-foreground))] font-medium">Unsaved changes</span>
          )}
          <Button size="sm" className="text-xs gap-1.5" disabled={!isDiff || updateConfig.isPending} onClick={handleSaveProposed}>
            <Save className="h-3 w-3" />{updateConfig.isPending ? 'Saving…' : 'Save as Baseline'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="card-surface p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Proposed Policy</h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">Editable</span>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Risk Threshold: {currentProposed.riskThreshold}%
              <span className="ml-2 text-[10px] opacity-60">(saved: {savedPolicy.riskThreshold}%)</span>
            </label>
            <Slider value={[currentProposed.riskThreshold]} onValueChange={v => updateProposed('riskThreshold', v[0])} min={10} max={95} step={5} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Review Capacity: {currentProposed.reviewCapacity}
              <span className="ml-2 text-[10px] opacity-60">(saved: {savedPolicy.reviewCapacity})</span>
            </label>
            <Slider value={[currentProposed.reviewCapacity]} onValueChange={v => updateProposed('reviewCapacity', v[0])} min={10} max={200} step={5} />
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium mb-1">Rule Weights</p>
            <p className="text-[10px] text-muted-foreground mb-3">Weights are multipliers, not percentage allocations.</p>
            <div className="space-y-3">
              {([
                { key: 'trialWeight' as const, label: 'Trial Abuse', savedKey: 'trialWeight' as const },
                { key: 'refundWeight' as const, label: 'Refund Cycling', savedKey: 'refundWeight' as const },
                { key: 'paymentWeight' as const, label: 'Payment Reuse', savedKey: 'paymentWeight' as const },
                { key: 'deviceWeight' as const, label: 'Device Burst', savedKey: 'deviceWeight' as const },
                { key: 'promoWeight' as const, label: 'Promo Abuse', savedKey: 'promoWeight' as const },
              ]).map(({ key, label, savedKey }) => (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{(currentProposed[key] / 100).toFixed(1)}x<span className="ml-1 text-[10px] opacity-60">({(savedPolicy[savedKey] / 100).toFixed(1)}x)</span></span>
                  </div>
                  <Slider value={[currentProposed[key]]} onValueChange={v => updateProposed(key, v[0])} min={0} max={200} step={5} />
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground italic pt-2 border-t border-border">
            Projections use heuristic formulas derived from seeded data distributions. Not production-calibrated.
          </p>
        </div>

        {/* Comparison Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Abuse Caught', saved: `${savedMetrics.abuseCaught}%`, proposed: `${proposedMetrics.abuseCaught}%`, better: proposedMetrics.abuseCaught > savedMetrics.abuseCaught },
              { label: 'False Positives', saved: `${savedMetrics.falsePositives}%`, proposed: `${proposedMetrics.falsePositives}%`, better: proposedMetrics.falsePositives < savedMetrics.falsePositives },
              { label: 'Queue Volume', saved: `${savedMetrics.queueVolume}`, proposed: `${proposedMetrics.queueVolume}`, better: proposedMetrics.queueVolume <= savedMetrics.queueVolume },
              { label: 'Revenue Saved', saved: `$${savedMetrics.revenueSaved.toLocaleString()}`, proposed: `$${proposedMetrics.revenueSaved.toLocaleString()}`, better: proposedMetrics.revenueSaved > savedMetrics.revenueSaved },
              { label: 'Conversion Loss', saved: `${savedMetrics.conversionLoss}%`, proposed: `${proposedMetrics.conversionLoss}%`, better: proposedMetrics.conversionLoss < savedMetrics.conversionLoss },
            ].map(m => (
              <div key={m.label} className="card-surface p-3">
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-1">Saved: {m.saved}</p>
                <p className={`text-sm font-semibold mt-0.5 ${m.better ? 'text-risk-low' : 'text-risk-high'}`}>Proposed: {m.proposed}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-surface p-4">
              <h4 className="text-xs font-medium mb-3">Saved vs Proposed</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                  <XAxis dataKey="metric" tick={{ fontSize: 9, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid hsl(220, 13%, 90%)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="saved" fill="hsl(220, 14%, 80%)" barSize={20} radius={[3, 3, 0, 0]} name="Saved Baseline" />
                  <Bar dataKey="proposed" fill="hsl(225, 73%, 57%)" barSize={20} radius={[3, 3, 0, 0]} name="Proposed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card-surface p-4">
              <h4 className="text-xs font-medium mb-3">Precision / Recall Tradeoff</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={tradeoffData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                  <XAxis dataKey="threshold" tick={{ fontSize: 9, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(220, 10%, 46%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid hsl(220, 13%, 90%)' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="caught" stroke="hsl(225, 73%, 57%)" strokeWidth={2} dot={{ r: 2 }} name="Caught %" />
                  <Line type="monotone" dataKey="fp" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 2 }} name="False Positive %" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h4 className="text-sm font-medium">AI Policy Recommendation</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Based on {totalClusters} active clusters with ${totalExposure.toLocaleString()} total exposure, the proposed configuration 
              (threshold {currentProposed.riskThreshold}%, trial weight {(currentProposed.trialWeight / 100).toFixed(1)}x) would catch an estimated{' '}
              <strong>{proposedMetrics.abuseCaught}%</strong> of abuse patterns while maintaining <strong>{proposedMetrics.falsePositives}%</strong> false positives. 
              Projected revenue saved: <strong>${proposedMetrics.revenueSaved.toLocaleString()}/month</strong>. 
              Queue load: <strong>{proposedMetrics.queueVolume} cases/day</strong> against a capacity of {currentProposed.reviewCapacity}. 
              {proposedMetrics.abuseCaught > savedMetrics.abuseCaught 
                ? ` This is +${proposedMetrics.abuseCaught - savedMetrics.abuseCaught}% improvement over saved baseline.`
                : proposedMetrics.abuseCaught < savedMetrics.abuseCaught 
                ? ` Warning: this is ${savedMetrics.abuseCaught - proposedMetrics.abuseCaught}% less effective than saved baseline.`
                : ' Matches saved baseline performance.'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2 italic">
              ⚠ Projections are heuristic estimates based on seeded data distributions — not production-calibrated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
