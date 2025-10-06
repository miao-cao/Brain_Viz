// --- Three.js场景初始化 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(15, 15, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 添加坐标轴
const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

// --- 数据和对象管理 ---
let streamlinesGroup = new THREE.Group();
scene.add(streamlinesGroup);

let data = null; // 存储解析后的JSON数据
let isPlaying = false;
let currentTimeStep = 0;
let animationId = null;
let numSeedPoints = 100;

// --- 颜色映射 ---
const colorStart = new THREE.Color(0x0066ff); // 蓝色
const colorEnd = new THREE.Color(0xff0066);   // 粉红色

// --- 文件读取和解析 ---
document.getElementById('fileInput').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            // 解析JSON数据
            data = JSON.parse(e.target.result);
            
            // 转换为更高效的格式
            data.positions = new Float32Array(data.positions.flat());
            data.velocities = data.velocities.map(t => new Float32Array(t.flat()));
            
            // 更新时间滑块
            const timeSlider = document.getElementById('timeSlider');
            timeSlider.max = data.time_steps.length - 1;
            document.getElementById('timeValue').textContent = `0 / ${data.time_steps.length - 1}`;
            
            // 生成流线
            generateStreamlines(currentTimeStep);
            
            console.log('Data loaded successfully!');

        } catch (error) {
            console.error('Error reading JSON file:', error);
            alert('Failed to read JSON file. Please check the console for details.');
        }
    };
    reader.readAsText(file);
});

// --- 流线生成 ---
function generateStreamlines(timeStep) {
    if (!data) return;
    
    // 清除旧的流线
    streamlinesGroup.clear();
    
    const positions = data.positions;
    const velocities = data.velocities[timeStep];
    const numPoints = positions.length / 3;
    
    // 创建种子点（随机选择）
    const seeds = [];
    for (let i = 0; i < numSeedPoints; i++) {
        const idx = Math.floor(Math.random() * numPoints);
        seeds.push({
            x: positions[idx * 3],
            y: positions[idx * 3 + 1],
            z: positions[idx * 3 + 2]
        });
    }
    
    // 为每个种子点生成流线
    seeds.forEach(seed => {
        const streamline = calculateStreamline(seed, velocities, positions, numPoints);
        if (streamline.length > 1) {
            createStreamlineObject(streamline);
        }
    });
}

// 使用Runge-Kutta方法计算流线
function calculateStreamline(seed, velocities, positions, numPoints, maxSteps = 100, stepSize = 0.1) {
    const points = [new THREE.Vector3(seed.x, seed.y, seed.z)];
    let currentPoint = points[0].clone();
    
    for (let i = 0; i < maxSteps; i++) {
        // 查找最近的网格点
        const nearestIdx = findNearestPointIndex(currentPoint, positions, numPoints);
        
        // 获取速度向量
        const vx = velocities[nearestIdx * 3];
        const vy = velocities[nearestIdx * 3 + 1];
        const vz = velocities[nearestIdx * 3 + 2];
        const velocity = new THREE.Vector3(vx, vy, vz);
        
        // 如果速度太小，停止
        if (velocity.length() < 0.01) break;
        
        // 使用RK4方法计算下一步
        const k1 = velocity.clone().multiplyScalar(stepSize);
        
        const p1 = currentPoint.clone().add(k1.clone().multiplyScalar(0.5));
        const i1 = findNearestPointIndex(p1, positions, numPoints);
        const v1 = new THREE.Vector3(
            velocities[i1 * 3], 
            velocities[i1 * 3 + 1], 
            velocities[i1 * 3 + 2]
        );
        const k2 = v1.clone().multiplyScalar(stepSize);
        
        const p2 = currentPoint.clone().add(k2.clone().multiplyScalar(0.5));
        const i2 = findNearestPointIndex(p2, positions, numPoints);
        const v2 = new THREE.Vector3(
            velocities[i2 * 3], 
            velocities[i2 * 3 + 1], 
            velocities[i2 * 3 + 2]
        );
        const k3 = v2.clone().multiplyScalar(stepSize);
        
        const p3 = currentPoint.clone().add(k3);
        const i3 = findNearestPointIndex(p3, positions, numPoints);
        const v3 = new THREE.Vector3(
            velocities[i3 * 3], 
            velocities[i3 * 3 + 1], 
            velocities[i3 * 3 + 2]
        );
        const k4 = v3.clone().multiplyScalar(stepSize);
        
        // 计算下一步位置
        const nextPoint = currentPoint.clone()
            .add(k1)
            .add(k2.clone().multiplyScalar(2))
            .add(k3.clone().multiplyScalar(2))
            .add(k4)
            .multiplyScalar(1/6);
        
        // 检查是否超出边界
        if (!isPointInBounds(nextPoint, positions)) break;
        
        points.push(nextPoint);
        currentPoint = nextPoint;
    }
    
    return points;
}

// 查找最近的点索引
function findNearestPointIndex(point, positions, numPoints) {
    let minDist = Infinity;
    let minIndex = 0;
    
    // 为了提高性能，可以优化这个线性搜索
    for (let i = 0; i < numPoints; i++) {
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        const dist = Math.pow(x - point.x, 2) + 
                        Math.pow(y - point.y, 2) + 
                        Math.pow(z - point.z, 2);
        
        if (dist < minDist) {
            minDist = dist;
            minIndex = i;
        }
    }
    
    return minIndex;
}

// 检查点是否在边界内
function isPointInBounds(point, positions) {
    // 简化的边界检查
    const minX = Math.min(...positions.filter((_, i) => i % 3 === 0));
    const maxX = Math.max(...positions.filter((_, i) => i % 3 === 0));
    const minY = Math.min(...positions.filter((_, i) => i % 3 === 1));
    const maxY = Math.max(...positions.filter((_, i) => i % 3 === 1));
    const minZ = Math.min(...positions.filter((_, i) => i % 3 === 2));
    const maxZ = Math.max(...positions.filter((_, i) => i % 3 === 2));
    
    return point.x >= minX && point.x <= maxX &&
            point.y >= minY && point.y <= maxY &&
            point.z >= minZ && point.z <= maxZ;
}

// 创建流线对象
function createStreamlineObject(points) {
    // 创建TubeGeometry
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 50, 0.1, 8, false);
    
    // 创建渐变色材质
    const colors = [];
    for (let i = 0; i < tubeGeometry.attributes.position.count; i++) {
        const t = i / (tubeGeometry.attributes.position.count - 1);
        const color = colorStart.clone().lerp(colorEnd, t);
        colors.push(color.r, color.g, color.b);
    }
    
    const colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 3);
    tubeGeometry.setAttribute('color', colorAttribute);
    
    const material = new THREE.MeshBasicMaterial({ 
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide
    });
    
    const mesh = new THREE.Mesh(tubeGeometry, material);
    streamlinesGroup.add(mesh);
}

// --- 交互控制 ---
document.getElementById('timeSlider').addEventListener('input', function(event) {
    currentTimeStep = parseInt(event.target.value);
    document.getElementById('timeValue').textContent = `${currentTimeStep} / ${data ? data.time_steps.length - 1 : 0}`;
    if (data) {
        generateStreamlines(currentTimeStep);
    }
});

document.getElementById('playPauseBtn').addEventListener('click', function() {
    if (!data) return;

    isPlaying = !isPlaying;
    this.textContent = isPlaying ? 'Pause' : 'Play';

    if (isPlaying) {
        animate();
    } else if (animationId) {
        cancelAnimationFrame(animationId);
    }
});

document.getElementById('seedsSlider').addEventListener('input', function(event) {
    numSeedPoints = parseInt(event.target.value);
    document.getElementById('seedsValue').textContent = numSeedPoints;
    if (data) {
        generateStreamlines(currentTimeStep);
    }
});

// --- 动画 ---
function animate() {
    if (!isPlaying || !data) return;

    currentTimeStep = (currentTimeStep + 1) % data.time_steps.length;
    document.getElementById('timeSlider').value = currentTimeStep;
    document.getElementById('timeValue').textContent = `${currentTimeStep} / ${data.time_steps.length - 1}`;
    generateStreamlines(currentTimeStep);

    animationId = requestAnimationFrame(animate);
}

// --- 窗口大小调整 ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 渲染循环
function render() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
}
render();