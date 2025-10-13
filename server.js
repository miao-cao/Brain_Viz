const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PVF data directory
const PVF_SUBJECTS_DIR = path.join(__dirname, 'pvf_data', 'pvf_subjects');

// Middleware
app.use(cors());
app.use(express.json());

// API endpoint to generate vector field data
app.get('/api/vector-field', (req, res) => {
    const { type, resolution = 8 } = req.query;
    
    // Generate vector field data based on parameters
    const vectorField = generateVectorField(type, parseInt(resolution));
    
    res.json(vectorField);
});

app.get('/api/read-pvf', async (req, res) => {
    const { filepath } = req.query;
    try {
        const data = await readPVFJson(filepath);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read PVF JSON file' });
    }
});

app.get('/api/list-subjects', (req, res) => {
    const subjects = listSubjects(PVF_SUBJECTS_DIR);
    res.json(subjects);
});

app.get('/api/list-subjects-files', (req, res) => {
    const files = listSubjectsPVFFiles(PVF_SUBJECTS_DIR, req.query.subject);
    res.json(files);
});


// 启动服务器
async function startServer() {
  try {
    await ensureDirectoryExists(BASE_DIR);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Serving folders from: ${BASE_DIR}`);
      console.log(`Serving PVF data from: ${PVF_SUBJECTS_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

// Function to generate vector field data
function generateVectorField(type = 'random', resolution = 8) {
    const vectorField = [];
    const size = resolution;
    const spacing = 50 / (size - 1);
    
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            for (let k = 0; k < size; k++) {
                // Calculate position
                const x = i * spacing - 10;
                const y = j * spacing - 10;
                const z = k * spacing - 10;
                
                // Calculate vector based on field type
                let vx, vy, vz;
                
                switch (type) {
                    case 'random':
                        vx = Math.random() * 2 - 1;
                        vy = Math.random() * 2 - 1;
                        vz = Math.random() * 2 - 1;
                        break;
                        
                    case 'curl':
                        // Curl field example: v = (-y, x, 0)
                        vx = -y;
                        vy = x;
                        vz = 0;
                        break;
                        
                    case 'divergence':
                        // Divergent field example: v = (x, y, z)
                        vx = x;
                        vy = y;
                        vz = z;
                        break;
                        
                    case 'vortex':
                        // Vortex field
                        const r = Math.sqrt(x * x + y * y) + 0.1;
                        vx = -y / r;
                        vy = x / r;
                        vz = 0;
                        break;
                        
                    case 'custom':
                        // Custom field
                        vx = Math.sin(x) * Math.cos(y);
                        vy = Math.cos(y) * Math.sin(z);
                        vz = Math.sin(z) * Math.cos(x);
                        break;
                }
                
                // Normalize vector
                const magnitude = Math.sqrt(vx * vx + vy * vy + vz * vz);
                if (magnitude > 0) {
                    vx /= magnitude;
                    vy /= magnitude;
                    vz /= magnitude;
                }
                
                vectorField.push({
                    position: { x, y, z },
                    direction: { x: vx, y: vy, z: vz },
                    magnitude
                });
            }
        }
    }
    
    return vectorField;
}

// Function to list subjects
async function listSubjects(subjectsDir){
    const fs       = require('fs').promises;
    const entries  = await fs.readdir(subjectsDir, { withFileTypes: true });
    const subjects = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    return subjects;
};

// Function to list subjects' PVF files
function listSubjectsPVFFiles(subjectsDir, subjectName){
    const fs       = require('fs').promises;
    const path     = require('path');
    const subjectDir = path.join(subjectsDir, subjectName);
    const entries  = fs.readdir(subjectDir, { withFileTypes: true });
    const files    = entries.filter(entry => entry.isFile() && entry.name.endsWith('.json'));
    return files.map(entry => entry.name);
};

// Function to read PVF JSON file
async function readPVFJson(filepath) {
    const fs = require('fs').promises;

    try {
        const fileContent = await fs.readFile(filepath, 'utf8');
        const data = JSON.parse(fileContent);
        console.log(data.keys());
        return data;
    } catch (error) {
        console.error('Error reading JSON file:', error);
    }
};