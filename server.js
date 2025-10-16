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
// app.get('/api/vector-field', (req, res) => {
//     const { type, resolution = 8 } = req.query;
    
//     // Generate vector field data based on parameters
//     const vectorField = generateVectorField(type, parseInt(resolution));
    
//     res.json(vectorField);
// });

// app.get('/api/read-pvf', async (req, res) => {
//     const { filepath } = req.query;
//     try {
//         const data = await readPVFJson(filepath);
//         res.json(data);
//     } catch (error) {
//         res.status(500).json({ error: 'Failed to read PVF JSON file' });
//     }
// });

app.get('/api/list-subjects', async (req, res) => {
    const subjects = await listSubjects(PVF_SUBJECTS_DIR);
    res.json(subjects);
});

app.get('/api/list-subjects-files', async(req, res) => {
    const files = await listSubjectsPVFFiles(PVF_SUBJECTS_DIR, req.query.subject);
    res.json(files);
});

app.get('/api/load-subjects-files', async(req, res) => {
    const keys = await readPVFJson(PVF_SUBJECTS_DIR, req.query.subject, req.query.file);
    console.log(keys);
    res.json(keys);
});

// 启动服务器
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
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
    // console.log(subjects);
    return subjects;
};

// Function to list subjects' PVF files
async function listSubjectsPVFFiles(subjectsDir, subjectName){
    const fs         = require('fs').promises;
    const path       = require('path');
    const subjectDir = path.join(subjectsDir, subjectName);
    const entries    = await fs.readdir(subjectDir, { withFileTypes: true });
    const files      = entries.filter(entry => entry.isFile() && entry.name.endsWith('.json')).map(entry => entry.name);
    return files;
};

// Function to read PVF JSON file
async function readPVFJson(subjectsDir, subjectName, fileName) {
    const fs   = require('fs');
    const path = require('path');
    // const filepath = path.join(subjectsDir, subjectName, fileName);

    // console.log(Object.keys(data_stream));
    const metadata_fname = path.join(subjectsDir, subjectName, fileName);
    const PVF_Vx_fname = metadata_fname.replace('_metadata.json', '_Vx.json');
    const PVF_Vy_fname = metadata_fname.replace('_metadata.json', '_Vy.json');
    const PVF_Vz_fname = metadata_fname.replace('_metadata.json', '_Vz.json');
    const resp_value = {};
    // fs.readFile(metadata_fname, 'utf8', (err, data) => { // 回调函数作为最后一个参数
    //     if (err) {
    //         console.error('读取失败:', err);
    //         return; // 出错时退出
    //     }
    //     try {
    //         const jsonData = JSON.parse(data);
    //         console.log(Object.keys(jsonData));
    //         resp_value.metadata = Object.keys(jsonData);
    //     } catch (parseErr) {
    //         console.error('JSON解析失败:', parseErr);
    //     }
    //     });
    // fs.readFile(PVF_Vx_fname, 'utf8', (err, data) => { // 回调函数作为最后一个参数
    //     if (err) {
    //         console.error('读取失败:', err);
    //         return; // 出错时退出
    //     }
    //     try {
    //         const jsonData = JSON.parse(data);
    //         console.log(Object.keys(jsonData));
    //         resp_value.Vx = Object.keys(jsonData);
    //     } catch (parseErr) {
    //         console.error('JSON解析失败:', parseErr);
    //     }
    //     });
    // fs.readFile(PVF_Vy_fname, 'utf8', (err, data) => { // 回调函数作为最后一个参数
    //     if (err) {
    //         console.error('读取失败:', err);
    //         return; // 出错时退出
    //     }
    //     try {
    //         const jsonData = JSON.parse(data);
    //         console.log(Object.keys(jsonData));
    //         resp_value.Vy = Object.keys(jsonData);
    //     } catch (parseErr) {
    //         console.error('JSON解析失败:', parseErr);
    //     }
    //     });
    // fs.readFile(PVF_Vz_fname, 'utf8', (err, data) => { // 回调函数作为最后一个参数
    //     if (err) {
    //         console.error('读取失败:', err);
    //         return; // 出错时退出
    //     }
    //     try {
    //         const jsonData = JSON.parse(data);
    //         console.log(Object.keys(jsonData));
    //         resp_value.Vz = Object.keys(jsonData);
    //     } catch (parseErr) {
    //         console.error('JSON解析失败:', parseErr);
    //     }
    //     });
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(metadata_fname, 'utf8');
        const jsonData = JSON.parse(data);
        resp_value.metadata = Object.keys(jsonData);
        console.log('读取成功:', resp_value.metadata);
    } catch (err) {
    // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_Vx_fname, 'utf8');
        const jsonData = JSON.parse(data);
        resp_value.Vx = Object.keys(jsonData);
        console.log('读取成功:', resp_value.Vx);
    } catch (err) {
    // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_Vy_fname, 'utf8');
        const jsonData = JSON.parse(data);
        resp_value.Vy = Object.keys(jsonData);
        console.log('读取成功:', resp_value.Vy);
    } catch (err) {
    // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_Vz_fname, 'utf8');
        const jsonData = JSON.parse(data);
        resp_value.Vz = Object.keys(jsonData);
        console.log('读取成功:', resp_value.Vz);
    } catch (err) {
    // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    console.log(resp_value);
    return resp_value;
    
};