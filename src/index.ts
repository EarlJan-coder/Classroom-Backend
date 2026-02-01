import express from 'express';
import subjectsRouter from "./routes/subjects";
import cors from "cors";

const app = express();
const PORT = 8000;

if (!process.env.FRONTEND_URL) {
    console.warn('FRONTEND_URL is not set. CORS may block requests.');
}

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use('/api/subjects', subjectsRouter)

app.get('/', (req, res) => {
  res.send({ message: 'Welcome to the Classroom API!' });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
