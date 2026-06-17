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

const numberOfFacts = 7;

export function registerGameSocket(io: Server): void {
  io.on('connection', (socket: Socket) => {
    socket.on('createRoom', async () => {
      try {
        const clientFacts = await getClientFacts(numberOfFacts);
        const room = createRoom(socket.id, clientFacts);

        socket.join(room.code);
        socket.emit('roomCode', { code: room.code });
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room' });
      }
    });

    socket.on('joinRoom', (data: { code: string }) => {
      const room = joinRoom(data.code, socket.id);

      if (!room) {
        socket.emit('error', { message: 'Room not found or already full' });
        return;
      }

      socket.join(room.code);
      io.to(room.code).emit('roomReady', { facts: room.clientFacts });
    });

    socket.on('submitOrder', async (data: { ids: number[] }) => {
      const room = recordSubmit(socket.id, data.ids);

      if (!room) {
        socket.emit('error', { message: 'Room not found or not in playing state' });
        return;
      }

      if (!bothSubmitted(room)) return;

      try {
        const rightAnswers = await getRightAnswers(room.factIds);
        const scores: { [socketId: string]: number } = {};
        const orders: { [socketId: string]: typeof rightAnswers } = {};
        const factMap = new Map(rightAnswers.map((f) => [f.id, f]));

        for (const [socketId, player] of Object.entries(room.players)) {
          scores[socketId] = calculateScore(rightAnswers, player.submittedIds!, 10000);
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
        io.to(room.code).emit('error', { message: 'Failed to calculate results' });
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
