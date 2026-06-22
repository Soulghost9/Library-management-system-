$(async function(){
  if (!api.token()) window.location.href = '/';
  $('#logoutBtn').on('click', ()=>{ localStorage.removeItem('lms_token'); window.location.href='/';});

  const table = $('#membersTable').DataTable({
    serverSide: true,
    processing: true,
    ajax: function(data, callback) {
      const params = new URLSearchParams();
      params.append('draw', data.draw);
      params.append('start', data.start);
      params.append('length', data.length);
      if (data.search && data.search.value) params.append('search[value]', data.search.value);
      fetch('/api/members/datatables?' + params.toString(), { headers: { 'Authorization': 'Bearer ' + api.token() } })
        .then(res => res.json()).then(json => callback(json)).catch(err => alert('Error loading members'));
    },
    columns: [
      { data: 'id' },
      { data: 'memberNo' },
      { data: row => (row.firstName || '') + (row.lastName ? ' ' + row.lastName : '') },
      { data: 'email' },
      { data: 'phone' },
      { data: 'status' },
      { data: null, orderable: false, render: d => {
          const id = d.id;
          const editBtn = `<button class="btn btn-sm btn-primary edit" data-id="${id}">Edit</button>`;
          const delBtn = api.isAdmin() ? `<button class="btn btn-sm btn-danger ms-1 delete" data-id="${id}">Delete</button>` : '';
          return editBtn + delBtn;
        }
      }
    ]
  });

  $('#addBtn').on('click', ()=> {
    $('#memberId').val(''); $('#firstName').val(''); $('#lastName').val(''); $('#email').val(''); $('#phone').val(''); $('#address').val(''); $('#dob').val('');
    $('#formError').hide(); new bootstrap.Modal(document.getElementById('memberModal')).show();
  });

  $('#membersTable tbody').on('click', '.edit', async function() {
    const id = $(this).data('id');
    const m = await api.fetchJson('/api/members/' + id);
    $('#memberId').val(m.id); $('#firstName').val(m.firstName); $('#lastName').val(m.lastName || ''); $('#email').val(m.email || ''); $('#phone').val(m.phone || ''); $('#address').val(m.address || ''); $('#dob').val(m.dob || '');
    $('#formError').hide(); new bootstrap.Modal(document.getElementById('memberModal')).show();
  });

  $('#membersTable tbody').on('click', '.delete', async function() {
    if (!confirm('Delete member?')) return;
    const id = $(this).data('id');
    try { await api.fetchJson('/api/members/' + id, { method: 'DELETE' }); table.ajax.reload(); } catch(e){ alert('Delete failed: ' + e.message); }
  });

  $('#memberForm').on('submit', async function(e){
    e.preventDefault();
    const id = $('#memberId').val();
    const payload = { firstName: $('#firstName').val(), lastName: $('#lastName').val(), email: $('#email').val(), phone: $('#phone').val(), address: $('#address').val(), dob: $('#dob').val() };
    try {
      if (id) await api.fetchJson('/api/members/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      else await api.fetchJson('/api/members', { method: 'POST', body: JSON.stringify(payload) });
      new bootstrap.Modal(document.getElementById('memberModal')).hide();
      table.ajax.reload();
    } catch (err) { $('#formError').show().text(err.message || 'Save failed'); }
  });
});
