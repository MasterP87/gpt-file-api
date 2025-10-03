const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const archiver = require('archiver');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const FILES_DIR = path.join(__dirname, 'files');
fs.ensureDirSync(FILES_DIR);

// Datei erstellen
app.post('/api/files', async (req, res) => {
  const { filename, content } = req.body;
  const filePath = path.join(FILES_DIR, filename);
  await fs.outputFile(filePath, content);
  res.status(201).json({ message: 'File created.' });
});

// Datei lesen
app.get('/api/files/:filename', async (req, res) => {
  const filePath = path.join(FILES_DIR, req.params.filename);
  if (await fs.pathExists(filePath)) {
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ filename: req.params.filename, content });
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

// Datei bearbeiten
app.put('/api/files/:filename', async (req, res) => {
  const { content } = req.body;
  const filePath = path.join(FILES_DIR, req.params.filename);
  if (await fs.pathExists(filePath)) {
    await fs.writeFile(filePath, content);
    res.json({ message: 'File updated.' });
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

// Datei löschen
app.delete('/api/files/:filename', async (req, res) => {
  const filePath = path.join(FILES_DIR, req.params.filename);
  if (await fs.pathExists(filePath)) {
    await fs.remove(filePath);
    res.status(204).end();
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

// Projekt zippen
app.post('/api/projects/export', async (req, res) => {
  const zipFilename = `project-${Date.now()}.zip`;
  const zipPath = path.join(FILES_DIR, zipFilename);

  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    res.json({
      downloadUrl: `${req.protocol}://${req.get('host')}/api/files/${zipFilename}/download`
    });
  });

  archive.on('error', err => res.status(500).send({ error: err.message }));

  archive.pipe(output);
  archive.directory(FILES_DIR + '/', false);
  archive.finalize();
});

// ZIP-Download
app.get('/api/files/:filename/download', (req, res) => {
  const filePath = path.join(FILES_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
