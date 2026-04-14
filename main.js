const { FFmpeg } = window.FFmpegWASM || {};

if (!FFmpeg) {
    alert("FFmpeg লাইব্রেরি লোড হতে পারেনি। দয়া করে পেজটি রিফ্রেশ দিন বা vercel.json চেক করুন।");
}

const ffmpeg = new FFmpeg();

const toBlobURL = async (url, mimeType) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: mimeType });
    return URL.createObjectURL(blob);
};

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

    try {
        status.innerText = "Loading FFmpeg (This may take a moment)...";
        if (!ffmpeg.loaded) await loadFFmpeg();

        status.innerText = "Processing SVG to MP4...";
        
        const svgData = await svgFile.arrayBuffer();
        await ffmpeg.writeFile('input.svg', new Uint8Array(svgData));

        // SVG থেকে MP4 কনভার্ট করার কমান্ড
        await ffmpeg.exec(['-r', '25', '-i', 'input.svg', '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', 'output.mp4']);

        const data = await ffmpeg.readFile('output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(videoBlob);

        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.download = 'animation.mp4';
        downloadLink.style.display = 'block';
        downloadLink.innerText = 'Download MP4';
        
        status.innerText = "Conversion Complete!";
    } catch (error) {
        console.error(error);
        status.innerText = "Error: " + error.message;
        alert("Error occurred: " + error.message);
    }
});
