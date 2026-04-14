let ffmpeg = null;
let convertBtn, svgInput, status, qualitySelect;

function waitForFFmpeg() {
    return new Promise((resolve) => {
        if (typeof FFmpeg !== 'undefined') {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (typeof FFmpeg !== 'undefined') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            setTimeout(() => clearInterval(checkInterval), 10000);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    convertBtn = document.getElementById('convertBtn');
    svgInput = document.getElementById('svgInput');
    status = document.getElementById('status');
    qualitySelect = document.getElementById('quality');
    convertBtn.addEventListener('click', handleConvert);
});

async function initializeFFmpeg() {
    if (ffmpeg && ffmpeg.isLoaded()) return;
    try {
        await waitForFFmpeg();
        if (typeof FFmpeg === 'undefined') throw new Error('FFmpeg not loaded');
        const { FFmpeg: FFmpegClass } = FFmpeg;
        ffmpeg = new FFmpegClass({
            log: true,
            corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/ffmpeg-core.js'
        });
        status.innerText = "FFmpeg লোড হচ্ছে...";
        await ffmpeg.load();
        status.innerText = "প্রস্তুত!";
    } catch (error) {
        console.error('FFmpeg error:', error);
        status.innerText = "ত্রুটি: FFmpeg ";
        throw error;
    }
}

async function handleConvert() {
    if (svgInput.files.length === 0) {
        alert("SVG ফাইল নির্বাচন করুন!");
        return;
    }
    try {
        const file = svgInput.files[0];
        const quality = qualitySelect.value;
        status.innerText = "শুরু...";
        await initializeFFmpeg();
        status.innerText = "SVG পড়া...";
        const svgData = await file.text();
        const { fetchFile } = FFmpeg;
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = async () => {
            try {
                status.innerText = "ছবিতে...";
                const canvas = document.createElement('canvas');
                canvas.width = 1920;
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 1920, 1080);
                ctx.drawImage(img, 0, 0, 1920, 1080);
                const imageData = canvas.toDataURL('image/png');
                const imageBuffer = await fetchFile(imageData);
                status.innerText = "ভিডিও...";
                ffmpeg.FS('writeFile', 'input.png', imageBuffer);
                await ffmpeg.run('-loop', '1', '-i', 'input.png', '-c:v', 'libx264', '-t', '5', '-pix_fmt', 'yuv420p', '-crf', quality, 'output.mp4');
                status.innerText = "ডাউনলোড...";
                const data = ffmpeg.FS('readFile', 'output.mp4');
                ffmpeg.FS('unlink', 'input.png');
                ffmpeg.FS('unlink', 'output.mp4');
                const videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
                const link = document.createElement('a');
                link.href = videoUrl;
                link.download = 'converted_video.mp4';
                link.click();
                status.innerText = "✓ সম্পন্ন!";
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error:', error);
                status.innerText = "ত্রুটি।";
            }
        };
        img.onerror = () => {
            status.innerText = "SVG ত্রুটি।";
        };
        img.src = url;
    } catch (error) {
        console.error('Error:', error);
        status.innerText = "ত্রুটি।";
    }
} 
