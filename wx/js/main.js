/**
 * main.js - 初始化脑表面可视化并处理UI交互
 */

// 在全局范围声明速度场相关变量
let velocityLoader = null;
let velocityVisualizer = null;
let velocityFiles = {};
// let potentialLoader = null;
// let potentialVisualizer = null;
// let potentialFiles = {};

// 初始化速度场文件列表
function initVelocityFiles() {
    velocityFiles = {
        'p1': {
            'e': 'data/p1/sub-ccepAgeUMCU01_e.csv',
            'velocities': [
                {
                    name: 'PT21-PT20',
                    vk: 'data/p1/run-021448/PT21-PT20/sub-ccepAgeUMCU01_ses-1_task-SPESclin_run-021448-PT21-PT20-V_k.csv',
                    potential: 'data/p1/run-021448/PT21-PT20/sub-ccepAgeUMCU01_ses-1_task-SPESclin_run-021448-PT21-PT20-interpolation_data.csv'
                }
            ]
        },
        'p35': {
            'e': 'data/p35/sub-ccepAgeUMCU35_e.csv',
            'velocities': [
                {
                    name: 'AT10-AT11',
                    vk: 'data/p35/run-021624/AT10-At11/sub-ccepAgeUMCU35_ses-1_task-SPESclin_run-021624-AT10-AT11-V_k.csv',
                    potential: 'data/p35/run-021624/AT10-At11/sub-ccepAgeUMCU35_ses-1_task-SPESclin_run-021624-AT10-AT11-interpolation_data.csv'
                }
            ]
        },
        'p48': {
            'e': 'data/p48/sub-ccepAgeUMCU48_e.csv',
            'velocities': [
                {
                    name: 'C27-C26',
                    vk: 'data/p48/run-021147/C27-C26/sub-ccepAgeUMCU48_ses-1_task-SPESclin_run-021147-C27-C26-V_k.csv',
                    potential: 'data/p48/run-021147/C27-C26/sub-ccepAgeUMCU48_ses-1_task-SPESclin_run-021147-C27-C26-interpolation_data.csv'
                }
            ]
        }
    };
}

// 更新速度场文件下拉选择框
function updateVelocityFileSelect(subjectId) {
    const select = document.getElementById('velocity-file-select');
    select.innerHTML = '<option value="">-- 请选择 --</option>';
    
    if (!velocityFiles[subjectId]) return;
    
    velocityFiles[subjectId].velocities.forEach((velocity, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = velocity.name;
        select.appendChild(option);
    });
}

// 加载速度场数据
async function loadVelocityField(subjectId, velocityIndex) {
    if (!velocityFiles[subjectId] || !velocityFiles[subjectId].velocities[velocityIndex]) {
        console.error('找不到指定的速度场数据');
        return false;
    }
    
    const files = velocityFiles[subjectId];
    const velocityData = files.velocities[velocityIndex];
    
    // 创建加载器
    velocityLoader = new VelocityFieldLoader();
    
    // 显示加载状态
    document.getElementById('loading').style.display = 'flex';
    
    try {
        // 加载基底向量
        await velocityLoader.loadE(files.e);
        
        // 加载速度场数据
        await velocityLoader.loadVk(velocityData.vk);
        
        // 加载电势数据（可选）
        await velocityLoader.loadPotentials(velocityData.potential);
        
        // 处理速度场
        const velocityField = velocityLoader.processVelocityField();
        
        if (!velocityField) {
            throw new Error('处理速度场数据失败');
        }
        
        // 创建可视化器
        if (!velocityVisualizer) {
            velocityVisualizer = new VelocityFieldVisualizer(
                window.brainViewer.scene,
                window.brainViewer.models.reconstructed
            );
        }
        
        // 设置速度场数据
        velocityVisualizer.setVelocityField(velocityField);
        
        // 更新时间步滑块的范围
        const timeStepSlider = document.getElementById('time-step');
        timeStepSlider.max = velocityField.length - 1;
        timeStepSlider.value = 0;
        document.getElementById('time-step-value').textContent = '0';
        
        // 创建初始箭头
        velocityVisualizer.setTimeStep(0);
        
        return true;
    } catch (error) {
        console.error('加载速度场数据失败:', error);
        return false;
    } finally {
        // 隐藏加载状态
        document.getElementById('loading').style.display = 'none';
    }
}


// // 更新电势场文件下拉选择框
// function updatePotentialFileSelect(subjectId) {
//     const select = document.getElementById('potential-file-select');
//     select.innerHTML = '<option value="">-- 请选择 --</option>';
    
//     if (!potentialFiles[subjectId]) return;
    
//     potentialFiles[subjectId].files.forEach((file, index) => {
//         const option = document.createElement('option');
//         option.value = index;
//         option.textContent = file.name;
//         select.appendChild(option);
//     });
// }

// // 加载电势场数据
// async function loadPotentialField(subjectId, potentialIndex) {
//     if (!potentialFiles[subjectId] || !potentialFiles[subjectId].files[potentialIndex]) {
//         console.error('找不到指定的电势场数据');
//         return false;
//     }
    
//     const fileInfo = potentialFiles[subjectId].files[potentialIndex];
    
//     // 创建可视化器
//     if (!potentialVisualizer) {
//         potentialVisualizer = new PotentialFieldVisualizer(
//             window.brainViewer.scene,
//             window.brainViewer
//         );
//     }
    
//     // 显示加载状态
//     document.getElementById('loading').style.display = 'flex';
    
//     try {
//         // 加载电势数据
//         await potentialVisualizer.loadPotentials(fileInfo.path);
        
//         // 更新时间步滑块的范围
//         const timeStepSlider = document.getElementById('potential-time-step');
//         const totalSteps = potentialVisualizer.potentialLoader.totalTimeSteps;
//         timeStepSlider.max = totalSteps - 1;
//         timeStepSlider.value = 0;
//         document.getElementById('potential-time-step-value').textContent = '0';
        
//         // 应用电势场
//         potentialVisualizer.setTimeStep(0);
        
//         return true;
//     } catch (error) {
//         console.error('加载电势场数据失败:', error);
//         return false;
//     } finally {
//         // 隐藏加载状态
//         document.getElementById('loading').style.display = 'none';
//     }
// }

// 页面加载完成后初始化
$(document).ready(function() {
    // 创建脑表面查看器实例
    window.brainViewer = new BrainSurfaceViewer("brainbrowser");
    
    // 加载脑表面按钮点击事件
    $("#load-brain").click(function() {
        const selectedSubject = $("#subject-select").val();
        window.brainViewer.loadSubject(selectedSubject);
    });
    
    // 背景颜色选择事件
    $("#background-color").change(function() {
        const colorValue = $(this).val();
        window.brainViewer.setBackgroundColor(colorValue);
    });
    
    // 表面颜色选择事件
    $("#surface-color").change(function() {
        const colorValue = $(this).val();
        window.brainViewer.setModelColor('reconstructed', colorValue);
    });
    
    // 左半球颜色选择事件
    $("#left-hemisphere-color").change(function() {
        const colorValue = $(this).val();
        window.brainViewer.setModelColor('leftHemisphere', colorValue);
    });
    
    // 右半球颜色选择事件
    $("#right-hemisphere-color").change(function() {
        const colorValue = $(this).val();
        window.brainViewer.setModelColor('rightHemisphere', colorValue);
    });
    
    // 透明度滑块事件
    $("#transparency").on("input", function() {
        const value = $(this).val();
        $("#transparency-value").text(value + "%");
        window.brainViewer.setTransparency('reconstructed', value);
    });
    
    // 皮层透明度滑块事件
    $("#cortex-transparency").on("input", function() {
        const value = $(this).val();
        $("#cortex-transparency-value").text(value + "%");
        window.brainViewer.setTransparency('leftHemisphere', value);
        window.brainViewer.setTransparency('rightHemisphere', value);
    });
    
    // 视图模式选择事件
    $("#view-mode").change(function() {
        const mode = $(this).val();
        window.brainViewer.setViewMode(mode);
    });
    
    // 光照强度滑块事件
    $("#light-intensity").on("input", function() {
        const value = $(this).val();
        $("#light-intensity-value").text(value + "%");
        window.brainViewer.setLightIntensity(value);
    });
    
    // X轴旋转滑块事件
    $("#x-rotation").on("input", function() {
        const value = $(this).val();
        $("#x-rotation-value").text(value + "°");
        const yRotation = parseInt($("#y-rotation").val());
        const zRotation = parseInt($("#z-rotation").val());
        window.brainViewer.setRotation(value, yRotation, zRotation);
    });
    
    // Y轴旋转滑块事件
    $("#y-rotation").on("input", function() {
        const value = $(this).val();
        $("#y-rotation-value").text(value + "°");
        const xRotation = parseInt($("#x-rotation").val());
        const zRotation = parseInt($("#z-rotation").val());
        window.brainViewer.setRotation(xRotation, value, zRotation);
    });
    
    // Z轴旋转滑块事件
    $("#z-rotation").on("input", function() {
        const value = $(this).val();
        $("#z-rotation-value").text(value + "°");
        const xRotation = parseInt($("#x-rotation").val());
        const yRotation = parseInt($("#y-rotation").val());
        window.brainViewer.setRotation(xRotation, yRotation, value);
    });
    
    // 重置视图按钮事件
    $("#reset-view").click(function() {
        window.brainViewer.resetView();
        // 重置旋转滑块
        $("#x-rotation").val(0).trigger('input');
        $("#y-rotation").val(0).trigger('input');
        $("#z-rotation").val(0).trigger('input');
    });
    
    // 截图按钮事件
    $("#screenshot").click(function() {
        window.brainViewer.takeScreenshot();
    });
    
    // 皮层表面显示控制
    $("#show-left-hemisphere, #show-right-hemisphere").change(function() {
        // 重新加载当前受试者以应用显示设置
        const selectedSubject = $("#subject-select").val();
        window.brainViewer.loadSubject(selectedSubject);
    });
    
    // 自定义OBJ文件加载
    $("#load-custom-obj").click(function() {
        const fileInput = document.getElementById('custom-obj-file');
        if (fileInput.files.length > 0) {
            window.brainViewer.loadCustomOBJFile(fileInput.files[0]);
        } else {
            alert('请先选择一个OBJ文件');
        }
    });
    
    // 初始化速度场文件列表
    initVelocityFiles();
    
    // 显示/隐藏速度场控制
    $("#show-velocity-field").change(function() {
        const isChecked = $(this).is(':checked');
        $('#velocity-field-controls').toggle(isChecked);
        
        if (!isChecked && velocityVisualizer) {
            velocityVisualizer.clearArrows();
            velocityVisualizer.stop();
        }
    });
    
    // 速度场文件选择变化
    $("#velocity-file-select").change(function() {
        const selectedValue = $(this).val();
        if (!selectedValue) return;
        
        const subjectId = $("#subject-select").val();
        loadVelocityField(subjectId, parseInt(selectedValue));
    });
    
    // 时间步滑块变化
    $("#time-step").on("input", function() {
        const value = parseInt($(this).val());
        $("#time-step-value").text(value);
        
        if (velocityVisualizer) {
            velocityVisualizer.setTimeStep(value);
        }
    });
    
    // 箭头大小滑块变化
    $("#arrow-size").on("input", function() {
        const value = parseFloat($(this).val());
        $("#arrow-size-value").text(value.toFixed(1));
        
        if (velocityVisualizer) {
            velocityVisualizer.setArrowSize(value);
        }
    });
    
    // 箭头颜色变化
    $("#arrow-color").change(function() {
        const color = $(this).val();
        
        if (velocityVisualizer) {
            // 将十六进制颜色转换为整数
            const colorInt = parseInt(color.replace('#', ''), 16);
            velocityVisualizer.setArrowColor(colorInt);
        }
    });
    
    // 播放按钮点击
    $("#play-velocity").click(function() {
        if (velocityVisualizer) {
            velocityVisualizer.play();
        }
    });
    
    // 停止按钮点击
    $("#stop-velocity").click(function() {
        if (velocityVisualizer) {
            velocityVisualizer.stop();
        }
    });
    
    // 受试者变化时更新速度场文件选择
    $("#subject-select").change(function() {
        const selectedSubject = $(this).val();
        updateVelocityFileSelect(selectedSubject);
        
        // 清除现有的速度场
        if (velocityVisualizer) {
            velocityVisualizer.clearArrows();
            velocityVisualizer.stop();
        }
    });

    // initPotentialFiles();

    // // 显示/隐藏电势场控制
    // $("#show-potential-field").change(function() {
    //     const isChecked = $(this).is(':checked');
    //     $('#potential-field-controls').toggle(isChecked);
        
    //     if (!isChecked && potentialVisualizer) {
    //         potentialVisualizer.resetModelColor();
    //         potentialVisualizer.stop();
    //     }
    // });
    
    // // 电势场文件选择变化
    // $("#potential-file-select").change(function() {
    //     const selectedValue = $(this).val();
    //     if (!selectedValue) return;
        
    //     const subjectId = $("#subject-select").val();
    //     loadPotentialField(subjectId, parseInt(selectedValue));
    // });
    
    // // 时间步滑块变化
    // $("#potential-time-step").on("input", function() {
    //     const value = parseInt($(this).val());
    //     $("#potential-time-step-value").text(value);
        
    //     if (potentialVisualizer) {
    //         potentialVisualizer.setTimeStep(value);
    //     }
    // });
    
    // // 播放按钮点击
    // $("#play-potential").click(function() {
    //     if (potentialVisualizer) {
    //         potentialVisualizer.play();
    //     }
    // });
    
    // // 停止按钮点击
    // $("#stop-potential").click(function() {
    //     if (potentialVisualizer) {
    //         potentialVisualizer.stop();
    //     }
    // });
    
    // // 受试者变化时更新电势场文件选择
    // $("#subject-select").change(function() {
    //     const selectedSubject = $(this).val();
    //     updatePotentialFileSelect(selectedSubject);
        
    //     // 清除现有的电势场
    //     if (potentialVisualizer) {
    //         potentialVisualizer.resetModelColor();
    //         potentialVisualizer.stop();
    //     }
    // });
    

    
    // 加载脑表面模型后创建速度场可视化器
    const originalLoadSubject = window.brainViewer.loadSubject;
    window.brainViewer.loadSubject = async function(subjectId) {
        await originalLoadSubject.call(window.brainViewer, subjectId);
        
        // 清除现有的速度场可视化
        if (velocityVisualizer) {
            velocityVisualizer.dispose();
            velocityVisualizer = null;
        }

        // // 清除现有的电势场可视化
        // if (potentialVisualizer) {
        //     potentialVisualizer.dispose();
        //     potentialVisualizer = null;
        // }
        
        // 如果选中了显示速度场，则创建新的可视化器
        if ($("#show-velocity-field").is(':checked')) {
            velocityVisualizer = new VelocityFieldVisualizer(
                window.brainViewer.scene,
                window.brainViewer.models.reconstructed
            );
            
            // 更新速度场文件选择并重新选择
            updateVelocityFileSelect(subjectId);
        }

        //         // 如果选中了显示电势场，则创建新的可视化器
        // if ($("#show-potential-field").is(':checked')) {
        //     potentialVisualizer = new PotentialFieldVisualizer(
        //         window.brainViewer.scene,
        //         window.brainViewer
        //     );
            
        //     // 更新电势场文件选择并重新选择
        //     updatePotentialFileSelect(subjectId);
        // }
    
    };
    
    // 初始更新速度场文件选择
    updateVelocityFileSelect('p1');
    // // 初始更新电势场文件选择
    // updatePotentialFileSelect('p1');
});
