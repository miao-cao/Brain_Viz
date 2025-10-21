const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;


// PVF metadata
let subject_ID          = ""
let PVF_metadata_fname  = ""
let PVF_metadata        = {}
let PVF_num_time_points = 0

// PVF data
let PVF_Vx    = {}
let PVF_Vy    = {}
let PVF_Vz    = {}
let PVF_X     = []
let PVF_Y     = []
let PVF_Z     = []
let dim_shift = [25, 25, 25]
const temporary_map_dim_shifts = {
    "sub-003": [25, 25, 20],
    "sub-005": [25, 25, 17],
}

let PVF_condA_fname = ""
let PVF_condA_data  = {}

let PVF_pattern_fname = ""
let PVF_pattern_data  = {}

let PVF_streamline_folder = ""
let PVF_streamlines_timeWindows = {}
let PVF_streamlines_tmin = 0
let PVF_streamlines_tmax = 4

// PVF data directory
let PVF_SUBJECTS_DIR = path.join(__dirname, 'pvf_data', 'pvf_subjects');

// Middleware
app.use(cors());
app.use(express.json());

app.get('/api/list-subjects', async (req, res) => {
    const subjects = await listSubjects(PVF_SUBJECTS_DIR);
    res.json(subjects);
});

app.get('/api/list-subjects-files', async(req, res) => {
    const files = await listSubjectsPVFFiles(PVF_SUBJECTS_DIR, req.query.subject);
    res.json(files);
});

app.get('/api/load-subjects-files', async(req, res) => {
    if (subject_ID == req.query.subject && PVF_metadata_fname == req.query.file){
        const data = await resp_PVFJson(0);
        res.json(data);
    } else {
        const data = await readPVFJson(PVF_SUBJECTS_DIR, req.query.subject, req.query.file);
        res.json(data);
    }

});

app.get('/api/read-PVF-streamlines', async(req, res) => {
    const data = await loadPVFStreamlines(req.query.timepoint);
    res.json(data);
});

// 启动服务器
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Serving PVF database from: ${PVF_SUBJECTS_DIR}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();


// Function to list all subject IDs under PVF_SUBJECTS_DIR
async function listSubjects(subjectsDir){
    const fs       = require('fs').promises;
    const entries  = await fs.readdir(subjectsDir, { withFileTypes: true });
    const subjects = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    // console.log(subjects);
    return subjects;
};

// Function to list all _metadata.json files under a subject's directory
async function listSubjectsPVFFiles(subjectsDir, subjectName){
    const fs         = require('fs').promises;
    const path       = require('path');
    const subjectDir = path.join(subjectsDir, subjectName);
    const entries    = await fs.readdir(subjectDir, { withFileTypes: true });
    const files      = entries.filter(entry => entry.isFile() && entry.name.endsWith('_metadata.json')).map(entry => entry.name);
    return files;
};

function processPVFTimeWindow(PVF_timeWindowID) {
    const return_value = {};
    // resp_value.current_PVF = {};
    console.log('Total number of time points:', PVF_num_time_points);
    console.log('Processing Vx, Vy, Vz of time point:', PVF_timeWindowID);
    const Vx = [];  
    const Vy = [];
    const Vz = [];

    for (let i = 0; i < 50; i++) {
        Vx[i] = []; // 初始化第二维数组
        Vy[i] = []; // 初始化第二维数组
        Vz[i] = []; // 初始化第二维数组
        // 遍历第二维（50个元素）
        for (let j = 0; j < 50; j++) {
            Vx[i][j] = []; // 初始化第三维数组
            Vy[i][j] = []; // 初始化第三维数组
            Vz[i][j] = []; // 初始化第三维数组
      
            // 遍历第三维（50个元素）
            for (let k = 0; k < 50; k++) {
                // 提取第四维的第一个元素（索引0），并包装成长度为1的数组
                Vx[i][j][k] = [PVF_Vx.Vx[i][j][k][PVF_timeWindowID]];
                Vy[i][j][k] = [PVF_Vy.Vy[i][j][k][PVF_timeWindowID]];
                Vz[i][j][k] = [PVF_Vz.Vz[i][j][k][PVF_timeWindowID]];
            }
        }
    }
    return_value.Vx = Vx;
    return_value.Vy = Vy;
    return_value.Vz = Vz;

    return return_value
}

function getArrayDimensionsLength(arr) {
  if (!Array.isArray(arr)) {
    return []; // 非数组，无维度
  }
  // 当前层的长度 + 递归子数组的维度长度（取第一个子数组的维度作为参考，兼容不规则数组）
  const firstChildDims = arr.length > 0 ? getArrayDimensionsLength(arr[0]) : [];
  return [arr.length, ...firstChildDims];
}

function arr_average(arr) {
  // 处理空数组（避免除以 0）
  if (arr.length === 0) return 0; // 或抛出错误：throw new Error("数组不能为空");
  
  // 计算总和
  const sum = arr.reduce((acc, current) => acc + current, 0);
  
  // 计算平均数（保留两位小数，可选）
  return sum / arr.length;
}

function sum3DMatrix(matrix) {
  return matrix.reduce((sum1, twoD) => {
    return sum1 + twoD.reduce((sum2, oneD) => {
      return sum2 + oneD.reduce((sum3, num) => sum3 + num, 0);
    }, 0);
  }, 0);
}

// Function to read PVF JSON file
async function readPVFJson(subjectsDir, subjectName, fileName) {
    const fs   = require('fs');
    const path = require('path');
    // const filepath = path.join(subjectsDir, subjectName, fileName);

      // console.log(Object.keys(data_stream));
          subject_ID            = subjectName;
    const metadata_fname        = path.join(subjectsDir, subjectName, fileName);
          PVF_metadata_fname    = metadata_fname;
    const PVF_Vx_fname          = metadata_fname.replace('_metadata.json', '_Vx.json');
    const PVF_Vy_fname          = metadata_fname.replace('_metadata.json', '_Vy.json');
    const PVF_Vz_fname          = metadata_fname.replace('_metadata.json', '_Vz.json');
          PVF_condA_fname       = metadata_fname.replace('_metadata.json', '_condA.json');
          PVF_pattern_fname     = metadata_fname.replace('_metadata.json', '_pattern_detection.json');
          PVF_streamline_folder = metadata_fname.replace('_metadata.json', '_streamlines');
    const resp_value            = {};


    // PVF meta data
    try {
        // 同步方法：无回调，直接获取结果
        const data   = fs.readFileSync(metadata_fname, 'utf8');
        PVF_metadata = JSON.parse(data);
        resp_value.subject_ID  = subjectName;
        resp_value.volume_mask = PVF_metadata.volume_mask;
        if (Object.hasOwn(temporary_map_dim_shifts, subject_ID)){
            dim_shift = temporary_map_dim_shifts[subject_ID];   
        } else {
            dim_shift = PVF_metadata.dim_shift;
        }
        console.log('读取成功:', Object.keys(PVF_metadata));
        console.log('Number of vectors:', sum3DMatrix(resp_value.volume_mask));
        console.log('Dim shift:', dim_shift);
        
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // PVF Vx
    try {
        // 同步方法：无回调，直接获取结果
        const data                     = fs.readFileSync(PVF_Vx_fname, 'utf8');
        PVF_Vx                         = JSON.parse(data);
        PVF_num_time_points            = getArrayDimensionsLength(PVF_Vx.Vx)[3];
        resp_value.PVF_dimension       = getArrayDimensionsLength(PVF_Vx.Vx)[0];
        resp_value.PVF_num_time_points = PVF_num_time_points;
        console.log('PVF dimensions:', resp_value.PVF_dimension);
        console.log('读取成功 Vx:', Object.keys(PVF_Vx));
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // PVF Vy
    try {
        // 同步方法：无回调，直接获取结果
        const data          = fs.readFileSync(PVF_Vy_fname, 'utf8');
        PVF_Vy        = JSON.parse(data);
        console.log('读取成功 Vy:', Object.keys(PVF_Vy));
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // PVF Vz
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_Vz_fname, 'utf8');
        PVF_Vz = JSON.parse(data);
        console.log('读取成功 Vz:', Object.keys(PVF_Vz));
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }

    // {x, y, z} = generate_xyz_coordinates(resp_value.PVF_dimension, dim_shift);

    // condition number of operator A
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_condA_fname, 'utf8');
        PVF_condA_data = JSON.parse(data);
        // resp_value.condA = PVF_condA_data;
        console.log('读取成功 condA:', Object.keys(PVF_condA_data));
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    
    // patterns - singularities and extent of singularities
    try {
        // 同步方法：无回调，直接获取结果
        const data = fs.readFileSync(PVF_pattern_fname, 'utf8');
        PVF_pattern_data = JSON.parse(data);
        // resp_value.pattern = Object.keys(PVF_pattern_data);
        console.log('读取成功 Patterns:', Object.keys(PVF_pattern_data));
    } catch (err) {
        // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    
    // // streamlines
    try {
        // 同步方法：无回调，直接获取结果
        const PVF_streamline_firstTW_fname = path.join(PVF_streamline_folder, "pvf_streamlines_time_window_0_4.json");
        const data                         = fs.readFileSync(PVF_streamline_firstTW_fname, 'utf8');
        PVF_streamlines_timeWindows  = JSON.parse(data);
        console.log('读取成功 Streamlines:', Object.keys(PVF_streamlines_timeWindows));
    } catch (err) {
    // 捕获所有错误（读取失败或解析失败）
        console.error('处理失败:', err);
    }
    
    // loading PVF, streamlines, condA, patterns and streamlines
    const default_first_timepoint = 0;
    const PVF_data = processPVFTimeWindow(default_first_timepoint)
    resp_value.Vx = PVF_data.Vx;
    resp_value.Vy = PVF_data.Vy;
    resp_value.Vz = PVF_data.Vz;
    resp_value.X  = PVF_X;
    resp_value.Y  = PVF_Y;
    resp_value.Z  = PVF_Z;
    resp_value.condA = arr_average(PVF_condA_data[`${default_first_timepoint}`]);
    resp_value.patterns = PVF_pattern_data[`${default_first_timepoint}`];
    resp_value.streamlines = PVF_streamlines_timeWindows[`${default_first_timepoint}`];
    return resp_value;
};

async function resp_PVFJson(timepoint){
    const resp_value = {};
    const PVF_data   = processPVFTimeWindow(timepoint)
    resp_value.subject_ID  = subjectName;
    resp_value.volume_mask = PVF_metadata.volume_mask;
    resp_value.Vx          = PVF_data.Vx;
    resp_value.Vy          = PVF_data.Vy;
    resp_value.Vz          = PVF_data.Vz;
    resp_value.X           = PVF_X;
    resp_value.Y           = PVF_Y;
    resp_value.Z           = PVF_Z;
    resp_value.condA       = arr_average(PVF_condA_data[`${default_first_timepoint}`]);
    resp_value.patterns    = PVF_pattern_data[`${default_first_timepoint}`];
    resp_value.streamlines = PVF_streamlines_timeWindows[`${default_first_timepoint}`];
}

async function loadPVFStreamlines(timepoint) {
    // loading PVF, streamlines, condA, patterns and streamlines
    const PVF_data   = processPVFTimeWindow(timepoint)
    const resp_value = {};
    resp_value.Vx          = PVF_data.Vx;
    resp_value.Vy          = PVF_data.Vy;
    resp_value.Vz          = PVF_data.Vz;
    resp_value.condA       = arr_average(PVF_condA_data[`${timepoint}`]);
    resp_value.patterns    = PVF_pattern_data[`${timepoint}`];

    // streamlines
    if (timepoint > PVF_streamlines_tmin && timepoint < PVF_streamlines_tmax) {
        resp_value.streamlines = PVF_streamlines_timeWindows[`${timepoint}`];
    } else if (timepoint < PVF_streamlines_tmin && timepoint < PVF_streamlines_tmax) {
        const PVF_streamline_fname = path.join(PVF_streamline_folder, `pvf_streamlines_time_window_${PVF_streamlines_tmin}_${PVF_streamlines_tmax}.json`);
        try {
            // 同步方法：无回调，直接获取结果
            const data = fs.readFileSync(PVF_streamline_fname, 'utf8');
            PVF_streamlines_timeWindows = JSON.parse(data);
            console.log('读取成功streamlines:', Object.keys(PVF_streamlines_timeWindows));
        } catch (err) {
            // 捕获所有错误（读取失败或解析失败）
            console.error('处理失败:', err);
        }
    } else if (timepoint < PVF_streamlines_tmin && timepoint < PVF_streamlines_tmax) {

    }
    
    return resp_value;
};