import type { Room, Player, FactForClient } from '../types/index';

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createRoom(hostSocketId: string, clientFacts: FactForClient[]): Room {
  let code = generateRoomCode();
  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room: Room = {
    code,
    hostId: hostSocketId,
    guestId: null,
    factIds: clientFacts.map((f) => f.id),
    clientFacts,
    players: {
      [hostSocketId]: { socketId: hostSocketId, submittedIds: null },
    },
    state: 'waiting',
  };

  rooms.set(code, room);
  return room;
}

export function joinRoom(code: string, guestSocketId: string): Room | null {
  const room = rooms.get(code);
  if (!room || room.guestId !== null || room.state !== 'waiting') return null;

  room.guestId = guestSocketId;
  room.players[guestSocketId] = { socketId: guestSocketId, submittedIds: null };
  room.state = 'playing';

  return room;
}

export function recordSubmit(socketId: string, ids: number[]): Room | null {
  const room = getRoomBySocketId(socketId);
  if (!room || room.state !== 'playing') return null;

  room.players[socketId].submittedIds = ids;
  return room;
}

export function bothSubmitted(room: Room): boolean {
  return Object.values(room.players).every((p) => p.submittedIds !== null);
}

export function removeRoom(code: string): void {
  rooms.delete(code);
}

export function getRoomBySocketId(socketId: string): Room | null {
  return [...rooms.values()].find((r) => r.hostId === socketId || r.guestId === socketId) ?? null;
}
