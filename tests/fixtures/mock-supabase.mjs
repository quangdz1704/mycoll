/** Browser-test fixture ONLY. Not an application backend or production Supabase substitute. */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
const storeId = "a0000000-0000-4000-8000-000000000001";
const adminId = "d0000000-0000-4000-8000-000000000001";
const now = () => new Date().toISOString();
const user = {
  id: adminId,
  aud: "authenticated",
  role: "authenticated",
  email: "admin@example.test",
  created_at: now(),
  app_metadata: {},
  user_metadata: {},
};
let token = [
  Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  ),
  Buffer.from(
    JSON.stringify({
      sub: adminId,
      role: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 86400,
    }),
  ).toString("base64url"),
  "test-only",
].join(".");
const session = {
  access_token: token,
  token_type: "bearer",
  expires_in: 86400,
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  refresh_token: "fixture-refresh-only",
  user,
};
const tables = {
  stores: [
    {
      id: storeId,
      name: "Nhà Quang",
      bio: "Cửa hàng kiểm thử — dữ liệu tạm thời",
      avatar_url: "http://127.0.0.1:5182/images/avatar.webp",
      tiktok_url: null,
      facebook_url: null,
      instagram_url: null,
      created_at: now(),
      updated_at: now(),
    },
  ],
  categories: [],
  products: [],
};
const clicks = [];
const images = new Map();
let uploads = 0;
if (process.env.FIXTURE_STATE_PATH) {
  const saved = JSON.parse(
    readFileSync(process.env.FIXTURE_STATE_PATH, "utf8"),
  );
  Object.assign(tables, saved.tables);
  clicks.push(...saved.clicks);
  if (saved.session) {
    token = saved.session.access_token;
    Object.assign(session, saved.session);
  }
  if (saved.images)
    for (const [path, data] of Object.entries(saved.images))
      images.set(path, Buffer.from(data, "base64"));
  uploads = saved.uploads || 0;
}
createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5182");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS",
  );
  response.setHeader("Access-Control-Expose-Headers", "Content-Range");
  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }
  const url = new URL(request.url, "http://127.0.0.1:5181");
  const authorized = request.headers.authorization === `Bearer ${token}`;
  const buffers = [];
  for await (const buffer of request) buffers.push(buffer);
  const bytes = Buffer.concat(buffers);
  let body = {};
  if (
    request.headers["content-type"]?.includes("application/json") &&
    bytes.length
  )
    body = JSON.parse(bytes);
  const json = (data, status = 200) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  };
  if (url.pathname === "/auth/v1/token") {
    if (
      url.searchParams.get("grant_type") === "refresh_token" ||
      (body.email === user.email && body.password === "test-password-only")
    )
      return json(session);
    return json({ msg: "Invalid login credentials" }, 400);
  }
  if (url.pathname === "/auth/v1/user")
    return authorized ? json(user) : json({ msg: "Unauthorized" }, 401);
  if (url.pathname === "/auth/v1/logout") {
    response.writeHead(204);
    response.end();
    return;
  }
  if (url.pathname === "/rest/v1/rpc/current_user_is_admin")
    return json(authorized);
  if (url.pathname === "/rest/v1/rpc/track_product_click") {
    const product = tables.products.find(
      (p) => p.id === body.product_id && p.is_active,
    );
    if (
      product &&
      tables.categories.some((c) => c.id === product.category_id && c.is_active)
    )
      clicks.push({
        product_id: product.id,
        store_id: product.store_id,
        referrer: body.referrer,
        created_at: now(),
      });
    return json(null);
  }
  if (url.pathname === "/rest/v1/rpc/get_analytics_summary") {
    if (!authorized) return json({ message: "Not authorized" }, 403);
    return json({
      total_clicks: clicks.length,
      top_products: tables.products
        .map((p) => ({
          id: p.id,
          name: p.name,
          image_url: p.image_url,
          clicks: clicks.filter((c) => c.product_id === p.id).length,
        }))
        .filter((p) => p.clicks)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 5),
    });
  }
  if (url.pathname.startsWith("/rest/v1/")) {
    const name = url.pathname.split("/").at(-1);
    const table = tables[name];
    if (!table) return json({ message: "Unknown table" }, 404);
    const matches = (row) =>
      [...url.searchParams].every(
        ([key, value]) =>
          !value.startsWith("eq.") ||
          String(
            key === "categories.is_active"
              ? tables.categories.find((c) => c.id === row.category_id)
                  ?.is_active
              : row[key],
          ) === value.slice(3),
      );
    let selected = table.filter(matches);
    if (request.method !== "GET" && !authorized)
      return json({ message: "Not authorized" }, 403);
    if (request.method === "POST") {
      const row = {
        id: randomUUID(),
        created_at: now(),
        updated_at: now(),
        ...body,
      };
      table.push(row);
      selected = [row];
    } else if (request.method === "PATCH")
      selected.forEach((row) =>
        Object.assign(row, body, { updated_at: now() }),
      );
    else if (request.method === "DELETE") {
      if (
        name === "categories" &&
        tables.products.some((p) =>
          selected.some((c) => c.id === p.category_id),
        )
      )
        return json(
          { code: "23503", message: "Category contains products" },
          409,
        );
      tables[name] = table.filter((row) => !selected.includes(row));
    } else if (!authorized) {
      if (name === "categories") selected = selected.filter((c) => c.is_active);
      if (name === "products")
        selected = selected.filter(
          (p) =>
            p.is_active &&
            tables.categories.some(
              (c) => c.id === p.category_id && c.is_active,
            ),
        );
    }
    if (name === "products")
      selected.sort(
        (a, b) =>
          Number(b.is_pinned) - Number(a.is_pinned) ||
          a.sort_order - b.sort_order ||
          Date.parse(b.created_at) - Date.parse(a.created_at),
      );
    if (name === "categories")
      selected.sort((a, b) => a.sort_order - b.sort_order);
    const single = request.headers.accept?.includes(
      "application/vnd.pgrst.object",
    );
    if (single && selected.length !== 1)
      return json({ message: "Expected one row", code: "PGRST116" }, 406);
    return json(single ? selected[0] : selected);
  }
  if (url.pathname.startsWith("/storage/v1/object/public/")) {
    const path = decodeURIComponent(
      url.pathname.replace("/storage/v1/object/public/", ""),
    );
    let image = images.get(path);
    if (!image) return json({ message: "Missing image" }, 404);
    // Older fixture snapshots may contain the SDK multipart envelope.
    if (image.subarray(0, 2).toString() === "--") {
      const boundary = image.subarray(2, image.indexOf("\r\n")).toString();
      const form = await new Response(image, {
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
        },
      }).formData();
      image = Buffer.from(await form.get("").arrayBuffer());
    }
    response.writeHead(200, { "Content-Type": "image/webp" });
    response.end(image);
    return;
  }
  if (url.pathname.startsWith("/storage/v1/object/")) {
    if (!authorized) return json({ message: "Not authorized" }, 403);
    const path = decodeURIComponent(
      url.pathname.replace("/storage/v1/object/", ""),
    );
    if (request.method === "DELETE") {
      for (const prefix of body.prefixes || [])
        images.delete(`${path}/${prefix}`);
      return json([]);
    }
    let image = bytes;
    if (request.headers["content-type"]?.startsWith("multipart/form-data")) {
      const form = await new Response(bytes, {
        headers: { "Content-Type": request.headers["content-type"] },
      }).formData();
      image = Buffer.from(await form.get("").arrayBuffer());
    }
    images.set(path, image);
    uploads++;
    return json({ Id: randomUUID(), Key: path }, 200);
  }
  if (url.pathname === "/__test/results")
    return json({
      tables,
      clicks,
      uploads,
      image_bytes: [...images.values()].map((b) => b.length),
    });
  if (url.pathname === "/__test/export")
    return json({
      tables,
      clicks,
      uploads,
      session,
      images: Object.fromEntries(
        [...images].map(([path, bytes]) => [path, bytes.toString("base64")]),
      ),
    });
  return json({ message: "Not found" }, 404);
}).listen(5181, "127.0.0.1", () =>
  console.log(
    "Test fixture on http://127.0.0.1:5181 — admin@example.test / test-password-only",
  ),
);
