// --- Three.js 场景初始化 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加坐标轴和网格辅助线
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const gridHelper = new THREE.GridHelper(20, 20);
scene.add(gridHelper);

// --- 数据和对象管理 ---
let vectorGroup = new THREE.Group();
scene.add(vectorGroup);

let h5Data = null; // 用于存储解析后的H5数据
let isPlaying = false;
let currentTimeStep = 0;
let animationId = null;

// --- H5 文件读取和解析 ---
document.getElementById('fileInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // 使用 hdf5.js 解析文件内容
            const arrayBuffer = e.target.result;
            const h5file = new H5File(arrayBuffer);

            // 假设数据结构如下，请根据你的实际文件修改路径
            // /position/x, /position/y, /position/z
            // /velocity/time_0/x, /velocity/time_1/x, ...
            // /time_steps

            // 读取位置数据 (假设位置不随时间变化)
            const posX = await readDatasetAsArray(h5file, '/position/x');
            const posY = await readDatasetAsArray(h5file, '/position/y');
            const posZ = await readDatasetAsArray(h5file, '/position/z');

            // 读取时间步长
            const timeSteps = await readDatasetAsArray(h5file, '/time_steps');
            const numTimeSteps = timeSteps.length;

            // 读取所有时间步的速度数据
            const velocityData = [];
            for (let t = 0; t < numTimeSteps; t++) {
                const velX = await readDatasetAsArray(h5file, `/velocity/time_${t}/x`);
                const velY = await readDatasetAsArray(h5file, `/velocity/time_${t}/y`);
                const velZ = await readDatasetAsArray(h5file, `/velocity/time_${t}/z`);
                velocityData.push({ x: velX, y: velY, z: velZ });
            }

            // 存储数据
            h5Data = {
                positions: { x: posX, y: posY, z: posZ },
                velocities: velocityData,
                timeSteps: timeSteps,
                numVectors: posX.length
            };

            // 初始化箭头
            createVectors(0);

            // 更新时间滑块
            const timeSlider = document.getElementById('timeSlider');
            timeSlider.max = numTimeSteps - 1;
            document.getElementById('timeValue').textContent = `0 / ${numTimeSteps - 1}`;

            console.log('Data loaded successfully!');

        } catch (error) {
            console.error('Error reading H5 file:', error);
            alert('Failed to read H5 file. Please check the console for details.');
        }
    };
    reader.readAsArrayBuffer(file);
});

// 辅助函数：读取数据集并转换为 Float32Array
async function readDatasetAsArray(h5file, path) {
    const dataset = h5file.get(path);
    if (!dataset) {
        throw new Error(`Dataset not found: ${path}`);
    }
    const data = await dataset.value; // 获取数据 (可能是二进制数组)
    return new Float32Array(data.buffer); // 转换为标准的Float32Array
}

// --- 矢量创建和更新 ---
function createVectors(timeStep) {
    // 清除旧的箭头
    vectorGroup.clear();

    if (!h5Data) return;

    const { positions, velocities } = h5Data;
    const vel = velocities[timeStep];
    const scale = 0.5; // 箭头长度的缩放因子

    for (let i = 0; i < h5Data.numVectors; i++) {
        const start = new THREE.Vector3(
            positions.x[i],
            positions.y[i],
            positions.z[i]
        );

        const direction = new THREE.Vector3(
            vel.x[i],
            vel.y[i],
            vel.z[i]
        );

        // 根据速度大小设置颜色 (使用HSV颜色空间，速度越大越红)
        const speed = direction.length();
        const hue = 0.6 - Math.min(0.5, speed / 10); // 假设最大速度为10，调整颜色范围
        const color = new THREE.Color().setHSL(hue, 1.0, 0.5);

        // 创建箭头
        const arrowHelper = new THREE.ArrowHelper(
            direction.normalize(), // 方向向量需要归一化
            start,
            direction.length() * scale, // 长度
            color,
            0.5, // 箭头头部长度
            0.2  // 箭头头部宽度
        );

        vectorGroup.add(arrowHelper);
    }
}

function updateVectors(timeStep) {
    if (!h5Data || timeStep >= h5Data.timeSteps.length) return;

    const vel = h5Data.velocities[timeStep];
    const scale = 0.5;

    for (let i = 0; i < vectorGroup.children.length; i++) {
        const arrowHelper = vectorGroup.children[i];
        const direction = new THREE.Vector3(
            vel.x[i],
            vel.y[i],
            vel.z[i]
        );

        // 更新箭头方向和长度
        arrowHelper.setDirection(direction.normalize());
        arrowHelper.setLength(direction.length() * scale);

        // 更新颜色
        const speed = direction.length();
        const hue = 0.6 - Math.min(0.5, speed / 10);
        arrowHelper.setColor(new THREE.Color().setHSL(hue, 1.0, 0.5));
    }
}

// --- 动画和交互控制 ---
document.getElementById('timeSlider').addEventListener('input', function(event) {
    currentTimeStep = parseInt(event.target.value);
    document.getElementById('timeValue').textContent = `${currentTimeStep} / ${h5Data ? h5Data.timeSteps.length - 1 : 0}`;
    if (h5Data) {
        updateVectors(currentTimeStep);
    }
});

document.getElementById('playPauseBtn').addEventListener('click', function() {
    if (!h5Data) return;

    isPlaying = !isPlaying;
    this.textContent = isPlaying ? 'Pause' : 'Play';

    if (isPlaying) {
        animate();
    } else if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

function animate() {
    if (!isPlaying) return;

    currentTimeStep = (currentTimeStep + 1) % h5Data.timeSteps.length;
    document.getElementById('timeSlider').value = currentTimeStep;
    document.getElementById('timeValue').textContent = `${currentTimeStep} / ${h5Data.timeSteps.length - 1}`;
    updateVectors(currentTimeStep);

    animationId = requestAnimationFrame(animate);
}

// --- 窗口大小调整 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初始渲染
function render() {
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
render();