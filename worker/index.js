/* API đồng bộ sổ theo game ID, lưu trong Cloudflare D1.
 *   GET /api/book/:id            -> { rev, data } (rev 0, data null nếu chưa có)
 *   PUT /api/book/:id {baseRev, data} -> { rev } | 409 { rev, data } khi baseRev lệch bản trên máy chủ
 * Chỉ cần game ID, không có mật khẩu: ai biết ID là đọc/ghi được. */
const MAX_BYTES = 1024 * 1024;
const MAX_ID = 40;

export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const m = new URL(req.url).pathname.match(/^\/api\/book\/([^/]+)$/);
    if (!m) return json({ error: 'not_found' }, 404);
    let id;
    try { id = decodeURIComponent(m[1]).trim(); } catch (e) { return json({ error: 'bad_id' }, 400); }
    if (!id || id.length > MAX_ID) return json({ error: 'bad_id' }, 400);

    const read = async () => {
      const row = await env.DB.prepare('SELECT data, rev FROM books WHERE id = ?').bind(id).first();
      return row ? { rev: row.rev, data: JSON.parse(row.data) } : { rev: 0, data: null };
    };

    if (req.method === 'GET') return json(await read());

    if (req.method === 'PUT') {
      const text = await req.text();
      if (text.length > MAX_BYTES) return json({ error: 'too_large' }, 413);
      let body;
      try { body = JSON.parse(text); } catch (e) { return json({ error: 'bad_json' }, 400); }
      const d = body && body.data;
      const base = Number(body && body.baseRev);
      if (!d || !Array.isArray(d.disciples) || !Array.isArray(d.expelled) || !Number.isInteger(base) || base < 0) {
        return json({ error: 'bad_body' }, 400);
      }
      const data = JSON.stringify({ disciples: d.disciples, expelled: d.expelled });
      const now = new Date().toISOString();
      const res = base === 0
        ? await env.DB.prepare('INSERT INTO books (id, data, rev, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(id) DO NOTHING').bind(id, data, now).run()
        : await env.DB.prepare('UPDATE books SET data = ?, rev = rev + 1, updated_at = ? WHERE id = ? AND rev = ?').bind(data, now, id, base).run();
      if (res.meta.changes === 1) return json({ rev: base + 1 });
      return json(await read(), 409);
    }
    return json({ error: 'method' }, 405);
  },
};
