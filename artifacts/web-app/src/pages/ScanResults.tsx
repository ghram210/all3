import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { Eye, Trash2, CheckCircle2, Settings2 } from "lucide-react";

interface ScanResult {
  id: string;
  name: string;
  target: string;
  tool: string;
  status: string;
  options: string;
  started_at: string;
  completed_at: string | null;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  total_findings: number;
  created_at: string;
}

const toolColors: Record<string, string> = {
  SQLMAP: "text-primary",
  FFUF: "text-primary",
  NMAP: "text-primary",
  NIKTO: "text-primary",
};

const ScanResults = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);
  const queryClient = useQueryClient();
  const { userRole } = useAuth();

  const { data: scans = [] } = useQuery({
    queryKey: ["scan_results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scan_results")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ScanResult[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scan_results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan_results"] });
      setSelectedScan(null);
    },
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activePage="scan-results"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Scan Results</h1>

          <div className="flex gap-6">
            {/* Scan List */}
            <div className="flex-1 space-y-3">
              {scans.length === 0 ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
                  No scans found
                </div>
              ) : (
                scans.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => setSelectedScan(scan)}
                    className={`bg-card border rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/50 ${
                      selectedScan?.id === scan.id ? "border-primary" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">{scan.name}</span>
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Target: {scan.target}</span>
                          <span>
                            Tool: <span className={toolColors[scan.tool] || "text-primary"}>{scan.tool}</span>
                          </span>
                          <span>{formatShortDate(scan.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-severity-critical" />
                            <span className="text-foreground">{scan.critical_count}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-severity-high" />
                            <span className="text-foreground">{scan.high_count}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-severity-medium" />
                            <span className="text-foreground">{scan.medium_count}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-severity-low" />
                            <span className="text-foreground">{scan.low_count}</span>
                          </span>
                          <span className="text-muted-foreground">{scan.total_findings} total findings</span>
                        </div>
                      </div>
                      {userRole === "admin" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(scan.id);
                          }}
                          className="text-destructive hover:text-destructive/80 transition-colors p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail Panel */}
            <div className="w-[350px] shrink-0">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-0">
                {selectedScan ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Settings2 className="w-5 h-5" />
                      Scan Details
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-sm text-foreground font-medium">{selectedScan.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="text-sm text-foreground font-mono">{selectedScan.target}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tool</p>
                        <p className="text-sm text-foreground font-mono">{selectedScan.tool}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="text-sm text-foreground">{selectedScan.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Options</p>
                        <p className="text-sm text-foreground font-mono">{selectedScan.options || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Started</p>
                        <p className="text-sm text-foreground">{formatDate(selectedScan.started_at)}</p>
                      </div>
                      {selectedScan.completed_at && (
                        <div>
                          <p className="text-xs text-muted-foreground">Completed</p>
                          <p className="text-sm text-foreground">{formatDate(selectedScan.completed_at)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Findings</p>
                        <p className="text-sm text-foreground font-semibold">{selectedScan.total_findings}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3">
                    <Eye className="w-10 h-10 opacity-40" />
                    <p className="text-sm">Select a scan to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ScanResults;
