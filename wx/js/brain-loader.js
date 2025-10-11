/**
 * brain-loader.js - 负责模型加载和处理
 */

class BrainLoader {
    constructor(scene) {
        this.scene = scene;
    }

    // 加载OBJ文件
    loadOBJModel(url, options = {}) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.OBJLoader();
            
            loader.load(
                url,
                (object) => {
                    // 遍历对象中的所有网格
                    object.traverse((child) => {
                        if (child.isMesh) {
                            // 创建材质
                            const material = new THREE.MeshLambertMaterial({
                                color: options.color || 0x4facfe,
                                transparent: true,
                                opacity: options.opacity || 1,
                                wireframe: options.wireframe || false,
                                side: THREE.DoubleSide
                            });
                            
                            child.material = material;
                            
                            // 计算法线用于光照
                            if (child.geometry) {
                                child.geometry.computeVertexNormals();
                            }
                        }
                    });
                    
                    // 设置位置和缩放
                    if (options.position) {
                        object.position.copy(options.position);
                    }
                    
                    if (options.scale) {
                        object.scale.setScalar(options.scale);
                    }
                    
                    // 添加到场景
                    this.scene.add(object);
                    
                    // 计算顶点和面数
                    let vertexCount = 0;
                    let faceCount = 0;
                    
                    object.traverse((child) => {
                        if (child.isMesh && child.geometry) {
                            vertexCount += child.geometry.attributes.position.count;
                            if (child.geometry.index) {
                                faceCount += child.geometry.index.count / 3;
                            }
                        }
                    });
                    
                    resolve({
                        mesh: object,
                        geometry: null,
                        material: null,
                        vertexCount: vertexCount,
                        faceCount: faceCount
                    });
                },
                // 加载进度
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        console.log(`加载进度: ${Math.round(percentComplete)}%`);
                    }
                },
                // 加载错误
                (error) => {
                    console.error('加载OBJ文件时出错:', error);
                    reject(error);
                }
            );
        });
    }

    // 加载PLY文件
    loadPLYModel(url, options = {}) {
        return new Promise((resolve, reject) => {
            const loader = new THREE.PLYLoader();
            
            loader.load(
                url,
                (geometry) => {
                    // 计算法线用于光照
                    geometry.computeVertexNormals();
                    
                    // 创建材质
                    const material = new THREE.MeshLambertMaterial({
                        color: options.color || 0x4facfe,
                        transparent: true,
                        opacity: options.opacity || 1,
                        wireframe: options.wireframe || false,
                        side: THREE.DoubleSide
                    });
                    
                    // 创建网格
                    const mesh = new THREE.Mesh(geometry, material);
                    
                    // 设置位置和缩放
                    if (options.position) {
                        mesh.position.copy(options.position);
                    }
                    
                    if (options.scale) {
                        mesh.scale.setScalar(options.scale);
                    }
                    
                    // 添加到场景
                    this.scene.add(mesh);
                    
                    resolve({
                        mesh: mesh,
                        geometry: geometry,
                        material: material,
                        vertexCount: geometry.attributes.position.count,
                        faceCount: geometry.index ? geometry.index.count / 3 : 0
                    });
                },
                // 加载进度
                (xhr) => {
                    if (xhr.lengthComputable) {
                        const percentComplete = (xhr.loaded / xhr.total) * 100;
                        console.log(`加载进度: ${Math.round(percentComplete)}%`);
                    }
                },
                // 加载错误
                (error) => {
                    console.error('加载PLY文件时出错:', error);
                    reject(error);
                }
            );
        });
    }

    // 创建模拟表面（用于文件加载失败时）
    createMockSurface(type, options = {}) {
        let geometry;
        
        switch(type) {
            case 'reconstructed':
                geometry = new THREE.SphereGeometry(2, 32, 32);
                break;
            case 'leftHemisphere':
                geometry = new THREE.SphereGeometry(1.5, 24, 24);
                geometry.translate(-1.5, 0, 0);
                break;
            case 'rightHemisphere':
                geometry = new THREE.SphereGeometry(1.5, 24, 24);
                geometry.translate(1.5, 0, 0);
                break;
            default:
                geometry = new THREE.SphereGeometry(2, 32, 32);
        }
        
        const material = new THREE.MeshPhongMaterial({
            color: options.color || 0x4facfe,
            transparent: true,
            opacity: options.opacity || 1,
            wireframe: options.wireframe || false,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);
        
        return {
            mesh: mesh,
            geometry: geometry,
            material: material,
            vertexCount: geometry.attributes.position.count,
            faceCount: geometry.index ? geometry.index.count / 3 : 0
        };
    }
}