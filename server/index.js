
import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Local uploads directory (kept for existing images)
const up = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'uploads'
);

fs.mkdirSync(up, { recursive: true });

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }),
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map(origin => origin.trim())
  }),
  express.json({ limit: '1mb' })
);

// Rate limiting
const lim = (n, error, ok) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: n,
    skipSuccessfulRequests: !!ok,
    message: { error }
  });

// Database models
const M = (n, s) =>
  mongoose.model(n, new mongoose.Schema(s, { timestamps: true }));

const Project = M('Project', {
  title: {
    type: String,
    required: [true, 'Add a project title']
  },
  summary: {
    type: String,
    required: [true, 'Add a short summary']
  },
  category: {
    type: String,
    enum: ['Full-stack', 'Laravel', 'UI', 'React'],
    default: 'Full-stack'
  },
  status: {
    type: String,
    enum: ['Built', 'In progress', 'Planned', 'Capstone'],
    default: 'Built'
  },
  tags: [String],
  liveUrl: { type: String, default: '' },
  githubUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  details: { type: String, default: '' },
  color: String,
  order: { type: Number, default: 0 },
  screenshots: { type: [String], default: [] }
});

const Cert = M('Cert', {
  title: {
    type: String,
    required: [true, 'Add a certificate title']
  },
  issuer: String,
  year: String,
  url: String,
  imageUrl: String
});

const Skill = M('Skill', {
  name: {
    type: String,
    required: [true, 'Add a skill name']
  },
  level: {
    type: Number,
    min: 0,
    max: 100,
    required: [true, 'Add a level from 0 to 100']
  }
});

const Msg = M('Msg', {
  name: String,
  email: {
    type: String,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Add a valid email, for example name@example.com'
    ]
  },
  message: {
    type: String,
    maxlength: 2000
  }
});

// Authentication middleware
const auth = (q, s, n) => {
  try {
    jwt.verify(
      (q.headers.authorization || '').slice(7),
      process.env.JWT_SECRET
    );
    n();
  } catch {
    s.status(401).json({ error: 'Please log in again' });
  }
};

// Admin login
app.post(
  '/api/login',
  lim(10, 'Too many attempts. Wait 15 minutes and try again.', true),
  (q, s) =>
    q.body.password &&
    q.body.password === process.env.ADMIN_PASSWORD
      ? s.json({
          token: jwt.sign(
            { a: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
          )
        })
      : s.status(401).json({
          error: 'Wrong password. Check ADMIN_PASSWORD in server/.env'
        })
);

// Projects, certificates and skills routes
for (const [p, Mo, sort] of [
  ['projects', Project, { order: 1 }],
  ['certificates', Cert, { year: -1 }],
  ['skills', Skill, { level: -1 }]
]) {
  app.get(`/api/${p}`, async (q, s, n) => {
    try {
      s.json(await Mo.find().sort(sort));
    } catch (e) {
      n(e);
    }
  });

  app.post(`/api/${p}`, auth, async (q, s, n) => {
    try {
      s.status(201).json(await Mo.create(q.body));
    } catch (e) {
      n(e);
    }
  });

  app.put(`/api/${p}/:id`, auth, async (q, s, n) => {
    try {
      s.json(
        await Mo.findByIdAndUpdate(
          q.params.id,
          q.body,
          { new: true, runValidators: true }
        )
      );
    } catch (e) {
      n(e);
    }
  });

  app.delete(`/api/${p}/:id`, auth, async (q, s, n) => {
    try {
      await Mo.findByIdAndDelete(q.params.id);
      s.json({ ok: 1 });
    } catch (e) {
      n(e);
    }
  });
}

// Contact messages
app.post(
  '/api/messages',
  lim(5, 'You sent several messages. Try again in 15 minutes.'),
  async (q, s, n) => {
    try {
      const { name, email, message } = q.body;

      if (!name || !email || !message) {
        return s.status(400).json({
          error: 'Name, email and message are required'
        });
      }

      await Msg.create({ name, email, message });
      s.status(201).json({ ok: 1 });
    } catch (e) {
      n(e);
    }
  }
);

app.get('/api/messages', auth, async (q, s, n) => {
  try {
    s.json(await Msg.find().sort({ createdAt: -1 }));
  } catch (e) {
    n(e);
  }
});

app.delete('/api/messages/:id', auth, async (q, s, n) => {
  try {
    await Msg.findByIdAndDelete(q.params.id);
    s.json({ ok: 1 });
  } catch (e) {
    n(e);
  }
});

// Multer: store new uploads in memory before sending to Cloudinary
const store = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (q, f, cb) => {
    /^image\/(jpeg|png|webp|gif)$/.test(f.mimetype)
      ? cb(null, true)
      : cb(
          Object.assign(
            new Error('Only JPG, PNG, WebP or GIF images are allowed'),
            { status: 400 }
          )
        );
  }
});

// Upload buffer to Cloudinary
const uploadToCloudinary = buffer =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'sitra-portfolio' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });

// Image upload route
app.post(
  '/api/upload',
  auth,
  store.single('image'),
  async (q, s, n) => {
    try {
      if (!q.file) {
        return s.status(400).json({
          error: 'Choose an image first'
        });
      }

      const result = await uploadToCloudinary(q.file.buffer);

      s.status(201).json({
        url: result.secure_url
      });
    } catch (e) {
      n(e);
    }
  }
);

// Continue serving previously uploaded local images
app.use('/uploads', express.static(up));

// Health check
app.get('/api/health', (q, s) => {
  s.json({
    ok: true,
    db: mongoose.connection.readyState === 1
  });
});

// Error handler
app.use((e, q, s, n) => {
  if (e.code === 'LIMIT_FILE_SIZE') {
    return s.status(413).json({
      error: 'Image is too large. Use one under 5 MB'
    });
  }

  s.status(
    e.name === 'ValidationError' || e.name === 'CastError'
      ? 400
      : e.status || 500
  ).json({
    error:
      e.name === 'ValidationError'
        ? Object.values(e.errors).map(x => x.message).join('. ')
        : e.message || 'Something went wrong'
  });
});

// Connect to MongoDB
for (let i = 1; ; i++) {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4
    });

    console.log('MongoDB connected successfully');
    break;
  } catch (e) {
    console.log(
      `MongoDB connection failed (try ${i}): ${e.message}`
    );

    if (i >= 5) throw e;

    await new Promise(r => setTimeout(r, 3000));
  }
}

// Seed initial data when requested
if (process.argv[2] === 'seed') {
  const g = {
    'Full-stack': 'linear-gradient(135deg,#4FD1A1,#1d8f6c)',
    Laravel: 'linear-gradient(135deg,#EE6B52,#F0BA1F)',
    UI: 'linear-gradient(135deg,#F0BA1F,#7c8cf0)',
    React: 'linear-gradient(135deg,#7c8cf0,#4FD1A1)'
  };

  const W = ['HTML', 'CSS', 'JavaScript'];

  const P = [
    ['Guzoye', 'Ethiopian tour guide marketplace with booking, guide and admin dashboards, and image uploads.', 'Full-stack', 'Built', ['React', 'Node', 'Express', 'MongoDB']],
    ['SplitEase', 'Split shared bills and see who owes what, in a MERN monorepo.', 'Full-stack', 'Built', ['React', 'Node', 'Express', 'MongoDB']],
    ['SitZone E-commerce', 'Online shop where customers browse products and place orders.', 'Full-stack', 'Built', ['E-commerce']],
    ['Mahber', 'Digital manager for Equb and Iddir savings groups.', 'Full-stack', 'Planned', ['React', 'Node', 'PostgreSQL']],
    ['ComputeX', 'Final-year capstone project that I led with a team of six.', 'Full-stack', 'Capstone', []],
    ['Lab Reservation System', 'Lets users reserve laboratory sessions and helps staff manage availability.', 'Laravel', 'Built', ['Laravel', 'PHP', 'MySQL']],
    ['Event Management System', 'Create events and manage registrations.', 'Laravel', 'Built', ['Laravel', 'PHP', 'MySQL']],
    ['Habit Constellation', 'Every habit is a star, and streaks connect into constellations.', 'React', 'In progress', ['React']],
    ['Todo app', 'Add, complete and delete tasks.', 'React', 'Built', ['React']],
    ['Calculator', 'A working calculator app.', 'React', 'Built', ['React']],
    ['Apple website clone', 'A responsive clone of the Apple website.', 'UI', 'Built', W],
    ['Mini UI project', 'A small UI practice project.', 'UI', 'Built', W]
  ];

  await Project.bulkWrite(
    P.map(([title, summary, category, status, tags], i) => ({
      updateOne: {
        filter: { title },
        update: {
          $set: { category, order: i + 1 },
          $setOnInsert: {
            summary,
            status,
            tags,
            color: g[category]
          }
        },
        upsert: true
      }
    }))
  );

  if (!await Skill.countDocuments()) {
    await Skill.insertMany([
      ['React', 90],
      ['Node.js', 88],
      ['Express.js', 88],
      ['MongoDB', 85],
      ['PostgreSQL', 75],
      ['MySQL', 75],
      ['Laravel / PHP', 70],
      ['Python', 70],
      ['Docker', 60],
      ['Git', 85]
    ].map(([name, level]) => ({ name, level })));
  }

  console.log(
    'Seed done. Projects were added or updated and your edits were kept.'
  );

  process.exit(0);
}

// Start server
app.listen(process.env.PORT || 5000, () => {
  console.log('API running on port ' + (process.env.PORT || 5000));
});
