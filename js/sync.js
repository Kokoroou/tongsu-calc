/* Đồng bộ sổ giữa các thiết bị theo game ID. Phần quyết định (decide) là hàm thuần để test. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Sync = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  /**
   * local: { rev, dirty, empty } — rev là bản máy chủ mà máy này dựa vào, dirty = có thay đổi chưa đẩy lên.
   * remote: { rev } — rev 0 nghĩa là máy chủ chưa có sổ.
   * Trả về: 'none' | 'push' | 'adopt' (lấy bản máy chủ) | 'conflict' (cả hai cùng đổi, để người dùng chọn).
   */
  function decide(local, remote) {
    if (remote.rev === 0) return local.empty && !local.dirty ? 'none' : 'push';
    if (remote.rev === local.rev) return local.dirty ? 'push' : 'none';
    return local.dirty && !local.empty ? 'conflict' : 'adopt';
  }

  const G = typeof window !== 'undefined' ? window : {};
  const url = (id) => String(G.SYNC_URL || '').replace(/\/+$/, '') + '/api/book/' + encodeURIComponent(id);
  const enabled = () => !!G.SYNC_URL;

  async function pull(id) {
    const r = await fetch(url(id));
    if (!r.ok) throw new Error('pull ' + r.status);
    return r.json();
  }

  /** Đẩy lên máy chủ. Trả { ok:true, rev } hoặc { ok:false, conflict:true, remote } khi bản máy chủ đã khác. */
  async function push(id, baseRev, data) {
    const r = await fetch(url(id), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseRev, data: { disciples: data.disciples, expelled: data.expelled } }),
    });
    if (r.status === 409) return { ok: false, conflict: true, remote: await r.json() };
    if (!r.ok) throw new Error('push ' + r.status);
    const j = await r.json();
    return { ok: true, rev: j.rev };
  }

  return { decide, enabled, pull, push };
});
