(function(){
  const KEY_PREFIX = 'WSU_BOOKINGS_';

  function currentUser(){
    return (window.WSU_AUTH && WSU_AUTH.getUser && WSU_AUTH.getUser())
           || JSON.parse(localStorage.getItem('WSU_USER')||'null');
  }

  function isAdmin(u){ return u && u.role === 'admin'; }

  // 扫描 localStorage，汇总所有用户的预订
  function loadAll(){
    const rows = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(!k || !k.startsWith(KEY_PREFIX)) continue;
      const email = k.slice(KEY_PREFIX.length);
      let list = [];
      try{ list = JSON.parse(localStorage.getItem(k) || '[]'); }catch{}
      list.forEach(r=>{
        rows.push({...r, __email: email});
      });
    }
    return rows;
  }

  function saveFor(email, list){
    localStorage.setItem(KEY_PREFIX + email, JSON.stringify(list));
  }

  function setStatus(email, id, status){
    const list = JSON.parse(localStorage.getItem(KEY_PREFIX + email) || '[]');
    const idx = list.findIndex(x=>x.id===id);
    if(idx>-1){
      list[idx].status = status;
      saveFor(email, list);
    }
  }

  function formatDate(iso){
    const d = new Date(iso+'T00:00:00');
    return d.toLocaleDateString('en-GB',{ day:'2-digit', month:'short', year:'numeric' });
  }

  function renderTable(rows){
    const tbody = document.querySelector('#adminTable tbody');
    tbody.innerHTML = '';
    rows.forEach(r=>{
      const statusClass = r.status==='approved' ? 'status--approved' :
                          r.status==='pending'  ? 'status--pending'  :
                          'status--rejected';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.__email}</td>
        <td>${r.room}</td>
        <td>${formatDate(r.date)}</td>
        <td>${r.start}–${r.end}</td>
        <td>${r.purpose}</td>
        <td><span class="pill ${statusClass}">${r.status}</span></td>
        <td class="actions">
          <button class="btn" data-approve="${r.__email}::${r.id}">Approve</button>
          <button class="btn" data-reject="${r.__email}::${r.id}">Reject</button>
          <button class="btn" data-pending="${r.__email}::${r.id}">Pend</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // 绑定按钮
    tbody.querySelectorAll('[data-approve],[data-reject],[data-pending]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const [email,id] = btn.getAttribute(btn.hasAttribute('data-approve')?'data-approve':btn.hasAttribute('data-reject')?'data-reject':'data-pending').split('::');
        const status = btn.hasAttribute('data-approve') ? 'approved' : btn.hasAttribute('data-reject') ? 'rejected' : 'pending';
        setStatus(email, id, status);
        hydrate(); // 重新渲染
      });
    });
  }

  function filterRows(rows){
    const kw = document.getElementById('kw').value.trim().toLowerCase();
    const st = document.getElementById('status').value;
    const from = document.getElementById('dateFrom').value;
    const to   = document.getElementById('dateTo').value;

    return rows.filter(r=>{
      const hitKw = !kw || [r.__email, r.room, r.purpose].some(x=>String(x).toLowerCase().includes(kw));
      const hitSt = !st || r.status===st;
      const hitFrom = !from || r.date >= from;
      const hitTo   = !to   || r.date <= to;
      return hitKw && hitSt && hitFrom && hitTo;
    }).sort((a,b)=> (a.date+a.start) > (b.date+b.start) ? 1 : -1);
  }

  function hydrate(){
    const u = currentUser();
    const guard = document.getElementById('guard');
    const sections = ['stats','toolsWrap','tableWrap'].map(id=>document.getElementById(id));

    if(!isAdmin(u)){
      guard.style.display = '';
      sections.forEach(s=> s.style.display='none');
      return;
    }
    guard.style.display = 'none';
    sections.forEach(s=> s.style.display='');

    // 汇总数据
    const all = loadAll();
    // 概览
    document.getElementById('statTotal').textContent   = all.length;
    document.getElementById('statPending').textContent = all.filter(x=>x.status==='pending').length;
    const todayStr = new Date().toISOString().slice(0,10);
    document.getElementById('statToday').textContent   = all.filter(x=>x.status==='approved' && x.date===todayStr).length;

    // 过滤 + 渲染
    const rows = filterRows(all);
    renderTable(rows);
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    // 过滤器事件
    ['kw','status','dateFrom','dateTo'].forEach(id=>{
      const el = document.getElementById(id);
      if(!el) return;
      el.addEventListener('input', hydrate);
      el.addEventListener('change', hydrate);
    });
    // Reset 按钮
    const resetBtn = document.querySelector('#toolsWrap .btn');
    resetBtn.addEventListener('click', ()=>{
      ['kw','status','dateFrom','dateTo'].forEach(id=>{
        const el = document.getElementById(id);
        if(el.tagName==='SELECT') el.value='';
        else el.value='';
      });
      hydrate();
    });

    hydrate();
  });

  // 登录状态变化后刷新
  document.addEventListener('wsu-auth', hydrate);
  document.addEventListener('wsu-logout', hydrate);
})();
