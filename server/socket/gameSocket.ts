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
    socket.on('createRoom', async () => {
      try {
        const clientFacts = await getClientFacts(NUMBER_OF_FACTS);
        const room = createRoom(socket.id, clientFacts);

        socket.join(room.code);
        socket.emit('roomCode', { code: room.code });
      } catch (error) {
        socket.emit('gameError', { message: 'Failed to create room' });
      }
    });

    socket.on('joinRoom', (data: { code: string }) => {
      const room = joinRoom(data.code, socket.id);

      if (!room) {
        socket.emit('gameError', { message: 'Room not found or already full' });
        return;
      }

      socket.join(room.code);
      io.to(room.code).emit('roomReady', { facts: room.clientFacts });
    });

    socket.on('submitOrder', async (data: { ids: number[] }) => {
      const room = recordSubmit(socket.id, data.ids);

      if (!room) {
        socket.emit('gameError', { message: 'Room not found or not in playing state' });
        return;
      }

      if (!bothSubmitted(room)) return;

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

        io.to(room.code).emit('gameResult', {
          rightAnswers,
          scores,
          orders,
          hostId: room.hostId,
          guestId: room.guestId,
        });

        removeRoom(room.code);
      } catch (error) {
        io.to(room.code).emit('gameError', { message: 'Failed to calculate results' });
      }
    });

    socket.on('disconnect', () => {
      const room = getRoomBySocketId(socket.id);
      if (!room) return;

      io.to(room.code).emit('playerDisconnected');
      removeRoom(room.code);
    });
  });
}
