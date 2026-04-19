import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Internal email domain for username-based auth
const INTERNAL_DOMAIN = "ifcomp.local";
const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@${INTERNAL_DOMAIN}`;
const isValidUsername = (u: string) => /^[a-z0-9_.-]{3,30}$/i.test(u);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles").select("role")
      .eq("user_id", caller.id).eq("role", "admin").maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Apenas administradores podem gerenciar usuários" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const method = req.method;

    // GET — list users
    if (method === "GET") {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
      if (error) throw error;

      const { data: roles } = await supabaseAdmin.from("user_roles").select("*");
      const { data: profiles } = await supabaseAdmin.from("profiles").select("*");

      const result = users.map((u) => {
        const role = roles?.find((r) => r.user_id === u.id);
        const profile = profiles?.find((p) => p.user_id === u.id);
        const isInternal = u.email?.endsWith(`@${INTERNAL_DOMAIN}`);
        return {
          id: u.id,
          email: u.email,
          username: profile?.username || (isInternal ? u.email!.split("@")[0] : null),
          display_name: profile?.display_name || u.user_metadata?.display_name || u.email,
          role: role?.role || "viewer",
          created_at: u.created_at,
        };
      });

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST ?action=create — create new user with role using USERNAME
    if (method === "POST" && action === "create") {
      const { username, password, display_name, role } = await req.json();

      if (!username || !password || !role || !["admin", "organizer"].includes(role)) {
        return new Response(JSON.stringify({ error: "Dados inválidos. Informe username, senha e papel (admin ou organizer)." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!isValidUsername(username)) {
        return new Response(JSON.stringify({ error: "Username deve ter 3-30 caracteres (letras, números, . _ -)" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check uniqueness
      const { data: existing } = await supabaseAdmin
        .from("profiles").select("id").ilike("username", username).maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "Este username já está em uso" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const email = usernameToEmail(username);
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { display_name: display_name || username, username: username.toLowerCase() },
      });

      if (createErr) {
        return new Response(JSON.stringify({ error: createErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = created.user.id;
      // Ensure profile has username (trigger may have created with raw_user_meta_data already)
      await supabaseAdmin.from("profiles").upsert(
        { user_id: userId, display_name: display_name || username, username: username.toLowerCase() },
        { onConflict: "user_id" }
      );

      await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles").insert({ user_id: userId, role });
      if (roleErr) throw roleErr;

      return new Response(JSON.stringify({ success: true, user_id: userId, username: username.toLowerCase() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST ?action=resolve — translate username → email (for login). PUBLIC-ish but guarded by edge auth.
    if (method === "POST" && action === "resolve") {
      // Special: this endpoint must work for unauthenticated users? No — login flow doesn't have a session.
      // Handled separately below (we let it pass if no caller — but we already required caller above).
      // So we expose it only when caller exists (admin testing).
      const { username } = await req.json();
      if (!username) {
        return new Response(JSON.stringify({ error: "username obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ email: usernameToEmail(username) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST ?action=delete — delete user
    if (method === "POST" && action === "delete") {
      const { user_id } = await req.json();
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id obrigatório" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Você não pode excluir a si mesmo" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST (default) — update role
    if (method === "POST") {
      const { user_id, role } = await req.json();
      if (!user_id || !role || !["admin", "organizer", "viewer"].includes(role)) {
        return new Response(JSON.stringify({ error: "Dados inválidos" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await supabaseAdmin.from("user_roles").insert({ user_id, role });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Método não suportado" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
