import type { Server, Socket } from 'socket.io';
import {
  createRoom,
  joinRoom,
  recordSubmit,
  bothSubmitted,
  removeRoom,
  getRoomBySocketId,
} from '../utils/rooms';
import { getClientFacts, getRightAnswers } from '../utils/facts_handling';
import { calculateScore } from '../utils/scoring';
import { NUMBER_OF_FACTS, MAX_POINTS_PER_FACT } from '../config';

export function registerGameSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`socket ${socket.id} connected`);

    socket.on('createRoom', async (data?: { hardcore?: boolean }) => {
      try {
        const clientFacts = await getClientFacts(NUMBER_OF_FACTS);
        const room = createRoom(socket.id, clientFacts, data?.hardcore ?? false);

        socket.join(room.code);
        socket.emit('roomCode', { code: room.code });
        console.log(`room ${room.code} created by ${socket.id}`);
      } catch (error) {
        console.error(`failed to create room for ${socket.id}`, error);
        socket.emit('gameError', { message: 'Failed to create room' });
      }
    });

    socket.on('joinRoom', (data: { code: string }) => {
      const room = joinRoom(data.code, socket.id);

      if (!room) {
        console.warn(`${socket.id} tried to join ${data.code} — not found or full`);
        socket.emit('gameError', { message: 'Room not found or already full' });
        return;
      }

      socket.join(room.code);
      io.to(room.code).emit('roomReady', { facts: room.clientFacts, hardcore: room.hardcore });
      console.log(`${socket.id} joined room ${room.code} — game starting`);
    });

    socket.on('submitOrder', async (data: { ids: number[] }) => {
      if (!Array.isArray(data?.ids)) {
        console.warn(`${socket.id} sent invalid ids`);
        socket.emit('gameError', { message: 'ids must be an array' });
        return;
      }

      const room = recordSubmit(socket.id, data.ids);

      if (!room) {
        console.warn(`${socket.id} submitted but no active room found`);
        socket.emit('gameError', { message: 'Room not found or not in playing state' });
        return;
      }

      if (!bothSubmitted(room)) {
        console.log(`${socket.id} submitted, waiting on the other player`);
        return;
      }

      try {
        const rightAnswers = await getRightAnswers(room.factIds);
        const scores: Record<string, number> = {};
        const orders: Record<string, typeof rightAnswers> = {};
        const factMap = new Map(rightAnswers.map((f) => [f.id, f]));

        for (const [socketId, player] of Object.entries(room.players)) {
          scores[socketId] = calculateScore(
            rightAnswers,
            player.submittedIds!,
            MAX_POINTS_PER_FACT
          );
          orders[socketId] = (player.submittedIds ?? [])
            .map((id) => factMap.get(id)!)
            .filter(Boolean);
        }

        console.log(`game done in room ${room.code} — scores:`, scores);
        io.to(room.code).emit('gameResult', {
          rightAnswers,
          scores,
          orders,
          hostId: room.hostId,
          guestId: room.guestId,
        });

        removeRoom(room.code);
      } catch (error) {
        console.error(`failed to calculate results for room ${room.code}`, error);
        io.to(room.code).emit('gameError', { message: 'Failed to calculate results' });
      }
    });

    socket.on('disconnect', () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) {
        console.log(`socket ${socket.id} left`);
        return;
      }

      console.log(`${socket.id} left, room ${room.code} removed`);
      io.to(room.code).emit('playerDisconnected');
      removeRoom(room.code);
    });
  });
}
