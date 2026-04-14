import { FFmpeg } from
'https://unpkg.com/@ffmpeg/ffmpeg@0.12.6/dist/ffmpeg.min.js';

const ffmpeg = new FFmpeg();

const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
};

document.getElementById('convertBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const svgFile = document.getElementById('svgInput').files[0];

    if (!svgFile) {
        alert("Please select an SVG file first!");
        return;
    }

    status.innerText = "Loading FFmpeg...";
    if (!ffmpeg.loaded) await loadFFmpeg();

    status.innerText = "Processing SVG to MP4...";
    
    const svgData = await fetchFile(svgFile);
    await ffmpeg.writeFile('input.svg', svgData);

    // SVG থেকে MP4 এ কনভার্ট করার কমান্ড
    await ffmpeg.exec(['-i', 'input.svg', 'output.mp4']);

    const data = await ffmpeg.readFile('output.mp4');
    const video = document.getElementById('outputVideo');
    video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    video.style.display = 'block';

    // অটোমেটিক ডাউনলোড
    const downloadLink = document.createElement('a');
    downloadLink.href = video.src;
    downloadLink.download = 'converted_video.mp4';
    downloadLink.click();

    status.innerText = "Conversion Complete!";
});
