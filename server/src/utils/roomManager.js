class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId) {
    this.rooms.set(roomId, 1);
  }

  joinRoom(roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.set(roomId, this.rooms.get(roomId) + 1);
    }
  }

  leaveRoom(roomId) {
    if (this.rooms.has(roomId)) {
      const count = this.rooms.get(roomId) - 1;
      if (count > 0) {
        this.rooms.set(roomId, count);
      } else {
        this.deleteRoom(roomId);
      }
    }
  }

  deleteRoom(roomId) {
    this.rooms.delete(roomId);
  }

  roomExists(roomId) {
    return this.rooms.has(roomId);
  }

  isRoomFull(roomId) {
    return this.rooms.get(roomId) >= 2;
  }

  getUserCount(roomId) {
    return this.rooms.get(roomId) || 0;
  }

  isEmpty(roomId) {
    return this.getUserCount(roomId) === 0;
  }

  getStats() {
    return {
      totalRooms: this.rooms.size,
      activeRooms: Array.from(this.rooms.entries()).map(([id, count]) => ({
        id,
        users: count
      }))
    };
  }
}

module.exports = new RoomManager();