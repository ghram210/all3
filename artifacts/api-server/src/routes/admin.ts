import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const SUPABASE_URL = process.env["SUPABASE_URL"] ?? "";
const SUPABASE_SERVICE_KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

const supabaseHeaders = {
  "apikey": SUPABASE_SERVICE_KEY,
  "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

async function verifyToken(token: string): Promise<{ id: string; email: string } | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_SERVICE_KEY,
      },
    });
    if (!res.ok) return null;
    const user = await res.json() as { id: string; email: string };
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

router.post("/admin/setup-first-admin", async (req: Request, res: Response) => {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth) {
    res.status(401).json({ detail: "Authorization header required" });
    return;
  }

  const token = auth.replace("Bearer ", "").trim();
  const user = await verifyToken(token);
  if (!user) {
    res.status(401).json({ detail: "Invalid or expired token" });
    return;
  }

  if (!SUPABASE_SERVICE_KEY) {
    res.status(500).json({ detail: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server" });
    return;
  }

  try {
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?role=eq.admin&select=id`,
      { headers: supabaseHeaders }
    );
    const existing = await checkRes.json();

    if (Array.isArray(existing) && existing.length > 0) {
      res.status(409).json({
        detail: "Admins already exist. Ask an existing admin to grant you access through the Admin Panel.",
      });
      return;
    }

    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
      method: "POST",
      headers: supabaseHeaders,
      body: JSON.stringify({
        email: user.email,
        role: "admin",
        name: user.email.split("@")[0],
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      res.status(500).json({ detail: `Failed to insert admin: ${err}` });
      return;
    }

    await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
      method: "POST",
      headers: { ...supabaseHeaders, "Prefer": "return=minimal,resolution=merge-duplicates", "on_conflict": "user_id" },
      body: JSON.stringify({ user_id: user.id, role: "admin" }),
    });

    res.json({ success: true, message: `${user.email} is now an admin. Please refresh the page.` });
  } catch (err) {
    res.status(500).json({ detail: `Server error: ${String(err)}` });
  }
});

router.post("/admin/promote", async (req: Request, res: Response) => {
  const auth = req.headers["authorization"] as string | undefined;
  if (!auth) {
    res.status(401).json({ detail: "Authorization header required" });
    return;
  }

  const token = auth.replace("Bearer ", "").trim();
  const caller = await verifyToken(token);
  if (!caller) {
    res.status(401).json({ detail: "Invalid or expired token" });
    return;
  }

  if (!SUPABASE_SERVICE_KEY) {
    res.status(500).json({ detail: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server" });
    return;
  }

  const callerAdminRes = await fetch(
    `${SUPABASE_URL}/rest/v1/admin_users?email=eq.${encodeURIComponent(caller.email)}&role=eq.admin&select=id`,
    { headers: supabaseHeaders }
  );
  const callerAdmin = await callerAdminRes.json();
  if (!Array.isArray(callerAdmin) || callerAdmin.length === 0) {
    res.status(403).json({ detail: "Only existing admins can promote users" });
    return;
  }

  const { email, name } = req.body as { email?: string; name?: string };
  if (!email) {
    res.status(400).json({ detail: "email is required" });
    return;
  }

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_users`, {
    method: "POST",
    headers: supabaseHeaders,
    body: JSON.stringify({ email, role: "user", name: name ?? email.split("@")[0] }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    res.status(500).json({ detail: `Failed to add user: ${err}` });
    return;
  }

  res.json({ success: true, message: `${email} added successfully` });
});

export default router;