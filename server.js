const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { connectDB, getDB } = require('./db');

const app = express();
const PORT = 3000;

// Ensure public/uploads directory exists
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for image and PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper to create URL-friendly slugs
const slugify = s =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);

// Helper to verify edit permission via x-edit-key header
async function verifyOwner(req, res) {
  const db = getDB();
  const slug = req.params.slug;
  const key = req.headers['x-edit-key'];
  const portfolio = await db.collection('portfolios').findOne({ slug });

  if (!portfolio) {
    res.status(404).json({ error: 'Portfolio not found.' });
    return null;
  }
  if (!key || portfolio.edit_key !== key) {
    res.status(403).json({ error: 'Unauthorized. Invalid edit key.' });
    return null;
  }
  return portfolio;
}

// Seed a preloaded example portfolio if the database is empty
async function seedExamplePortfolio() {
  const db = getDB();
  const count = await db.collection('portfolios').countDocuments();
  if (count > 0) return;

  const demoSlug = 'aarav-mehta';
  const demoKey = 'demo-edit-key-12345';

  await db.collection('portfolios').insertOne({
    slug: demoSlug,
    edit_key: demoKey,
    name: 'Aarav Mehta',
    headline: 'Full-stack engineer building fast, accessible web tools and clean APIs.',
    roles: 'full-stack web apps, distributed systems, open source, developer tools',
    bio: 'I am a software developer based in Bengaluru who loves turning complex problems into simple, intuitive interfaces.\nWhen I am not writing code, you can find me participating in hackathons, exploring systems programming, or brewing specialty coffee.',
    location: 'Bengaluru, India',
    status: 'Open to internships & collaborations',
    email: 'aarav.demo@example.com',
    website: 'https://example.com',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    accent: '#d9481c',
    avatar_url: '',
    resume_url: '',
    created_at: new Date()
  });

  await db.collection('entries').insertMany([
    {
      slug: demoSlug,
      title: 'CloudPulse Monitor',
      category: 'Project',
      date: '2026-08',
      description: 'Real-time server metrics dashboard with live WebSocket streams and alert webhooks.',
      tags: 'Node.js, MongoDB, WebSockets, Docker',
      link: 'https://github.com',
      level: 0,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'DocuSearch AI',
      category: 'Project',
      date: '2026-05',
      description: 'Semantic search engine for technical documentation using vector embeddings.',
      tags: 'Python, FastAPI, JavaScript',
      link: 'https://github.com',
      level: 0,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'JavaScript / Node.js',
      category: 'Skill',
      date: '2026',
      description: 'REST APIs, Express, async workflows, and modern ES6+ frontend architecture.',
      tags: '',
      link: '',
      level: 90,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'MongoDB & Data Modeling',
      category: 'Skill',
      date: '2026',
      description: 'Document schema design, indexing, and aggregation pipelines.',
      tags: '',
      link: '',
      level: 85,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'C & Data Structures',
      category: 'Skill',
      date: '2026',
      description: 'Memory management, trees, graphs, and algorithmic problem solving.',
      tags: '',
      link: '',
      level: 80,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'Winner — National Student Hackathon',
      category: 'Achievement',
      date: '2026-09',
      description: 'Built an end-to-end prototype in 24 hours with a 4-person engineering team.',
      tags: '',
      link: '',
      level: 0,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'Started B.E. in Computer Science',
      category: 'Milestone',
      date: '2025-08',
      description: 'Focused on core computer science fundamentals, operating systems, and software design.',
      tags: '',
      link: '',
      level: 0,
      image_url: '',
      created_at: new Date()
    },
    {
      slug: demoSlug,
      title: 'MongoDB Node.js Developer Path',
      category: 'Certificate',
      date: '2026-10',
      description: 'MongoDB University',
      tags: '',
      link: '',
      level: 0,
      image_url: '',
      created_at: new Date()
    }
  ]);

  await db.collection('messages').insertOne({
    slug: demoSlug,
    name: 'Priya Nair',
    email: 'priya@example.com',
    body: 'Hey Aarav! Loved checking out your projects. Let us connect for an upcoming hackathon.',
    created_at: new Date().toISOString().slice(0, 10)
  });

  console.log('Seeded preloaded example portfolio: /p/aarav-mehta');
}

// ==================== API ROUTES ====================

// 1. Get all portfolios for the home gallery
app.get('/api/portfolios', async (req, res) => {
  try {
    const db = getDB();
    const list = await db
      .collection('portfolios')
      .find({}, { projection: { edit_key: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fetch portfolios.' });
  }
});

// 2. Create a new portfolio
app.post('/api/portfolios', async (req, res) => {
  try {
    const db = getDB();
    const name = String(req.body.name || '').trim();
    const headline = String(req.body.headline || '').trim();
    let slug = slugify(req.body.slug || name);

    if (!name) return res.status(400).json({ error: 'Name is required.' });
    if (!slug) slug = 'user-' + Math.round(Math.random() * 10000);

    const existing = await db.collection('portfolios').findOne({ slug });
    if (existing) {
      return res.status(409).json({ error: 'That username/slug is already taken. Try another.' });
    }

    const editKey = crypto.randomBytes(16).toString('hex');

    const newPortfolio = {
      slug,
      edit_key: editKey,
      name,
      headline,
      roles: 'building things, problem solving, learning',
      bio: '',
      location: '',
      status: 'Available for opportunities',
      email: '',
      website: '',
      github: '',
      linkedin: '',
      accent: '#d9481c',
      avatar_url: '',
      resume_url: '',
      created_at: new Date()
    };

    await db.collection('portfolios').insertOne(newPortfolio);
    res.status(201).json({ slug, key: editKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create portfolio.' });
  }
});

// 3. Get single portfolio details and entries
app.get('/api/p/:slug', async (req, res) => {
  try {
    const db = getDB();
    const slug = req.params.slug;
    const portfolio = await db.collection('portfolios').findOne({ slug });

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found.' });
    }

    const reqKey = req.headers['x-edit-key'];
    // Allow editing if the user has the matching key OR if it's the preloaded demo portfolio
    const isDemo = slug === 'aarav-mehta' && portfolio.edit_key === 'demo-edit-key-12345';
    const canEdit = Boolean((reqKey && reqKey === portfolio.edit_key) || isDemo);

    const rawEntries = await db
      .collection('entries')
      .find({ slug })
      .sort({ created_at: -1 })
      .toArray();

    const entries = rawEntries.map(e => ({
      ...e,
      id: e._id.toString()
    }));

    const { edit_key, _id, ...safeProfile } = portfolio;

    res.json({
      profile: safeProfile,
      entries,
      canEdit,
      ...(isDemo ? { editKey: portfolio.edit_key } : {})
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error loading portfolio.' });
  }
});

// 4. Update portfolio profile (supports avatar image and resume PDF upload)
app.put(
  '/api/p/:slug/profile',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const portfolio = await verifyOwner(req, res);
      if (!portfolio) return;

      const db = getDB();
      const b = req.body;

      const updates = {
        name: String(b.name || portfolio.name).trim(),
        headline: String(b.headline ?? '').trim(),
        roles: String(b.roles ?? '').trim(),
        bio: String(b.bio ?? '').trim(),
        location: String(b.location ?? '').trim(),
        status: String(b.status ?? '').trim(),
        email: String(b.email ?? '').trim(),
        website: String(b.website ?? '').trim(),
        github: String(b.github ?? '').trim(),
        linkedin: String(b.linkedin ?? '').trim(),
        accent: String(b.accent || portfolio.accent || '#d9481c').trim()
      };

      if (req.files && req.files.avatar && req.files.avatar[0]) {
        updates.avatar_url = `/uploads/${req.files.avatar[0].filename}`;
      }
      if (req.files && req.files.resume && req.files.resume[0]) {
        updates.resume_url = `/uploads/${req.files.resume[0].filename}`;
      }

      await db.collection('portfolios').updateOne({ slug: portfolio.slug }, { $set: updates });
      res.json({ message: 'Profile updated.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Could not update profile.' });
    }
  }
);

// 5. Delete entire portfolio
app.delete('/api/p/:slug', async (req, res) => {
  try {
    const portfolio = await verifyOwner(req, res);
    if (!portfolio) return;

    const db = getDB();
    await db.collection('portfolios').deleteOne({ slug: portfolio.slug });
    await db.collection('entries').deleteMany({ slug: portfolio.slug });
    await db.collection('messages').deleteMany({ slug: portfolio.slug });

    res.json({ message: 'Portfolio deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete portfolio.' });
  }
});

// 6. Add an entry (Project, Skill, Milestone, Achievement, Certificate)
app.post('/api/p/:slug/entries', upload.single('image'), async (req, res) => {
  try {
    const portfolio = await verifyOwner(req, res);
    if (!portfolio) return;

    const db = getDB();
    const b = req.body;
    const title = String(b.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const entry = {
      slug: portfolio.slug,
      title,
      category: b.category || 'Project',
      date: String(b.date || '').trim(),
      description: String(b.description || '').trim(),
      tags: String(b.tags || '').trim(),
      link: String(b.link || '').trim(),
      level: Number(b.level) || 0,
      image_url: req.file ? `/uploads/${req.file.filename}` : '',
      created_at: new Date()
    };

    await db.collection('entries').insertOne(entry);
    res.status(201).json({ message: 'Entry added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add entry.' });
  }
});

// 7. Edit an existing entry
app.put('/api/p/:slug/entries/:id', upload.single('image'), async (req, res) => {
  try {
    const portfolio = await verifyOwner(req, res);
    if (!portfolio) return;

    const db = getDB();
    let entryId;
    try {
      entryId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid entry ID.' });
    }

    const existing = await db.collection('entries').findOne({ _id: entryId, slug: portfolio.slug });
    if (!existing) return res.status(404).json({ error: 'Entry not found.' });

    const b = req.body;
    const updates = {
      title: String(b.title || existing.title).trim(),
      category: b.category || existing.category,
      date: String(b.date ?? '').trim(),
      description: String(b.description ?? '').trim(),
      tags: String(b.tags ?? '').trim(),
      link: String(b.link ?? '').trim(),
      level: Number(b.level) || 0,
      image_url: req.file ? `/uploads/${req.file.filename}` : existing.image_url
    };

    await db.collection('entries').updateOne({ _id: entryId }, { $set: updates });
    res.json({ message: 'Entry updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update entry.' });
  }
});

// 8. Delete an entry
app.delete('/api/p/:slug/entries/:id', async (req, res) => {
  try {
    const portfolio = await verifyOwner(req, res);
    if (!portfolio) return;

    const db = getDB();
    let entryId;
    try {
      entryId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid entry ID.' });
    }

    await db.collection('entries').deleteOne({ _id: entryId, slug: portfolio.slug });
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete entry.' });
  }
});

// 9. Send a contact message to a portfolio
app.post('/api/p/:slug/contact', async (req, res) => {
  try {
    const db = getDB();
    const slug = req.params.slug;

    // Honeypot check
    if (req.body.website) return res.json({ message: 'Sent.' });

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const body = String(req.body.body || '').trim();

    if (!name || !email || body.length < 5) {
      return res.status(400).json({ error: 'Please fill out all fields properly.' });
    }

    await db.collection('messages').insertOne({
      slug,
      name,
      email,
      body,
      created_at: new Date().toISOString().slice(0, 10)
    });

    res.status(201).json({ message: 'Message sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not send message.' });
  }
});

// 10. View inbox messages (Owner only)
app.get('/api/p/:slug/messages', async (req, res) => {
  try {
    const portfolio = await verifyOwner(req, res);
    if (!portfolio) return;

    const db = getDB();
    const msgs = await db
      .collection('messages')
      .find({ slug: portfolio.slug })
      .sort({ _id: -1 })
      .toArray();

    res.json(msgs.map(m => ({ ...m, id: m._id.toString() })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load messages.' });
  }
});

// 11. Delete an inbox message (Owner only)
app.delete('/api/p/:slug/messages/:id', async (req, res) => {
  try {
    const portfolio = await verifyOwner(req, res);
    if (!portfolio) return;

    const db = getDB();
    let msgId;
    try {
      msgId = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid message ID.' });
    }

    await db.collection('messages').deleteOne({ _id: msgId, slug: portfolio.slug });
    res.json({ message: 'Message deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete message.' });
  }
});

// ==================== HTML PAGE ROUTES ====================

// Serve portfolio.html for any /p/:slug URL
app.get('/p/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

// Start Server after connecting to MongoDB and seeding demo data
connectDB().then(async () => {
  await seedExamplePortfolio();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});