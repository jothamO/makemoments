import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

ffmpeg.setFfmpegPath(ffmpegPath);

const srcDir = 'C:\\Users\\Evelyn\\Documents\\makemoments\\.ignore';
const destDir = 'C:\\Users\\Evelyn\\Documents\\makemoments\\public\\assets';

// Ensure destination exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

async function convertAssets() {
    console.log('Starting asset conversion...');

    // 1. Convert Logo to WebP
    const logoSrc = path.join(srcDir, 'logo', 'Adobe Express - file.png');
    const logoDest = path.join(destDir, 'logo.webp');
    if (fs.existsSync(logoSrc)) {
        console.log(`Converting logo to webp...`);
        await sharp(logoSrc)
            .resize({ height: 64 }) // Resize for header while keeping quality
            .webp({ quality: 90 })
            .toFile(logoDest);
        console.log(`✅ Created ${logoDest}`);
    } else {
        console.warn(`⚠️ Warning: Logo source not found at ${logoSrc}`);
    }

    // 2. Convert Logo to Favicon (SVG and ICO fallback)
    if (fs.existsSync(logoSrc)) {
        console.log(`Creating favicons...`);
        const publicDir = path.join(destDir, '..');

        // Apple Touch Icon (180x180)
        await sharp(logoSrc)
            .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(path.join(publicDir, 'apple-touch-icon.png'));

        // Favicon (32x32)
        await sharp(logoSrc)
            .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .png()
            .toFile(path.join(publicDir, 'favicon-32x32.png'));

        // Standard Favicon.ico
        await sharp(logoSrc)
            .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
            .toFormat('png')
            .toFile(path.join(publicDir, 'favicon.ico'));

        console.log(`✅ Created Favicons in public directory`);
    }

    // 3. Convert Video to WebM
    const videoSrc = path.join(srcDir, 'loading screen', 'Animated_Logo_Loading_Screen_1.mp4');
    const videoDest = path.join(destDir, 'animated-logo.webm');

    if (fs.existsSync(videoSrc)) {
        console.log(`Converting video to webm... this might take a minute`);
        await new Promise((resolve, reject) => {
            ffmpeg(videoSrc)
                .outputOptions([
                    '-c:v libvpx-vp9',
                    '-crf 30',
                    '-b:v 0',
                    '-an', // No audio
                    '-vf scale=-2:480' // Scale down to 480p height
                ])
                .toFormat('webm')
                .on('end', () => {
                    console.log(`✅ Created ${videoDest}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`❌ Error converting video: ${err.message}`);
                    reject(err);
                })
                .save(videoDest);
        });
    } else {
        console.warn(`⚠️ Warning: Video source not found at ${videoSrc}`);
    }

    console.log('Conversion complete!');
}

convertAssets().catch(console.error);
