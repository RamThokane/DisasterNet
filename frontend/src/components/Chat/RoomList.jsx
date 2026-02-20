import { useState, useEffect } from 'react';
import { Plus, Hash, Users, Loader2 } from 'lucide-react';
import { getRooms, createRoom, joinRoom as joinRoomApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const RoomList = ({ activeRoom, onSelectRoom }) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newRoom.name.trim()) return;
    setCreating(true);

    try {
      const res = await createRoom(newRoom);
      setRooms((prev) => [res.data.data, ...prev]);
      setNewRoom({ name: '', description: '' });
      setShowCreate(false);
      onSelectRoom(res.data.data);
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinAndSelect = async (room) => {
    try {
      const isParticipant = room.participants?.some(
        (p) => (p._id || p).toString() === user._id.toString()
      );
      if (!isParticipant) {
        await joinRoomApi(room._id);
      }
      onSelectRoom(room);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Rooms</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition"
          title="Create Room"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="p-3 border-b border-gray-200 space-y-2">
          <input
            type="text"
            placeholder="Room name"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            required
            minLength={2}
            maxLength={50}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={newRoom.description}
            onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            maxLength={200}
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm py-2 rounded-lg transition disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <p className="text-gray-400 text-xs text-center p-4">
            No rooms yet. Create one!
          </p>
        ) : (
          rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => handleJoinAndSelect(room)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 transition ${
                activeRoom?._id === room._id
                  ? 'bg-gray-100 border-l-2 border-gray-900'
                  : 'hover:bg-gray-50 border-l-2 border-transparent'
              }`}
            >
              <Hash className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">
                  {room.name}
                </p>
                {room.description && (
                  <p className="text-xs text-gray-400 truncate">
                    {room.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
                <Users className="w-3 h-3" />
                {room.participants?.length || 0}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
