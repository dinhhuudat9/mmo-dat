
/* ============================================================
   ADMIN MODULE - Loaded dynamically for security
   ============================================================ */

window._adminActiveTab = window._adminActiveTab || 'overview';

window.setAdminTab = function(tab) {
    window._adminActiveTab = tab;
    const target = document.getElementById('page-admin');
    if (target) {
        target.innerHTML = adminHTML();
    }
};

window.adminHTML = function() {
    if (!isAdmin()) return `<div class="glass-panel"><p>Truy cập bị từ chối.</p></div>`;
    
    const tab = window._adminActiveTab;
    const pendingDeposits = Object.entries(DB.users || {}).flatMap(([email, u]) => (u.depositRequests || []).map(r => ({ ...r, userEmail: email }))).filter(r => r.status === 'pending');
    const pendingOrders = (DB.orders || []).filter(o => o.status === 'pending');
    const pendingTickets = getAdminTickets().filter(ticket => (ticket.status || 'pending') === 'pending');
    const pendingCustomOrders = getAdminCustomOrders().filter(o => (o.status || 'pending') === 'pending');
    
    const navItems = [
        { id: 'overview', icon: 'bi-grid-1x2', label: 'Tổng quan' },
        { id: 'users', icon: 'bi-people', label: 'Thành viên' },
        { id: 'products', icon: 'bi-box-seam', label: 'Sản phẩm' },
        { id: 'resources', icon: 'bi-folder2-open', label: 'Tài nguyên' },
        { id: 'orders', icon: 'bi-cart-check', label: 'Đơn hàng' },
        { id: 'tickets', icon: 'bi-life-preserver', label: 'Ticket' },
        { id: 'custom-orders', icon: 'bi-code-slash', label: 'Web/Tool' },
        { id: 'settings', icon: 'bi-gear', label: 'Cài đặt' }
    ];

    return `
  <div class="hero" style="padding:24px;margin-bottom:18px;background:linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))">
    <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
            <h1 style="margin:0;font-size:1.8rem">Quản trị Hệ thống</h1>
            <p style="margin:5px 0 0;opacity:0.7">Quản lý toàn bộ hoạt động của MMO Studio</p>
        </div>
        <div class="badge badge-blue"><i class="bi bi-shield-lock"></i> Firebase Security Active</div>
    </div>
  </div>

  <div class="admin-tabs" style="display:flex;gap:10px;margin-bottom:20px;overflow-x:auto;padding-bottom:5px">
    ${navItems.map(item => `
        <button class="btn ${tab === item.id ? 'btn-primary' : 'btn-ghost'}" onclick="setAdminTab('${item.id}')" style="white-space:nowrap">
            <i class="bi ${item.icon}"></i> ${item.label}
        </button>
    `).join('')}
  </div>

  <div class="admin-content-area animate-fade-in">
    ${renderTabContent(tab, pendingDeposits, pendingOrders, pendingTickets, pendingCustomOrders)}
  </div>
    `;
};

function renderTabContent(tab, pendingDeposits, pendingOrders, pendingTickets, pendingCustomOrders) {
    switch(tab) {
        case 'overview': return renderOverview(pendingDeposits, pendingOrders, pendingTickets, pendingCustomOrders);
        case 'users': return renderUsers();
        case 'products': return renderProducts();
        case 'resources': return renderResources();
        case 'orders': return renderOrders();
        case 'tickets': return renderTickets();
        case 'custom-orders': return renderCustomOrders();
        case 'settings': return renderSettings();
        default: return '';
    }
}

function renderOverview(pendingDeposits, pendingOrders, pendingTickets, pendingCustomOrders) {
    return `
    <div class="stats-grid">
        <div class="stat" style="background:rgba(99,102,241,0.1)">
            <div style="font-size:1.5rem;margin-bottom:8px;color:var(--indigo)"><i class="bi bi-people"></i></div>
            <h3>${Object.keys(DB.users || {}).length}</h3><p>Thành viên</p>
        </div>
        <div class="stat" style="background:rgba(34,197,94,0.1)">
            <div style="font-size:1.5rem;margin-bottom:8px;color:var(--green)"><i class="bi bi-cart-check"></i></div>
            <h3>${(DB.orders || []).length}</h3><p>Đơn hàng</p>
        </div>
        <div class="stat" style="background:rgba(245,158,11,0.1)">
            <div style="font-size:1.5rem;margin-bottom:8px;color:var(--amber)"><i class="bi bi-cash-stack"></i></div>
            <h3>${pendingDeposits.length}</h3><p>Nạp chờ duyệt</p>
        </div>
        <div class="stat" style="background:rgba(6,182,212,0.1)">
            <div style="font-size:1.5rem;margin-bottom:8px;color:var(--blue)"><i class="bi bi-box-seam"></i></div>
            <h3>${(DB.products || []).length}</h3><p>Sản phẩm</p>
        </div>
        <div class="stat" style="background:rgba(59,130,246,0.1)">
            <div style="font-size:1.5rem;margin-bottom:8px;color:var(--blue)"><i class="bi bi-life-preserver"></i></div>
            <h3>${pendingTickets.length}</h3><p>Ticket chờ xử lý</p>
        </div>
        <div class="stat" style="background:rgba(99,102,241,0.1)">
            <div style="font-size:1.5rem;margin-bottom:8px;color:var(--indigo)"><i class="bi bi-code-slash"></i></div>
            <h3>${pendingCustomOrders.length}</h3><p>Web/Tool chờ xử lý</p>
        </div>
    </div>
    
    <div class="split">
        <div class="glass-panel">
            <h3>💵 Nạp tiền chờ duyệt (${pendingDeposits.length})</h3>
            <div id="depositRequests">
                ${pendingDeposits.map(r => `
                    <div class="tx-item" style="margin-top:10px">
                        <div>
                            <b>${esc(r.userEmail)}</b>
                            <div style="font-size:.8rem;color:var(--muted)">${esc(r.note || 'Không có ghi chú')}</div>
                        </div>
                        <div style="text-align:right">
                            <div style="color:var(--green);font-weight:700">+${safeNum(r.amount).toLocaleString()}đ</div>
                            <div class="toolbar" style="margin-top:5px">
                                <button class="btn btn-primary btn-sm" onclick="approveDeposit('${r.userEmail}',${r.id})">Duyệt</button>
                                <button class="btn btn-danger btn-sm" onclick="rejectDeposit('${r.userEmail}',${r.id})">Xóa</button>
                            </div>
                        </div>
                    </div>
                `).join('') || '<p style="opacity:0.5;text-align:center;padding:20px">Không có yêu cầu nào</p>'}
            </div>
        </div>
        <div class="glass-panel">
            <h3>📦 Đơn hàng mới (${pendingOrders.length})</h3>
            ${pendingOrders.map(o => `
                <div class="tx-item" style="margin-top:10px">
                    <div>
                        <b>${esc(o.service)}</b>
                        <div style="font-size:.8rem;color:var(--muted)">${esc(o.userEmail)}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700">${safeNum(o.price).toLocaleString()}đ</div>
                        <div class="toolbar" style="margin-top:5px">
                            <button class="btn btn-primary btn-sm" onclick="setOrderStatus(${o.id},'approved')">Xử lý</button>
                            <button class="btn btn-ghost btn-sm" onclick="setOrderStatus(${o.id},'rejected')">Hủy</button>
                        </div>
                    </div>
                </div>
            `).join('') || '<p style="opacity:0.5;text-align:center;padding:20px">Đã xử lý hết đơn hàng</p>'}
        </div>
    </div>
    
    <div class="glass-panel">
        <h3>🚀 Tiện ích hệ thống</h3>
        <div class="toolbar">
            <button class="btn btn-ghost" onclick="exportDB()"><i class="bi bi-cloud-download"></i> Backup Database</button>
            <button class="btn btn-ghost" onclick="importDBPrompt()"><i class="bi bi-cloud-upload"></i> Restore</button>
            <button class="btn btn-danger" onclick="resetDB()"><i class="bi bi-exclamation-triangle"></i> Reset Toàn bộ</button>
        </div>
    </div>
    `;
}

/* ============================================================
   ADMIN ACTIONS
   ============================================================ */

window.approveDeposit = function(email, id) {
    const u = DB.users[email];
    if (!u) return notify('Không tìm thấy người dùng.', 'error');
    
    const reqIndex = (u.depositRequests || []).findIndex(r => r.id === id);
    if (reqIndex === -1) return notify('Không tìm thấy yêu cầu.', 'error');
    
    const req = u.depositRequests[reqIndex];
    if (req.status !== 'pending') return notify('Yêu cầu này đã được xử lý.');

    const amount = safeNum(req.amount);
    const newBalance = safeNum(u.balance) + amount;

    // Firebase Granular Update
    const encoded = encodeEmail(email);
    const updates = {};
    updates[`users/${encoded}/balance`] = newBalance;
    updates[`users/${encoded}/depositRequests/${reqIndex}/status`] = 'approved';
    
    // Thêm thông báo
    const notifId = uid();
    const notif = {
        id: notifId,
        userEmail: email,
        message: `✅ Yêu cầu nạp tiền ${amount.toLocaleString()}đ của bạn đã được DUYỆT thành công.`,
        timestamp: now(),
        read: false
    };
    
    dbUpdate('/', updates)
        .then(() => dbPush(`notifications`, notif))
        .then(() => {
            notify(`✅ Đã duyệt +${amount.toLocaleString()}đ cho ${u.name}`);
            setAdminTab('overview');
        })
        .catch(err => notify('Lỗi Firebase: ' + err.message, 'error'));
};

window.rejectDeposit = function(email, id) {
    if (!confirm('Bạn có chắc chắn muốn xóa yêu cầu này?')) return;
    const u = DB.users[email];
    if (!u) return;
    const encoded = encodeEmail(email);
    const filtered = (u.depositRequests || []).filter(r => r.id !== id);
    dbSet(`users/${encoded}/depositRequests`, filtered).then(() => {
        notify('Đã xóa yêu cầu nạp tiền.');
        setAdminTab('overview');
    });
};

window.adjustBalance = function(email) {
    const u = DB.users[email];
    if (!u) return;
    const n = prompt(`Nhập số tiền muốn CỘNG cho ${u.name} (ví dụ: 10000 hoặc -10000):`, '0');
    if (n === null) return;
    const amount = parseInt(n, 10);
    if (isNaN(amount)) return notify('Số tiền không hợp lệ.', 'error');
    
    const newBalance = safeNum(u.balance) + amount;
    dbSet(`users/${encodeEmail(email)}/balance`, newBalance).then(() => {
        notify(`Đã cập nhật số dư cho ${u.name}`);
        setAdminTab('users');
    });
};

window.setRole = function(email) {
    const u = DB.users[email];
    if (!u) return;
    const newRole = prompt(`Nhập role cho ${u.name} (admin hoặc member):`, u.role || 'member');
    if (!newRole) return;
    dbSet(`users/${encodeEmail(email)}/role`, newRole.trim().toLowerCase()).then(() => {
        notify(`Đã đổi role của ${u.name}`);
        setAdminTab('users');
    });
};

window.deleteUser = function(email) {
    if (email === currentEmail()) return notify('Bạn không thể tự xóa chính mình.', 'error');
    if (!confirm(`Xóa vĩnh viễn người dùng ${email}?`)) return;
    dbSet(`users/${encodeEmail(email)}`, null).then(() => {
        notify('Đã xóa người dùng.');
        setAdminTab('users');
    });
};

function renderUsers() {
    return `
    <div class="glass-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
            <h3 style="margin:0">Quản lý Thành viên</h3>
            <div class="badge badge-blue">${Object.keys(DB.users || {}).length} users</div>
        </div>
        <div style="display:grid;gap:10px">
            ${Object.entries(DB.users || {}).map(([email, u]) => `
                <div class="tx-item">
                    <div style="display:flex;gap:12px;align-items:center">
                        <div class="avatar-sm" style="background:var(--indigo-grad)">${(u.name || '?').charAt(0).toUpperCase()}</div>
                        <div>
                            <b>${esc(u.name)}</b> ${u.tick ? '<i class="bi bi-patch-check-fill" style="color:var(--blue)"></i>' : ''}
                            <div style="font-size:.8rem;color:var(--muted)">${esc(email)} | <span class="badge ${u.role === 'admin' ? 'badge-amber' : 'badge-blue'}">${u.role}</span></div>
                        </div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700;color:var(--green)">${safeNum(u.balance).toLocaleString()}đ</div>
                        <div class="toolbar" style="margin-top:8px;justify-content:flex-end">
                            <button class="btn btn-ghost btn-sm" onclick="toggleTick('${email}')" title="Bật/Tắt tích xanh"><i class="bi bi-patch-check-fill" style="color:${u.tick ? 'var(--blue)' : 'var(--muted)'}"></i></button>
                            <button class="btn btn-ghost btn-sm" onclick="adjustBalance('${email}')">Tiền</button>
                            <button class="btn btn-ghost btn-sm" onclick="setRole('${email}')">Role</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteUser('${email}')"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

function renderProducts() {
    return `
    <div class="glass-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
            <h3 style="margin:0">Danh sách Sản phẩm</h3>
            <button class="btn btn-primary btn-sm" onclick="openAddProductModal()"><i class="bi bi-plus-lg"></i> Thêm mới</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:15px">
            ${(DB.products || []).map(p => `
                <div class="tx-item" style="flex-direction:column;align-items:flex-start">
                    <div style="display:flex;gap:12px;width:100%">
                        <div class="history-thumb" style="background-image:url('${esc(p.image || '')}');width:60px;height:60px"></div>
                        <div style="flex:1">
                            <b>${esc(p.name)}</b>
                            <div style="color:var(--indigo);font-weight:700">${safeNum(p.price).toLocaleString()}đ</div>
                            <div style="font-size:.75rem;color:var(--muted)">Kho: ${p.stock} | Đã bán: ${p.sold}</div>
                        </div>
                    </div>
                    <div class="toolbar" style="width:100%;margin-top:12px;justify-content:space-between">
                        <span class="badge badge-blue">${esc(p.category)}</span>
                        <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})"><i class="bi bi-trash"></i> Xóa</button>
                    </div>
                </div>
            `).join('') || '<p>Chưa có sản phẩm nào</p>'}
        </div>
    </div>
    `;
}

function renderResources() {
    return `
    <div class="glass-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
            <h3 style="margin:0">Kho Tài nguyên</h3>
            <button class="btn btn-primary btn-sm" onclick="openAddResourceModal()"><i class="bi bi-plus-lg"></i> Đăng tải</button>
        </div>
        <div style="display:grid;gap:10px">
            ${(DB.resources || []).map(r => `
                <div class="tx-item">
                    <div>
                        <b>${esc(r.title)}</b>
                        <div style="font-size:.8rem;color:var(--muted)">${esc(r.category)} | Tác giả: ${esc(r.author)}</div>
                    </div>
                    <div class="toolbar">
                        <button class="btn btn-danger btn-sm" onclick="deleteResource(${r.id})"><i class="bi bi-trash"></i></button>
                    </div>
                </div>
            `).join('') || '<p>Trống</p>'}
        </div>
    </div>
    `;
}

function renderOrders() {
    return `
    <div class="glass-panel">
        <h3>Lịch sử Đơn hàng</h3>
        <div style="display:grid;gap:10px">
            ${(DB.orders || []).slice().reverse().map(o => `
                <div class="tx-item">
                    <div>
                        <span class="badge ${o.status === 'approved' ? 'badge-green' : (o.status === 'rejected' ? 'badge-red' : 'badge-amber')}">#${o.id}</span>
                        <b>${esc(o.service)}</b>
                        <div style="font-size:.8rem;color:var(--muted)">${esc(o.userEmail)} | ${esc(o.type)}</div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700">${safeNum(o.price).toLocaleString()}đ</div>
                        <div style="font-size:.7rem;opacity:0.6">${o.createdAt || ''}</div>
                    </div>
                </div>
            `).join('') || '<p>Chưa có đơn hàng nào</p>'}
        </div>
    </div>
    `;
}

function getAdminTickets() {
    const raw = DB.tickets || [];
    const list = Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw).filter(Boolean);
    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt || b.date || 0).getTime() - new Date(a.updatedAt || a.createdAt || a.date || 0).getTime());
}

function adminTicketStatusLabel(status) {
    return ({ pending: 'Đang chờ', processing: 'Đang xử lý', closed: 'Đã đóng' })[status] || status || 'Đang chờ';
}

function adminTicketStatusClass(status) {
    return status === 'closed' ? 'badge-green' : (status === 'processing' ? 'badge-blue' : 'badge-amber');
}

function renderAdminTicketReplies(ticket) {
    const replies = ensureArray(ticket?.replies).filter(Boolean);
    if (!replies.length) return '';
    return `<div style="margin-top:12px;display:grid;gap:8px">
        ${replies.map(reply => `<div style="padding:10px 12px;border-radius:12px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.18)">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
                <strong style="font-size:.85rem">${esc(reply.authorName || reply.author || 'Admin')}</strong>
                <span style="font-size:.72rem;color:var(--muted)">${new Date(reply.time || now()).toLocaleString('vi-VN')}</span>
            </div>
            <div style="white-space:pre-wrap;margin-top:6px;color:#dbe4f0">${esc(reply.message || '')}</div>
        </div>`).join('')}
    </div>`;
}

function renderTickets() {
    const rows = getAdminTickets();
    return `
    <div class="glass-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;gap:12px;flex-wrap:wrap">
            <h3 style="margin:0">Hỗ trợ / Ticket</h3>
            <div class="badge badge-blue">${rows.length} ticket</div>
        </div>
        <div style="display:grid;gap:10px">
            ${rows.map(ticket => `
                <div class="tx-item" style="align-items:flex-start">
                    <div style="min-width:0">
                        <span class="badge ${adminTicketStatusClass(ticket.status)}">#${ticket.id} • ${adminTicketStatusLabel(ticket.status)}</span>
                        <div style="font-weight:800;margin-top:8px">${esc(ticket.title || 'Ticket')}</div>
                        <div style="font-size:.8rem;color:var(--muted);margin-top:6px">${esc(ticket.userEmail || '')} | ${new Date(ticket.createdAt || ticket.date || now()).toLocaleString('vi-VN')}</div>
                        <div style="white-space:pre-wrap;margin-top:10px;color:#e5e7eb">${esc(ticket.content || ticket.detail || '')}</div>
                        ${renderAdminTicketReplies(ticket)}
                        <div style="margin-top:12px">
                            <textarea id="ticketReply-${ticket.id}" rows="3" placeholder="Nhập phản hồi cho người dùng..." style="width:100%;padding:12px;background:#030712;border:1px solid var(--border);border-radius:14px;color:#fff;resize:vertical"></textarea>
                        </div>
                    </div>
                    <div class="toolbar" style="justify-content:flex-end">
                        <button class="btn btn-primary btn-sm" onclick="replyTicket(${ticket.id})">Phản hồi</button>
                        <button class="btn btn-primary btn-sm" onclick="setTicketStatus(${ticket.id},'processing')">Xử lý</button>
                        <button class="btn btn-ghost btn-sm" onclick="setTicketStatus(${ticket.id},'pending')">Chờ</button>
                        <button class="btn btn-success btn-sm" onclick="setTicketStatus(${ticket.id},'closed')">Đóng</button>
                    </div>
                </div>
            `).join('') || '<p>Chưa có ticket nào.</p>'}
        </div>
    </div>
    `;
}

function getAdminCustomOrders() {
    const raw = DB.customOrders || [];
    const list = Array.isArray(raw) ? raw.filter(Boolean) : Object.values(raw).filter(Boolean);
    return list
        .filter(o => o.kind === 'web_tool' || o.type === 'web_tool' || o.title === 'Đặt làm Web/Tool')
        .sort((a, b) => new Date(b.date || b.createdAt || b.time || 0).getTime() - new Date(a.date || a.createdAt || a.time || 0).getTime());
}

function adminCustomStatusLabel(status) {
    return ({ pending: 'Đang chờ', approved: 'Đã duyệt', rejected: 'Từ chối' })[status] || status || 'Đang chờ';
}

function adminCustomStatusClass(status) {
    return status === 'approved' ? 'badge-green' : (status === 'rejected' ? 'badge-red' : 'badge-amber');
}

function renderCustomOrders() {
    const rows = getAdminCustomOrders();
    return `
    <div class="glass-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;gap:12px;flex-wrap:wrap">
            <h3 style="margin:0">Yêu cầu làm Web/Tool</h3>
            <div class="badge badge-blue">${rows.length} yêu cầu</div>
        </div>
        <div style="display:grid;gap:10px">
            ${rows.map(o => `
                <div class="tx-item" style="align-items:flex-start">
                    <div style="min-width:0">
                        <span class="badge ${adminCustomStatusClass(o.status)}">#${o.id} • ${adminCustomStatusLabel(o.status)}</span>
                        <div style="font-size:.8rem;color:var(--muted);margin-top:8px">${esc(o.userEmail || 'Ẩn danh')} | ${new Date(o.date || o.createdAt || o.time || now()).toLocaleString('vi-VN')}</div>
                        <div style="white-space:pre-wrap;margin-top:8px;color:#e5e7eb">${esc(o.detail || o.description || '')}</div>
                    </div>
                    <div class="toolbar" style="justify-content:flex-end">
                        <button class="btn btn-primary btn-sm" onclick="setCustomOrderStatus(${o.id},'approved')">Duyệt</button>
                        <button class="btn btn-ghost btn-sm" onclick="setCustomOrderStatus(${o.id},'pending')">Chờ</button>
                        <button class="btn btn-danger btn-sm" onclick="setCustomOrderStatus(${o.id},'rejected')">Từ chối</button>
                    </div>
                </div>
            `).join('') || '<p>Chưa có yêu cầu Web/Tool nào.</p>'}
        </div>
    </div>
    `;
}

function renderSettings() {
    return `
    <div class="glass-panel">
        <h3>📢 Thông báo hệ thống (Broadcast)</h3>
        <div style="display:flex;gap:10px">
            <input id="bulkMsg" placeholder="Nhập nội dung thông báo gửi đến toàn bộ user..." style="flex:1;padding:12px;background:#030712;border:1px solid var(--border);border-radius:14px;color:#fff">
            <button class="btn btn-primary" onclick="sendAdminNotif()">Gửi ngay</button>
        </div>
    </div>

    <div class="glass-panel">
        <h3>🎁 Quản lý Voucher</h3>
        <form id="voucherAdminForm" onsubmit="event.preventDefault(); saveVoucherFromAdmin();">
            <div class="split">
                <div class="form-group"><label>Mã Voucher</label><input id="voucherAdminCode" placeholder="MMO2026" required></div>
                <div class="form-group"><label>Số tiền tặng</label><input id="voucherAdminAmount" type="number" value="5000" required></div>
            </div>
            <button class="btn btn-primary btn-block">Tạo Voucher</button>
        </form>
        <div style="margin-top:15px">
            ${(DB.vouchers || []).map(v => `
                <div class="tx-item" style="margin-top:5px">
                    <span><b>${esc(v.code)}</b> (+${safeNum(v.amount).toLocaleString()}đ)</span>
                    <button class="btn btn-danger btn-sm" onclick="deleteVoucherAdmin('${v.code}')">Xóa</button>
                </div>
            `).join('')}
        </div>
    </div>

    <div class="glass-panel">
        <h3>⚙️ Cấu hình nhanh</h3>
        <div class="form-group"><label>Tên Website</label><input id="siteName" value="${esc(DB.settings.siteName)}"></div>
        <div class="form-group">
            <label>Chế độ bảo trì</label>
            <select id="maintenanceMode" class="btn-block" style="padding:10px;background:#030712;color:#fff;border:1px solid var(--border);border-radius:12px">
                <option value="false" ${!DB.settings.maintenance ? 'selected' : ''}>Tắt (Hoạt động bình thường)</option>
                <option value="true" ${DB.settings.maintenance ? 'selected' : ''}>Bật (Chỉ Admin mới vào được)</option>
            </select>
        </div>
        <div class="form-group"><label>Thưởng giới thiệu (VNĐ)</label><input id="referralReward" type="number" min="0" value="${safeNum(DB.settings.referralReward || 5000)}"></div>
        <div class="split">
            <div class="form-group"><label>Facebook</label><input id="contactFacebook" value="${esc(DB.settings.contactInfo?.facebook || '')}"></div>
            <div class="form-group"><label>Zalo</label><input id="contactZalo" value="${esc(DB.settings.contactInfo?.zalo || '')}"></div>
        </div>
        <div class="split">
            <div class="form-group"><label>Telegram</label><input id="contactTelegram" value="${esc(DB.settings.contactInfo?.telegram || '')}"></div>
            <div class="form-group"><label>TikTok</label><input id="contactTiktok" value="${esc(DB.settings.contactInfo?.tiktok || '')}"></div>
        </div>
        <button class="btn btn-primary btn-block" onclick="saveQuickSettings()">Lưu thay đổi</button>
    </div>
    
    <div class="glass-panel">
        <h3>💰 Giá dịch vụ Buff</h3>
        ${Object.entries(DB.settings.buffPrices || {}).map(([platform, types]) => `
            <details style="margin-top:10px;background:rgba(255,255,255,0.03);padding:10px;border-radius:12px">
                <summary style="cursor:pointer;font-weight:700">${platform.toUpperCase()}</summary>
                <div style="padding-top:10px">
                    ${Object.entries(types).map(([type, val]) => `
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                            <span style="min-width:120px;font-size:.9rem">${esc(type)}</span>
                            <input type="number" value="${val}" style="width:80px;padding:5px;background:#000;color:#fff;border:1px solid var(--border)" onchange="updateBuffPriceSetting('${platform}','${type}',this.value)">
                            <span style="font-size:.8rem;opacity:0.6">đ/1k</span>
                        </div>
                    `).join('')}
                </div>
            </details>
        `).join('')}
    </div>
    `;
}

window.saveVoucherFromAdmin = function() {
    const code = ($('#voucherAdminCode')?.value || '').trim().toUpperCase();
    const amount = parseInt($('#voucherAdminAmount')?.value || '0', 10);
    if(!code || isNaN(amount)) return notify('Thông tin không hợp lệ', 'error');
    
    DB.vouchers = DB.vouchers || [];
    DB.vouchers.push({ code, amount, active: true, usedBy: [], note: 'Admin created' });
    saveNow().then(() => { notify('Đã tạo Voucher'); setAdminTab('settings'); });
};

/* These functions use saveNow() for reliable Firebase persistence */

window.setOrderStatus = function (id, status) {
    const o = (DB.orders || []).find(x => x.id === id); if (!o) return;
    o.status = status;
    saveNow().then(() => {
        if (o.userEmail) addNotification(o.userEmail, `Đơn #${o.id} cập nhật: ${status}`);
        notify('Đã cập nhật đơn.');
        setAdminTab('overview');
    });
};

window.setTicketStatus = function(id, status) {
    const list = getAdminTickets();
    const ticket = list.find(x => String(x.id) === String(id));
    if (!ticket) return notify('Không tìm thấy ticket.', 'error');

    ticket.status = status;
    ticket.updatedAt = now();
    const notificationList = getNotificationList();
    if (ticket.userEmail) {
        notificationList.unshift(createNotificationRecord(ticket.userEmail, `Ticket #${ticket.id} cập nhật: ${adminTicketStatusLabel(status)}`, { title: 'Hỗ trợ', kind: 'ticket_status', ticketId: ticket.id }));
    }

    Promise.all([
        persistTicketList(list),
        persistNotifications(notificationList)
    ]).then(() => {
        notify('Đã cập nhật ticket.');
        setAdminTab('tickets');
    }).catch(err => notify('Lỗi Firebase: ' + (err?.message || err), 'error'));
};

window.replyTicket = function(id) {
    const list = getAdminTickets();
    const ticket = list.find(x => String(x.id) === String(id));
    if (!ticket) return notify('Không tìm thấy ticket.', 'error');

    const input = document.getElementById(`ticketReply-${id}`);
    const message = (input?.value || '').trim();
    if (message.length < 2) return notify('Nhập nội dung phản hồi.', 'error');

    ticket.replies = ensureArray(ticket.replies);
    ticket.replies.push({
        id: uid(),
        author: currentEmail() || 'admin',
        authorName: (user()?.name || 'Admin'),
        message,
        time: now()
    });
    ticket.status = ticket.status === 'closed' ? 'closed' : 'processing';
    ticket.updatedAt = now();

    const notificationList = getNotificationList();
    notificationList.unshift(createNotificationRecord(ticket.userEmail, `Admin đã phản hồi ticket #${ticket.id}.`, {
        title: 'Phản hồi ticket',
        detail: message,
        kind: 'ticket_reply',
        ticketId: ticket.id
    }));

    Promise.all([
        persistTicketList(list),
        persistNotifications(notificationList)
    ]).then(() => {
        notify('Đã gửi phản hồi cho ticket.');
        setAdminTab('tickets');
    }).catch(err => notify('Lỗi Firebase: ' + (err?.message || err), 'error'));
};

window.setCustomOrderStatus = function(id, status) {
    const raw = DB.customOrders || [];
    let order = null;

    if (Array.isArray(raw)) {
        order = raw.find(x => String(x.id) === String(id));
    } else {
        const key = Object.keys(raw).find(k => String(raw[k]?.id) === String(id));
        if (key) order = raw[key];
    }

    if (!order) return notify('Không tìm thấy yêu cầu Web/Tool.', 'error');

    order.status = status;
    order.updatedAt = now();

    if (order.userEmail) {
        DB.notifications = DB.notifications || [];
        DB.notifications.unshift({
            id: uid(),
            userEmail: order.userEmail,
            title: 'Web/Tool',
            message: `Yêu cầu Web/Tool #${order.id} cập nhật: ${adminCustomStatusLabel(status)}`,
            read: false,
            kind: 'normal',
            system: false,
            timestamp: now()
        });
        DB.notifications = DB.notifications.slice(0, 400);
    }

    saveNow().then(() => {
        notify('Đã cập nhật yêu cầu Web/Tool.');
        setAdminTab('custom-orders');
    }).catch(err => notify('Lỗi Firebase: ' + (err?.message || err), 'error'));
};

window.updateBuffPriceSetting = function (platform, type, val) {
    DB.settings.buffPrices[platform][type] = parseInt(val || '50', 10);
    saveNow();
};

window.toggleTick = function (email) {
    DB.users[email].tick = !DB.users[email].tick;
    saveNow().then(() => setAdminTab('users'));
};

window.sendAdminNotif = function () {
    const msg = ($('#bulkMsg')?.value || '').trim(); if (!msg) return notify('Nhập nội dung.', 'error');
    Object.keys(DB.users || {}).forEach(email => addNotification(email, msg, { kind: 'broadcast', system: true, title: 'Thông báo hệ thống' }));
    DB.announcements.unshift({ id: uid(), title: 'Thông báo hệ thống', body: msg, pinned: true, author: currentEmail() || 'admin', timestamp: now() });
    DB.announcements = DB.announcements.slice(0, 40);
    saveNow().then(() => {
        if ($('#bulkMsg')) $('#bulkMsg').value = '';
        notify('Đã gửi thông báo.'); setAdminTab('settings');
    });
};

window.openAddProductModal = function() {
    openModal(`
        <div class="hero"><h1>Thêm sản phẩm mới</h1></div>
        <form id="addProductForm" onsubmit="saveProductAdmin(event)">
            <div class="split">
                <div class="form-group"><label>Tên sản phẩm</label><input id="pName" required></div>
                <div class="form-group"><label>Giá (đ)</label><input id="pPrice" type="number" value="10000" required></div>
            </div>
            <div class="split">
                <div class="form-group"><label>Danh mục</label><input id="pCat" value="Tool"></div>
                <div class="form-group"><label>Số lượng kho</label><input id="pStock" type="number" value="999"></div>
            </div>
            <div class="form-group"><label>Hình ảnh sản phẩm</label><input type="file" id="pImageFile" accept="image/*"></div>
            <div class="form-group"><label>Link sản phẩm / Source</label><input id="pLink" placeholder="Link tải hoặc truy cập"></div>
            <div class="form-group"><label>Mô tả ngắn</label><textarea id="pDesc" rows="3"></textarea></div>
            <button class="btn btn-primary btn-block" id="pSubmitBtn">Lưu sản phẩm</button>
        </form>
    `);
}

window.saveProductAdmin = async function(e) {
    e.preventDefault();
    const btn = $('#pSubmitBtn');
    const file = $('#pImageFile')?.files[0];
    
    try {
        btn.disabled = true;
        btn.textContent = 'Đang tải ảnh...';
        
        let imageUrl = '';
        if (file) {
            imageUrl = await uploadToImgBB(file);
            if (!imageUrl) throw new Error('Không thể tải ảnh lên ImgBB');
        }

        const newProduct = {
            id: Date.now(),
            name: $('#pName').value,
            price: parseInt($('#pPrice').value, 10),
            category: $('#pCat').value || 'Khác',
            stock: parseInt($('#pStock').value, 10),
            image: imageUrl,
            link: $('#pLink').value,
            desc: $('#pDesc').value,
            sold: 0, status: 'active', createdAt: now()
        };

        // Tìm index tiếp theo trong mảng products (nếu coi như array)
        const nextIndex = (DB.products || []).length;
        await dbSet(`products/${nextIndex}`, newProduct);
        
        notify('Đã thêm sản phẩm.'); 
        closeModal(); 
        setAdminTab('products');
    } catch (err) {
        notify(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu sản phẩm';
    }
}

window.deleteProduct = function(id) {
    if (!confirm('Xóa sản phẩm này?')) return;
    const filtered = (DB.products || []).filter(p => String(p.id) !== String(id));
    dbSet(`products`, filtered).then(() => { 
        notify('Đã xóa sản phẩm.'); 
        setAdminTab('products'); 
    });
}

window.openAddResourceModal = function() {
    openModal(`
        <div class="hero"><h1>Thêm tài nguyên mới</h1></div>
        <form id="addResourceForm" onsubmit="saveResourceAdmin(event)">
            <div class="form-group"><label>Tiêu đề</label><input id="rTitle" required></div>
            <div class="split">
                <div class="form-group"><label>Danh mục</label><input id="rCat" value="Source"></div>
                <div class="form-group"><label>Tác giả</label><input id="rAuthor" value="Admin"></div>
            </div>
            <div class="form-group"><label>Link tải file (URL)</label><input id="rUrl" placeholder="https://..."></div>
            <div class="form-group"><label>Ảnh minh họa</label><input type="file" id="rThumbFile" accept="image/*"></div>
            <div class="form-group"><label>Mô tả</label><textarea id="rDesc" rows="3"></textarea></div>
            <button class="btn btn-primary btn-block" id="rSubmitBtn">Lưu tài nguyên</button>
        </form>
    `);
}

window.saveResourceAdmin = async function(e) {
    e.preventDefault();
    const btn = $('#rSubmitBtn');
    const file = $('#rThumbFile')?.files[0];

    try {
        btn.disabled = true;
        btn.textContent = 'Đang tải ảnh...';

        let thumbUrl = '';
        if (file) {
            thumbUrl = await uploadToImgBB(file);
            if (!thumbUrl) throw new Error('Không thể tải ảnh lên ImgBB');
        }

        const newRes = {
            id: Date.now(),
            title: $('#rTitle').value,
            category: $('#rCat').value || 'Khác',
            author: $('#rAuthor').value,
            fileUrl: $('#rUrl').value,
            thumbnail: thumbUrl,
            desc: $('#rDesc').value,
            downloads: 0, date: now()
        };

        const nextIndex = (DB.resources || []).length;
        await dbSet(`resources/${nextIndex}`, newRes);
        
        notify('Đã thêm tài nguyên.'); 
        closeModal(); 
        setAdminTab('resources');
    } catch (err) {
        notify(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu tài nguyên';
    }
}

window.deleteResource = function(id) {
    if (!confirm('Xóa tài nguyên này?')) return;
    const filtered = (DB.resources || []).filter(r => String(r.id) !== String(id));
    dbSet(`resources`, filtered).then(() => { 
        notify('Đã xóa tài nguyên.'); 
        setAdminTab('resources'); 
    });
}

window.exportDB = function() {
    const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'mmo-firebase-db.json'; a.click(); URL.revokeObjectURL(a.href);
}

window.importDBPrompt = function() {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json';
    inp.onchange = e => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try { const obj = JSON.parse(ev.target.result); DB = obj; saveNow().then(() => { updateUI(); navigate('home'); notify('Đã nhập dữ liệu.'); }); }
            catch (err) { notify('File JSON không hợp lệ.', 'error'); }
        };
        reader.readAsText(file);
    };
    inp.click();
}

window.resetDB = function() {
    if (!confirm('Reset toàn bộ dữ liệu trên Firebase?')) return;
    // Note: makeDefaultDB needs to be accessible or redefined
    fbRef.set(null).then(() => {
        location.reload();
    });
}

window.saveQuickSettings = function () {
    if (!isAdmin()) return notify('Chỉ admin.', 'error');
    DB.settings.siteName = ($('#siteName')?.value || 'MMO Studio').trim();
    DB.settings.maintenance = $('#maintenanceMode')?.value === 'true';
    DB.settings.referralReward = Math.max(0, safeNum($('#referralReward')?.value || DB.settings.referralReward || 5000));
    const currentContact = DB.settings.contactInfo || {};
    const facebookInput = $('#contactFacebook');
    const zaloInput = $('#contactZalo');
    const telegramInput = $('#contactTelegram');
    const tiktokInput = $('#contactTiktok');
    DB.settings.contactInfo = {
        facebook: facebookInput ? facebookInput.value.trim() : (currentContact.facebook || ''),
        zalo: zaloInput ? zaloInput.value.trim() : (currentContact.zalo || ''),
        telegram: telegramInput ? telegramInput.value.trim() : (currentContact.telegram || ''),
        tiktok: tiktokInput ? tiktokInput.value.trim() : (currentContact.tiktok || '')
    };
    saveNow().then(() => notify('Đã lưu cài đặt.'));
};

window.toggleTick = function(email) {
    const u = DB.users[email]; if (!u) return;
    const newStatus = !u.tick;
    dbUpdate(`users/${encodeEmail(email)}`, { tick: newStatus }).then(() => {
        notify(`Đã ${newStatus ? 'bật' : 'tắt'} tích xanh cho ${u.name}.`);
        setAdminTab('users');
    });
};
