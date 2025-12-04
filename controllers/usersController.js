const User = require('../models/userModel');
const bcrypt = require('bcrypt');

async function getUser(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching user' });
  }
}

async function updateName(req, res) {
  try {
    const userIdToUpdate = req.params.id;  
    const currentUserId = req.user.id;    
    
    if (String(userIdToUpdate) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
    }
    
    const { first_name, last_name } = req.body;
    if (!first_name || !last_name) return res.status(400).json({ error: 'Names are required' });
    
    const [result] = await User.update(userIdToUpdate, {first_name, last_name});

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ message: 'User name updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating name' });
  }
}

async function setPassword(req, res) {
  try {
    const userIdToUpdate = req.params.id;  
    const currentUserId = req.user.id;    
    
    if (String(userIdToUpdate) !== String(currentUserId)) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own password' });
    }
    
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await User.update(userIdToUpdate, { password: hashedPassword });

    if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({ message: 'Password set successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error setting password' });
  }
}

module.exports = { getUser, updateName, setPassword };