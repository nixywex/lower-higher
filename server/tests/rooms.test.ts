import { describe, test, expect } from '@jest/globals';
import type { FactForClient, Room } from '../types';

const {
  createRoom,
  joinRoom,
  recordSubmit,
  bothSubmitted,
  removeRoom,
  getRoomBySocketId,
} = require('../utils/rooms');

const facts: FactForClient[] = [
  { id: 1, question: 'Q1' },
  { id: 2, question: 'Q2' },
];

describe('createRoom', () => {
  test('creates room with correct initial state', () => {
    const room: Room = createRoom('host-1', facts);
    expect(room.hostId).toBe('host-1');
    expect(room.guestId).toBeNull();
    expect(room.state).toBe('waiting');
    expect(room.factIds).toEqual([1, 2]);
    expect(room.clientFacts).toEqual(facts);
    expect(room.hardcore).toBe(false);
    removeRoom(room.code);
  });

  test('stores hardcore flag', () => {
    const room: Room = createRoom('host-1', facts, true);
    expect(room.hardcore).toBe(true);
    removeRoom(room.code);
  });

  test('generates a unique code per room', () => {
    const room1: Room = createRoom('host-1', facts);
    const room2: Room = createRoom('host-2', facts);
    expect(room1.code).not.toBe(room2.code);
    removeRoom(room1.code);
    removeRoom(room2.code);
  });
});

describe('joinRoom', () => {
  test('returns null for unknown room code', () => {
    expect(joinRoom('XXXX', 'guest-1')).toBeNull();
  });

  test('sets guest, changes state to playing', () => {
    const room: Room = createRoom('host-1', facts);
    const joined: Room = joinRoom(room.code, 'guest-1');
    expect(joined).not.toBeNull();
    expect(joined.guestId).toBe('guest-1');
    expect(joined.state).toBe('playing');
    removeRoom(room.code);
  });

  test('returns null if room already has a guest', () => {
    const room: Room = createRoom('host-1', facts);
    joinRoom(room.code, 'guest-1');
    expect(joinRoom(room.code, 'guest-2')).toBeNull();
    removeRoom(room.code);
  });
});

describe('bothSubmitted', () => {
  test('returns false when only one player submitted', () => {
    const room: Room = createRoom('host-1', facts);
    joinRoom(room.code, 'guest-1');
    recordSubmit('host-1', [1, 2]);
    expect(bothSubmitted(room)).toBe(false);
    removeRoom(room.code);
  });

  test('returns true when both players submitted', () => {
    const room: Room = createRoom('host-1', facts);
    joinRoom(room.code, 'guest-1');
    recordSubmit('host-1', [1, 2]);
    recordSubmit('guest-1', [2, 1]);
    expect(bothSubmitted(room)).toBe(true);
    removeRoom(room.code);
  });
});

describe('getRoomBySocketId', () => {
  test('finds room by host socket id', () => {
    const room: Room = createRoom('host-1', facts);
    expect(getRoomBySocketId('host-1')).toEqual(room);
    removeRoom(room.code);
  });

  test('finds room by guest socket id', () => {
    const room: Room = createRoom('host-1', facts);
    joinRoom(room.code, 'guest-1');
    const found: Room = getRoomBySocketId('guest-1');
    expect(found).not.toBeNull();
    expect(found.guestId).toBe('guest-1');
    removeRoom(room.code);
  });

  test('returns null for unknown socket id', () => {
    expect(getRoomBySocketId('unknown-id')).toBeNull();
  });
});
