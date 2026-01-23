import express from 'express';

const index = express();
const port = 8000;

index.use(express.json());

index.get('/', (req, res) => {
  res.send({ message: 'Welcome to the Classroom API!' });
});

index.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
