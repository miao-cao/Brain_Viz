const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


const subject_ID   = ""
const PVF_fname    = ""
const PVF_metadata = {}
const PVF_num_time_points = 0
const PVF_Vx       = {}
const PVF_Vy       = {}
const PVF_Vz       = {}

const PVF_condA_fname = ""
const PVF_condA_data  = {}

const PVF_pattern_fname = ""
const PVF_pattern_data  = {}

const PVF_streamline_folder = ""
const PVF_streamlines_timeWindows = {}

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

// // Function to generate vector field data
// function generateVectorField(type = 'random', resolution = 8) {
//     const vectorField = [];
//     const size = resolution;
//     const spacing = 50 / (size - 1);
    
//     for (let i = 0; i < size; i++) {
//         for (let j = 0; j < size; j++) {
//             for (let k = 0; k < size; k++) {
//                 // Calculate position
//                 const x = i * spacing - 10;
//                 const y = j * spacing - 10;
//                 const z = k * spacing - 10;
                
//                 // Calculate vector based on field type
//                 let vx, vy, vz;
                
//                 switch (type) {
//                     case 'random':
//                         vx = Math.random() * 2 - 1;
//                         vy = Math.random() * 2 - 1;
//                         vz = Math.random() * 2 - 1;
//                         break;
                        
//                     case 'curl':
//                         // Curl field example: v = (-y, x, 0)
//                         vx = -y;
//                         vy = x;
//                         vz = 0;
//                         break;
                        
//                     case 'divergence':
//                         // Divergent field example: v = (x, y, z)
//                         vx = x;
//                         vy = y;
//                         vz = z;
//                         break;
                        
//                     case 'vortex':
//                         // Vortex field
//                         const r = Math.sqrt(x * x + y * y) + 0.1;
//                         vx = -y / r;
//                         vy = x / r;
//                         vz = 0;
//                         break;
                        
//                     case 'custom':
//                         // Custom field
//                         vx = Math.sin(x) * Math.cos(y);
//                         vy = Math.cos(y) * Math.sin(z);
//                         vz = Math.sin(z) * Math.cos(x);
//                         break;
//                 }
                
//                 // Normalize vector
//                 const magnitude = Math.sqrt(vx * vx + vy * vy + vz * vz);
//                 if (magnitude > 0) {
//                     vx /= magnitude;
//                     vy /= magnitude;
//                     vz /= magnitude;
//                 }
                
//                 vectorField.push({
//                     position: { x, y, z },
//                     direction: { x: vx, y: vy, z: vz },
//                     magnitude
//                 });
//             }
//         }
//     }
    
//     return vectorField;
// }

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

async function laodPVFStreamlines(timepoint) {
    // for (let i = 0; i < 10; i++) {
    //     const PVF_streamline_fname = path.join(PVF_streamline_folder, `pvf_streamlines_time_window_${i}_${i+1}.json`);
    //     const data                 = fs.readFileSync(PVF_streamline_fname, 'utf8');
    //     const PVF_streamlines_timeWindows[i] = JSON.parse(data);


};


async function processPVFTimeWindow(PVF_timeWindowID) {
    resp_value.current_PVF = {};
    resp_value.Vx = PVF_Vx.Vx[:][:][:][PVF_timeWindowID];
    resp_value.Vy = PVF_Vy[PVF_timeWindowID];
    resp_value.Vz = PVF_Vz[PVF_timeWindowID];
    resp_value.subjectID = subject_ID;


    return resp_value
}

function getArrayDimensionsLength(arr) {
  if (!Array.isArray(arr)) {
    return []; // 非数组，无维度
  }
  // 当前层的长度 + 递归子数组的维度长度（取第一个子数组的维度作为参考，兼容不规则数组）
  const firstChildDims = arr.length > 0 ? getArrayDimensionsLength(arr[0]) : [];
  return [arr.length, ...firstChildDims];
}

// Function to read PVF JSON file
async function readPVFJson(subjectsDir, subjectName, fileName) {
    const fs   = require('fs');
    const path = require('path');
    // const filepath = path.join(subjectsDir, subjectName, fileName);

    // console.log(Object.keys(data_stream));
    const metadata_fname        = path.join(subjectsDir, subjectName, fileName);
    const PVF_Vx_fname          = metadata_fname.replace('_metadata.json', '_Vx.json');
    const PVF_Vy_fname          = metadata_fname.replace('_metadata.json', '_Vy.json');
    const PVF_Vz_fname          = metadata_fname.replace('_metadata.json', '_Vz.json');
    const PVF_condA_fname       = metadata_fname.replace('_metadata.json', '_condA.json');
    const PVF_pattern_fname     = metadata_fname.replace('_metadata.json', '_pattern_detection.json');
    const PVF_streamline_folder = metadata_fname.replace('_metadata.json', '_streamlines');
    const resp_value = {};


    // PVF meta data
    try {
        // 同步方法：无回调，直接获取结果
        const data         = fs.readFileSync(metadata_fname, 'utf8');
        const PVF_metadata = JSON.parse(data);
        resp_value.metadata = Object.keys(PVF_metadata);
        console.log('读取成功:', resp_value.metadata);
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // PVF Vx
    try {
        // 同步方法：无回调，直接获取结果
        const data   = fs.readFileSync(PVF_Vx_fname, 'utf8');
        PVF_Vx = JSON.parse(data);
        PVF_num_time_points = getArrayDimensionsLength(PVF_Vx.Vx)[3];
        resp_value.Vx = Object.keys(PVF_Vx);
        console.log('读取成功:', resp_value.Vx);
        console.log('Number of time points:', PVF_num_time_points);
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // PVF Vy
    try {
        // 同步方法：无回调，直接获取结果
        const data          = fs.readFileSync(PVF_Vy_fname, 'utf8');
        const PVF_Vy        = JSON.parse(data);
        resp_value.Vy = Object.keys(PVF_Vy);
        console.log('读取成功:', resp_value.Vy);
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // PVF Vz
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_Vz_fname, 'utf8');
        const PVF_Vz = JSON.parse(data);
        resp_value.Vz = Object.keys(PVF_Vz);
        console.log('读取成功:', resp_value.Vz);
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // // condition number of operator A
    // try {
    //     // 同步方法：无回调，直接获取结果
    //     const data = fs.readFileSync(PVF_condA_fname, 'utf8');
    //     const PVF_condA_data = JSON.parse(data);
    //     resp_value.condA = Object.keys(PVF_condA_data);
    //     console.log('读取成功:', resp_value.condA);
    // } catch (err) {
    // // 捕获所有错误（读取失败或解析失败）
    //     console.error('处理失败:', err);
    // }
    
    // // patterns - singularities
    // try {
    //     // 同步方法：无回调，直接获取结果
    //     const data = fs.readFileSync(PVF_pattern_fname, 'utf8');
    //     const PVF_pattern_data = JSON.parse(data);
    //     resp_value.pattern = Object.keys(PVF_pattern_data);
    //     console.log('读取成功:', resp_value.pattern);
    // } catch (err) {
    // // 捕获所有错误（读取失败或解析失败）
    //     console.error('处理失败:', err);
    // }
    
    // // streamlines
    // try {
    //     // 同步方法：无回调，直接获取结果
    //     const PVF_streamline_firstTW_fname = path.join(PVF_streamline_folder, "pvf_streamlines_time_window_0_9.json");
    //     const data                         = fs.readFileSync(PVF_streamline_firstTW_fname, 'utf8');
    //     const PVF_streamlines_timeWindows  = JSON.parse(data);
    //     resp_value.streamlines = Object.keys(PVF_streamlines_timeWindows);
    //     console.log('读取成功:', resp_value.streamlines);
    // } catch (err) {
    // // 捕获所有错误（读取失败或解析失败）
    //     console.error('处理失败:', err);
    // }
    

    // resp_value.PVF_data = processPVFTimeWindow(0)
    // console.log(resp_value);
    return resp_value;
    
};