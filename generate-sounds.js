// Script to generate ambient sound files using oscillators and noise
// Run with: node generate-sounds.js

const fs = require('fs');
const path = require('path');

// WAV file writer helper
function createWavBuffer(samples, sampleRate = 44100) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = samples.length * (bitsPerSample / 8);
    const headerSize = 44;
    const buffer = Buffer.alloc(headerSize + dataSize);

    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);

    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < samples.length; i++) {
        const sample = Math.max(-1, Math.min(1, samples[i]));
        buffer.writeInt16LE(Math.floor(sample * 32767), headerSize + i * 2);
    }

    return buffer;
}

// Generate white/brown noise (rain-like)
function generateRain(duration, sampleRate = 44100) {
    const samples = new Float32Array(duration * sampleRate);
    let lastOut = 0;

    for (let i = 0; i < samples.length; i++) {
        const white = Math.random() * 2 - 1;
        // Brown noise filter for rain-like sound
        lastOut = (lastOut + (0.02 * white)) / 1.02;
        // Add occasional "drop" sounds
        const dropChance = Math.random();
        const drop = dropChance > 0.9998 ? Math.sin(i * 0.1) * 0.3 : 0;
        samples[i] = lastOut * 3.5 * 0.4 + drop;
        // Gentle volume modulation
        samples[i] *= 0.5 + 0.2 * Math.sin(i / sampleRate * 0.3);
    }
    return samples;
}

// Generate forest sounds (bird-like chirps + wind)
function generateForest(duration, sampleRate = 44100) {
    const samples = new Float32Array(duration * sampleRate);
    let lastOut = 0;

    for (let i = 0; i < samples.length; i++) {
        const t = i / sampleRate;
        // Wind (filtered noise)
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.01 * white)) / 1.01;
        let sample = lastOut * 2 * 0.3;

        // Bird chirps
        const birdCycle = t % 4;
        if (birdCycle < 0.1) {
            sample += Math.sin(t * 4000 + Math.sin(t * 200) * 5) * 0.15 * Math.sin(birdCycle * Math.PI / 0.1);
        }
        if (birdCycle > 1.5 && birdCycle < 1.65) {
            sample += Math.sin(t * 5000 + Math.sin(t * 300) * 3) * 0.12 * Math.sin((birdCycle - 1.5) * Math.PI / 0.15);
        }
        if (birdCycle > 2.8 && birdCycle < 2.88) {
            sample += Math.sin(t * 3500 + Math.sin(t * 150) * 4) * 0.1 * Math.sin((birdCycle - 2.8) * Math.PI / 0.08);
        }

        // Rustling leaves
        samples[i] = sample * (0.6 + 0.3 * Math.sin(t * 0.5));
    }
    return samples;
}

// Generate cafe ambience (murmur + clinking)
function generateCafe(duration, sampleRate = 44100) {
    const samples = new Float32Array(duration * sampleRate);

    for (let i = 0; i < samples.length; i++) {
        const t = i / sampleRate;
        // Background chatter (filtered noise)
        const white = Math.random() * 2 - 1;
        let sample = white * 0.08;

        // Low murmur
        sample += Math.sin(t * 200 + Math.sin(t * 50) * 3) * 0.03;
        sample += Math.sin(t * 180 + Math.sin(t * 30) * 2) * 0.02;

        // Occasional clink sounds
        const clinkCycle = t % 5;
        if (clinkCycle > 3.0 && clinkCycle < 3.02) {
            sample += Math.sin(t * 8000) * 0.2 * Math.exp(-(clinkCycle - 3.0) * 200);
        }
        if (clinkCycle > 1.2 && clinkCycle < 1.22) {
            sample += Math.sin(t * 6000) * 0.15 * Math.exp(-(clinkCycle - 1.2) * 200);
        }

        samples[i] = sample * 0.8;
    }
    return samples;
}

// Generate fireplace crackling
function generateFireplace(duration, sampleRate = 44100) {
    const samples = new Float32Array(duration * sampleRate);
    let lastOut = 0;

    for (let i = 0; i < samples.length; i++) {
        const t = i / sampleRate;
        // Base crackling
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.04 * white)) / 1.04;
        let sample = lastOut * 2;

        // Occasional pops and crackles
        if (Math.random() > 0.9995) {
            const popDuration = 0.01 + Math.random() * 0.02;
            for (let j = 0; j < popDuration * sampleRate && (i + j) < samples.length; j++) {
                samples[i + j] += Math.sin(j * (0.2 + Math.random() * 0.3)) * 0.3 * Math.exp(-j / (popDuration * sampleRate) * 3);
            }
        }

        // Warm low hum
        sample += Math.sin(t * 60 + Math.sin(t * 20) * 2) * 0.05;
        samples[i] += sample * 0.5;
    }
    return samples;
}

// Generate ocean waves
function generateWaves(duration, sampleRate = 44100) {
    const samples = new Float32Array(duration * sampleRate);
    let lastOut = 0;

    for (let i = 0; i < samples.length; i++) {
        const t = i / sampleRate;
        // Wave cycle (~8 seconds)
        const waveEnvelope = Math.pow(Math.sin(t * Math.PI / 4), 2) * 0.5 + 0.3;

        // Filtered noise for wave texture
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.03 * white)) / 1.03;

        // Combine
        samples[i] = lastOut * 3 * waveEnvelope * 0.5;
        // Add subtle high freq for foam
        samples[i] += (Math.random() * 2 - 1) * 0.02 * waveEnvelope;
    }
    return samples;
}

// Generate alarm sound
function generateAlarm(duration = 3, sampleRate = 44100) {
    const samples = new Float32Array(duration * sampleRate);

    for (let i = 0; i < samples.length; i++) {
        const t = i / sampleRate;
        // Three beeps
        const beepCycle = t % 1;
        if (beepCycle < 0.3) {
            const envelope = Math.sin(beepCycle * Math.PI / 0.3);
            samples[i] = Math.sin(t * 2 * Math.PI * 880) * 0.4 * envelope;
            samples[i] += Math.sin(t * 2 * Math.PI * 1760) * 0.15 * envelope;
        }
    }
    return samples;
}

// Main
const soundsDir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
    fs.mkdirSync(soundsDir, { recursive: true });
}

const DURATION = 30; // 30 seconds loop

console.log('Generating rain.wav...');
fs.writeFileSync(path.join(soundsDir, 'rain.wav'), createWavBuffer(generateRain(DURATION)));

console.log('Generating forest.wav...');
fs.writeFileSync(path.join(soundsDir, 'forest.wav'), createWavBuffer(generateForest(DURATION)));

console.log('Generating cafe.wav...');
fs.writeFileSync(path.join(soundsDir, 'cafe.wav'), createWavBuffer(generateCafe(DURATION)));

console.log('Generating fireplace.wav...');
fs.writeFileSync(path.join(soundsDir, 'fireplace.wav'), createWavBuffer(generateFireplace(DURATION)));

console.log('Generating waves.wav...');
fs.writeFileSync(path.join(soundsDir, 'waves.wav'), createWavBuffer(generateWaves(DURATION)));

console.log('Generating alarm.wav...');
fs.writeFileSync(path.join(soundsDir, 'alarm.wav'), createWavBuffer(generateAlarm(3)));

console.log('Done! All sound files generated in public/sounds/');
