const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors({ origin: true}));

const STATUSES = ['active', 'paused', 'archived'];
const CATEGORIES = ['general', 'work', 'personal'];

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const includesInsensitive = (haystack, needle) => haystack.toLowerCase().includes(needle.toLowerCase());

const seedItems = (count = 25) => {
  const namePool = [
    'Invoice Sync',
    'Client Portal',
    'Status Reporter',
    'Release Notes',
    'QA Checklist',
    'Bug Triage',
    'Timesheet Export',
    'Email Digest',
    'Audit Log',
    'Onboarding Pack',
    'Asset Manager',
    'Lead Tracker',
    'Roadmap Draft',
    'Docs Refresh',
    'Feedback Queue',
  ];

  const notesPool = [
    'Needs review',
    'Follow up with stakeholder',
    'Edge cases pending',
    'Ready for QA',
    'Waiting on API',
    'Polish UI copy',
    'Add validation',
    'Fix sorting bug',
    'Confirm requirements',
  ];

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  return Array.from({ length: count }, (_, idx) => {
    const id = idx + 1;
    const name = namePool[idx % namePool.length];
    const status = STATUSES[idx % STATUSES.length];
    const category = CATEGORIES[idx % CATEGORIES.length];

    const createdAt = new Date(now - (idx * 2 + 1) * oneDay).toISOString();

    const notes = notesPool[(idx * 3) % notesPool.length];

    return {
      id,
      name: `${name} #${id}`,
      status,
      category,
      createdAt,
      notes,
    };
  });
};

let items = seedItems(25);
let nextId = items.length + 1;

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/items', (req, res) => {
  const q = normalizeString(req.query.q);
  const status = normalizeString(req.query.status);
  const category = normalizeString(req.query.category);

  const sort = normalizeString(req.query.sort) || 'createdAt';
  const order = (normalizeString(req.query.order) || 'desc').toLowerCase();

  const page = Math.max(1, Math.min(9999, Number(req.query.page) || 1));
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const allowedSort = ['createdAt', 'name', 'status'];
  if (!allowedSort.includes(sort)) {
    return res.status(400).json({ error: 'Invalid sort field' });
  }
  if (order !== 'asc' && order !== 'desc') {
    return res.status(400).json({ error: 'Invalid order' });
  }

  let results = [...items];

  if (status) results = results.filter((item) => item.status === status);
  if (category) results = results.filter((item) => item.category === category);

  if (q) {
    results = results.filter(
      (item) => includesInsensitive(item.name, q) || includesInsensitive(item.notes ?? '', q)
    );
  }

  results.sort((a, b) => {
    let av = a[sort];
    let bv = b[sort];

    if (sort === 'createdAt') {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    } else {
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
    }

    if (av < bv) return order === 'asc' ? -1 : 1;
    if (av > bv) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const start = (page - 1) * limit;
  const end = start + limit;
  const paged = results.slice(start, end);

  res.json({
    data: paged,
    meta: {
      page,
      limit,
      total: results.length,
      totalPages: Math.max(1, Math.ceil(results.length / limit)),
    },
  });
});

app.get('/items/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  res.json(item);
});

app.post('/items', (req, res) => {
  const name = normalizeString(req.body?.name);
  const status = normalizeString(req.body?.status) || 'active';
  const category = normalizeString(req.body?.category) || 'general';
  const notes = normalizeString(req.body?.notes);

  if (!name) return res.status(400).json({ error: 'name is required' });
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });

  const created = {
    id: nextId++,
    name,
    status,
    category,
    createdAt: new Date().toISOString(),
    notes,
  };

  items.unshift(created); // newest first
  res.status(201).json(created);
});

app.patch('/items/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const item = items.find((i) => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const name = req.body?.name !== undefined ? normalizeString(req.body.name) : undefined;
  const status = req.body?.status !== undefined ? normalizeString(req.body.status) : undefined;
  const category = req.body?.category !== undefined ? normalizeString(req.body.category) : undefined;
  const notes = req.body?.notes !== undefined ? normalizeString(req.body.notes) : undefined;

  if (name !== undefined && !name) return res.status(400).json({ error: 'name cannot be empty' });
  if (status !== undefined && !STATUSES.includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  if (category !== undefined && !CATEGORIES.includes(category))
    return res.status(400).json({ error: 'Invalid category' });

  if (name !== undefined) item.name = name;
  if (status !== undefined) item.status = status;
  if (category !== undefined) item.category = category;
  if (notes !== undefined) item.notes = notes;

  res.json(item);
});

app.delete('/items/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });

  const [deleted] = items.splice(idx, 1);
  res.json(deleted);
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Admin List API running on http://localhost:${PORT}`);
    console.log(`Try: http://localhost:${PORT}/items`);
  });
}


