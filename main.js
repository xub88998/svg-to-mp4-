// FFmpeg লাইব্রেরিটি উইন্ডো অবজেক্ট থেকে নেওয়া হচ্ছে
const { FFmpeg } = window.FFmpegWASM;
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
        alert("দয়া করে আগে একটি SVG ফাইল সিলেক্ট করুন!");
        return;
    }

    try {
        status.innerText = "লাইব্রেরি লোড হচ্ছে, অপেক্ষা করুন...";
        if (!ffmpeg.loaded) await loadFFmpeg();

        status.innerText = "কনভার্ট হচ্ছে... এটি কয়েক সেকেন্ড সময় নিতে পারে।";
        
        const svgData = await svgFile.arrayBuffer();
        await ffmpeg.writeFile('input.svg', new Uint8Array(svgData));

        // SVG থেকে MP4 এ কনভার্ট করার মূল কমান্ড
        await ffmpeg.exec(['-r', '25', '-i', 'input.svg', '-vcodec', 'libx264', '-pix_fmt', 'yuv420p', 'output.mp4']);

        const data = await ffmpeg.readFile('output.mp4');
        const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(videoBlob);

        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.download = 'animation.mp4';
        downloadLink.style.display = 'block';
        downloadLink.innerText = 'Download MP4';
        
        status.innerText = "অভিনন্দন! কনভার্ট সফল হয়েছে।";
    } catch (error) {
        console.error(error);
        status.innerText = "দুঃখিত, কোনো ভুল হয়েছে: " + error.message;
    }
});
