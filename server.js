const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000; 

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ssl: true, 
  },
});

app.use(cors());
app.use(express.json());

// Define a root route
app.get('/', (req, res) => {
  res.send('Welcome to the Song API!');
});

// Create song
app.post('/songs', async (req, res) => {
  const { name, artist, album, poster, preview_url } = req.body;

  console.log('Request body:', req.body);

  if (!name || !artist || !album || !poster || !preview_url) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO songs (name, artist, album, poster, preview_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, artist, album, poster, preview_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding song:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update song
app.put('/songs/:id', async (req, res) => {
  const { id } = req.params;
  const { name, artist, preview_url, poster } = req.body;

  const fieldsToUpdate = [];
  const values = [];
  let index = 1;

  if (name) {
    fieldsToUpdate.push(`name = $${index++}`);
    values.push(name);
  }

  if (artist) {
    fieldsToUpdate.push(`artist = $${index++}`);
    values.push(artist);
  }

  if (preview_url) {
    fieldsToUpdate.push(`preview_url = $${index++}`);
    values.push(preview_url);
  }

  if (poster) {
    fieldsToUpdate.push(`poster = $${index++}`);
    values.push(poster);
  }

  if (fieldsToUpdate.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const query = `UPDATE songs SET ${fieldsToUpdate.join(', ')} WHERE id = $${index} RETURNING *`;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete song
app.delete('/songs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM songs WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch all songs
app.get('/songs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM songs');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
