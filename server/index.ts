import express, { Request, Response } from "express";
import factsRouter from './routes/facts';

const app = express();
const port = 3000;

var cors = require("cors");

app.use(cors());
app.use(express.json());

app.get("/", async (_: Request, res: Response) => {
  res.send("Lower-Higher");
});

app.use('/api/facts', factsRouter);

app.listen(port, () => {
  console.log(`"Lower-Higher" backend listening on port ${port}`);
});