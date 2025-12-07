// Minimal app bootstrap for Writing Project Management Tool
console.log('Writing project tool booting...');

const boardsContainer = document.getElementById('boards-container');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// Simple view router
navButtons.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const route = btn.dataset.route;
    views.forEach(v=> v.classList.remove('active'));
    const target = document.getElementById('view-'+route);
    if(target) target.classList.add('active');
  })
});

// Sample data
let boards = [
  {
    id: 'board-1',
    title: 'Novel Draft',
    lists: [
      { id: 'todo', title: 'To do', cards: [{id:'c1',title:'Outline Act 1'}] },
      { id: 'doing', title: 'Doing', cards: [] },
      { id: 'done', title: 'Done', cards: [] }
    ]
  }
];

function render(){
  boardsContainer.innerHTML = '';
  boards.forEach(board=>{
    const b = document.createElement('section');
    b.className = 'board';
    b.innerHTML = `<h3>${board.title}</h3>`;
    const listsWrap = document.createElement('div');
    listsWrap.className = 'lists-wrap';
    board.lists.forEach(list=>{
      const listEl = document.createElement('div');
      listEl.className = 'column';
      listEl.dataset.stage = list.id;
      listEl.innerHTML = `<div class="col-title">${list.title}</div>`;
      list.cards.forEach(card=>{
  // ensure counters exist on card (kept in data only)
  card.wordCount = card.wordCount || 0;
  card.wordGoal = card.wordGoal || 0;
  // debug: log card goal state when rendering
  try{ console.log('rendering card', card.id, 'wordGoal=', card.wordGoal); }catch(e){}
  const c = document.createElement('div');
  c.className = 'card draggable';
  c.draggable = true;
  c.dataset.cardId = card.id;
  c.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><strong>${card.title}</strong></div><div class="card-desc">${card.description||''}</div>`;
        // quick controls
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '.4rem';
  controls.style.marginTop = '.5rem';
  if(card.wordGoal && Number(card.wordGoal) > 0){
  const goalLabel = document.createElement('div');
  goalLabel.className = 'goal-label';
  goalLabel.textContent = `Goal: ${card.wordGoal}`;
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', ()=>{
      const g = Number(prompt('Edit word goal for this project', card.wordGoal||0)||0);
      if(g>=0){ setCardGoal(card.id,g); }
    });
    controls.appendChild(goalLabel);
    controls.appendChild(editBtn);
  } else {
    const setGoal = document.createElement('button');
    setGoal.className='btn';
    setGoal.textContent='Set Goal';
    setGoal.addEventListener('click', ()=>{
      const g = Number(prompt('Set word goal for this project', card.wordGoal||0)||0);
      if(g>=0){ setCardGoal(card.id,g); }
    });
    controls.appendChild(setGoal);
  }
        // drag events
        c.addEventListener('dragstart', onDragStart);
        c.addEventListener('dragend', onDragEnd);
        c.appendChild(controls);
        listEl.appendChild(c);
      });
      // allow drop
      listEl.addEventListener('dragover', onDragOver);
      listEl.addEventListener('drop', onDrop);
      listsWrap.appendChild(listEl);
    })
    b.appendChild(listsWrap);
    boardsContainer.appendChild(b);
  })
  populateProjectSelector();
  // also refresh character/project selects whenever boards render
  try{ populateCharAndProjectSelects(); }catch(e){}
}

// Drag & drop handlers
let draggingCardId = null;
function onDragStart(e){
  this.classList.add('dragging');
  draggingCardId = this.dataset.cardId;
  e.dataTransfer.setData('text/plain', draggingCardId);
}
function onDragEnd(e){
  this.classList.remove('dragging');
  draggingCardId = null;
}
function onDragOver(e){
  e.preventDefault();
  this.classList.add('drag-over');
}
function onDrop(e){
  e.preventDefault();
  this.classList.remove('drag-over');
  const cardId = e.dataTransfer.getData('text/plain');
  if(!cardId) return;
  moveCardToStage(cardId, this.dataset.stage);
}

function moveCardToStage(cardId, stage){
  for(const board of boards){
    for(const list of board.lists){
      const idx = list.cards.findIndex(c=>c.id===cardId);
      if(idx>-1){
        const [card] = list.cards.splice(idx,1);
        // find target list
        const target = board.lists.find(l=>l.id===stage);
        if(target) target.cards.push(card);
        saveBoards();
        render();
        return;
      }
    }
  }
}

// quick-add removed: per-card increments are now handled by attaching sprints or manual adds in Progress

function setCardGoal(cardId, goal){
  for(const board of boards){
    for(const list of board.lists){
      const card = list.cards.find(c=>c.id===cardId);
      if(card){ card.wordGoal = goal; saveBoards(); render(); renderProgress(); return; }
    }
  }
}

// Storage
const STORAGE_KEY = 'wpm_boards_v1';
function saveBoards(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}
function loadBoards(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{ boards = JSON.parse(raw); }catch(e){console.error('loadBoards parse',e)}
  }
  populateProjectSelector();
}

// Add card form
const addForm = document.getElementById('add-card-form');
if(addForm){
  addForm.addEventListener('submit', e=>{
    e.preventDefault();
    const title = document.getElementById('card-title').value.trim();
    const desc = document.getElementById('card-desc').value.trim();
    if(!title) return;
    const newCard = { id: 'c_'+Date.now(), title, description: desc };
    // add to first board drafting list
    boards[0].lists[0].cards.push(newCard);
    saveBoards();
    render();
    addForm.reset();
  })
}

// Clear board
const clearBtn = document.getElementById('clear-board');
if(clearBtn) clearBtn.addEventListener('click', ()=>{
  if(confirm('Clear all projects?')){
    boards = [{ id:'board-1', title:'Novel Draft', lists:[{id:'drafting',title:'Drafting',cards:[]},{id:'revising',title:'Revising',cards:[]},{id:'submitted',title:'Submitted',cards:[]}]}];
    saveBoards(); render();
  }
});

// init (deferred to DOMContentLoaded)

// --- Sprint timer implementation ---
const SPRINT_KEY = 'wpm_sprints_v1';
let sprintState = { lengthMin:25, shortBreak:5, longBreak:15, targetWords:500, running:false, remainingSec:25*60, mode:'work', title: '' };
let sprintInterval = null;

function loadSprints(){
  const raw = localStorage.getItem(SPRINT_KEY);
  if(raw) try{ sprintState = Object.assign(sprintState, JSON.parse(raw)); }catch(e){console.error(e)}
}
function saveSprints(){ localStorage.setItem(SPRINT_KEY, JSON.stringify(sprintState)); }

function formatTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = Math.floor(sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function updateSprintUI(){
  const el = document.getElementById('sprint-time');
  if(el) el.textContent = formatTime(sprintState.remainingSec);
  document.getElementById('sprint-length').value = sprintState.lengthMin;
  document.getElementById('short-break').value = sprintState.shortBreak;
  document.getElementById('long-break').value = sprintState.longBreak;
  document.getElementById('sprint-target').value = sprintState.targetWords;
  const titleEl = document.getElementById('sprint-title');
  if(titleEl) titleEl.value = sprintState.title || '';
  // mode badge
  const modeEl = document.getElementById('sprint-mode');
  if(modeEl) modeEl.textContent = sprintState.mode === 'work' ? 'Work' : 'Break';
  modeEl.style.background = sprintState.mode === 'work' ? 'var(--accent)' : '#2a8';
  // progress
  const fill = document.getElementById('sprint-progress-fill');
  if(fill){
    const total = (sprintState.mode === 'work' ? sprintState.lengthMin*60 : sprintState.shortBreak*60) || 1;
    const pct = Math.max(0, Math.min(100, Math.round(((total - sprintState.remainingSec)/total)*100)));
    fill.style.width = pct + '%';
  }
}

function pushHistory(entry){
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  arr.unshift(entry);
  localStorage.setItem('wpm_sprint_history', JSON.stringify(arr.slice(0,100)));
  // update UI live when history changes
  try{ renderHistory(); }catch(e){}
  try{ renderProgress(); }catch(e){}
}

// populate project selector in Sprints view
function populateProjectSelector(){
  const sel = document.getElementById('sprint-project-select');
  if(!sel) return;
  sel.innerHTML = '<option value="">— Select project —</option>';
  boards.forEach(b=> b.lists.forEach(l=> l.cards.forEach(c=>{
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.title} (${b.title} / ${l.title})`;
    sel.appendChild(opt);
  })));
}

function attachSprintToProject(cardId, sprintEntry){
  for(const board of boards){
    for(const list of board.lists){
      const card = list.cards.find(c=> c.id === cardId);
      if(card){
        card.sprints = card.sprints || [];
        card.sprints.unshift(sprintEntry);
        // increment card wordCount by sprint words
        card.wordCount = (card.wordCount||0) + (sprintEntry.words||0);
        saveBoards();
        render();
        renderProgress();
        return true;
      }
    }
  }
  return false;
}

function renderHistory(){
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  const list = document.getElementById('sprint-history-list');
  if(!list) return;
  list.innerHTML = '';
  arr.forEach(it=>{
    const li = document.createElement('li');
    const dt = new Date(it.t);
    const dateStr = dt.toLocaleDateString();
    const timeStr = dt.toLocaleTimeString();
  const rem = (typeof it.remainingSec === 'number') ? ` (remaining ${formatTime(it.remainingSec)})` : '';
  li.textContent = `${dateStr} ${timeStr} — ${it.title? it.title + ' — ' : ''}${it.mode} ${it.lengthMin}m — ${it.words||0}w${rem}`;
    // actions
    const actions = document.createElement('div');
    actions.style.marginLeft = '8px';
  actions.style.display = 'inline-block';
  actions.style.verticalAlign = 'middle';
  actions.style.marginTop = '-4px';
  actions.style.marginBottom = '-4px';
  actions.style.gap = '6px';
  actions.style.paddingLeft = '8px';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.className = 'btn';
    editBtn.style.marginRight = '6px';
    editBtn.addEventListener('click', ()=>{ editHistoryEntry(it.t); });
  // view button created below
  const dlBtn = document.createElement('button');
  dlBtn.textContent = 'Download';
  dlBtn.className = 'btn';
  dlBtn.style.marginRight = '6px';
  dlBtn.addEventListener('click', ()=>{ downloadHistoryText(it.t); });
  const viewBtn = document.createElement('button');
  viewBtn.textContent = 'View';
  viewBtn.className = 'btn';
  viewBtn.style.marginRight = '6px';
  viewBtn.addEventListener('click', ()=>{ viewHistoryEntry(it.t); });
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.className = 'btn';
    delBtn.style.background = '#c33';
    delBtn.addEventListener('click', ()=>{ if(confirm('Delete this session?')) deleteHistoryEntry(it.t); });
  actions.appendChild(viewBtn);
  actions.appendChild(dlBtn);
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);
    li.appendChild(actions);
    list.appendChild(li);
  })
}

function deleteHistoryEntry(ts){
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  const filtered = arr.filter(it=> it.t !== ts);
  localStorage.setItem('wpm_sprint_history', JSON.stringify(filtered));
  renderHistory();
  try{ renderProgress(); }catch(e){}
}

function editHistoryEntry(ts){
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  const idx = arr.findIndex(it=> it.t === ts);
  if(idx===-1) return;
  const entry = arr[idx];
  const newTitle = prompt('Edit session title', entry.title||'') || '';
  const newWords = Number(prompt('Edit words count', entry.words||0) || 0);
  entry.title = newTitle;
  entry.words = newWords;
  arr[idx] = entry;
  localStorage.setItem('wpm_sprint_history', JSON.stringify(arr));
  renderHistory();
  try{ renderProgress(); }catch(e){}
}

function viewHistoryEntry(ts){
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  const entry = arr.find(it=> it.t === ts);
  if(!entry) return alert('Entry not found');
  // build modal
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.left = '0';
  modal.style.top = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.5)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = 9999;

  const card = document.createElement('div');
  card.style.width = '80%';
  card.style.maxWidth = '900px';
  card.style.background = '#fff';
  card.style.borderRadius = '8px';
  card.style.padding = '1rem';
  card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  const h = document.createElement('strong');
  h.textContent = entry.title || '(no title)';
  header.appendChild(h);
  const close = document.createElement('button');
  close.textContent = 'Close';
  close.className = 'btn';
  close.addEventListener('click', ()=> document.body.removeChild(modal));
  header.appendChild(close);

  const meta = document.createElement('div');
  const dt = new Date(entry.t);
  meta.textContent = `${dt.toLocaleString()} — ${entry.mode} ${entry.lengthMin}m — ${entry.words||0}w` + (entry.remainingSec? ` — remaining ${formatTime(entry.remainingSec)}` : '');
  meta.style.margin = '0.5rem 0';

  const ta = document.createElement('textarea');
  ta.style.width = '100%';
  ta.style.height = '50vh';
  ta.style.padding = '0.75rem';
  ta.value = entry.editorText || '';
  ta.readOnly = true;

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.gap = '8px';
  footer.style.marginTop = '0.5rem';
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy text';
  copyBtn.className = 'btn';
  copyBtn.addEventListener('click', ()=>{ navigator.clipboard.writeText(ta.value).then(()=> alert('Copied')); });
  footer.appendChild(copyBtn);

  card.appendChild(header);
  card.appendChild(meta);
  card.appendChild(ta);
  card.appendChild(footer);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

function downloadHistoryText(ts){
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  const entry = arr.find(it=> it.t === ts);
  if(!entry) return alert('Entry not found');
  const text = entry.editorText || '';
  const dt = new Date(entry.t);
  const safeTitle = (entry.title || 'session').replace(/[^a-z0-9\-\_ ]/ig,'').slice(0,40).trim().replace(/ /g,'_') || 'session';
  const filename = `${dt.toISOString().slice(0,10)}_${safeTitle || 'session'}.txt`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function startSprint(){
  if(sprintState.running) return;
  sprintState.running = true;
  sprintInterval = setInterval(()=>{
    sprintState.remainingSec -= 1;
    if(sprintState.remainingSec <= 0){
      clearInterval(sprintInterval);
      sprintState.running = false;
  // push history using actual editor words if available
  const words = getEditorWordCount();
  const entry = { t: Date.now(), mode: sprintState.mode, lengthMin: sprintState.lengthMin, words: words || sprintState.targetWords, title: sprintState.title || '', remainingSec: sprintState.remainingSec, editorText: editor? editor.value : '' };
  pushHistory(entry);
  // if a project is selected, attach to it
  const sel = document.getElementById('sprint-project-select');
  if(sel && sel.value) attachSprintToProject(sel.value, entry);
      // switch to break or stop
      if(sprintState.mode==='work'){
        sprintState.mode = 'break';
        sprintState.remainingSec = sprintState.shortBreak * 60;
      } else {
        sprintState.mode = 'work';
        sprintState.remainingSec = sprintState.lengthMin * 60;
      }
      saveSprints();
    }
    updateSprintUI();
  },1000);
  saveSprints();
}

function pauseSprint(){
  if(sprintInterval) clearInterval(sprintInterval);
  sprintState.running = false;
  sprintInterval = null;
  saveSprints();
}

function resetSprint(){
  pauseSprint();
  sprintState.mode = 'work';
  sprintState.remainingSec = sprintState.lengthMin * 60;
  saveSprints();
  updateSprintUI();
}

// wire controls
function wireSprintControls(){
  const start = document.getElementById('sprint-start');
  const pause = document.getElementById('sprint-pause');
  const reset = document.getElementById('sprint-reset');
  const len = document.getElementById('sprint-length');
  const sb = document.getElementById('short-break');
  const lb = document.getElementById('long-break');
  const tgt = document.getElementById('sprint-target');
  const titleEl = document.getElementById('sprint-title');
  const saveBtn = document.getElementById('sprint-save');

  if(start) start.addEventListener('click', ()=> startSprint());
  if(pause) pause.addEventListener('click', ()=> pauseSprint());
  if(reset) reset.addEventListener('click', ()=> resetSprint());
  if(len) len.addEventListener('change', ()=>{ sprintState.lengthMin = Number(len.value)||25; sprintState.remainingSec = sprintState.lengthMin*60; saveSprints(); updateSprintUI(); });
  if(sb) sb.addEventListener('change', ()=>{ sprintState.shortBreak = Number(sb.value)||5; saveSprints(); });
  if(lb) lb.addEventListener('change', ()=>{ sprintState.longBreak = Number(lb.value)||15; saveSprints(); });
  if(tgt) tgt.addEventListener('change', ()=>{ sprintState.targetWords = Number(tgt.value)||0; saveSprints(); });
  if(titleEl) titleEl.addEventListener('input', ()=>{ sprintState.title = titleEl.value; saveSprints(); });
  if(saveBtn) saveBtn.addEventListener('click', ()=>{
  // stop timer and persist current session to history and attach to project if selected
  pauseSprint();
  const words = getEditorWordCount();
  const entry = { t: Date.now(), mode: sprintState.mode, lengthMin: sprintState.lengthMin, words: words || sprintState.targetWords, title: sprintState.title || '', remainingSec: sprintState.remainingSec, editorText: editor? editor.value : '' };
  pushHistory(entry);
  const sel = document.getElementById('sprint-project-select');
  if(sel && sel.value) attachSprintToProject(sel.value, entry);
  renderHistory();
  });
}

// init sprints (deferred to DOMContentLoaded)

// ------------------ Characters & Scenes ------------------
const CHAR_KEY = 'wpm_characters_v1';
const SCENE_KEY = 'wpm_scenes_v1';
let characters = [];
let scenes = [];

function loadCharacters(){
  const raw = localStorage.getItem(CHAR_KEY)||'[]';
  try{ characters = JSON.parse(raw); }catch(e){ characters = []; }
}
function saveCharacters(){ localStorage.setItem(CHAR_KEY, JSON.stringify(characters)); }

function loadScenes(){
  const raw = localStorage.getItem(SCENE_KEY)||'[]';
  try{ scenes = JSON.parse(raw); }catch(e){ scenes = []; }
}
function saveScenes(){ localStorage.setItem(SCENE_KEY, JSON.stringify(scenes)); }

function renderCharacters(){
  loadCharacters();
  const list = document.getElementById('characters-list');
  if(!list) return;
  // group characters by project
  list.innerHTML = '';
  const byProject = {};
  characters.forEach(ch=>{ const key = ch.projectId || '_none'; (byProject[key] = byProject[key]||[]).push(ch); });
  // render each project group (including no-project)
  // build a mapping of project id -> title
  const projectTitles = {};
  boards.forEach(b=> b.lists.forEach(l=> l.cards.forEach(c=> projectTitles[c.id] = `${c.title} (${b.title} / ${l.title})`)));
  Object.keys(byProject).forEach(pid=>{
    const group = document.createElement('div');
    const header = document.createElement('div'); header.style.margin='0.25rem 0'; header.style.fontWeight='700';
    header.textContent = pid === '_none' ? 'Unassigned' : (projectTitles[pid] || 'Project');
    group.appendChild(header);
    byProject[pid].forEach(ch=>{
      const row = document.createElement('div');
      row.className = 'card';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.innerHTML = `<div><strong>${ch.name}</strong> <div style="font-size:.9rem;color:var(--muted)">${ch.role||''}</div><div style="font-size:.9rem;color:var(--muted)">${ch.notes||''}</div></div>`;
      const actions = document.createElement('div');
      actions.style.display='flex'; actions.style.gap='6px';
      const edit = document.createElement('button'); edit.className='btn'; edit.textContent='Edit';
      edit.addEventListener('click', ()=>{ editCharacter(ch.id); });
      // clicking the card main area opens a detail modal
      row.addEventListener('click', (ev)=>{
        // avoid triggering when clicking action buttons
        if(ev.target === edit || ev.target === del) return;
        openCharacterModal(ch.id);
      });
      const del = document.createElement('button'); del.className='btn'; del.style.background='#c33'; del.textContent='Delete';
      del.addEventListener('click', ()=>{ if(confirm('Delete character?')){ deleteCharacter(ch.id); } });
      actions.appendChild(edit); actions.appendChild(del);
      row.appendChild(actions);
      group.appendChild(row);
    });
    list.appendChild(group);
  });
}

function renderScenes(){
  loadScenes();
  const list = document.getElementById('scenes-list');
  if(!list) return;
  list.innerHTML = '';
  scenes.forEach(s=>{
    const row = document.createElement('div');
    row.className = 'card';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    row.innerHTML = `<div><strong>${s.title}</strong> <div style="font-size:.9rem;color:var(--muted)">POV: ${s.pov||'-'} — ${s.status||'planned'}</div><div style="font-size:.9rem;color:var(--muted)">${s.summary||''}</div></div>`;
    const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='6px';
    const edit = document.createElement('button'); edit.className='btn'; edit.textContent='Edit';
    edit.addEventListener('click', ()=>{ editScene(s.id); });
    const del = document.createElement('button'); del.className='btn'; del.style.background='#c33'; del.textContent='Delete';
    del.addEventListener('click', ()=>{ if(confirm('Delete scene?')){ deleteScene(s.id); } });
    actions.appendChild(edit); actions.appendChild(del);
    row.appendChild(actions);
    list.appendChild(row);
  });
}

// Populate project and character selects
function populateCharAndProjectSelects(){
  // project select for character form
  const projSel = document.getElementById('char-project-select');
  if(projSel){
    projSel.innerHTML = '<option value="">— No project —</option>';
    boards.forEach(b=> b.lists.forEach(l=> l.cards.forEach(c=>{
      const opt = document.createElement('option'); opt.value = c.id; opt.textContent = `${c.title} (${b.title} / ${l.title})`; projSel.appendChild(opt);
    })));
  }
  // pov select for scene form
  const povSel = document.getElementById('scene-pov');
  if(povSel){
    povSel.innerHTML = '<option value="">— Select POV —</option>';
    loadCharacters();
    characters.forEach(ch=>{
      const opt = document.createElement('option'); opt.value = ch.id; opt.textContent = ch.name + (ch.role? ` — ${ch.role}` : ''); povSel.appendChild(opt);
    });
  }
}

// Update handlers to include projectId/povId when adding
const addCharForm = document.getElementById('add-character-form');
if(addCharForm){
  addCharForm.removeEventListener && addCharForm.removeEventListener('submit', ()=>{});
  addCharForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = document.getElementById('char-name').value.trim();
    const role = document.getElementById('char-role').value.trim();
    const notes = document.getElementById('char-notes').value.trim();
    const projectId = document.getElementById('char-project-select').value || '';
    if(!name) return;
    characters.unshift({ id: 'ch_' + Date.now(), name, role, notes, projectId });
    saveCharacters(); renderCharacters(); addCharForm.reset(); populateCharAndProjectSelects();
  })
}

const addSceneForm = document.getElementById('add-scene-form');
if(addSceneForm){
  addSceneForm.removeEventListener && addSceneForm.removeEventListener('submit', ()=>{});
  addSceneForm.addEventListener('submit', e=>{
    e.preventDefault();
    const title = document.getElementById('scene-title').value.trim();
    const povId = document.getElementById('scene-pov').value || '';
    const status = document.getElementById('scene-status').value;
    const summary = document.getElementById('scene-summary').value.trim();
    if(!title) return;
    scenes.unshift({ id: 'sc_' + Date.now(), title, povId, status, summary });
    saveScenes(); renderScenes(); addSceneForm.reset();
  })
}

// ensure selects are populated after boards/characters load
populateProjectSelector(); // existing function for sprint selector
populateCharAndProjectSelects();



// CRUD helpers
function deleteCharacter(id){
  const ch = characters.find(c=> c.id === id); if(!ch) return;
  // build modal
  const modal = document.createElement('div'); modal.className='detail-modal';
  const card = document.createElement('div'); card.className='detail-card';
  const header = document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between';
  const title = document.createElement('strong'); title.textContent = `Delete ${ch.name}?`; header.appendChild(title);
  const close = document.createElement('button'); close.className='btn'; close.textContent='Cancel'; close.addEventListener('click', ()=> document.body.removeChild(modal)); header.appendChild(close);
  card.appendChild(header);
  const info = document.createElement('div'); info.style.margin='0.5rem 0'; const related = scenes.filter(s=> s.povId === id || s.pov === id);
  info.innerHTML = `<div>${related.length} scene(s) reference this character as POV.</div>`;
  card.appendChild(info);
  const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.marginTop='0.5rem';
  const removeBtn = document.createElement('button'); removeBtn.className='btn'; removeBtn.textContent='Remove POV from scenes';
  removeBtn.addEventListener('click', ()=>{
    related.forEach(s=>{ if(s.povId === id) s.povId = ''; if(s.pov === id) s.pov = ''; });
    // remove character
    characters = characters.filter(c=> c.id !== id);
    saveScenes(); saveCharacters(); renderScenes(); renderCharacters(); document.body.removeChild(modal);
  });
  const reassignBtn = document.createElement('button'); reassignBtn.className='btn'; reassignBtn.textContent='Reassign POV';
  // create select of other characters
  const select = document.createElement('select'); select.style.marginLeft='8px'; select.innerHTML = '<option value="">— select —</option>';
  characters.filter(c=> c.id !== id).forEach(c=>{ const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; select.appendChild(o); });
  reassignBtn.addEventListener('click', ()=>{
    const to = select.value; if(!to) return alert('Choose a character to reassign to');
    related.forEach(s=>{ if(s.povId === id) s.povId = to; if(s.pov === id) s.pov = to; });
    characters = characters.filter(c=> c.id !== id);
    saveScenes(); saveCharacters(); renderScenes(); renderCharacters(); document.body.removeChild(modal);
  });
  actions.appendChild(removeBtn); actions.appendChild(reassignBtn); actions.appendChild(select);
  card.appendChild(actions);
  modal.appendChild(card); document.body.appendChild(modal);
}
function deleteScene(id){ scenes = scenes.filter(s=> s.id !== id); saveScenes(); renderScenes(); }

function editCharacter(id){
  const ch = characters.find(c=> c.id === id); if(!ch) return;
  const name = prompt('Name', ch.name) || ch.name;
  const role = prompt('Role', ch.role||'') || ch.role;
  const notes = prompt('Notes', ch.notes||'') || ch.notes;
  ch.name = name; ch.role = role; ch.notes = notes; saveCharacters(); renderCharacters();
}

// Character modal
function openCharacterModal(id){
  const ch = characters.find(c=> c.id === id); if(!ch) return;
  const modal = document.createElement('div');
  modal.className = 'detail-modal';
  const card = document.createElement('div'); card.className = 'detail-card';
  const header = document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center';
  const title = document.createElement('strong'); title.textContent = ch.name; header.appendChild(title);
  const close = document.createElement('button'); close.className='btn'; close.textContent='Close'; close.addEventListener('click', ()=> document.body.removeChild(modal)); header.appendChild(close);
  card.appendChild(header);
  const meta = document.createElement('div'); meta.style.margin='0.5rem 0'; meta.innerHTML = `<div><strong>Role:</strong> ${ch.role||'-'}</div><div><strong>Project:</strong> ${ch.projectId? (function(){
    // find project title
    for(const b of boards){ for(const l of b.lists){ const found = l.cards.find(c=> c.id === ch.projectId); if(found) return `${found.title} (${b.title} / ${l.title})`; }} return 'Unknown';
  })() : 'Unassigned'}</div>`;
  card.appendChild(meta);
  const notes = document.createElement('div'); notes.style.marginTop='0.5rem'; notes.textContent = ch.notes || '(no notes)'; card.appendChild(notes);
  // scenes where this character is POV
  const rel = document.createElement('div'); rel.style.marginTop='0.75rem'; rel.innerHTML = '<h4>Scenes (POV)</h4>';
  const list = document.createElement('div'); list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='.4rem';
  scenes.filter(s=> s.povId === ch.id || s.pov === ch.id).forEach(s=>{
    const r = document.createElement('div'); r.className='card'; r.style.display='flex'; r.style.justifyContent='space-between'; r.style.alignItems='center';
    r.innerHTML = `<div><strong>${s.title}</strong><div style="font-size:.9rem;color:var(--muted)">${s.status||''}</div></div>`;
    const open = document.createElement('button'); open.className='btn'; open.textContent='Open'; open.addEventListener('click', ()=>{ openSceneModal(s.id); });
    r.appendChild(open); list.appendChild(r);
  });
  rel.appendChild(list);
  card.appendChild(rel);
  // actions
  const footer = document.createElement('div'); footer.style.display='flex'; footer.style.gap='8px'; footer.style.marginTop='0.5rem';
  const editBtn = document.createElement('button'); editBtn.className='btn'; editBtn.textContent='Edit'; editBtn.addEventListener('click', ()=>{ document.body.removeChild(modal); editCharacter(ch.id); });
  const delBtn = document.createElement('button'); delBtn.className='btn'; delBtn.style.background='#c33'; delBtn.textContent='Delete'; delBtn.addEventListener('click', ()=>{ if(confirm('Delete character?')){ deleteCharacter(ch.id); document.body.removeChild(modal); } });
  footer.appendChild(editBtn); footer.appendChild(delBtn);
  card.appendChild(footer);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

// small helper to open scene modal if desired
function openSceneModal(id){
  const s = scenes.find(x=> x.id === id); if(!s) return;
  const modal = document.createElement('div'); modal.className='detail-modal';
  const card = document.createElement('div'); card.className='detail-card';
  const header = document.createElement('div'); header.style.display='flex'; header.style.justifyContent='space-between'; header.style.alignItems='center';
  const title = document.createElement('strong'); title.textContent = s.title; header.appendChild(title);
  const close = document.createElement('button'); close.className='btn'; close.textContent='Close'; close.addEventListener('click', ()=> document.body.removeChild(modal)); header.appendChild(close);
  card.appendChild(header);
  const meta = document.createElement('div'); meta.style.margin='0.5rem 0';
  const povName = (function(){ const ch = characters.find(c=> c.id === s.povId || c.id === s.pov); return ch? ch.name : (s.pov||''); })();
  meta.innerHTML = `<div><strong>POV:</strong> ${povName}</div><div><strong>Status:</strong> ${s.status||''}</div>`;
  card.appendChild(meta);
  const summary = document.createElement('div'); summary.style.marginTop='0.5rem'; summary.textContent = s.summary || '(no summary)'; card.appendChild(summary);
  document.body.appendChild(modal); modal.appendChild(card);
}

function editScene(id){
  const s = scenes.find(x=> x.id === id); if(!s) return;
  const title = prompt('Title', s.title) || s.title;
  const pov = prompt('POV', s.pov||'') || s.pov;
  const status = prompt('Status (planned/drafted/revised)', s.status||'planned') || s.status;
  const summary = prompt('Summary', s.summary||'') || s.summary;
  s.title = title; s.pov = pov; s.status = status; s.summary = summary; saveScenes(); renderScenes();
}

// init characters/scenes (deferred to DOMContentLoaded)

// --- Sprint editor wiring ---
const EDITOR_KEY = 'wpm_sprint_editor_v1';
const editor = document.getElementById('sprint-editor-input');
const wordCountEl = document.getElementById('sprint-wordcount');

function loadEditor(){
  const raw = localStorage.getItem(EDITOR_KEY)||'';
  if(editor) editor.value = raw;
  updateEditorCount();
}

function saveEditor(){
  if(!editor) return;
  localStorage.setItem(EDITOR_KEY, editor.value);
}

function clearEditor(){
  if(!editor) return;
  editor.value = '';
  saveEditor();
  updateEditorCount();
}

function getEditorWordCount(){
  if(!editor) return 0;
  const txt = editor.value.trim();
  if(!txt) return 0;
  // split on whitespace, filter empty
  return txt.split(/\s+/).filter(Boolean).length;
}

function updateEditorCount(){
  if(!wordCountEl) return;
  wordCountEl.textContent = 'Words: ' + getEditorWordCount();
}

if(editor){
  editor.addEventListener('input', ()=>{ saveEditor(); updateEditorCount(); });
}

// expose clear button via double-click on wordcount
if(wordCountEl) wordCountEl.addEventListener('dblclick', ()=>{ if(confirm('Clear editor?')) clearEditor(); });

// --- Progress dashboard ---
const PROGRESS_KEY = 'wpm_progress_v1';
let progressState = { dailyGoal: 1000, manualAdds: [] };

function loadProgress(){
  const raw = localStorage.getItem(PROGRESS_KEY)||'';
  if(raw) try{ progressState = Object.assign(progressState, JSON.parse(raw)); }catch(e){}
}
function saveProgress(){ localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressState)); }

function getTodayKey(){ const d = new Date(); return d.toISOString().slice(0,10); }

function aggregateToday(){
  const key = getTodayKey();
  // sum session words from history happened today
  const raw = localStorage.getItem('wpm_sprint_history')||'[]';
  const arr = JSON.parse(raw);
  let total = 0;
  arr.forEach(it=>{
    const itDay = new Date(it.t).toISOString().slice(0,10);
    if(itDay === key) total += Number(it.words||0);
  });
  // add manual adds stored with date
  progressState.manualAdds.forEach(a=>{ if(a.date === key) total += Number(a.words||0); });
  return total;
}

function renderProgress(){
  loadProgress();
  const total = aggregateToday();
  const el = document.getElementById('today-words');
  if(el) el.textContent = total;
  const goal = progressState.dailyGoal || 1000;
  // total all-time words
  const rawAll = localStorage.getItem('wpm_sprint_history')||'[]';
  const arrAll = JSON.parse(rawAll);
  const totalFromHistory = arrAll.reduce((s,it)=> s + Number(it.words||0), 0);
  // include per-card totals
  let totalFromCards = 0;
  boards.forEach(b=> b.lists.forEach(l=> l.cards.forEach(c=> totalFromCards += Number(c.wordCount||0))));
  const totalAll = totalFromHistory + totalFromCards + progressState.manualAdds.reduce((s,a)=> s + Number(a.words||0),0);
  const totalEl = document.getElementById('total-words');
  if(totalEl) totalEl.textContent = totalAll;
  const until = Math.max(0, goal - total);
  const untilEl = document.getElementById('until-goal');
  if(untilEl) untilEl.textContent = until;
  const fill = document.getElementById('today-progress-fill');
  if(fill){ const pct = Math.max(0, Math.min(100, Math.round((total/goal)*100))); fill.style.width = pct + '%'; }
  const list = document.getElementById('progress-history-list');
  if(list){
    list.innerHTML = '';
    const raw = localStorage.getItem('wpm_sprint_history')||'[]';
    const arr = JSON.parse(raw);
    arr.slice(0,20).forEach(it=>{
      const li = document.createElement('li');
      const dt = new Date(it.t);
      li.textContent = `${dt.toLocaleTimeString()} — ${it.title? it.title + ' — ' : ''}${it.words||0}w`;
      list.appendChild(li);
    });
  }
  renderProjectsBreakdown();
}

// Minimal projects breakdown renderer (stub to avoid runtime errors)
function renderProjectsBreakdown(){
  try{
    const el = document.getElementById('projects-breakdown');
    if(!el) return;
    el.innerHTML = '';
    boards.forEach(b=>{
      b.lists.forEach(l=>{
        l.cards.forEach(c=>{
          const d = document.createElement('div');
          d.className = 'card';
          d.style.marginBottom = '.4rem';
          d.textContent = `${c.title} — ${c.wordCount||0}w`;
          el.appendChild(d);
        })
      })
    });
  }catch(e){ console.error('renderProjectsBreakdown error', e); }
}

function wireProgressControls(){
  const add25 = document.getElementById('add-25');
  const add100 = document.getElementById('add-100');
  const add500 = document.getElementById('add-500');
  const goal = document.getElementById('daily-goal');
  const manualInput = document.getElementById('manual-words');
  const manualBtn = document.getElementById('manual-add-btn');
  if(add25) add25.addEventListener('click', ()=> addManualWords(25));
  if(add100) add100.addEventListener('click', ()=> addManualWords(100));
  if(add500) add500.addEventListener('click', ()=> addManualWords(500));
  if(goal) goal.addEventListener('change', ()=>{ progressState.dailyGoal = Number(goal.value)||1000; saveProgress(); renderProgress(); });
  if(manualBtn) manualBtn.addEventListener('click', ()=>{ const n = Number(manualInput.value)||0; if(n>0){ addManualWords(n); manualInput.value=''; } });
}

function addManualWords(n){
  const key = getTodayKey();
  progressState.manualAdds.unshift({ date: key, words: n, t: Date.now() });
  saveProgress();
  renderProgress();
}

// init progress (deferred to DOMContentLoaded)

function startApp(){
  // Boards and UI
  loadBoards();
  render();

  // Sprints
  loadSprints();
  wireSprintControls();
  updateSprintUI();
  renderHistory();

  // Characters & Scenes
  loadCharacters(); loadScenes(); renderCharacters(); renderScenes();
  populateCharAndProjectSelects();

  // Editor
  loadEditor();

  // Progress
  loadProgress();
  wireProgressControls();
  renderProgress();

  // wire nav buttons already attached earlier; ensure current view is active
  try{ document.querySelectorAll('.nav-btn')[0].click(); }catch(e){}
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
