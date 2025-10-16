const Event = require('../models/Event');
const Profile = require('../models/Profile');
const dayjs = require('dayjs');

// Get all events
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('profiles', 'name')
      .sort({ startDate: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get events by profile
exports.getEventsByProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const events = await Event.find({ profiles: profileId })
      .populate('profiles', 'name')
      .sort({ startDate: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { profiles, timezone, startDate, endDate } = req.body;

    if (!profiles || profiles.length === 0) {
      return res.status(400).json({ message: 'At least one profile is required' });
    }

    if (!timezone || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Verify all profiles exist
    const profileDocs = await Profile.find({ _id: { $in: profiles } });
    if (profileDocs.length !== profiles.length) {
      return res.status(400).json({ message: 'One or more profiles not found' });
    }

    const event = new Event({
      profiles,
      timezone,
      startDate: start,
      endDate: end,
      logs: []
    });

    await event.save();
    await event.populate('profiles', 'name');
    
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { profiles, timezone, startDate, endDate } = req.body;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const logs = [...event.logs];
    let changesMade = false;

    // Check for changes
    if (startDate && new Date(startDate).getTime() !== event.startDate.getTime()) {
      logs.push({
        timestamp: new Date(),
        change: 'Start date/time updated'
      });
      event.startDate = new Date(startDate);
      changesMade = true;
    }

    if (endDate && new Date(endDate).getTime() !== event.endDate.getTime()) {
      logs.push({
        timestamp: new Date(),
        change: 'End date/time updated'
      });
      event.endDate = new Date(endDate);
      changesMade = true;
    }

    if (profiles && JSON.stringify(profiles.sort()) !== JSON.stringify(event.profiles.map(p => p.toString()).sort())) {
      const profileDocs = await Profile.find({ _id: { $in: profiles } });
      const profileNames = profileDocs.map(p => p.name).join(', ');
      logs.push({
        timestamp: new Date(),
        change: `Profiles changed to ${profileNames}`
      });
      event.profiles = profiles;
      changesMade = true;
    }

    if (timezone && timezone !== event.timezone) {
      logs.push({
        timestamp: new Date(),
        change: `Timezone changed to ${timezone}`
      });
      event.timezone = timezone;
      changesMade = true;
    }

    // Validate end date is after start date
    if (event.endDate <= event.startDate) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    event.logs = logs;
    event.updatedAt = new Date();
    
    await event.save();
    await event.populate('profiles', 'name');
    
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get a single event
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('profiles', 'name');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get event logs
exports.getEventLogs = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event.logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};