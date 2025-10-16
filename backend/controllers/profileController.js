const Profile = require('../models/Profile');

// Get all profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ name: 1 });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new profile
exports.createProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Profile name is required' });
    }

    const existingProfile = await Profile.findOne({ name: name.trim() });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    const profile = new Profile({ name: name.trim() });
    await profile.save();
    
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};