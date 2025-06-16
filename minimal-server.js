// minimal-server.js - Test if basic Express works
import express from 'express';

const app = express();
const PORT = 3001;

console.log('🧪 Testing minimal Express server...');

// Absolutely minimal routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Minimal server works!' });
});

app.get('/test', (req, res) => {
  res.json({ test: 'success' });
});

app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log('Test with: curl http://localhost:3001/health');
});
