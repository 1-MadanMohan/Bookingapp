// 🌐 Required Modules & Config
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const User = require('./models/User.js');
const Place = require('./models/Place.js');
const Booking = require('./models/Booking.js');
require('dotenv').config();

const app = express();
const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';

// 🔧 Mongo Strict Query Mode
mongoose.set('strictQuery', false);

// 📦 Middleware
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads')); // Serve static images 
app.use(cors({
  origin: 'http://localhost:5173', // Replace with frontend URL
  credentials: true,
}));

// 🔌 Database Connection
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// 📸 Multer Storage for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${file.originalname.split('.').pop()}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// ✅ Health Check Route
app.get('/api/test', (req, res) => {
  console.log("✅ Test API hit");
  res.json('Test OK');
});

// 🔑 User Registration
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    const userDoc = await User.create({ name, email, password: hashedPassword });
    console.log('✅ Registered:', email);
    res.json(userDoc);
  } catch (err) {
    console.error('❌ Registration failed:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// 🔑 User Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.log("✅ Login API hit:", email);
  try {
    const userDoc = await User.findOne({ email });
    if (userDoc && bcrypt.compareSync(password, userDoc.password)) {
      jwt.sign({ email: userDoc.email, id: userDoc._id }, jwtSecret, {}, (err, token) => {
        if (err) throw err;
        res.cookie('token', token).json({
          id: userDoc._id,
          name: userDoc.name,
          email: userDoc.email,
        });
        console.log("✅ Login successful:", email);
      });
    } else {
      console.log("❌ Invalid credentials");
      res.status(422).json('Invalid email or password');
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json('Login failed');
  }
});

// 🚪 Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  console.log("✅ User logged out");
  res.json({ message: 'Logged out successfully' });
});

// 📥 Upload Image by Link
app.post('/api/upload-by-link', async (req, res) => {
  const { link } = req.body;
  if (!link.startsWith('http')) return res.status(400).json('Invalid image URL');
  const newName = `photo${Date.now()}.jpg`;
  try {
    await imageDownloader.image({ url: link, dest: `${__dirname}/uploads/${newName}` });
    console.log("✅ Image downloaded:", newName);
    res.json(newName);
  } catch (err) {
    console.error('❌ Image download error:', err);
    res.status(500).json('Image download failed');
  }
});

// 📤 Upload Files (Photos)
app.post('/api/upload', upload.array('photos', 100), (req, res) => {
  console.log("✅ File Upload API hit");
  const uploadedFiles = req.files.map(file => file.filename);
  res.json(uploadedFiles);
});

// 👤 Get User Profile
app.get('/api/profile', (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json(null);
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) return res.status(403).json('Invalid token');
    const user = await User.findById(userData.id);
    res.json({ name: user.name, email: user.email, _id: user._id });
    console.log("✅ Profile fetched for:", user.email);
  });
});

// 🏠 Create Place Listing
app.post('/api/places', (req, res) => {
  const { token } = req.cookies;
  const placeData = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) return res.status(401).json('Unauthorized');
    const placeDoc = await Place.create({ ...placeData, owner: userData.id });
    res.json(placeDoc);
  });
});

// 🏠 Get User's Places
app.get('/api/user-places', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const places = await Place.find({ owner: userData.id });
    res.json(places);
  });
});

// 🏠 Get Place by ID
app.get('/api/places/:id', async (req, res) => {
  const place = await Place.findById(req.params.id);
  res.json(place);
});

// ✏️ Update Place
app.put('/api/places', async (req, res) => {
  const { token } = req.cookies;
  const placeData = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const placeDoc = await Place.findById(placeData.id);
    if (userData.id === placeDoc.owner.toString()) {
      Object.assign(placeDoc, placeData);
      await placeDoc.save();
      res.json('Updated Successfully');
    } else {
      res.status(403).json('Unauthorized');
    }
  });
});

// 🌍 Get All Places
app.get('/api/places', async (req, res) => {
  try {
    const places = await Place.find();
    res.json(places);
  } catch (err) {
    console.error("❌ Error fetching places:", err);
    res.status(500).json('Failed to fetch places');
  }
});

// 📅 Book a Place
app.post('/api/bookings', async (req, res) => {
  const { token } = req.cookies;
  try {
    const userData = jwt.verify(token, jwtSecret);
    const bookingDoc = await Booking.create({ ...req.body, user: userData.id });
    res.json(bookingDoc);
  } catch (err) {
    console.warn('❌ Booking error:', err);
    res.status(400).json({ error: err.message });
  }
});

// 📋 Get User's Bookings
app.get('/api/bookings', async (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json('Unauthorized');
  try {
    const userData = jwt.verify(token, jwtSecret); 
    const bookings = await Booking.find({ user: userData.id }).populate('place');
    res.json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json('Failed to fetch bookings');
  }
});

// 🚀 Server Listen
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});