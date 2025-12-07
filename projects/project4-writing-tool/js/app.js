// Writing Project Management Tool – Full App (Model 3: Boards = Projects + Tasks)
// ------------------------------------------------------------
// Boards = projects
// Each board has To Do / Doing / Done columns with cards (tasks)
// Sprints can attach to either a board (project-level) OR a card (task-level)
// Characters link to boards (projects)
// Progress aggregates words from boards + cards + manual adds
// ------------------------------------------------------------

console.log('Writing Project Management Tool booting…');

// =========================
// DOM LOOKUPS
// =========================
const boardsContainer = document.getElementById('boards-container');
const navButtons = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');

// =========================
// SIMPLE VIEW ROUTER
// =========================
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const route = btn.dataset.route;

    // set active nav button
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // switch views (CSS can fade .view.active)
    views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + route);
    if (target) target.classList.add('active');

    // when landing on Projects, focus quick-add
    if (route === 'projects') {
      setTimeout(focusFirstQuickAddInput, 0);
    }
  });
});

// =========================
// BOARD / PROJECT MODEL
// =========================
const BOARDS_KEY = 'wpm_boards_v3';

// Each board = project
let boards = [
  {
    id: 'board_1',
    title: 'Novel Draft',
    description: 'Main work-in-progress novel',
    wordGoal: 0,
    wordCount: 0,
    lists: [
      { id: 'todo',  title: 'To Do',  cards: [], collapsed: false },
      { id: 'doing', title: 'Doing', cards: [], collapsed: false },
      { id: 'done',  title: 'Done',  cards: [], collapsed: false }
    ],
    sprints: [] // sprints attached directly to this project
  }
];

function saveBoards() {
  try {
    localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
  } catch (e) {
    console.error('saveBoards error', e);
  }
}

function loadBoards() {
  const raw = localStorage.getItem(BOARDS_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      boards = parsed;
    }
  } catch (e) {
    console.error('loadBoards error', e);
  }
}

// =========================
// QUICK-ADD TASK BAR (per board)
// =========================
function createQuickAddBar(board) {
  const wrap = document.createElement('div');
  wrap.className = 'quick-add-bar';
  wrap.style.display = 'flex';
  wrap.style.flexWrap = 'wrap';
  wrap.style.gap = '.5rem';
  wrap.style.alignItems = 'center';
  wrap.style.margin = '.5rem 0 1rem';

  // task title input
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'New task (e.g. “Revise Chapter 3”)';
  input.className = 'quick-add-input';
  input.style.flex = '1 1 180px';
  input.style.padding = '.45rem .6rem';
  input.style.borderRadius = '8px';
  input.style.border = '1px solid #ccc';

  // stage select: To Do / Doing / Done
  const stageSelect = document.createElement('select');
  stageSelect.style.padding = '.45rem .6rem';
  stageSelect.style.borderRadius = '8px';
  stageSelect.style.border = '1px solid #ccc';
  stageSelect.style.flex = '0 0 auto';

  board.lists.forEach(list => {
    const opt = document.createElement('option');
    opt.value = list.id;
    opt.textContent = list.title;
    stageSelect.appendChild(opt);
  });

  // tags input (comma separated)
  const tagsInput = document.createElement('input');
  tagsInput.type = 'text';
  tagsInput.placeholder = 'tags (scene, edit, research)';
  tagsInput.style.flex = '0 0 190px';
  tagsInput.style.padding = '.45rem .6rem';
  tagsInput.style.borderRadius = '8px';
  tagsInput.style.border = '1px solid #ccc';

  // priority select
  const prioritySelect = document.createElement('select');
  prioritySelect.style.padding = '.45rem .6rem';
  prioritySelect.style.borderRadius = '8px';
  prioritySelect.style.border = '1px solid #ccc';
  prioritySelect.style.flex = '0 0 auto';

  [
    { val: '', label: 'Priority' },
    { val: 'low', label: 'Low' },
    { val: 'medium', label: 'Medium' },
    { val: 'high', label: 'High' }
  ].forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.val;
    opt.textContent = p.label;
    prioritySelect.appendChild(opt);
  });

  // add button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn';
  addBtn.textContent = '+ Task';

  function addTask(targetStageOverride) {
    const title = input.value.trim();
    if (!title) return;

    let stageId = stageSelect.value;
    if (targetStageOverride) {
      // prefer override if that stage exists in this board
      const exists = board.lists.some(l => l.id === targetStageOverride);
      if (exists) stageId = targetStageOverride;
    }

    const list = board.lists.find(l => l.id === stageId) || board.lists[0];
    if (!list) return;

    const tags = tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const priority = prioritySelect.value || '';

    list.cards.push({
      id: 'task_' + Date.now(),
      title,
      description: '',
      wordGoal: 0,
      wordCount: 0,
      sprints: [],
      tags,
      priority
    });

    saveBoards();
    renderBoards();

    // reset inputs
    input.value = '';
    tagsInput.value = '';
    prioritySelect.value = '';
    // keep focus for fast entry
    setTimeout(focusFirstQuickAddInput, 0);
  }

  // click to add
  addBtn.addEventListener('click', () => addTask());

  // keyboard shortcuts
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter → Doing (if exists)
        addTask('doing');
      } else {
        // Enter → To Do (if exists)
        addTask('todo');
      }
    }
  });

  wrap.appendChild(input);
  wrap.appendChild(stageSelect);
  wrap.appendChild(tagsInput);
  wrap.appendChild(prioritySelect);
  wrap.appendChild(addBtn);
  return wrap;
}

// helper: auto-focus first quick-add input
function focusFirstQuickAddInput() {
  const el = document.querySelector('.quick-add-input');
  if (el) el.focus();
}

// helper: create meta pill row (tags + priority)
function createCardMetaRow(card) {
  const metaRow = document.createElement('div');
  metaRow.className = 'card-meta-row';
  metaRow.style.display = 'flex';
  metaRow.style.flexWrap = 'wrap';
  metaRow.style.gap = '.35rem';
  metaRow.style.marginTop = '.35rem';

  const tags = Array.isArray(card.tags) ? card.tags : [];
  tags.forEach(tag => {
    const pill = document.createElement('span');
    pill.textContent = tag;
    pill.className = 'tag-pill';
    pill.style.display = 'inline-flex';
    pill.style.alignItems = 'center';
    pill.style.padding = '.15rem .45rem';
    pill.style.borderRadius = '999px';
    pill.style.fontSize = '.8rem';
    pill.style.background = 'rgba(90,69,125,0.06)';
    pill.style.color = 'var(--text)';
    pill.style.border = '1px solid rgba(90,69,125,0.15)';
    metaRow.appendChild(pill);
  });

  if (card.priority) {
    const p = document.createElement('span');
    p.className = 'priority-pill';
    p.style.display = 'inline-flex';
    p.style.alignItems = 'center';
    p.style.padding = '.15rem .45rem';
    p.style.borderRadius = '999px';
    p.style.fontSize = '.8rem';
    p.style.border = '1px solid transparent';

    let label = '';
    let dotColor = '';
    let bgColor = '';

    if (card.priority === 'low') {
      label = 'Low priority';
      dotColor = '#4B675A';
      bgColor = 'rgba(75,103,90,0.06)';
      p.style.borderColor = 'rgba(75,103,90,0.3)';
    } else if (card.priority === 'medium') {
      label = 'Medium priority';
      dotColor = '#A07A4A';
      bgColor = 'rgba(160,122,74,0.08)';
      p.style.borderColor = 'rgba(160,122,74,0.35)';
    } else if (card.priority === 'high') {
      label = 'High priority';
      dotColor = '#C24545';
      bgColor = 'rgba(194,69,69,0.08)';
      p.style.borderColor = 'rgba(194,69,69,0.4)';
    }

    p.style.background = bgColor;
    const dot = document.createElement('span');
    dot.style.width = '8px';
    dot.style.height = '8px';
    dot.style.borderRadius = '50%';
    dot.style.background = dotColor;
    dot.style.display = 'inline-block';
    dot.style.marginRight = '.35rem';

    const txt = document.createElement('span');
    txt.textContent = label;

    p.appendChild(dot);
    p.appendChild(txt);
    metaRow.appendChild(p);
  }

  if (!metaRow.childNodes.length) return null;
  return metaRow;
}

// =========================
// BOARD RENDERING
// =========================
function renderBoards() {
  if (!boardsContainer) return;
  boardsContainer.innerHTML = '';

  boards.forEach(board => {
    const boardEl = document.createElement('section');
    boardEl.className = 'board';
    boardEl.dataset.boardId = board.id;

    // header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '.35rem';

    const titleWrap = document.createElement('div');
    const h3 = document.createElement('h3');
    h3.textContent = board.title;
    titleWrap.appendChild(h3);

    if (board.description) {
      const sub = document.createElement('div');
      sub.style.fontSize = '.85rem';
      sub.style.color = 'var(--muted)';
      sub.textContent = board.description;
      titleWrap.appendChild(sub);
    }

    header.appendChild(titleWrap);

    const headerActions = document.createElement('div');
    headerActions.style.display = 'flex';
    headerActions.style.gap = '.25rem';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editBoard(board.id));
    headerActions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteBoard(board.id));
    headerActions.appendChild(delBtn);

    header.appendChild(headerActions);
    boardEl.appendChild(header);

    // quick-add bar
    boardEl.appendChild(createQuickAddBar(board));

    // columns
    const listsWrap = document.createElement('div');
    listsWrap.className = 'lists-wrap';

    board.lists.forEach(list => {
      const col = document.createElement('div');
      col.className = 'column';
      col.dataset.stage = list.id;
      col.dataset.boardId = board.id;

      const colTitle = document.createElement('div');
      colTitle.className = 'col-title';
      colTitle.style.display = 'flex';
      colTitle.style.alignItems = 'center';
      colTitle.style.gap = '.25rem';
      colTitle.style.cursor = 'pointer';

      const isCollapsed = !!list.collapsed;
      const chevron = document.createElement('span');
      chevron.textContent = isCollapsed ? '▸' : '▾';
      chevron.style.fontSize = '.85rem';
      chevron.style.opacity = 0.7;

      const label = document.createElement('span');
      label.textContent = list.title;

      colTitle.appendChild(chevron);
      colTitle.appendChild(label);
      col.appendChild(colTitle);

      const listContainer = document.createElement('div');
      listContainer.className = 'list';
      if (isCollapsed) listContainer.style.display = 'none';

      // toggle collapse
      colTitle.addEventListener('click', () => {
        list.collapsed = !list.collapsed;
        saveBoards();
        renderBoards();
      });

      list.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card draggable';
        cardEl.draggable = true;
        cardEl.dataset.cardId = card.id;
        cardEl.dataset.boardId = board.id;

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';

        const titleEl = document.createElement('strong');
        titleEl.textContent = card.title;
        topRow.appendChild(titleEl);

        const wordMeta = document.createElement('span');
        wordMeta.style.fontSize = '.8rem';
        wordMeta.style.color = 'var(--muted)';
        const wc = Number(card.wordCount || 0);
        const wg = Number(card.wordGoal || 0);
        if (wg > 0) {
          wordMeta.textContent = `${wc}/${wg} w`;
        } else if (wc > 0) {
          wordMeta.textContent = `${wc} w`;
        }
        topRow.appendChild(wordMeta);
        cardEl.appendChild(topRow);

        const desc = document.createElement('div');
        desc.className = 'card-desc';
        desc.textContent = card.description || '';
        cardEl.appendChild(desc);

        // tags + priority meta row
        const metaRow = createCardMetaRow(card);
        if (metaRow) cardEl.appendChild(metaRow);

        // controls (styled to appear nicely on hover via CSS)
        const controls = document.createElement('div');
        controls.className = 'card-controls';
        controls.style.display = 'flex';
        controls.style.flexWrap = 'wrap';
        controls.style.gap = '.35rem';
        controls.style.marginTop = '.45rem';

        if (card.wordGoal && Number(card.wordGoal) > 0) {
          const goalLabel = document.createElement('div');
          goalLabel.className = 'goal-label';
          goalLabel.textContent = `Goal: ${card.wordGoal} w`;
          controls.appendChild(goalLabel);
        }

        const goalBtn = document.createElement('button');
        goalBtn.className = 'btn';
        goalBtn.textContent = card.wordGoal ? 'Edit Goal' : 'Set Goal';
        goalBtn.addEventListener('click', () => {
          const next = Number(prompt('Word goal for this task', card.wordGoal || 0) || 0);
          if (next >= 0) setCardGoal(card.id, board.id, next);
        });
        controls.appendChild(goalBtn);

        const openBtn = document.createElement('button');
        openBtn.className = 'btn';
        openBtn.textContent = 'Open';
        openBtn.addEventListener('click', () => openTaskModal(board.id, card.id));
        controls.appendChild(openBtn);

        cardEl.appendChild(controls);

        // drag events
        cardEl.addEventListener('dragstart', onDragStart);
        cardEl.addEventListener('dragend', onDragEnd);

        listContainer.appendChild(cardEl);
      });

      col.addEventListener('dragover', onDragOver);
      col.addEventListener('drop', onDrop);
      col.appendChild(listContainer);
      listsWrap.appendChild(col);
    });

    boardEl.appendChild(listsWrap);
    boardsContainer.appendChild(boardEl);
  });

  populateProjectSelector();
  populateCharAndProjectSelects();

  // focus quick-add when projects first render
  setTimeout(focusFirstQuickAddInput, 0);
}

// =========================
// BOARD HELPERS
// =========================
function editBoard(boardId) {
  const board = boards.find(b => b.id === boardId);
  if (!board) return;
  const title = prompt('Project title', board.title) || board.title;
  const desc = prompt('Short description', board.description || '') || board.description || '';
  const goalInput = prompt('Project word goal (0 for none)', board.wordGoal || 0) || board.wordGoal || 0;
  const wordGoal = Number(goalInput) || 0;
  board.title = title;
  board.description = desc;
  board.wordGoal = wordGoal;
  saveBoards();
  renderBoards();
  renderProgress();
}

function deleteBoard(boardId) {
  if (!confirm('Delete this project and all its tasks?')) return;
  boards = boards.filter(b => b.id !== boardId);
  saveBoards();
  renderBoards();
  populateProjectSelector();
  populateCharAndProjectSelects();
  renderProgress();
}

function setCardGoal(cardId, boardId, goal) {
  const board = boards.find(b => b.id === boardId);
  if (!board) return;
  board.lists.forEach(list => {
    const card = list.cards.find(c => c.id === cardId);
    if (card) card.wordGoal = goal;
  });
  saveBoards();
  renderBoards();
  renderProgress();
}

// =========================
// DRAG & DROP
// =========================
let draggingCard = null; // { cardId, boardId }

function onDragStart(e) {
  draggingCard = {
    cardId: this.dataset.cardId,
    boardId: this.dataset.boardId
  };
  this.classList.add('dragging');
  e.dataTransfer.setData('text/plain', JSON.stringify(draggingCard));
}

function onDragEnd() {
  this.classList.remove('dragging');
  draggingCard = null;
}

function onDragOver(e) {
  e.preventDefault();
  this.classList.add('drag-over');
}

function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  let payload;
  try {
    payload = JSON.parse(e.dataTransfer.getData('text/plain'));
  } catch (err) {
    payload = draggingCard;
  }
  if (!payload) return;

  const { cardId, boardId } = payload;
  const targetStage = this.dataset.stage;
  const targetBoardId = this.dataset.boardId || boardId;

  moveCard(cardId, boardId, targetBoardId, targetStage);
}

function moveCard(cardId, fromBoardId, toBoardId, stageId) {
  let cardObj = null;
  const fromBoard = boards.find(b => b.id === fromBoardId);
  const toBoard = boards.find(b => b.id === toBoardId);
  if (!fromBoard || !toBoard) return;

  fromBoard.lists.forEach(list => {
    const idx = list.cards.findIndex(c => c.id === cardId);
    if (idx > -1) cardObj = list.cards.splice(idx, 1)[0];
  });
  if (!cardObj) return;

  const targetList = toBoard.lists.find(l => l.id === stageId);
  if (!targetList) return;
  targetList.cards.push(cardObj);

  saveBoards();
  renderBoards();
}

// =========================
// PROJECT CREATION (ADVANCED FORM)
// =========================
const addForm = document.getElementById('add-card-form');
if (addForm) {
  addForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('card-title').value.trim();
    const desc = document.getElementById('card-desc').value.trim();
    if (!title) return;

    const goalInput = prompt('Set a word goal for this project (optional)', '0') || '0';
    const wordGoal = Number(goalInput) || 0;

    const tasksRaw = prompt('Initial To Do items (comma-separated), or leave blank', '');
    const tasks = tasksRaw
      ? tasksRaw.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const boardId = 'board_' + Date.now();
    const todoCards = tasks.map((t, idx) => ({
      id: `task_${Date.now()}_${idx}`,
      title: t,
      description: '',
      wordGoal: 0,
      wordCount: 0,
      sprints: [],
      tags: [],
      priority: ''
    }));

    const newBoard = {
      id: boardId,
      title,
      description: desc,
      wordGoal,
      wordCount: 0,
      lists: [
        { id: 'todo',  title: 'To Do',  cards: todoCards, collapsed: false },
        { id: 'doing', title: 'Doing', cards: [], collapsed: false },
        { id: 'done',  title: 'Done',  cards: [], collapsed: false }
      ],
      sprints: []
    };

    boards.push(newBoard);
    saveBoards();
    renderBoards();
    populateProjectSelector();
    populateCharAndProjectSelects();
    addForm.reset();
  });
}

// Clear all projects
const clearBtn = document.getElementById('clear-board');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    if (!confirm('Clear ALL projects and boards?')) return;
    boards = [
      {
        id: 'board_' + Date.now(),
        title: 'Novel Draft',
        description: '',
        wordGoal: 0,
        wordCount: 0,
        lists: [
          { id: 'todo',  title: 'To Do',  cards: [], collapsed: false },
          { id: 'doing', title: 'Doing', cards: [], collapsed: false },
          { id: 'done',  title: 'Done',  cards: [], collapsed: false }
        ],
        sprints: []
      }
    ];
    saveBoards();
    renderBoards();
    populateProjectSelector();
    populateCharAndProjectSelects();
    renderProgress();
  });
}

// =========================
// TASK MODAL (simple view)
// =========================
function openTaskModal(boardId, cardId) {
  const board = boards.find(b => b.id === boardId);
  if (!board) return;
  let card;
  board.lists.forEach(l => {
    const found = l.cards.find(c => c.id === cardId);
    if (found) card = found;
  });
  if (!card) return;

  const modal = document.createElement('div');
  modal.className = 'detail-modal';

  const cardEl = document.createElement('div');
  cardEl.className = 'detail-card';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const title = document.createElement('h4');
  title.textContent = card.title + ' — ' + board.title;
  header.appendChild(title);

  const close = document.createElement('button');
  close.className = 'btn';
  close.textContent = 'Close';
  close.addEventListener('click', () => document.body.removeChild(modal));
  header.appendChild(close);

  cardEl.appendChild(header);

  const meta = document.createElement('div');
  meta.style.margin = '0.5rem 0';
  meta.style.fontSize = '.9rem';
  const wc = Number(card.wordCount || 0);
  const wg = Number(card.wordGoal || 0);
  meta.textContent = `Words: ${wc}` + (wg > 0 ? ` / ${wg}` : '');
  cardEl.appendChild(meta);

  const descArea = document.createElement('textarea');
  descArea.style.width = '100%';
  descArea.style.minHeight = '120px';
  descArea.value = card.description || '';
  cardEl.appendChild(descArea);

  // tags + priority editing (simple prompts for now)
  const metaEditRow = document.createElement('div');
  metaEditRow.style.display = 'flex';
  metaEditRow.style.flexWrap = 'wrap';
  metaEditRow.style.gap = '.5rem';
  metaEditRow.style.marginTop = '.75rem';

  const tagsBtn = document.createElement('button');
  tagsBtn.className = 'btn';
  tagsBtn.textContent = 'Edit tags';
  tagsBtn.addEventListener('click', () => {
    const current = (card.tags || []).join(', ');
    const next = prompt('Tags (comma separated)', current) || current;
    card.tags = next
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  });
  metaEditRow.appendChild(tagsBtn);

  const priorityBtn = document.createElement('button');
  priorityBtn.className = 'btn';
  priorityBtn.textContent = 'Set priority';
  priorityBtn.addEventListener('click', () => {
    const current = card.priority || '';
    const next = prompt('Priority (low / medium / high or blank)', current) || current;
    const norm = next.toLowerCase().trim();
    if (!norm || ['low', 'medium', 'high'].includes(norm)) {
      card.priority = norm;
    }
  });
  metaEditRow.appendChild(priorityBtn);
  cardEl.appendChild(metaEditRow);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.style.marginTop = '.75rem';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => {
    card.description = descArea.value.trim();
    saveBoards();
    renderBoards();
    document.body.removeChild(modal);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'btn danger';
  delBtn.textContent = 'Delete task';
  delBtn.addEventListener('click', () => {
    if (!confirm('Delete this task?')) return;
    board.lists.forEach(l => {
      l.cards = l.cards.filter(c => c.id !== card.id);
    });
    saveBoards();
    renderBoards();
    document.body.removeChild(modal);
  });

  footer.appendChild(saveBtn);
  footer.appendChild(delBtn);
  cardEl.appendChild(footer);

  modal.appendChild(cardEl);
  document.body.appendChild(modal);
}

// =========================
// SPRINTS (MODEL 3: attach to board OR card)
// =========================
const SPRINT_KEY = 'wpm_sprints_v1';
const SPRINT_HISTORY_KEY = 'wpm_sprint_history_v1';

let sprintState = {
  lengthMin: 25,
  shortBreak: 5,
  longBreak: 15,
  targetWords: 500,
  running: false,
  remainingSec: 25 * 60,
  mode: 'work', // 'work' or 'break'
  title: '',
  attachedTarget: '' // 'board:<id>' or 'card:<id>' or ''
};

let sprintInterval = null;

function loadSprints() {
  const raw = localStorage.getItem(SPRINT_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(sprintState, parsed);
  } catch (e) {
    console.error('loadSprints error', e);
  }
}

function saveSprints() {
  try {
    localStorage.setItem(SPRINT_KEY, JSON.stringify(sprintState));
  } catch (e) {
    console.error('saveSprints error', e);
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateSprintUI() {
  const timeEl = document.getElementById('sprint-time');
  if (timeEl) timeEl.textContent = formatTime(sprintState.remainingSec);

  const len = document.getElementById('sprint-length');
  const sb = document.getElementById('short-break');
  const lb = document.getElementById('long-break');
  const tgt = document.getElementById('sprint-target');
  const titleEl = document.getElementById('sprint-title');

  if (len) len.value = sprintState.lengthMin;
  if (sb) sb.value = sprintState.shortBreak;
  if (lb) lb.value = sprintState.longBreak;
  if (tgt) tgt.value = sprintState.targetWords;
  if (titleEl) titleEl.value = sprintState.title || '';

  const modeEl = document.getElementById('sprint-mode');
  if (modeEl) {
    modeEl.textContent = sprintState.mode === 'work' ? 'Work' : 'Break';
    modeEl.style.background = sprintState.mode === 'work' ? 'var(--accent)' : '#2a8';
  }

  const fill = document.getElementById('sprint-progress-fill');
  if (fill) {
    const total =
      sprintState.mode === 'work'
        ? sprintState.lengthMin * 60
        : sprintState.shortBreak * 60;
    const pct = total ? Math.max(0, Math.min(100, Math.round(((total - sprintState.remainingSec) / total) * 100))) : 0;
    fill.style.width = pct + '%';
  }
}

// history helpers
function loadSprintHistory() {
  const raw = localStorage.getItem(SPRINT_HISTORY_KEY) || '[]';
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveSprintHistory(arr) {
  localStorage.setItem(SPRINT_HISTORY_KEY, JSON.stringify(arr.slice(0, 200)));
}

function pushHistory(entry) {
  const arr = loadSprintHistory();
  arr.unshift(entry);
  saveSprintHistory(arr);
  renderHistory();
  renderProgress();
}

// populate sprint project/task selector (MODEL 3)
function populateProjectSelector() {
  const sel = document.getElementById('sprint-project-select');
  if (!sel) return;

  const current = sel.value;
  sel.innerHTML = '';

  const def = document.createElement('option');
  def.value = '';
  def.textContent = '— Select project or task —';
  sel.appendChild(def);

  // Projects
  if (boards.length) {
    const label = document.createElement('option');
    label.disabled = true;
    label.textContent = '--- Projects ---';
    sel.appendChild(label);

    boards.forEach(b => {
      const opt = document.createElement('option');
      opt.value = 'board:' + b.id;
      opt.textContent = b.title;
      sel.appendChild(opt);
    });
  }

  // Tasks
  let hasTasks = false;
  boards.forEach(b => {
    b.lists.forEach(l => {
      l.cards.forEach(c => {
        if (!hasTasks) {
          const label = document.createElement('option');
          label.disabled = true;
          label.textContent = '--- Tasks ---';
          sel.appendChild(label);
          hasTasks = true;
        }
        const opt = document.createElement('option');
        opt.value = 'card:' + c.id;
        opt.textContent = `${c.title} (${b.title})`;
        sel.appendChild(opt);
      });
    });
  });

  if (current) {
    const found = Array.from(sel.options).find(o => o.value === current);
    if (found) sel.value = current;
  }
}

function attachSprintToTarget(targetValue, sprintEntry) {
  if (!targetValue) return false;
  const [kind, id] = targetValue.split(':');
  if (!kind || !id) return false;

  if (kind === 'board') {
    const board = boards.find(b => b.id === id);
    if (!board) return false;
    board.sprints = board.sprints || [];
    board.sprints.unshift(sprintEntry);
    board.wordCount = (board.wordCount || 0) + (sprintEntry.words || 0);
    saveBoards();
    renderBoards();
    renderProgress();
    return true;
  }

  if (kind === 'card') {
    for (const board of boards) {
      for (const list of board.lists) {
        const card = list.cards.find(c => c.id === id);
        if (card) {
          card.sprints = card.sprints || [];
          card.sprints.unshift(sprintEntry);
          card.wordCount = (card.wordCount || 0) + (sprintEntry.words || 0);
          saveBoards();
          renderBoards();
          renderProgress();
          return true;
        }
      }
    }
  }

  return false;
}

function renderHistory() {
  const list = document.getElementById('sprint-history-list');
  if (!list) return;
  const arr = loadSprintHistory();
  list.innerHTML = '';

  arr.forEach(entry => {
    const li = document.createElement('li');

    const left = document.createElement('div');
    const dt = new Date(entry.t);
    const when = `${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}`;
    left.textContent = `${when} — ${entry.title || '(no title)'} — ${entry.mode} ${entry.lengthMin}m — ${entry.words || 0}w`;

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '0.35rem';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn';
    viewBtn.textContent = 'View';
    viewBtn.addEventListener('click', () => viewHistoryEntry(entry.t));
    right.appendChild(viewBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => deleteHistoryEntry(entry.t));
    right.appendChild(delBtn);

    li.appendChild(left);
    li.appendChild(right);
    list.appendChild(li);
  });
}

function deleteHistoryEntry(ts) {
  const arr = loadSprintHistory();
  const filtered = arr.filter(e => e.t !== ts);
  saveSprintHistory(filtered);
  renderHistory();
  renderProgress();
}

function viewHistoryEntry(ts) {
  const arr = loadSprintHistory();
  const entry = arr.find(e => e.t === ts);
  if (!entry) return;

  const modal = document.createElement('div');
  modal.className = 'detail-modal';

  const card = document.createElement('div');
  card.className = 'detail-card';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const h = document.createElement('h4');
  h.textContent = entry.title || '(no title)';
  header.appendChild(h);

  const close = document.createElement('button');
  close.textContent = 'Close';
  close.className = 'btn';
  close.addEventListener('click', () => document.body.removeChild(modal));
  header.appendChild(close);

  card.appendChild(header);

  const meta = document.createElement('div');
  meta.style.margin = '0.5rem 0';
  const dt = new Date(entry.t);
  meta.textContent = `${dt.toLocaleString()} — ${entry.mode} ${entry.lengthMin}m — ${entry.words || 0}w`;
  card.appendChild(meta);

  const ta = document.createElement('textarea');
  ta.style.width = '100%';
  ta.style.height = '50vh';
  ta.value = entry.editorText || '';
  ta.readOnly = true;
  card.appendChild(ta);

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.gap = '0.5rem';
  footer.style.marginTop = '.75rem';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn';
  copyBtn.textContent = 'Copy text';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(ta.value || '').then(() => alert('Copied'));
  });
  footer.appendChild(copyBtn);

  card.appendChild(footer);
  modal.appendChild(card);
  document.body.appendChild(modal);
}

function startSprint() {
  if (sprintState.running) return;
  sprintState.running = true;
  saveSprints();

  if (!sprintInterval) {
    sprintInterval = setInterval(() => {
      sprintState.remainingSec -= 1;
      if (sprintState.remainingSec <= 0) {
        pauseSprint();

        const words = getEditorWordCount() || sprintState.targetWords || 0;
        const entry = {
          t: Date.now(),
          mode: sprintState.mode,
          lengthMin: sprintState.lengthMin,
          words,
          title: sprintState.title || '',
          remainingSec: sprintState.remainingSec,
          editorText: editor ? editor.value : '',
          attachedTarget: sprintState.attachedTarget || ''
        };
        pushHistory(entry);

        const sel = document.getElementById('sprint-project-select');
        if (sel && sel.value) attachSprintToTarget(sel.value, entry);

        if (sprintState.mode === 'work') {
          sprintState.mode = 'break';
          sprintState.remainingSec = sprintState.shortBreak * 60;
        } else {
          sprintState.mode = 'work';
          sprintState.remainingSec = sprintState.lengthMin * 60;
        }
        saveSprints();
      }
      updateSprintUI();
    }, 1000);
  }
}

function pauseSprint() {
  if (sprintInterval) {
    clearInterval(sprintInterval);
    sprintInterval = null;
  }
  sprintState.running = false;
  saveSprints();
}

function resetSprint() {
  pauseSprint();
  sprintState.mode = 'work';
  sprintState.remainingSec = sprintState.lengthMin * 60;
  saveSprints();
  updateSprintUI();
}

function wireSprintControls() {
  const start = document.getElementById('sprint-start');
  const pause = document.getElementById('sprint-pause');
  const reset = document.getElementById('sprint-reset');
  const len = document.getElementById('sprint-length');
  const sb = document.getElementById('short-break');
  const lb = document.getElementById('long-break');
  const tgt = document.getElementById('sprint-target');
  const titleEl = document.getElementById('sprint-title');
  const saveBtn = document.getElementById('sprint-save');
  const sel = document.getElementById('sprint-project-select');

  if (start) start.addEventListener('click', startSprint);
  if (pause) pause.addEventListener('click', pauseSprint);
  if (reset) reset.addEventListener('click', resetSprint);

  if (len) len.addEventListener('change', () => {
    sprintState.lengthMin = Number(len.value) || 25;
    sprintState.remainingSec = sprintState.lengthMin * 60;
    saveSprints();
    updateSprintUI();
  });

  if (sb) sb.addEventListener('change', () => {
    sprintState.shortBreak = Number(sb.value) || 5;
    saveSprints();
  });

  if (lb) lb.addEventListener('change', () => {
    sprintState.longBreak = Number(lb.value) || 15;
    saveSprints();
  });

  if (tgt) tgt.addEventListener('change', () => {
    sprintState.targetWords = Number(tgt.value) || 0;
    saveSprints();
  });

  if (titleEl) titleEl.addEventListener('input', () => {
    sprintState.title = titleEl.value;
    saveSprints();
  });

  if (sel) sel.addEventListener('change', () => {
    sprintState.attachedTarget = sel.value || '';
    saveSprints();
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      pauseSprint();
      const words = getEditorWordCount() || sprintState.targetWords || 0;
      const entry = {
        t: Date.now(),
        mode: sprintState.mode,
        lengthMin: sprintState.lengthMin,
        words,
        title: sprintState.title || '',
        remainingSec: sprintState.remainingSec,
        editorText: editor ? editor.value : '',
        attachedTarget: sprintState.attachedTarget || ''
      };
      pushHistory(entry);
      const sel = document.getElementById('sprint-project-select');
      if (sel && sel.value) attachSprintToTarget(sel.value, entry);
    });
  }
}

// =========================
// SPRINT EDITOR (autosave)
// =========================
const EDITOR_KEY = 'wpm_sprint_editor_v1';
const editor = document.getElementById('sprint-editor-input');
const wordCountEl = document.getElementById('sprint-wordcount');

function loadEditor() {
  const raw = localStorage.getItem(EDITOR_KEY) || '';
  if (editor) editor.value = raw;
  updateEditorCount();
}

function saveEditor() {
  if (!editor) return;
  localStorage.setItem(EDITOR_KEY, editor.value);
}

function clearEditor() {
  if (!editor) return;
  editor.value = '';
  saveEditor();
  updateEditorCount();
}

function getEditorWordCount() {
  if (!editor) return 0;
  const txt = editor.value.trim();
  if (!txt) return 0;
  return txt.split(/\s+/).filter(Boolean).length;
}

function updateEditorCount() {
  if (!wordCountEl) return;
  wordCountEl.textContent = 'Words: ' + getEditorWordCount();
}

if (editor) {
  editor.addEventListener('input', () => {
    saveEditor();
    updateEditorCount();
  });
}
if (wordCountEl) {
  wordCountEl.addEventListener('dblclick', () => {
    if (confirm('Clear editor?')) clearEditor();
  });
}

// =========================
// PROGRESS DASHBOARD
// =========================
const PROGRESS_KEY = 'wpm_progress_v1';
let progressState = { dailyGoal: 1000, manualAdds: [] };

function loadProgress() {
  const raw = localStorage.getItem(PROGRESS_KEY) || '';
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(progressState, parsed);
  } catch (e) {
    console.error('loadProgress error', e);
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressState));
}

function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function aggregateToday() {
  const key = getTodayKey();
  const arr = loadSprintHistory();
  let total = 0;
  arr.forEach(e => {
    const day = new Date(e.t).toISOString().slice(0, 10);
    if (day === key) total += Number(e.words || 0);
  });
  progressState.manualAdds.forEach(a => {
    if (a.date === key) total += Number(a.words || 0);
  });
  return total;
}

function renderProjectsBreakdown() {
  const el = document.getElementById('projects-breakdown');
  if (!el) return;
  el.innerHTML = '';
  boards.forEach(b => {
    const row = document.createElement('div');
    row.className = 'card';
    row.style.marginBottom = '.4rem';
    row.textContent = `${b.title} — ${b.wordCount || 0} w`;
    el.appendChild(row);
  });
}

function renderProgress() {
  loadProgress();
  const today = aggregateToday();
  const todayEl = document.getElementById('today-words');
  if (todayEl) todayEl.textContent = today;

  const goal = progressState.dailyGoal || 1000;
  const untilEl = document.getElementById('until-goal');
  if (untilEl) untilEl.textContent = Math.max(0, goal - today);

  const arr = loadSprintHistory();
  const totalFromHistory = arr.reduce((s, e) => s + Number(e.words || 0), 0);

  let totalFromBoards = 0;
  boards.forEach(b => {
    totalFromBoards += Number(b.wordCount || 0);
    b.lists.forEach(l => l.cards.forEach(c => {
      totalFromBoards += Number(c.wordCount || 0);
    }));
  });

  const totalFromManual = progressState.manualAdds.reduce((s, a) => s + Number(a.words || 0), 0);
  const totalAll = totalFromHistory + totalFromBoards + totalFromManual;

  const totalEl = document.getElementById('total-words');
  if (totalEl) totalEl.textContent = totalAll;

  const fill = document.getElementById('today-progress-fill');
  if (fill) {
    const pct = goal ? Math.max(0, Math.min(100, Math.round((today / goal) * 100))) : 0;
    fill.style.width = pct + '%';
  }

  const list = document.getElementById('progress-history-list');
  if (list) {
    list.innerHTML = '';
    arr.slice(0, 20).forEach(e => {
      const li = document.createElement('li');
      const dt = new Date(e.t);
      li.textContent = `${dt.toLocaleTimeString()} — ${e.title || '(no title)'} — ${e.words || 0}w`;
      list.appendChild(li);
    });
  }

  renderProjectsBreakdown();
}

function addManualWords(n) {
  const key = getTodayKey();
  progressState.manualAdds.unshift({ date: key, words: n, t: Date.now() });
  saveProgress();
  renderProgress();
}

function wireProgressControls() {
  const add25 = document.getElementById('add-25');
  const add100 = document.getElementById('add-100');
  const add500 = document.getElementById('add-500');
  const goalInput = document.getElementById('daily-goal');
  const manualInput = document.getElementById('manual-words');
  const manualBtn = document.getElementById('manual-add-btn');

  if (add25) add25.addEventListener('click', () => addManualWords(25));
  if (add100) add100.addEventListener('click', () => addManualWords(100));
  if (add500) add500.addEventListener('click', () => addManualWords(500));

  if (goalInput) {
    goalInput.addEventListener('change', () => {
      progressState.dailyGoal = Number(goalInput.value) || 1000;
      saveProgress();
      renderProgress();
    });
  }

  if (manualBtn) {
    manualBtn.addEventListener('click', () => {
      const n = Number(manualInput.value) || 0;
      if (n > 0) {
        addManualWords(n);
        manualInput.value = '';
      }
    });
  }
}

// =========================
// CHARACTERS & SCENES
// =========================
const CHAR_KEY = 'wpm_characters_v1';
const SCENE_KEY = 'wpm_scenes_v1';

let characters = [];
let scenes = [];

function loadCharacters() {
  const raw = localStorage.getItem(CHAR_KEY) || '[]';
  try {
    characters = JSON.parse(raw);
  } catch {
    characters = [];
  }
}

function saveCharacters() {
  localStorage.setItem(CHAR_KEY, JSON.stringify(characters));
}

function loadScenes() {
  const raw = localStorage.getItem(SCENE_KEY) || '[]';
  try {
    scenes = JSON.parse(raw);
  } catch {
    scenes = [];
  }
}

function saveScenes() {
  localStorage.setItem(SCENE_KEY, JSON.stringify(scenes));
}

function populateCharAndProjectSelects() {
  const projSel = document.getElementById('char-project-select');
  if (projSel) {
    projSel.innerHTML = '<option value="">— No project —</option>';
    boards.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.title;
      projSel.appendChild(opt);
    });
  }

  const povSel = document.getElementById('scene-pov');
  if (povSel) {
    povSel.innerHTML = '<option value="">— Select POV —</option>';
    characters.forEach(ch => {
      const opt = document.createElement('option');
      opt.value = ch.id;
      opt.textContent = ch.name + (ch.role ? ` — ${ch.role}` : '');
      povSel.appendChild(opt);
    });
  }
}

function renderCharacters() {
  const list = document.getElementById('characters-list');
  if (!list) return;
  list.innerHTML = '';

  const byProject = {};
  characters.forEach(ch => {
    const key = ch.projectId || '_none';
    (byProject[key] = byProject[key] || []).push(ch);
  });

  const projectNames = {};
  boards.forEach(b => { projectNames[b.id] = b.title; });

  Object.keys(byProject).forEach(pid => {
    const group = document.createElement('div');

    const header = document.createElement('div');
    header.style.margin = '0.25rem 0';
    header.style.fontWeight = '700';
    header.textContent = pid === '_none' ? 'Unassigned' : (projectNames[pid] || 'Project');
    group.appendChild(header);

    byProject[pid].forEach(ch => {
      const row = document.createElement('div');
      row.className = 'card';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';

      const left = document.createElement('div');
      left.innerHTML = `<strong>${ch.name}</strong>
        <div style="font-size:.9rem;color:var(--muted)">${ch.role || ''}</div>
        <div style="font-size:.9rem;color:var(--muted)">${ch.notes || ''}</div>`;
      row.appendChild(left);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => editCharacter(ch.id));
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn danger';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete character?')) return;
        characters = characters.filter(c => c.id !== ch.id);
        saveCharacters();
        renderCharacters();
      });
      actions.appendChild(delBtn);

      row.appendChild(actions);
      group.appendChild(row);
    });

    list.appendChild(group);
  });
}

function renderScenes() {
  const list = document.getElementById('scenes-list');
  if (!list) return;
  list.innerHTML = '';

  scenes.forEach(s => {
    const row = document.createElement('div');
    row.className = 'card';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    const povName = (() => {
      const ch = characters.find(c => c.id === s.povId);
      return ch ? ch.name : (s.pov || '');
    })();

    const left = document.createElement('div');
    left.innerHTML = `<strong>${s.title}</strong>
      <div style="font-size:.9rem;color:var(--muted)">POV: ${povName || '-'} — ${s.status || 'planned'}</div>
      <div style="font-size:.9rem;color:var(--muted)">${s.summary || ''}</div>`;
    row.appendChild(left);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => editScene(s.id));
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => {
      if (!confirm('Delete scene?')) return;
      scenes = scenes.filter(x => x.id !== s.id);
      saveScenes();
      renderScenes();
    });
    actions.appendChild(delBtn);

    row.appendChild(actions);
    list.appendChild(row);
  });
}

function editCharacter(id) {
  const ch = characters.find(c => c.id === id);
  if (!ch) return;
  const name = prompt('Name', ch.name) || ch.name;
  const role = prompt('Role', ch.role || '') || ch.role;
  const notes = prompt('Notes', ch.notes || '') || ch.notes;
  ch.name = name;
  ch.role = role;
  ch.notes = notes;
  saveCharacters();
  renderCharacters();
}

function editScene(id) {
  const s = scenes.find(x => x.id === id);
  if (!s) return;
  const title = prompt('Title', s.title) || s.title;
  const status = prompt('Status (planned/drafted/revised)', s.status || 'planned') || s.status;
  const summary = prompt('Summary', s.summary || '') || s.summary;
  s.title = title;
  s.status = status;
  s.summary = summary;
  saveScenes();
  renderScenes();
}

// forms
const addCharForm = document.getElementById('add-character-form');
if (addCharForm) {
  addCharForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('char-name').value.trim();
    const role = document.getElementById('char-role').value.trim();
    const notes = document.getElementById('char-notes').value.trim();
    const projectId = document.getElementById('char-project-select').value || '';
    if (!name) return;
    characters.unshift({
      id: 'ch_' + Date.now(),
      name,
      role,
      notes,
      projectId
    });
    saveCharacters();
    renderCharacters();
    addCharForm.reset();
    populateCharAndProjectSelects();
  });
}

const addSceneForm = document.getElementById('add-scene-form');
if (addSceneForm) {
  addSceneForm.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('scene-title').value.trim();
    const povId = document.getElementById('scene-pov').value || '';
    const status = document.getElementById('scene-status').value;
    const summary = document.getElementById('scene-summary').value.trim();
    if (!title) return;
    scenes.unshift({
      id: 'sc_' + Date.now(),
      title,
      povId,
      status,
      summary
    });
    saveScenes();
    renderScenes();
  });
}

// =========================
// APP STARTUP
// =========================
function startApp() {
  loadBoards();
  loadCharacters();
  loadScenes();
  loadSprints();
  loadEditor();
  loadProgress();

  renderBoards();
  renderCharacters();
  renderScenes();
  renderHistory();
  renderProgress();

  wireSprintControls();
  wireProgressControls();

  updateSprintUI();
  populateProjectSelector();
  populateCharAndProjectSelects();

  // default to Projects view
  const firstNav = document.querySelector('.nav-btn[data-route="projects"]');
  if (firstNav) firstNav.click();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

