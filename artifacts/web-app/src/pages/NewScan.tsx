import { useState } from "react";
import { Globe, Terminal, Zap, Shield, Maximize2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import { cn } from "@/lib/utils";

const tools = [
  { key: "NMAP", label: "Nmap", desc: "Network discovery and port scanning", icon: Globe },
  { key: "SQLMAP", label: "SQLmap", desc: "SQL injection detection and exploitation", icon: Terminal },
  { key: "FFUF", label: "FFUF", desc: "Fast web fuzzer for content discovery", icon: Zap },
  { key: "NIKTO", label: "Nikto", desc: "Web server vulnerability scanner", icon: Shield },
  { key: "FULL", label: "Full Scan", desc: "Comprehensive scan using all tools", icon: Maximize2 },
];

const NewScan = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [scanName, setScanName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTool, setSelectedTool] = useState("");
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("scan_results").insert({
        name: scanName,
        target,
        description,
        tool: selectedTool,
        status: "running",
        started_at: new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Scan completed successfully!");
      navigate("/scan-results");
    },
    onError: () => toast.error("Failed to start scan"),
  });

  const canSubmit = scanName.trim() && target.trim() && selectedTool;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} activePage="new-scan" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          {/* Target Configuration */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-primary">Target Configuration</h2>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Scan Name</label>
                <input
                  value={scanName}
                  onChange={(e) => setScanName(e.target.value)}
                  placeholder="e.g. Production Server Scan"
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Target URL or IP Address</label>
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="e.g. https://example.com or 192.168.1.1"
                  className="w-full bg-background border border-primary/50 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this scan..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
            </div>
          </div>

          {/* Select Scan Tool */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Select Scan Tool</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isSelected = selectedTool === tool.key;
                return (
                  <button
                    key={tool.key}
                    onClick={() => setSelectedTool(tool.key)}
                    className={cn(
                      "flex flex-col items-start gap-3 p-5 rounded-xl border transition-all text-left",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    )}
                  >
                    <Icon className={cn("w-6 h-6", isSelected ? "text-primary" : "text-primary/60")} />
                    <div>
                      <p className="font-medium text-sm">{tool.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tool.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Scan Button */}
          <button
            disabled={mutation.isPending}
            onClick={() => {
              if (!canSubmit) {
                toast.error("Please fill in all fields and select a scan tool");
                return;
              }
              toast.info("Scan has been initiated...");
              mutation.mutate();
            }}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-lg font-medium text-sm transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {mutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Start Scan
              </>
            )}
          </button>

          {mutation.isPending && (
            <div className="bg-card border border-primary/30 rounded-xl p-5 mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <p className="text-primary font-semibold">Scan in Progress</p>
              </div>
              <p className="text-muted-foreground text-sm">Scanning target <span className="text-foreground font-mono">{target}</span> using <span className="text-primary">{selectedTool}</span>...</p>
              <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
                <div className="bg-primary h-full rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: "60%" }} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NewScan;
