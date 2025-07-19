const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ✅ Enable CORS
app.use(express.json());
app.use(morgan('combined'));

app.post('/log', (req, res) => {
  //console.log('Received log request:', req.body);
  const practitionerId = req.body?.practitionerId || 'Unknown';
  console.log(req.body.practitionerId);
  const patientId = req.body?.patientId || 'Unknown';
  const fhirServer = req.body?.fhirServer || 'Unknown';
  const timestamp = req.body?.timestamp || 'Unknown';



  console.log(`🆔 Practitioner ID: ${practitionerId}`);
  console.log(`🏥 Patient ID: ${patientId}`);
  console.log(`🌐 FHIR Server: ${fhirServer}`);
  console.log(`🕒 Timestamp: ${timestamp}`);

  res.status(200).send('Log saved');
});

app.get('/', (req, res) => {
  res.send('Log server is up and running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});