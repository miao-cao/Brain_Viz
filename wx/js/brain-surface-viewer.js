/**
 * brain-surface-viewer.js - 脑表面可视化的核心类
 */

class BrainSurfaceViewer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.models = {
            reconstructed: null,
            leftHemisphere: null,
            rightHemisphere: null
        };
        this.lights = {};
        this.isLoading = false;
        this.mouse = { x: 0, y: 0 };
        this.autorotate = { x: false, y: false, z: false };
        this.zoom = 1;
        
        this.init();
        // 创建加载器
        this.loader = new BrainLoader(this.scene);
    }
    
    init() {
        // 创建Three.js场景
        this.scene = new THREE.Scene();
        
        // 创建相机
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.z = 10;
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            preserveDrawingBuffer: true // 用于截图
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 1);
        this.container.appendChild(this.renderer.domElement);
        
        // 添加光源
        this.addLights();
        
        // 添加轨道控制器 - 使用TrackballControls实现完全自由旋转
        this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;
        this.controls.noZoom = false;
        this.controls.noPan = false;
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;
        
        // 启动渲染循环
        this.animate();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    addLights() {
        // this.scene.add(new THREE.AmbientLight(0xffffff, 0.7)); // 环境光
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        // directionalLight.position.set(1, 1, 1);
        // this.scene.add(directionalLight);
        // 环境光
        this.lights.ambient = new THREE.AmbientLight(0x404040, 0.7);
        this.scene.add(this.lights.ambient);
        
        // 方向光
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(1, 1, 1);
        this.scene.add(this.lights.directional);
        
        // 添加更多光源以获得更好的照明效果
        this.lights.directional2 = new THREE.DirectionalLight(0xffffff, 0.4);
        this.lights.directional2.position.set(-1, -1, -1);
        this.scene.add(this.lights.directional2);
    }
    
    // 加载受试者数据
    async loadSubject(subjectId) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            // 清除现有模型
            this.clearModels();
            
            // 根据受试者ID确定文件路径
            const basePath = `data/${subjectId}/`;
            // 修正：p1->01, p35->35
            const subjectNum = subjectId.replace('p', '');
            const subjectNumStr = subjectNum.padStart(2, '0');
            const reconstructedFile = `sub-ccepAgeUMCU${subjectNumStr}_reconstructed_surface.ply`;
            const leftHemisphereFile = 'lh.pial.obj';
            const rightHemisphereFile = 'rh.pial.obj';
            
            // 更新UI信息
            document.getElementById('current-subject').textContent = 
                `${subjectId.toUpperCase()} - 受试者${subjectId.replace('p', '')}`;
            document.getElementById('reconstructed-surface').textContent = reconstructedFile;
            document.getElementById('cortex-surface').textContent = `${leftHemisphereFile}, ${rightHemisphereFile}`;
            document.getElementById('file-name').textContent = reconstructedFile;
            
            // 加载重建表面
            console.log(`加载重建表面: ${basePath}${reconstructedFile}`);
            try {
                this.models.reconstructed = await this.loader.loadPLYModel(
                    `${basePath}${reconstructedFile}`,
                    {
                        color: document.getElementById('surface-color').value,
                        opacity: 1 - (parseInt(document.getElementById('transparency').value) / 100),
                        wireframe: document.getElementById('view-mode').value === 'wireframe'
                    }
                );
            } catch (error) {
                console.warn('重建表面加载失败，使用模拟表面:', error);
                this.models.reconstructed = this.loader.createMockSurface('reconstructed', {
                    color: document.getElementById('surface-color').value,
                    opacity: 1 - (parseInt(document.getElementById('transparency').value) / 100),
                    wireframe: document.getElementById('view-mode').value === 'wireframe'
                });
            }
            
            // 加载左半球皮层表面
            if (document.getElementById('show-left-hemisphere').checked) {
                console.log(`加载左半球皮层表面: ${basePath}${leftHemisphereFile}`);
                try {
                    this.models.leftHemisphere = await this.loader.loadOBJModel(
                        `${basePath}${leftHemisphereFile}`,
                        {
                            color: document.getElementById('left-hemisphere-color').value,
                            opacity: 1 - (parseInt(document.getElementById('cortex-transparency').value) / 100),
                            position: new THREE.Vector3(0, 0, 0),
                            scale: 1,
                            wireframe: document.getElementById('view-mode').value === 'wireframe'
                        }
                    );
                } catch (error) {
                    console.warn('左半球皮层表面加载失败，使用模拟表面:', error);
                    this.models.leftHemisphere = this.loader.createMockSurface('leftHemisphere', {
                        color: document.getElementById('left-hemisphere-color').value,
                        opacity: 1 - (parseInt(document.getElementById('cortex-transparency').value) / 100),
                        wireframe: document.getElementById('view-mode').value === 'wireframe'
                    });
                }
            }
            
            // 加载右半球皮层表面
            if (document.getElementById('show-right-hemisphere').checked) {
                console.log(`加载右半球皮层表面: ${basePath}${rightHemisphereFile}`);
                try {
                    this.models.rightHemisphere = await this.loader.loadOBJModel(
                        `${basePath}${rightHemisphereFile}`,
                        {
                            color: document.getElementById('right-hemisphere-color').value,
                            opacity: 1 - (parseInt(document.getElementById('cortex-transparency').value) / 100),
                            position: new THREE.Vector3(0, 0, 0),
                            scale: 1,
                            wireframe: document.getElementById('view-mode').value === 'wireframe'
                        }
                    );
                } catch (error) {
                    console.warn('右半球皮层表面加载失败，使用模拟表面:', error);
                    this.models.rightHemisphere = this.loader.createMockSurface('rightHemisphere', {
                        color: document.getElementById('right-hemisphere-color').value,
                        opacity: 1 - (parseInt(document.getElementById('cortex-transparency').value) / 100),
                        wireframe: document.getElementById('view-mode').value === 'wireframe'
                    });
                }
            }
            
            // 更新统计信息
            this.updateStats();
            
            // 调整相机位置以显示所有模型
            this.fitViewToModels();
            
        } catch (error) {
            console.error('加载受试者数据时出错:', error);
            alert('加载模型时出错，请检查控制台获取详细信息。');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    // 加载自定义OBJ文件
    async loadCustomOBJFile(file) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            // 清除现有模型
            this.clearModels();
            
            // 从文件创建URL
            const url = URL.createObjectURL(file);
            
            // 加载OBJ文件
            this.models.reconstructed = await this.loader.loadOBJModel(
                url,
                {
                    color: document.getElementById('surface-color').value,
                    opacity: 1 - (parseInt(document.getElementById('transparency').value) / 100),
                    wireframe: document.getElementById('view-mode').value === 'wireframe'
                }
            );
            
            // 更新UI信息
            document.getElementById('current-subject').textContent = '自定义文件';
            document.getElementById('reconstructed-surface').textContent = file.name;
            document.getElementById('cortex-surface').textContent = '无';
            document.getElementById('file-name').textContent = file.name;
            
            // 更新统计信息
            this.updateStats();
            
            // 调整相机位置
            this.fitViewToModels();
            
            // 释放URL
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
        } catch (error) {
            console.error('加载自定义OBJ文件时出错:', error);
            alert('加载自定义文件时出错，请检查控制台获取详细信息。');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }
    
    // 清除所有模型
    clearModels() {
        Object.values(this.models).forEach(model => {
            if (model && model.mesh) {
                this.scene.remove(model.mesh);
            }
        });
        
        this.models = {
            reconstructed: null,
            leftHemisphere: null,
            rightHemisphere: null
        };
        
        this.updateStats();
    }
    
    // 更新统计信息
    updateStats() {
        let vertexCount = 0;
        let faceCount = 0;
        
        Object.values(this.models).forEach(model => {
            if (model) {
                vertexCount += model.vertexCount || 0;
                faceCount += model.faceCount || 0;
            }
        });
        
        document.getElementById('vertex-count').textContent = vertexCount;
        document.getElementById('face-count').textContent = faceCount;
    }



    
    // 调整视图以显示所有模型
    fitViewToModels() {
        const box = new THREE.Box3();
        
        // 计算所有模型的边界框
        Object.values(this.models).forEach(model => {
            if (model && model.mesh) {
                box.expandByObject(model.mesh);
            }
        });
        
        // 如果边界框有效，调整相机位置
        if (box.isEmpty() === false) {
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = this.camera.fov * (Math.PI / 180);
            let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
            
            // 添加一些额外的空间
            cameraZ *= 1.5;
            
            this.camera.position.copy(center);
            this.camera.position.z += cameraZ;
            
            this.controls.target.copy(center);
            this.controls.update();
        }
    }
    
    // 设置背景颜色
    setBackgroundColor(color) {
        this.renderer.setClearColor(parseInt(color, 16), 1);
    }
    
    // 设置模型颜色
    setModelColor(modelType, color) {
        if (this.models[modelType] && this.models[modelType].mesh) {
            // 对于OBJ模型，需要遍历所有子网格
            this.models[modelType].mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.color.setStyle(color);
                }
            });
        }
    }
    
    // 设置透明度
    setTransparency(modelType, transparency) {
        if (this.models[modelType] && this.models[modelType].mesh) {
            // 对于OBJ模型，需要遍历所有子网格
            this.models[modelType].mesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = 1 - (transparency / 100);
                }
            });
        }
    }
    
    // 设置线框模式
    setWireframe(wireframe) {
        Object.values(this.models).forEach(model => {
            if (model && model.mesh) {
                // 对于OBJ模型，需要遍历所有子网格
                model.mesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.wireframe = wireframe;
                    }
                });
            }
        });
    }
    
    // 设置视图模式
    setViewMode(mode) {
        this.setWireframe(mode === 'wireframe');
    }
    
    // 设置光照强度
    setLightIntensity(intensity) {
        const intensityValue = intensity / 100;
        this.lights.ambient.intensity = intensityValue * 0.7;
        this.lights.directional.intensity = intensityValue * 0.8;
        this.lights.directional2.intensity = intensityValue * 0.4;
    }
    
    // 设置模型旋转
    setRotation(x, y, z) {
        Object.values(this.models).forEach(model => {
            if (model && model.mesh) {
                model.mesh.rotation.x = THREE.MathUtils.degToRad(x);
                model.mesh.rotation.y = THREE.MathUtils.degToRad(y);
                model.mesh.rotation.z = THREE.MathUtils.degToRad(z);
            }
        });
    }
    
    // 重置视图
    resetView() {
        this.camera.position.set(0, 0, 10);
        this.controls.target.set(0, 0, 0);
        this.controls.reset();
        this.zoom = 1;
        this.camera.zoom = this.zoom;
        this.camera.updateProjectionMatrix();
    }
    
    // 截取屏幕
    takeScreenshot() {
        this.renderer.render(this.scene, this.camera);
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'brain-surface-screenshot.png';
        link.href = dataURL;
        link.click();
    }
    
    // 显示/隐藏加载动画
    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }
    
    // 窗口大小变化处理
    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.controls.handleResize();
    }
    
    // 动画循环
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // 自动旋转
        if (this.models.reconstructed && this.models.reconstructed.mesh) {
            const rotationSpeed = document.getElementById('rotation').value;
            let speed = 0;
            
            switch(rotationSpeed) {
                case 'slow': speed = 0.002; break;
                case 'medium': speed = 0.005; break;
                case 'fast': speed = 0.01; break;
            }
            
            if (speed > 0) {
                this.models.reconstructed.mesh.rotation.y += speed;
                
                if (this.models.leftHemisphere && this.models.leftHemisphere.mesh) {
                    this.models.leftHemisphere.mesh.rotation.y += speed;
                }
                
                if (this.models.rightHemisphere && this.models.rightHemisphere.mesh) {
                    this.models.rightHemisphere.mesh.rotation.y += speed;
                }
            }
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}