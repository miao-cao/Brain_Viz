/**
 * velocity-field-loader.js - 负责加载和处理速度场数据
 */

class VelocityFieldLoader {
    constructor() {
        this.e = null; // 基底向量数据
        this.vk = null; // 速度场数据
        this.potentials = null; // 电势数据
        this.singularityPoints = null; // 临界点数据
    }

    // 加载e.csv文件
    async loadE(path) {
        try {
            const response = await fetch(path);
            const data = await response.text();
            
            // 解析CSV数据
            const parsedData = this.parseCSV(data);
            
            // 重塑数据格式为 (n, 2, 3) 的数组，类似Python中的reshape
            const rows = parsedData.length;
            this.e = [];
            
            for (let i = 0; i < rows; i++) {
                const e1 = [parseFloat(parsedData[i][0]), parseFloat(parsedData[i][1]), parseFloat(parsedData[i][2])];
                const e2 = [parseFloat(parsedData[i][3]), parseFloat(parsedData[i][4]), parseFloat(parsedData[i][5])];
                this.e.push([e1, e2]);
            }
            
            console.log(`基底向量数据已加载，共 ${this.e.length} 个点`);
            return true;
        } catch (error) {
            console.error('加载e.csv文件时出错:', error);
            return false;
        }
    }

    // 加载V_k.csv文件
    async loadVk(path) {
        try {
            const response = await fetch(path);
            const data = await response.text();
            
            // 解析CSV数据
            this.vk = this.parseCSV(data).map(row => 
                row.map(val => parseFloat(val))
            );
            
            console.log(`速度场数据已加载，共 ${this.vk.length} 个时间步`);
            return true;
        } catch (error) {
            console.error('加载V_k.csv文件时出错:', error);
            return false;
        }
    }

    // 加载电势数据文件
    async loadPotentials(path) {
        try {
            const response = await fetch(path);
            const data = await response.text();
            
            // 解析CSV数据
            this.potentials = this.parseCSV(data).map(row => 
                row.map(val => parseFloat(val))
            );
            
            console.log(`电势数据已加载，共 ${this.potentials.length} 个时间步`);
            return true;
        } catch (error) {
            console.error('加载电势数据文件时出错:', error);
            return false;
        }
    }

    // 解析CSV文件
    parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length > 1) {
                // 跳过第一列（索引列）
                result.push(values.slice(1));
            }
        }
        
        return result;
    }

    // 处理速度场数据，类似Python中的process_V_k函数
    processVelocityField() {
        if (!this.e || !this.vk) {
            console.error('基底向量或速度场数据未加载');
            return null;
        }

        const pointNum = this.e.length; // 曲面上点的个数
        const vkArray = [];
        const timeSteps = this.vk.length;

        // 将vk重新组织成(k, n, 2)的形状
        for (let k = 0; k < timeSteps; k++) {
            const v = [];
            const vIndex = this.vk[k];
            
            for (let i = 0; i < pointNum; i++) {
                v.push([vIndex[i], vIndex[i + pointNum]]);
            }
            
            vkArray.push(v);
        }

        // 计算坐标系中的速度向量
        const vkCoord = [];
        
        for (let k = 0; k < timeSteps; k++) {
            const vIndex = vkArray[k];
            const vArrow = [];
            
            for (let i = 0; i < pointNum; i++) {
                // 基底向量乘以系数
                const e0 = this.e[i][0];
                const e1 = this.e[i][1];
                
                const v1 = e0.map(val => val * vIndex[i][0]);
                const v2 = e1.map(val => val * vIndex[i][1]);
                
                // 将两个向量相加
                const vector = [
                    v1[0] + v2[0],
                    v1[1] + v2[1],
                    v1[2] + v2[2]
                ];
                
                vArrow.push(vector);
            }
            
            vkCoord.push(vArrow);
        }

        return vkCoord;
    }
}