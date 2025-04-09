import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Kullanıcı var mı kontrolü
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluştur
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // Token üret
    const token = generateToken(newUser._id);

    res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email
      },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kullanıcıyı bul
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Şifre kontrolü
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Token oluştur
    const token = generateToken(user._id);

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
