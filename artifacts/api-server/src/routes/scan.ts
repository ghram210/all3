import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const GATEWAY_URL = process.env["SCAN_GATEWAY_URL"] ?? "http://localhost:8090";

async function proxyToGateway(req: Request, res: Response, path: string) {
  const url = `${GATEWAY_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const auth = req.headers["authorization"];
  if (auth) {
    headers["Authorization"] = auth as string;
  }

  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({
      detail: "Scan gateway is not reachable. Make sure the scan servers are running.",
      error: String(err),
    });
  }
}

router.post("/scan", async (req: Request, res: Response) => {
  await proxyToGateway(req, res, "/scan");
});

router.get("/scan/:scanId", async (req: Request, res: Response) => {
  await proxyToGateway(req, res, `/scan/${req.params["scanId"]}`);
});

router.get("/scan-servers/health", async (_req: Request, res: Response) => {
  const servers = [
    { name: "gateway", url: `${GATEWAY_URL}/health` },
    { name: "nmap", url: "http://localhost:8001/health" },
    { name: "nikto", url: "http://localhost:8002/health" },
    { name: "sqlmap", url: "http://localhost:8003/health" },
    { name: "ffuf", url: "http://localhost:8004/health" },
  ];

  const results = await Promise.allSettled(
    servers.map(async (s) => {
      const r = await fetch(s.url, { signal: AbortSignal.timeout(3000) });
      const data = await r.json();
      return { name: s.name, status: "ok", data };
    })
  );

  const statuses = results.map((r, i) => ({
    name: servers[i]!.name,
    status: r.status === "fulfilled" ? "ok" : "unreachable",
    ...(r.status === "fulfilled" ? { data: r.value.data } : { error: String((r as PromiseRejectedResult).reason) }),
  }));

  res.json({ servers: statuses });
});

export default router;
