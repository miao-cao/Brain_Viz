// --- 1. 场景、相机和渲染器 ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // 设置背景色

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 50;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 增加阻尼效果，使旋转更平滑


import h5wasm from "https://cdn.jsdelivr.net/npm/h5wasm@0.8.6/dist/iife/h5wasm.min.js";

// --- 2. 箭头工厂函数 (核心部分) ---
/**
 * 创建一个箭头对象
 * @param {THREE.Vector3} startPoint - 箭头的起点
 * @param {THREE.Vector3} direction - 箭头的方向向量
 * @param {THREE.Color} color - 箭头的颜色
 * @param {number} height - 箭头的总高度 (箭杆 + 箭头)
 * @param {number} tipLength - 箭头（锥体）的长度
 * @param {number} tipRadius - 箭头（锥体）的底部半径
 * @param {number} shaftRadius - 箭杆（圆柱体）的半径
 * @returns {THREE.Group} - 包含箭头所有部分的组对象
 */


function loadPVFHD5File(url) {
    return h5wasm.ready.then(() => {
        return h5wasm.open(url, 'r').then(file => {
            const data = {};
            // 假设文件中有这些数据集
            const datasets = ['mask', 'vx', 'vy', 'vz'];
            datasets.forEach(name => {
                if (file.exists(name)) {
                    const dataset = file.get(name);
                    data[name] = dataset.toArray();
                } else {
                    console.warn(`Dataset ${name} does not exist in the file.`);
                }
            });
            file.close();
            return data;
        });
    });
}

function createArrow(startPoint, direction, color, height, tipLength, tipRadius, shaftRadius) {
    const arrowGroup = new THREE.Group();

    // 计算箭杆的长度和方向
    const shaftLength = height - tipLength;
    const dirNorm = direction.clone().normalize();

    // --- 创建箭杆 (Cylinder) ---
    const shaftGeometry = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLength, 12);
    const shaftMaterial = new THREE.MeshStandardMaterial({ color: color });
    const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
    
    // 定位和旋转箭杆
    // 圆柱体默认沿Y轴延伸，我们需要将其旋转到 direction 方向
    const shaftEndPoint = startPoint.clone().add(dirNorm.clone().multiplyScalar(shaftLength / 2));
    shaft.position.copy(shaftEndPoint);
    shaft.lookAt(startPoint.clone().add(dirNorm.clone().multiplyScalar(shaftLength)));
    shaft.rotateZ(Math.PI / 2); // 调整旋转，使其与方向向量对齐

    // --- 创建箭头 (Cone) ---
    const tipGeometry = new THREE.ConeGeometry(tipRadius, tipLength, 12);
    const tipMaterial = new THREE.MeshStandardMaterial({ color: color });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    
    // 定位和旋转箭头
    const tipStartPoint = startPoint.clone().add(dirNorm.clone().multiplyScalar(shaftLength));
    const tipEndPoint = startPoint.clone().add(dirNorm.clone().multiplyScalar(height));
    tip.position.copy(tipStartPoint.clone().add(dirNorm.clone().multiplyScalar(tipLength / 2)));
    tip.lookAt(tipEndPoint);
    tip.rotateZ(Math.PI / 2); // 调整旋转

    // 将两部分组合成一个箭头
    arrowGroup.add(shaft);
    arrowGroup.add(tip);

    return arrowGroup;
}

// --- 3. 构建箭头场的主函数 ---
/**
 * 构建一个包含所有箭头的 Group，模拟 FURY 的 actor.arrow
 * @param {Object} params - 包含所有参数的对象
 * @returns {THREE.Group} - 包含场景中所有箭头的组
 */
function constructArrowField(params) {
    const arrowFieldGroup = new THREE.Group();
    
    const { mask, vx, vy, vz, dim_shift, heights, tip_length, tip_radius, shaft_radius, scale, white, alpha } = params;
    
    // --- 数据处理 ---
    // 注意：这里的 mask, vx, vy, vz 应该是从 Python 转换过来的 TypedArray
    // 假设它们的维度都是 [xdim, ydim, zdim]
    const xdim = vx.shape[0];
    const ydim = vx.shape[1];
    const zdim = vx.shape[2];

    // 为了简化，我们假设 mask 是一个一维数组，长度为 xdim*ydim*zdim
    // 并且 vx, vy, vz 也是扁平化的数组
    // 如果不是，你需要在 JavaScript 中或在 Python 端先扁平化它们

    // 存储所有箭头的中心点和方向
    const centers = [];
    const dirs = [];

    for (let i = 0; i < mask.length; i++) {
        if (mask[i]) {
            // 计算 3D 坐标 (这里假设是扁平化前的顺序)
            // 这部分逻辑需要根据你数据的实际存储顺序进行调整
            const z_idx = Math.floor(i / (xdim * ydim));
            const y_idx = Math.floor((i % (xdim * ydim)) / xdim);
            const x_idx = (i % (xdim * ydim)) % xdim;
            
            let x = x_idx;
            let y = y_idx;
            let z = z_idx;

            // 应用 dim_shift 和 scale (与 FURY 代码匹配)
            const center = new THREE.Vector3(
                (x - dim_shift[0]) * 5,
                (y - dim_shift[1]) * 5,
                (z - dim_shift[2]) * 5
            );
            
            const dir = new THREE.Vector3(
                vx[i],
                vy[i],
                vz[i]
            );

            // 只添加非零向量
            if (dir.length() > 0.0001) {
                centers.push(center);
                dirs.push(dir);
            }
        }
    }

    // --- 颜色处理 ---
    let colors = [];
    if (white) {
        // 所有箭头都为白色
        colors = Array(centers.length).fill().map(() => new THREE.Color(1, 1, 1));
    } else {
        // 根据向量长度着色 (模拟 FURY 的 hot 颜色映射)
        // 1. 计算所有向量的长度
        const lengths = dirs.map(dir => dir.length());
        const maxLength = Math.max(...lengths);
        
        // 2. 将长度归一化并映射到颜色
        // 这里使用 HSL 颜色，从红色 (h=0) 到黄色 (h=0.17) 到白色 (h=0.33)
        for (let i = 0; i < lengths.length; i++) {
            const normalizedLength = lengths[i] / maxLength;
            // 使用 hot 色系，值越高越亮
            const hue = 0.1 - (normalizedLength * 0.1); // 从黄 (0.1) 到红 (0)
            const saturation = 1.0;
            const lightness = 0.5 + (normalizedLength * 0.3); // 从暗 (0.5) 到亮 (0.8)
            colors.push(new THREE.Color().setHSL(hue, saturation, lightness));
        }
    }

    // --- 创建并添加所有箭头 ---
    for (let i = 0; i < centers.length; i++) {
        const arrow = createArrow(
            centers[i],
            dirs[i],
            colors[i],
            heights,
            tip_length * scale,
            tip_radius,
            shaft_radius
        );
        arrowFieldGroup.add(arrow);
    }
    
    return arrowFieldGroup;
}

// --- 4. 准备数据并调用函数 ---
// ！！！重要：这里是模拟数据。你需要将你的真实数据传入。！！！
// 在实际应用中，你可能会通过服务器请求 (fetch) 来获取这些数据。
function createMockData() {
    // 创建一个 10x10x10 的网格
    const dim = 10;
    const size = dim * dim * dim;
    
    // 创建 mask: 每隔一个点取一个，创建一个稀疏的网格
    const mask = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
        const z_idx = Math.floor(i / (dim * dim));
        const y_idx = Math.floor((i % (dim * dim)) / dim);
        const x_idx = (i % (dim * dim)) % dim;
        if ((x_idx % 2 === 0) && (y_idx % 2 === 0) && (z_idx % 2 === 0)) {
            mask[i] = 1; // 1 represents True
        } else {
            mask[i] = 0; // 0 represents False
        }
    }

    // 创建 velocity field: 一个简单的漩涡场
    const vx = new Float32Array(size);
    const vy = new Float32Array(size);
    const vz = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
        const z_idx = Math.floor(i / (dim * dim));
        const y_idx = Math.floor((i % (dim * dim)) / dim);
        const x_idx = (i % (dim * dim)) % dim;

        // 计算中心点
        const cx = dim / 2;
        const cy = dim / 2;
        
        // 计算相对位置
        const dx = x_idx - cx;
        const dy = y_idx - cy;
        
        // 创建漩涡 (在 XY 平面)
        vx[i] = -dy * 0.5;
        vy[i] = dx * 0.5;
        vz[i] = (z_idx - dim/2) * 0.1; // Z 方向有一个小分量
    }

    // 附加 shape 属性，方便在 constructArrowField 中使用
    vx.shape = [dim, dim, dim];
    vy.shape = [dim, dim, dim];
    vz.shape = [dim, dim, dim];

    return { mask, vx, vy, vz };
}

// --- 5. 初始化场景 ---
function init() {
    // 添加环境光和方向光，使物体有明暗效果
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    scene.add(directionalLight);
    
    // 获取模拟数据
    const mockData = createMockData();

    // 定义参数，与 FURY 函数的参数对应
    const params = {
        mask: mockData.mask,
        vx: mockData.vx,
        vy: mockData.vy,
        vz: mockData.vz,
        dim_shift: [5, 5, 5], // 对应 10x10x10 网格的中心
        heights: 4,
        tip_length: 2,
        tip_radius: 0.2,
        shaft_radius: 0.05, // 稍微加粗一点，看得更清楚
        scale: 1,
        white: false,
        alpha: 0.8 // Three.js 的 MeshStandardMaterial 不直接支持颜色的 alpha，我们可以通过材质的 opacity 属性设置
    };

    // 构建箭头场
    const arrowField = constructArrowField(params);
    scene.add(arrowField);
    
    // 渲染循环
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 当页面加载完成后初始化
window.addEventListener('load', init);

// 窗口大小调整时更新相机和渲染器
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});