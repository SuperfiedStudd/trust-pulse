import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { usePolicyConfig, useUpdatePolicyConfig } from "@/hooks/useSupabaseData";
import { useLatestPipelineRun, usePipelineRuns, useTriggerScoring, useRawEventStats } from "@/hooks/usePipelineData";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { Save, Check, Zap, RefreshCw, SlidersHorizontal } from "lucide-react";

export default function SettingsPage() {
  const { data: config, isLoading } = usePolicyConfig();
  const updateConfig = useUpdatePolicyConfig();
  const { data: pipelineRuns } = usePipelineRuns(5);
  const { data: eventStats } = useRawEventStats();
  const { data: latestRun } = useLatestPipelineRun();
  const triggerScoring = useTriggerScoring();

  const [riskThreshold, setRiskThreshold] = useState(70);
  const [trialWeight, setTrialWeight] = useState(1.0);
  const [refundWeight, setRefundWeight] = useState(1.0);
  const [promoWeight, setPromoWeight] = useState(0.8);
  const [paymentReuseWeight, setPaymentReuseWeight] = useState(0.9);
  const [deviceBurstWeight, setDeviceBurstWeight] = useState(1.2);
  const [reviewCapacity, setReviewCapacity] = useState(50);
  const [dirty, setDirty] = useState(false);

  // Sync from DB when config loads
  useEffect(() => {
    if (config) {
      setRiskThreshold(config.risk_threshold);
      setTrialWeight(Number(config.trial_weight));
      setRefundWeight(Number(config.refund_weight));
      setPromoWeight(Number(config.promo_weight));
      setPaymentReuseWeight(Number(config.payment_reuse_weight));
      setDeviceBurstWeight(Number(config.device_burst_weight));
      setReviewCapacity(config.review_capacity);
      setDirty(false);
    }
  }, [config]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        risk_threshold: riskThreshold,
        trial_weight: trialWeight,
        refund_weight: refundWeight,
        promo_weight: promoWeight,
        payment_reuse_weight: paymentReuseWeight,
        device_burst_weight: deviceBurstWeight,
        review_capacity: reviewCapacity,
      });
      setDirty(false);
      toast.success("Policy configuration saved", {
        description: "Policy Simulator baseline is updated. Recompute scores to refresh live risk outputs.",
      });
    } catch {
      toast.error("Failed to save configuration");
    }
  };

  const WeightSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium font-mono">{value.toFixed(1)}</span>
      </div>
      <Slider min={0} max={2} step={0.1} value={[value]} onValueChange={([v]) => { onChange(v); markDirty(); }} className="w-full" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Live scoring controls and pipeline operations for the current demo merchant</p>
        </div>
        {config && (
          <p className="text-[10px] text-muted-foreground">Last saved: {formatDateTime(config.updated_at)}</p>
        )}
      </div>

      <div className="card-surface p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Policy Configuration</h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">Saved to database</span>
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Risk Threshold (score)</span>
                <span className="font-medium font-mono">{riskThreshold}</span>
              </div>
              <Slider min={0} max={100} step={1} value={[riskThreshold]} onValueChange={([v]) => { setRiskThreshold(v); markDirty(); }} />
              <p className="text-[10px] text-muted-foreground">Clusters scoring above this threshold are flagged for review</p>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-xs font-medium">Abuse Type Weights</p>
              <WeightSlider label="Trial Abuse" value={trialWeight} onChange={setTrialWeight} />
              <WeightSlider label="Refund Cycling" value={refundWeight} onChange={setRefundWeight} />
              <WeightSlider label="Promo Abuse" value={promoWeight} onChange={setPromoWeight} />
              <WeightSlider label="Payment Reuse" value={paymentReuseWeight} onChange={setPaymentReuseWeight} />
              <WeightSlider label="Device Burst" value={deviceBurstWeight} onChange={setDeviceBurstWeight} />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Review Queue Capacity</span>
                <span className="font-medium font-mono">{reviewCapacity}</span>
              </div>
              <Slider min={10} max={200} step={5} value={[reviewCapacity]} onValueChange={([v]) => { setReviewCapacity(v); markDirty(); }} />
              <p className="text-[10px] text-muted-foreground">Maximum cases in the review queue at one time</p>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5 text-[11px] text-muted-foreground">
              <p><span className="font-medium text-foreground">Applies after save:</span> Policy Simulator loads this config as its saved baseline.</p>
              <p><span className="font-medium text-foreground">Used on recompute:</span> the scoring pipeline reads these saved weights and threshold on the next score run.</p>
            </div>
          </>
        )}
      </div>

      <div className="card-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Pipeline &amp; Scoring</h3>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5" onClick={async () => {
            try {
              await triggerScoring.mutateAsync();
              toast.success("Scoring pipeline completed", {
                description: "Latest saved policy weights were used for this run.",
              });
            } catch {
              toast.error("Scoring pipeline failed");
            }
          }} disabled={triggerScoring.isPending}>
            <RefreshCw className={`h-3 w-3 ${triggerScoring.isPending ? 'animate-spin' : ''}`} />
            {triggerScoring.isPending ? 'Running…' : 'Recompute Scores'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <PipelineStat label="Raw Events" value={String(eventStats?.total ?? 0)} />
          <PipelineStat label="Processed" value={String(eventStats?.processed ?? 0)} />
          <PipelineStat label="Failed" value={String(eventStats?.failed ?? 0)} highlight={(eventStats?.failed ?? 0) > 0} />
          <PipelineStat label="Latest Run" value={formatDateTime(latestRun?.completed_at || latestRun?.started_at)} />
          <PipelineStat label="Entities Scored" value={String(latestRun?.entities_scored ?? 0)} />
          <PipelineStat label="Score Version" value={latestRun?.score_version || '—'} mono />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs font-medium">Recent scoring runs</p>
          {(pipelineRuns || []).length === 0 ? (
            <p className="text-[11px] text-muted-foreground py-2">No scoring runs recorded yet</p>
          ) : (
            <div className="space-y-1.5">
              {(pipelineRuns || []).map(run => (
                <div key={run.id} className="flex items-center justify-between text-[11px] p-2 rounded-md bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${run.status === 'completed' ? 'bg-risk-low' : run.status === 'running' ? 'bg-primary animate-pulse' : 'bg-destructive'}`} />
                    <span className="text-muted-foreground">{formatDateTime(run.completed_at || run.started_at)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{run.entities_scored} scored</span>
                    <span className="text-muted-foreground">{run.events_processed} events</span>
                    {run.events_failed > 0 && <span className="text-destructive">{run.events_failed} failed</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
          External systems can post inbound events to the ingest-event function. This page is the operator surface for current run health and score recomputes.
        </p>
      </div>

      <div className="flex items-center justify-between sticky bottom-4 card-surface p-3">
        <div className="flex items-center gap-2">
          {dirty ? (
            <span className="text-xs text-risk-medium font-medium">Unsaved changes</span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Check className="h-3 w-3" /> All changes saved</span>
          )}
        </div>
        <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={!dirty || updateConfig.isPending}>
          <Save className="h-3 w-3" />{updateConfig.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function PipelineStat({ label, value, highlight = false, mono = false }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="rounded-md bg-muted/30 px-3 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? 'text-destructive' : 'text-foreground'} ${mono ? 'font-mono text-[12px]' : ''}`}>{value}</p>
    </div>
  );
}
