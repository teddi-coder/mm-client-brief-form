/**
 * mm-client-brief-worker
 * Cloudflare Worker — receives form submissions and writes to ClickUp.
 *
 * CORS: Currently set to "*". Once the Pages site is deployed,
 * replace "*" with the exact Pages URL, e.g.:
 *   "https://mm-client-brief-form.pages.dev"
 */

const CORS_ORIGIN = "*";

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

// ClickUp custom field IDs
const FIELD = {
  brandName:     "75160272-a884-4946-b617-5c6ff63f3d48",
  yourName:      "2e08ad22-9de7-460a-8456-7424548f5d57",
  email:         "c8891b93-d831-4fbc-89a0-068dd3d1bcdb",
  websiteUrl:    "6f31565d-8ede-4ccb-adcc-875f608e7bcb",
  bookingUrl:    "4c1ec478-ed78-4774-b48e-a2223103ac3f",
  goal:          "486af920-afd8-4f36-a7bb-98ce985742eb",
  niche:         "2379fdcd-dc93-47af-a89e-210c28b4e276",
  targetLocation:"38bc21eb-40b9-4aba-8b48-940cc68b1578",
  googleBudget:  "ad10b2ed-9ccd-49eb-be3e-41327d6731bd",
  facebookBudget:"4a208081-fbf1-4252-8513-b1990e3ca0f7",
  competitors:   "4fe9c17c-3c85-406e-8669-afd34be4dfe8",
  notes:         "af4a74fd-ef8e-4534-ba5f-a861b5210326",
  englishPref:   "40aea5eb-6829-4f14-a0a2-3d2adc81e88f",
  mmPlan:        "dce7a58d-04c3-403d-95c0-d83d2f401013",
};

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

/**
 * Build the task description — omit sections where the value is blank.
 */
function buildDescription(fields) {
  const lines = [`${fields.brandName} — Client Brief`, ""];

  if (fields.goal) {
    lines.push("Goal:", fields.goal, "");
  }
  if (fields.niche) {
    lines.push("Niche / Speciality:", fields.niche, "");
  }
  if (fields.competitors) {
    lines.push("Top Competitors:", fields.competitors, "");
  }
  if (fields.notes) {
    lines.push("Additional Notes:", fields.notes, "");
  }

  return lines.join("\n").trim();
}

/**
 * Build the custom_fields array for the ClickUp task.
 * Omits any field whose value is empty/null/undefined.
 */
function buildCustomFields(fields) {
  const custom = [];

  const addStr = (id, value) => {
    if (value != null && value !== "") {
      custom.push({ id, value });
    }
  };

  const addNum = (id, value) => {
    const num = Number(value);
    if (value != null && value !== "" && !isNaN(num)) {
      custom.push({ id, value: num });
    }
  };

  const addDropdown = (id, orderindex) => {
    if (orderindex != null) {
      custom.push({ id, value: orderindex });
    }
  };

  addStr(FIELD.brandName,      fields.brandName);
  addStr(FIELD.yourName,       fields.yourName);
  addStr(FIELD.email,          fields.email);
  addStr(FIELD.websiteUrl,     fields.websiteUrl);
  addStr(FIELD.bookingUrl,     fields.bookingUrl);
  addStr(FIELD.goal,           fields.goal);
  addStr(FIELD.niche,          fields.niche);
  addStr(FIELD.targetLocation, fields.targetLocation);
  addNum(FIELD.googleBudget,   fields.googleBudget);
  addNum(FIELD.facebookBudget, fields.facebookBudget);
  addStr(FIELD.competitors,    fields.competitors);
  addStr(FIELD.notes,          fields.notes);

  // drop_down: send orderindex as integer
  if (fields.englishPref != null) {
    addDropdown(FIELD.englishPref, fields.englishPref); // 0 or 1
  }
  if (fields.mmPlan != null) {
    addDropdown(FIELD.mmPlan, fields.mmPlan); // 0 or 1
  }

  return custom;
}

async function handleSubmit(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  // Server-side validation — required fields
  const { brandName, yourName, email } = body;
  if (!brandName || !yourName || !email) {
    return jsonResponse(
      { error: "Brand name, your name, and email are required" },
      400
    );
  }

  const folderId = env.MM_CLIENTS_FOLDER_ID;
  const token = env.CLICKUP_API_TOKEN;

  // ── Step 1: Create the client list ──────────────────────────────────────────
  let listId;
  try {
    const listRes = await fetch(`${CLICKUP_API_BASE}/folder/${folderId}/list`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: brandName }),
    });

    if (!listRes.ok) {
      const err = await listRes.text();
      console.error(`ClickUp create list failed (${listRes.status}):`, err);
      return jsonResponse(
        { error: "Failed to create ClickUp list. Please try again." },
        500
      );
    }

    const listData = await listRes.json();
    listId = listData.id;
  } catch (e) {
    console.error("Network error creating list:", e);
    return jsonResponse(
      { error: "Network error contacting ClickUp. Please try again." },
      500
    );
  }

  // ── Step 2: Create the Client Brief task ────────────────────────────────────
  let taskId;
  try {
    const taskPayload = {
      name: `${brandName} — Client Brief`,
      description: buildDescription(body),
      custom_fields: buildCustomFields(body),
    };

    const taskRes = await fetch(`${CLICKUP_API_BASE}/list/${listId}/task`, {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskPayload),
    });

    if (!taskRes.ok) {
      const err = await taskRes.text();
      console.error(`ClickUp create task failed (${taskRes.status}):`, err);
      return jsonResponse(
        { error: "Failed to create ClickUp task. Please try again." },
        500
      );
    }

    const taskData = await taskRes.json();
    taskId = taskData.id;
  } catch (e) {
    console.error("Network error creating task:", e);
    return jsonResponse(
      { error: "Network error contacting ClickUp. Please try again." },
      500
    );
  }

  return jsonResponse({ success: true, listId, taskId });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (request.method === "POST" && url.pathname === "/submit-brief") {
      return handleSubmit(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};
