document.getElementById('fileInput').addEventListener('change', function(e) {
    if (e.target.files[0]) document.getElementById('fileName').innerText = e.target.files[0].name;
});

document.getElementById('processBtn').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    if (!fileInput.files[0]) return alert("กรุณาเลือกไฟล์ก่อน!");

    const offset = parseFloat(document.getElementById('offset').value);
    const reader = new FileReader();

    reader.onload = function(e) {
        let model = JSON.parse(e.target.result);
        let newElements = [];

        model.elements.forEach(cube => {
            const minY = cube.from[1];
            const maxY = cube.to[1];
            const totalHeight = maxY - minY;
            
            let currentY = minY;
            let sliceIndex = 0;

            while (currentY < maxY) {
                let nextY = Math.min(currentY + offset, maxY);
                let currentSliceHeight = nextY - currentY;

                // Clone cube เดิม
                let slice = JSON.parse(JSON.stringify(cube));
                slice.uuid = crypto.randomUUID(); // สร้าง ID ใหม่กันซ้ำ
                slice.name = `${cube.name}_s${sliceIndex}`;
                
                // ปรับตำแหน่ง Y
                slice.from[1] = currentY;
                slice.to[1] = nextY;

                // --- คำนวณ UV ใหม่ (หัวใจสำคัญ) ---
                // เราต้องขยับค่า UV เฉพาะด้านแนวตั้ง (North, South, East, West)
                const heightRatio = 1; // อัตราส่วน Blockbench ปกติ 1 unit = 1 pixel uv
                const uvOffset = (currentY - minY);

                for (let face in slice.faces) {
                    if (['north', 'south', 'east', 'west'].includes(face)) {
                        // UV format: [x1, y1, x2, y2]
                        // ขยับเฉพาะค่า y (Index 1 และ 3) เพื่อให้ลายต่อเนื่อง
                        slice.faces[face].uv[1] += uvOffset;
                        slice.faces[face].uv[3] = slice.faces[face].uv[1] + currentSliceHeight;
                    }
                }

                newElements.push(slice);
                currentY = nextY;
                sliceIndex++;
            }
        });

        // แทนที่ elements เดิมด้วยตัวที่หั่นแล้ว
        model.elements = newElements;
        
        // ส่งไฟล์ออก
        const blob = new Blob([JSON.stringify(model)], {type: "application/json"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `sliced_${fileInput.files[0].name}`;
        link.click();
        
        document.getElementById('status').style.display = 'block';
    };

    reader.readAsText(fileInput.files[0]);
});