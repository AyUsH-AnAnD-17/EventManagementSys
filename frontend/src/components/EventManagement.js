import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Clock, Users, X, Plus, Edit, FileText, Search, ChevronDown } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  fetchProfiles,
  createProfile,
  setCurrentProfile,
} from '../redux/slices/profileSlice';
import {
  fetchEvents,
  fetchEventsByProfile,
  createEvent,
  updateEvent,
} from '../redux/slices/eventSlice';

dayjs.extend(utc);
dayjs.extend(timezone);

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
];

const CalendarPicker = ({ value, onChange, minDate }) => {
  const [currentMonth, setCurrentMonth] = useState(value ? dayjs(value) : dayjs());
  const startOfMonth = dayjs(currentMonth).startOf('month');
  const endOfMonth = dayjs(currentMonth).endOf('month');
  const startDate = startOfMonth.startOf('week');
  const endDate = endOfMonth.endOf('week');

  const days = [];
  let day = startDate;
  while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
    days.push(day);
    day = day.add(1, 'day');
  }

  return (
    <div className="absolute z-50 bg-white border rounded-lg shadow-lg p-4 mt-1 left-0">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(dayjs(currentMonth).subtract(1, 'month'))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          ←
        </button>
        <span className="font-medium">{dayjs(currentMonth).format('MMMM YYYY')}</span>
        <button
          onClick={() => setCurrentMonth(dayjs(currentMonth).add(1, 'month'))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="font-medium text-gray-600 p-2">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const isCurrentMonth = d.month() === dayjs(currentMonth).month();
          const isSelected = value && d.format('YYYY-MM-DD') === value;
          const isPast = minDate && d.isBefore(dayjs(minDate), 'day');
          return (
            <button
              key={i}
              onClick={() => {
                if (!isPast) {
                  onChange(d.format('YYYY-MM-DD'));
                }
              }}
              disabled={isPast}
              className={`p-2 rounded ${
                isSelected ? 'bg-purple-600 text-white' : ''
              } ${!isCurrentMonth ? 'text-gray-300' : ''} ${
                isPast
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'hover:bg-purple-100'
              }`}
            >
              {d.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const EventManagement = () => {
  const dispatch = useDispatch();
  const { profiles, currentProfile } = useSelector((state) => state.profiles);
  const { events } = useSelector((state) => state.events);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [profileSearch, setProfileSearch] = useState('');
  const [eventTimezone, setEventTimezone] = useState('America/New_York');
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [viewTimezone, setViewTimezone] = useState('America/New_York');
  const [showViewTimezoneDropdown, setShowViewTimezoneDropdown] = useState(false);
  const [viewTimezoneSearch, setViewTimezoneSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('09:00');
  const [showCalendar, setShowCalendar] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showLogs, setShowLogs] = useState(null);
  const [newCurrentProfileName, setNewCurrentProfileName] = useState('');

  useEffect(() => {
    dispatch(fetchProfiles());
  }, [dispatch]);

  useEffect(() => {
    if (currentProfile) {
      dispatch(fetchEventsByProfile(currentProfile));
    }
  }, [currentProfile, dispatch]);

  const handleAddProfile = async () => {
    if (newProfileName.trim()) {
      await dispatch(createProfile(newProfileName.trim()));
      setNewProfileName('');
    }
  };

  const handleAddCurrentProfile = async () => {
    if (newCurrentProfileName.trim()) {
      const result = await dispatch(createProfile(newCurrentProfileName.trim()));
      if (result.payload) {
        dispatch(setCurrentProfile(result.payload._id));
        setNewCurrentProfileName('');
        setShowProfileDropdown(false);
      }
    }
  };

  const toggleProfileSelection = (profileId) => {
    if (selectedProfiles.includes(profileId)) {
      setSelectedProfiles(selectedProfiles.filter((p) => p !== profileId));
    } else {
      setSelectedProfiles([...selectedProfiles, profileId]);
    }
  };

  const handleCreateEvent = async () => {
    if (selectedProfiles.length === 0 || !startDate || !endDate) {
      alert('Please fill all fields');
      return;
    }

    const startDateTime = dayjs.tz(`${startDate} ${startTime}`, eventTimezone);
    const endDateTime = dayjs.tz(`${endDate} ${endTime}`, eventTimezone);

    if (endDateTime.isBefore(startDateTime)) {
      alert('End date/time cannot be before start date/time');
      return;
    }

    await dispatch(
      createEvent({
        profiles: selectedProfiles,
        timezone: eventTimezone,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
      })
    );

    if (currentProfile) {
      dispatch(fetchEventsByProfile(currentProfile));
    }

    setSelectedProfiles([]);
    setStartDate('');
    setEndDate('');
    setStartTime('09:00');
    setEndTime('09:00');
    setShowProfileSelector(false);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent) return;

    const startDateTime = dayjs(editingEvent.startDate);
    const endDateTime = dayjs(editingEvent.endDate);

    if (endDateTime.isBefore(startDateTime)) {
      alert('End date/time cannot be before start date/time');
      return;
    }

    await dispatch(
      updateEvent({
        id: editingEvent._id,
        data: {
          profiles: editingEvent.profiles.map((p) =>
            typeof p === 'string' ? p : p._id
          ),
          timezone: editingEvent.timezone,
          startDate: editingEvent.startDate,
          endDate: editingEvent.endDate,
        },
      })
    );

    if (currentProfile) {
      dispatch(fetchEventsByProfile(currentProfile));
    }

    setEditingEvent(null);
  };

  const formatDateTime = (isoString, tz) => {
    return dayjs(isoString).tz(tz).format('MMM D, YYYY');
  };

  const formatTime = (isoString, tz) => {
    return dayjs(isoString).tz(tz).format('h:mm A');
  };

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(profileSearch.toLowerCase())
  );

  const filteredTimezones = timezones.filter((tz) =>
    tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
  );

  const filteredViewTimezones = timezones.filter((tz) =>
    tz.label.toLowerCase().includes(viewTimezoneSearch.toLowerCase())
  );

  const getProfileName = (profile) => {
    return typeof profile === 'string' ? profile : profile.name;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Event Management
          </h1>
          <p className="text-gray-600">
            Create and manage events across multiple timezones
          </p>
        </div>

        <div className="mb-6 flex justify-end relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="px-4 py-2 bg-white border rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[250px] justify-between"
          >
            <span>
              {currentProfile
                ? profiles.find((p) => p._id === currentProfile)?.name
                : 'Select current profile...'}
            </span>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {showProfileDropdown && (
            <div className="absolute top-full mt-2 bg-white border rounded-lg shadow-lg w-64 z-50 right-0">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search current profile..."
                  value={profileSearch}
                  onChange={(e) => setProfileSearch(e.target.value)}
                  className="w-full px-3 py-2 border rounded mb-2"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredProfiles.map((profile) => (
                  <div
                    key={profile._id}
                    onClick={() => {
                      dispatch(setCurrentProfile(profile._id));
                      setShowProfileDropdown(false);
                      setProfileSearch('');
                    }}
                    className={`px-4 py-2 hover:bg-purple-100 cursor-pointer ${
                      currentProfile === profile._id
                        ? 'bg-purple-500 text-white'
                        : ''
                    }`}
                  >
                    {profile.name}
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <input
                  type="text"
                  placeholder="New profile name"
                  value={newCurrentProfileName}
                  onChange={(e) => setNewCurrentProfileName(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && handleAddCurrentProfile()
                  }
                  className="w-full px-3 py-2 border rounded text-sm mb-2"
                />
                <button
                  onClick={handleAddCurrentProfile}
                  className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-1"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Create Event</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Profiles
                </label>
                <div className="relative">
                  {selectedProfiles.length === 0 ? (
                    <button
                      onClick={() =>
                        setShowProfileSelector(!showProfileSelector)
                      }
                      className="w-full px-4 py-2 border rounded-lg text-left flex justify-between items-center hover:bg-gray-50"
                    >
                      <span className="text-gray-500">Select profiles...</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setShowProfileSelector(!showProfileSelector)
                      }
                      className="w-full px-4 py-2 border rounded-lg text-left flex justify-between items-center hover:bg-gray-50"
                    >
                      <span>{selectedProfiles.length} profiles selected</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                  )}

                  {showProfileSelector && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-40">
                      {selectedProfiles.length > 0 && (
                        <div className="p-2 border-b max-h-32 overflow-y-auto">
                          {selectedProfiles.map((profileId) => {
                            const profile = profiles.find(
                              (p) => p._id === profileId
                            );
                            return (
                              <div
                                key={profileId}
                                className="flex items-center justify-between px-2 py-1 bg-purple-100 rounded mb-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-purple-600">✓</span>
                                  <span>{profile?.name}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProfileSelection(profileId);
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search profiles..."
                          className="w-full px-3 py-2 border rounded mb-2 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {profiles
                          .filter((p) => !selectedProfiles.includes(p._id))
                          .map((profile) => (
                            <div
                              key={profile._id}
                              onClick={() => toggleProfileSelection(profile._id)}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                            >
                              <span className="w-4 h-4 border rounded"></span>
                              <span>{profile.name}</span>
                            </div>
                          ))}
                      </div>
                      <div className="border-t p-2">
                        <input
                          type="text"
                          placeholder="New profile name"
                          value={newProfileName}
                          onChange={(e) => setNewProfileName(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === 'Enter' && handleAddProfile()
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-3 py-2 border rounded text-sm mb-2"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddProfile();
                          }}
                          className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-1"
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Timezone
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
                    className="w-full px-4 py-2 border rounded-lg text-left flex justify-between items-center hover:bg-gray-50"
                  >
                    <span>
                      {timezones.find((tz) => tz.value === eventTimezone)?.label}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  {showTimezoneDropdown && (
                    <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-40">
                      <div className="p-2">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search timezone..."
                            value={timezoneSearch}
                            onChange={(e) => setTimezoneSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredTimezones.map((tz) => (
                          <div
                            key={tz.value}
                            onClick={() => {
                              setEventTimezone(tz.value);
                              setShowTimezoneDropdown(false);
                              setTimezoneSearch('');
                            }}
                            className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                              eventTimezone === tz.value ? 'bg-purple-100' : ''
                            }`}
                          >
                            {eventTimezone === tz.value && (
                              <span className="text-purple-600 mr-2">✓</span>
                            )}
                            {tz.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Start Date & Time
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={startDate}
                        onClick={() => setShowCalendar('start')}
                        placeholder="Pick a date"
                        readOnly
                        className="w-full pl-10 pr-4 py-2 border rounded-lg cursor-pointer"
                      />
                    </div>
                    {showCalendar === 'start' && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <CalendarPicker
                          value={startDate}
                          onChange={(date) => {
                            setStartDate(date);
                            setShowCalendar(null);
                          }}
                          minDate={null}
                        />
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  End Date & Time
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="relative">
                      <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={endDate}
                        onClick={() => setShowCalendar('end')}
                        placeholder="Pick a date"
                        readOnly
                        className="w-full pl-10 pr-4 py-2 border rounded-lg cursor-pointer"
                      />
                    </div>
                    {showCalendar === 'end' && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <CalendarPicker
                          value={endDate}
                          onChange={(date) => {
                            setEndDate(date);
                            setShowCalendar(null);
                          }}
                          minDate={startDate}
                        />
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateEvent}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Create Event
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Events</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                View in Timezone
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowViewTimezoneDropdown(!showViewTimezoneDropdown)}
                  className="w-full px-4 py-2 border rounded-lg text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span>
                    {timezones.find((tz) => tz.value === viewTimezone)?.label}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {showViewTimezoneDropdown && (
                  <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-40">
                    <div className="p-2">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search timezone..."
                          value={viewTimezoneSearch}
                          onChange={(e) => setViewTimezoneSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredViewTimezones.map((tz) => (
                        <div
                          key={tz.value}
                          onClick={() => {
                            setViewTimezone(tz.value);
                            setShowViewTimezoneDropdown(false);
                            setViewTimezoneSearch('');
                          }}
                          className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                            viewTimezone === tz.value ? 'bg-purple-100' : ''
                          }`}
                        >
                          {viewTimezone === tz.value && (
                            <span className="text-purple-600 mr-2">✓</span>
                          )}
                          {tz.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {!currentProfile && (
                <div className="text-center py-12 text-gray-500">
                  Select a profile to view events
                </div>
              )}

              {currentProfile && events.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No events found
                </div>
              )}

              {currentProfile &&
                events.map((event) => (
                  <div key={event._id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Users size={18} className="text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {event.profiles
                            .map((p) => getProfileName(p))
                            .join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mb-2">
                      <Calendar size={18} className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-sm">
                          Start: {formatDateTime(event.startDate, viewTimezone)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>
                            {formatTime(event.startDate, viewTimezone)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mb-3">
                      <Calendar size={18} className="text-gray-400 mt-1" />
                      <div>
                        <div className="text-sm">
                          End: {formatDateTime(event.endDate, viewTimezone)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{formatTime(event.endDate, viewTimezone)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      <div>
                        Created:{' '}
                        {dayjs(event.createdAt)
                          .tz(viewTimezone)
                          .format('MMM D, YYYY [at] h:mm A')}
                      </div>
                      <div>
                        Updated:{' '}
                        {dayjs(event.updatedAt)
                          .tz(viewTimezone)
                          .format('MMM D, YYYY [at] h:mm A')}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => setShowLogs(event)}
                        className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <FileText size={16} />
                        View Logs
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Edit Event</h3>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Profiles
                  </label>
                  <div className="px-4 py-2 bg-purple-100 rounded-lg">
                    {editingEvent.profiles.length} profiles selected
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Timezone
                  </label>
                  <select
                    value={editingEvent.timezone}
                    onChange={(e) =>
                      setEditingEvent({
                        ...editingEvent,
                        timezone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {timezones.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="text"
                    value={dayjs(editingEvent.startDate).format(
                      'MMMM D, YYYY'
                    )}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2"
                  />
                  <input
                    type="time"
                    value={dayjs(editingEvent.startDate).format('HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newStart = dayjs(editingEvent.startDate)
                        .hour(parseInt(hours))
                        .minute(parseInt(minutes));
                      setEditingEvent({
                        ...editingEvent,
                        startDate: newStart.toISOString(),
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="text"
                    value={dayjs(editingEvent.endDate).format('MMMM D, YYYY')}
                    readOnly
                    className="w-full px-4 py-2 border rounded-lg bg-gray-50 mb-2"
                  />
                  <input
                    type="time"
                    value={dayjs(editingEvent.endDate).format('HH:mm')}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newEnd = dayjs(editingEvent.endDate)
                        .hour(parseInt(hours))
                        .minute(parseInt(minutes));
                      setEditingEvent({
                        ...editingEvent,
                        endDate: newEnd.toISOString(),
                      });
                    }}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingEvent(null)}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateEvent}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Update Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLogs && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Event Update History</h3>
                <button
                  onClick={() => setShowLogs(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              {showLogs.logs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No update history yet
                </div>
              ) : (
                <div className="space-y-3">
                  {showLogs.logs.map((log, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-purple-500 pl-4 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Clock size={12} />
                        <span>
                          {dayjs(log.timestamp)
                            .tz(viewTimezone)
                            .format('MMM D, YYYY [at] h:mm A')}
                        </span>
                      </div>
                      <div className="text-sm">{log.change}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {(showCalendar || showProfileSelector || showTimezoneDropdown || showViewTimezoneDropdown) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowCalendar(null);
            setShowProfileSelector(false);
            setShowTimezoneDropdown(false);
            setShowViewTimezoneDropdown(false);
          }}
        />
      )}
    </div>
  );
};

export default EventManagement;