    // Simple local workout logger
    const LS_KEY = 'workoutEntries_v1';

    const form = document.getElementById('entry-form');
    const dateInput = document.getElementById('date');
    const exerciseInput = document.getElementById('exercise');
    const setsInput = document.getElementById('sets');
    const repsInput = document.getElementById('reps');
    const weightInput = document.getElementById('weight');
    const notesInput = document.getElementById('notes');
    const tableWrap = document.getElementById('table-wrap');
    const countEl = document.getElementById('count');

    let entries = [];
    let editingId = null;

    function load() {
      try {
        entries = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      } catch (e) { entries = []; }
      renderTable();
    }

    function saveToStorage() {
      localStorage.setItem(LS_KEY, JSON.stringify(entries));
      renderTable();
    }

    function resetForm() {
      form.reset(); editingId = null; dateInput.focus();
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const entry = {
        id: editingId || Date.now().toString(),
        date: dateInput.value || new Date().toISOString().slice(0,10),
        exercise: exerciseInput.value.trim(),
        sets: parseInt(setsInput.value)||0,
        reps: parseInt(repsInput.value)||0,
        weight: weightInput.value ? parseFloat(weightInput.value) : '',
        notes: notesInput.value.trim()
      };
      if (editingId) {
        entries = entries.map(en => en.id === editingId ? entry : en);
      } else {
        entries.push(entry);
      }
      saveToStorage();
      resetForm();
    });

    document.getElementById('reset').addEventListener('click', resetForm);

    document.getElementById('clearAll').addEventListener('click', () => {
      if (!confirm('Delete ALL entries from this browser? This cannot be undone.')) return;
      entries = []; saveToStorage();
    });

    function renderTable() {
      if (!entries.length) {
        tableWrap.innerHTML = '<div class="muted">No entries yet. Add your first workout above.</div>';
        countEl.textContent = '0 entries';
        return;
      }
      const rows = entries.slice().sort((a,b)=> b.date.localeCompare(a.date) || b.id.localeCompare(a.id)).map(e => {
        return `<tr data-id="${e.id}"><td>${escapeHtml(e.date)}</td><td>${escapeHtml(e.exercise)}</td><td>${e.sets}</td><td>${e.reps}</td><td>${e.weight ?? ''}</td><td>${escapeHtml(e.notes)}</td><td class="actions"><button class="small ghost" data-act="edit">Edit</button><button class="small ghost" data-act="del">Delete</button></td></tr>`
      }).join('');

      tableWrap.innerHTML = `<div style="overflow:auto"><table><thead><tr><th>Date</th><th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th>Notes</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
      countEl.textContent = `${entries.length} ${entries.length===1?'entry':'entries'}`;

      // delegate actions
      tableWrap.querySelectorAll('button[data-act]').forEach(btn => {
        btn.addEventListener('click', (ev)=>{
          const tr = ev.target.closest('tr');
          const id = tr.getAttribute('data-id');
          if (ev.target.dataset.act === 'edit') startEdit(id);
          if (ev.target.dataset.act === 'del') deleteEntry(id);
        });
      });
    }

    function startEdit(id) {
      const e = entries.find(x=>x.id===id); if(!e) return;
      editingId = id;
      dateInput.value = e.date;
      exerciseInput.value = e.exercise;
      setsInput.value = e.sets;
      repsInput.value = e.reps;
      weightInput.value = e.weight;
      notesInput.value = e.notes;
      window.scrollTo({top:0,behavior:'smooth'});
      exerciseInput.focus();
    }

    function deleteEntry(id) {
      if(!confirm('Delete this entry?')) return;
      entries = entries.filter(x=>x.id!==id);
      saveToStorage();
    }

    function escapeHtml(s){ if(!s && s!==0) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Export CSV
    document.getElementById('exportCsv').addEventListener('click', ()=>{
      if (!entries.length) { alert('No entries to export'); return; }
      const header = ['Date','Exercise','Sets','Reps','Weight','Notes'];
      const lines = [header.join(',')];
      entries.forEach(e=>{
        const row = [e.date, e.exercise, e.sets, e.reps, e.weight, e.notes].map(cell=>`"${String(cell ?? '').replace(/"/g,'""')}"`);
        lines.push(row.join(','));
      });
      const blob = new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8;'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='workouts.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    });

    // Export Excel (.xlsx) using SheetJS
    document.getElementById('exportXlsx').addEventListener('click', ()=>{
      if (!entries.length) { alert('No entries to export'); return; }
      const ws_data = [['Date','Exercise','Sets','Reps','Weight','Notes']];
      entries.forEach(e=> ws_data.push([e.date,e.exercise,e.sets,e.reps,e.weight,e.notes]));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, 'Workouts');
      XLSX.writeFile(wb, 'workouts.xlsx');
    });

    // initialize default date to today
    (function setToday(){ const today = new Date().toISOString().slice(0,10); dateInput.value = today; })();

    load();