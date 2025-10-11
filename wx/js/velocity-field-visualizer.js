/**
 * velocity-field-visualizer.js - 负责在3D场景中渲染速度场
 */

class VelocityFieldVisualizer {
    constructor(scene, surface) {
        this.scene = scene;
        this.surface = surface;
        this.arrows = [];
        this.velocityField = null;
        this.currentStep = 0;
        this.totalSteps = 0;
        this.animationId = null;
        this.isPlaying = false;
        this.arrowSize = 1.0;
        this.arrowColor = 0x000000;
    }

    // 设置速度场数据
    setVelocityField(velocityField) {
        this.velocityField = velocityField;
        this.totalSteps = velocityField.length;
        console.log(`设置了速度场数据，共 ${this.totalSteps} 个时间步`);
    }

    // 清除所有箭头
    clearArrows() {
        for (const arrow of this.arrows) {
            this.scene.remove(arrow);
        }
        this.arrows = [];
    }


    createArrows(timeStep) {
        if (!this.velocityField || !this.surface) {
            console.error('速度场数据或曲面数据未设置');
            return;
        }

        this.clearArrows();

        const step = Math.min(timeStep, this.totalSteps - 1);
        const velocities = this.velocityField[step];
        
        // 获取表面顶点
        let vertices = [];
        if (this.surface.mesh && this.surface.mesh.traverse) {
            this.surface.mesh.traverse((child) => {
                if (child.isMesh && child.geometry) {
                    const position = child.geometry.attributes.position;
                    for (let i = 0; i < position.count; i++) {
                        vertices.push(new THREE.Vector3(
                            position.getX(i),
                            position.getY(i),
                            position.getZ(i)
                        ));
                    }
                }
            });
        }

        // 不采样，全部绘制
        for (let i = 0; i < velocities.length; i++) {
            if (i >= vertices.length) break;
            
            const origin = vertices[i];
            const velocity = velocities[i];

            // 计算速度向量模长
            const length = Math.sqrt(
                velocity[0] * velocity[0] +
                velocity[1] * velocity[1] +
                velocity[2] * velocity[2]
            );
            
            // 跳过全零向量
            if (length < 1e-8) continue;

            // 归一化向量
            const direction = new THREE.Vector3(
                velocity[0] / length,
                velocity[1] / length,
                velocity[2] / length
            );

            // 所有箭头长度相同
            const arrowLength = this.arrowSize;

            const arrowHelper = new THREE.ArrowHelper(
                direction,
                origin,
                arrowLength,
                this.arrowColor,
                arrowLength * 0.2,
                arrowLength * 0.1
            );

            this.scene.add(arrowHelper);
            this.arrows.push(arrowHelper);
        }
    }


    // // 创建箭头表示速度向量
    // createArrows(timeStep) {
    //     if (!this.velocityField || !this.surface) {
    //         console.error('速度场数据或曲面数据未设置');
    //         return;
    //     }

    //     this.clearArrows();

    //     const step = Math.min(timeStep, this.totalSteps - 1);
    //     const velocities = this.velocityField[step];
        
    //     // 获取表面顶点
    //     let vertices = [];
    //     if (this.surface.mesh && this.surface.mesh.traverse) {
    //         this.surface.mesh.traverse((child) => {
    //             if (child.isMesh && child.geometry) {
    //                 const position = child.geometry.attributes.position;
    //                 for (let i = 0; i < position.count; i++) {
    //                     vertices.push(new THREE.Vector3(
    //                         position.getX(i),
    //                         position.getY(i),
    //                         position.getZ(i)
    //                     ));
    //                 }
    //             }
    //         });
    //     }

    //     // 如果顶点数量与速度向量数量不匹配，进行采样或插值
    //     const maxArrows = 300; // 限制箭头数量，提高性能
    //     const stride = Math.max(1, Math.floor(velocities.length / maxArrows));
        
    //     for (let i = 0; i < velocities.length; i += stride) {
    //         if (i >= vertices.length) break;
            
    //         const origin = vertices[i];
    //         const velocity = velocities[i];
            
    //         // 计算速度向量模长
    //         const length = Math.sqrt(
    //             velocity[0] * velocity[0] +
    //             velocity[1] * velocity[1] +
    //             velocity[2] * velocity[2]
    //         );
            
    //         // 跳过过小的向量
    //         if (length < 0.001) continue;
            
    //         // 归一化向量并缩放
    //         const direction = new THREE.Vector3(
    //             velocity[0] / length,
    //             velocity[1] / length,
    //             velocity[2] / length
    //         );
            
    //         // 创建箭头
    //         const arrowLength = this.arrowSize * Math.min(2, length * 10);
    //         const arrowHelper = new THREE.ArrowHelper(
    //             direction,
    //             origin,
    //             arrowLength,
    //             this.arrowColor,
    //             arrowLength * 0.2, // 箭头头部大小
    //             arrowLength * 0.1  // 箭头头部宽度
    //         );
            
    //         this.scene.add(arrowHelper);
    //         this.arrows.push(arrowHelper);
    //     }
    // }

    // 设置当前时间步
    setTimeStep(step) {
        this.currentStep = Math.max(0, Math.min(step, this.totalSteps - 1));
        this.createArrows(this.currentStep);
    }

    // 设置箭头大小
    setArrowSize(size) {
        this.arrowSize = size;
        this.createArrows(this.currentStep);
    }

    // 设置箭头颜色
    setArrowColor(color) {
        this.arrowColor = color;
        this.createArrows(this.currentStep);
    }

    // 播放动画
    play() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        let lastTime = 0;
        const fps = 10; // 每秒帧数
        const frameInterval = 1000 / fps;

        const animate = (time) => {
            this.animationId = requestAnimationFrame(animate);
            
            const deltaTime = time - lastTime;
            if (deltaTime > frameInterval) {
                lastTime = time - (deltaTime % frameInterval);
                
                this.currentStep = (this.currentStep + 1) % this.totalSteps;
                this.createArrows(this.currentStep);
                
                // 更新UI
                if (document.getElementById('time-step')) {
                    document.getElementById('time-step').value = this.currentStep;
                    document.getElementById('time-step-value').textContent = this.currentStep;
                }
            }
        };
        
        this.animationId = requestAnimationFrame(animate);
    }

    // 停止动画
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isPlaying = false;
    }

    // 释放资源
    dispose() {
        this.stop();
        this.clearArrows();
        this.velocityField = null;
    }
}