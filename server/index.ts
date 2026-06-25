import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import factsRouter from './routes/facts';
import { registerGameSocket } from './socket/gameSocket';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const io = new Server(httpServer, {
  cors: { origin: corsOrigin },
});
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/', (_: Request, res: Response) => {
  res.send('Lower-Higher');
});

app.use('/api/facts', factsRouter);

registerGameSocket(io);

httpServer.listen(port, () => {
  console.log(`"Lower-Higher" backend listening on port ${port}`);
});
