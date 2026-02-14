/**
 * 🐰 Miffy Runner - 可愛跑酷遊戲
 * 使用純 HTML5 Canvas 繪製，無外部圖片依賴
 */

(function () {
    'use strict';

    // ============== 常數定義 ==============
    const DEFAULT_WIDTH = (MiffyConfig.view && MiffyConfig.view.width) || 600;
    const DEFAULT_HEIGHT = (MiffyConfig.view && MiffyConfig.view.height) || 150;
    const FPS = (MiffyConfig.performance && MiffyConfig.performance.targetFps) || 60;
    const GROUND_HEIGHT = (MiffyConfig.view && MiffyConfig.view.groundHeight) || 20;

    // ============== 工具函數 ==============
    function getRandomNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getTimeStamp() {
        return performance.now();
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.arcTo(x + width, y, x + width, y + r, r);
        ctx.lineTo(x + width, y + height - r);
        ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
        ctx.lineTo(x + r, y + height);
        ctx.arcTo(x, y + height, x, y + height - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    function getTulipPalette() {
        const season = MiffyConfig.seasons[MiffyConfig.season];
        if (season && season.tulipPalette && season.tulipPalette.length) {
            return season.tulipPalette[Math.floor(Math.random() * season.tulipPalette.length)];
        }
        const fallback = (season && season.tulipColors) || ['#FF69B4'];
        const petal = fallback[Math.floor(Math.random() * fallback.length)];
        return {
            petal,
            shadow: '#C84C7A',
            highlight: '#FFD2E3'
        };
    }

    function drawTulip(ctx, x, y, width, height, palette) {
        const stemTop = y + height * 0.55;
        const stemBottom = y + height;

        // Stem
        const stemGradient = ctx.createLinearGradient(x, stemTop, x, stemBottom);
        stemGradient.addColorStop(0, '#2E8B57');
        stemGradient.addColorStop(1, '#1C6B3B');
        ctx.strokeStyle = stemGradient;
        ctx.lineWidth = Math.max(2, width * 0.12);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x + width * 0.5, stemBottom);
        ctx.quadraticCurveTo(x + width * 0.46, y + height * 0.7, x + width * 0.5, stemTop);
        ctx.stroke();

        // Leaves
        ctx.fillStyle = '#2FAA5F';
        ctx.beginPath();
        ctx.ellipse(x + width * 0.3, y + height * 0.78, width * 0.22, height * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + width * 0.68, y + height * 0.72, width * 0.25, height * 0.12, 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Petals
        const petalGradient = ctx.createLinearGradient(x, y, x, y + height * 0.6);
        petalGradient.addColorStop(0, palette.highlight);
        petalGradient.addColorStop(0.6, palette.petal);
        petalGradient.addColorStop(1, palette.shadow);
        ctx.fillStyle = petalGradient;

        const cupHeight = height * 0.55;
        const cupY = y + height * 0.15;
        const centerX = x + width * 0.5;

        // Center petal
        ctx.beginPath();
        ctx.moveTo(centerX, cupY + cupHeight * 0.9);
        ctx.bezierCurveTo(centerX - width * 0.18, cupY + cupHeight, centerX - width * 0.1, cupY + cupHeight * 0.25, centerX, cupY);
        ctx.bezierCurveTo(centerX + width * 0.1, cupY + cupHeight * 0.25, centerX + width * 0.18, cupY + cupHeight, centerX, cupY + cupHeight * 0.9);
        ctx.fill();

        // Left petal
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.08, cupY + cupHeight * 0.85);
        ctx.bezierCurveTo(centerX - width * 0.42, cupY + cupHeight * 0.85, centerX - width * 0.38, cupY + cupHeight * 0.2, centerX - width * 0.18, cupY + cupHeight * 0.2);
        ctx.bezierCurveTo(centerX - width * 0.02, cupY + cupHeight * 0.22, centerX - width * 0.04, cupY + cupHeight * 0.6, centerX - width * 0.08, cupY + cupHeight * 0.85);
        ctx.fill();

        // Right petal
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.08, cupY + cupHeight * 0.85);
        ctx.bezierCurveTo(centerX + width * 0.42, cupY + cupHeight * 0.85, centerX + width * 0.38, cupY + cupHeight * 0.2, centerX + width * 0.18, cupY + cupHeight * 0.2);
        ctx.bezierCurveTo(centerX + width * 0.02, cupY + cupHeight * 0.22, centerX + width * 0.04, cupY + cupHeight * 0.6, centerX + width * 0.08, cupY + cupHeight * 0.85);
        ctx.fill();

        // Petal outline
        ctx.strokeStyle = 'rgba(160, 40, 80, 0.35)';
        ctx.lineWidth = Math.max(1, width * 0.04);
        ctx.stroke();
    }

    // ============== 音效生成器 ==============
    class SoundGenerator {
        constructor() {
            this.audioContext = null;
            this.enabled = MiffyConfig.sounds.enabled;
            this.volume = MiffyConfig.sounds.volume;
            this.unlocked = false;
        }

        init() {
            if (this.audioContext) return;
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                this.enabled = false;
            }
        }

        wake() {
            if (!this.enabled) return;
            this.init();
            if (!this.audioContext) return;

            if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
                this.audioContext.resume().then(() => {
                    this.unlockForIOS();
                }).catch(() => { });
                return;
            }

            this.unlockForIOS();
        }

        unlockForIOS() {
            if (!this.audioContext || this.unlocked) return;
            try {
                const buffer = this.audioContext.createBuffer(1, 1, 22050);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
                this.unlocked = true;
            } catch (e) {
            }
        }

        withRunningAudio(playFn) {
            if (!this.enabled) return;
            this.init();
            if (!this.audioContext) return;

            const runIfReady = () => {
                if (!this.audioContext) return;
                if (this.audioContext.state === 'running') {
                    this.unlockForIOS();
                    playFn();
                }
            };

            if (this.audioContext.state === 'running') {
                runIfReady();
                return;
            }

            if (this.audioContext.state === 'suspended' || this.audioContext.state === 'interrupted') {
                this.audioContext.resume().then(() => {
                    runIfReady();
                }).catch(() => { });
            }
        }

        playJump() {
            this.withRunningAudio(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
                gain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.2);
            });
        }

        playHit() {
            this.withRunningAudio(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
                gain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            });
        }

        playScore() {
            this.withRunningAudio(() => {
                const notes = [523, 659, 784];
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.2);
                    osc.start(this.audioContext.currentTime + i * 0.1);
                    osc.stop(this.audioContext.currentTime + i * 0.1 + 0.2);
                });
            });
        }

        playAchievement() {
            this.withRunningAudio(() => {
                const notes = [523, 659, 784, 1047];
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(this.volume * 0.6, this.audioContext.currentTime + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.15 + 0.3);
                    osc.start(this.audioContext.currentTime + i * 0.15);
                    osc.stop(this.audioContext.currentTime + i * 0.15 + 0.3);
                });
            });
        }
    }

    // ============== 成就系統 ==============
    class AchievementSystem {
        constructor() {
            this.achievements = {
                firstJump: { name: 'First Jump', icon: '🐰', description: 'Complete your first jump', unlocked: false },
                score100: { name: 'Score 100', icon: '💯', description: 'Reach 100 points', unlocked: false },
                score500: { name: 'Fast Runner', icon: '🏃', description: 'Reach 500 points', unlocked: false },
                score1000: { name: 'Legend Runner', icon: '👑', description: 'Reach 1000 points', unlocked: false },
                jumps10: { name: 'Bouncy Bunny', icon: '🦘', description: 'Jump 10 times in one run', unlocked: false },
                jumps50: { name: 'Sky Hopper', icon: '✈️', description: 'Jump 50 times in one run', unlocked: false },
                dodge10: { name: 'Quick Dodge', icon: '💨', description: 'Dodge 10 obstacles', unlocked: false },
                dodge50: { name: 'Untouchable', icon: '⚡', description: 'Dodge 50 obstacles', unlocked: false },
                allSeasons: { name: 'Season Traveler', icon: '🌍', description: 'Play all seasons', unlocked: false },
                playTime5: { name: 'Loyal Player', icon: '⏰', description: 'Play for 5 minutes total', unlocked: false }
            };
            this.stats = {
                totalJumps: 0,
                totalDodges: 0,
                totalPlayTime: 0,
                highScore: 0,
                seasonsPlayed: new Set()
            };
            this.pendingNotifications = [];
            this.loadProgress();
        }

        loadProgress() {
            try {
                const saved = localStorage.getItem('miffyRunnerAchievements');
                if (saved) {
                    const data = JSON.parse(saved);
                    Object.keys(data.achievements || {}).forEach(key => {
                        if (this.achievements[key]) {
                            this.achievements[key].unlocked = data.achievements[key].unlocked;
                        }
                    });
                    this.stats = { ...this.stats, ...data.stats };
                    this.stats.seasonsPlayed = new Set(data.stats.seasonsPlayed || []);
                }
            } catch (e) {
                console.log('Unable to load achievement progress');
            }
        }

        saveProgress() {
            try {
                const data = {
                    achievements: this.achievements,
                    stats: {
                        ...this.stats,
                        seasonsPlayed: Array.from(this.stats.seasonsPlayed)
                    }
                };
                localStorage.setItem('miffyRunnerAchievements', JSON.stringify(data));
            } catch (e) {
                console.log('Unable to save achievement progress');
            }
        }

        unlock(achievementId) {
            if (this.achievements[achievementId] && !this.achievements[achievementId].unlocked) {
                this.achievements[achievementId].unlocked = true;
                this.pendingNotifications.push(this.achievements[achievementId]);
                this.saveProgress();
                return true;
            }
            return false;
        }

        checkAchievements(gameStats) {
            if (gameStats.jumpCount >= 1) this.unlock('firstJump');
            if (gameStats.jumpCount >= 10) this.unlock('jumps10');
            if (gameStats.jumpCount >= 50) this.unlock('jumps50');

            if (gameStats.score >= 100) this.unlock('score100');
            if (gameStats.score >= 500) this.unlock('score500');
            if (gameStats.score >= 1000) this.unlock('score1000');

            if (gameStats.dodges >= 10) this.unlock('dodge10');
            if (gameStats.dodges >= 50) this.unlock('dodge50');

            this.stats.totalJumps += gameStats.jumpCount;
            this.stats.totalDodges += gameStats.dodges;
            if (gameStats.score > this.stats.highScore) {
                this.stats.highScore = gameStats.score;
            }

            this.stats.seasonsPlayed.add(MiffyConfig.season);
            if (this.stats.seasonsPlayed.size >= 4) {
                this.unlock('allSeasons');
            }

            this.saveProgress();
        }

        getNextNotification() {
            return this.pendingNotifications.shift();
        }

        getUnlockedCount() {
            return Object.values(this.achievements).filter(a => a.unlocked).length;
        }

        getTotalCount() {
            return Object.keys(this.achievements).length;
        }
    }

    // ============== 粒子系統 ==============
    class Particle {
        constructor(x, y, color, type = 'circle') {
            this.x = x;
            this.y = y;
            this.vx = (Math.random() - 0.5) * 5;
            this.vy = (Math.random() - 0.5) * 5 - 3;
            this.life = 1;
            this.decay = 0.015 + Math.random() * 0.015;
            this.color = color;
            this.size = 3 + Math.random() * 4;
            this.type = type;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotationSpeed = (Math.random() - 0.5) * 0.2;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.2;
            this.vx *= 0.98;
            this.life -= this.decay;
            this.rotation += this.rotationSpeed;
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.life * 0.8;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.type === 'heart') {
                this.drawHeart(ctx, 0, 0, this.size);
            } else if (this.type === 'star') {
                this.drawStar(ctx, 0, 0, this.size);
            } else {
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
                gradient.addColorStop(0, this.color);
                gradient.addColorStop(1, this.color + '00');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        drawHeart(ctx, x, y, size) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(x, y + size / 4);
            ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
            ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
            ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
            ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
            ctx.fill();
        }

        drawStar(ctx, x, y, size) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                const px = x + Math.cos(angle) * size;
                const py = y + Math.sin(angle) * size;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
        }

        isAlive() {
            return this.life > 0;
        }
    }

    class ParticleSystem {
        constructor() {
            this.particles = [];
        }

        emit(x, y, count, color, type = 'circle') {
            const performanceConfig = MiffyConfig.performance || {};
            if (performanceConfig.enableParticles === false) return;
            const maxParticles = Number.isFinite(performanceConfig.maxParticles) ? performanceConfig.maxParticles : 160;
            for (let i = 0; i < count; i++) {
                if (this.particles.length >= maxParticles) break;
                this.particles.push(new Particle(x, y, color, type));
            }
        }

        update() {
            this.particles = this.particles.filter(p => {
                p.update();
                return p.isAlive();
            });
        }

        draw(ctx) {
            this.particles.forEach(p => p.draw(ctx));
        }
    }

    // ============== Miffy 角色 ==============
    class Miffy {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            const characterConfig = MiffyConfig.character || {};
            this.width = characterConfig.width || 40;
            this.height = characterConfig.height || 50;
            this.duckHeight = characterConfig.duckHeight || 30;

            this.x = characterConfig.startX || 50;
            this.y = 0;
            this.groundY = 0;

            this.jumping = false;
            this.ducking = false;
            this.jumpVelocity = 0;
            this.gravity = 0.6;
            this.jumpStrength = -12;
            this.jumpTime = 0;
            this.jumpDuration = characterConfig.jumpDuration || 520;
            this.jumpHeight = characterConfig.jumpHeight || 65;

            this.frame = 0;
            this.frameTimer = 0;
            this.frameInterval = characterConfig.frameInterval || 100;

            this.status = 'waiting';
            this.jumpCount = 0;

            // 加载图片资源
            this.images = {
                idle: new Image(),
                jump: new Image(),
                run1: new Image(),
                run2: new Image(),
                run3: new Image(),
                duck: new Image(),
                crash: new Image()
            };

            this.images.idle.src = 'assets/miffy/miffy-idle.png';
            this.images.jump.src = 'assets/miffy/miffy-jump.png';
            this.images.run1.src = 'assets/miffy/miffy-run-1.png';
            this.images.run2.src = 'assets/miffy/miffy-run-2.png';
            this.images.run3.src = 'assets/miffy/miffy-run-3.png';
            this.images.duck.src = 'assets/miffy/miffy-duck.png';
            this.images.crash.src = 'assets/miffy/miffy-crash.png';

            this.imagesLoaded = false;
            this.loadImages();
        }

        loadImages() {
            let loadedCount = 0;
            const totalImages = Object.keys(this.images).length;

            Object.values(this.images).forEach(img => {
                img.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalImages) {
                        this.imagesLoaded = true;
                    }
                };
            });
        }

        init(groundY) {
            this.groundY = groundY - this.height;
            this.y = this.groundY;
        }

        update(deltaTime) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameInterval) {
                this.frame = (this.frame + 1) % 3; // 0, 1, 2 for run animation
                this.frameTimer = 0;
            }

            if (this.jumping) {
                this.jumpTime += deltaTime;
                const t = Math.min(this.jumpTime / this.jumpDuration, 1);
                const arc = Math.sin(Math.PI * t);
                const ease = arc * arc * (3 - 2 * arc);
                this.y = this.groundY - ease * this.jumpHeight;

                if (t >= 1) {
                    this.y = this.groundY;
                    this.jumping = false;
                    this.jumpVelocity = 0;
                    this.jumpTime = 0;
                    if (this.status !== 'crashed') {
                        this.status = 'running';
                    }
                }
            }
        }

        jump() {
            if (!this.jumping && !this.ducking) {
                this.jumping = true;
                this.jumpVelocity = this.jumpStrength;
                this.jumpTime = 0;
                this.status = 'jumping';
                this.jumpCount++;
                return true;
            }
            return false;
        }

        duck(isDucking) {
            if (!this.jumping) {
                this.ducking = isDucking;
                if (isDucking) {
                    this.status = 'ducking';
                    this.y = this.groundY + (this.height - this.duckHeight);
                } else {
                    this.status = 'running';
                    this.y = this.groundY;
                }
            }
        }

        speedDrop() {
            if (this.jumping) {
                const ratio = (MiffyConfig.character && MiffyConfig.character.speedDropRatio) || 0.85;
                this.jumpTime = Math.max(this.jumpTime, this.jumpDuration * ratio);
            }
        }

        crash() {
            this.status = 'crashed';
        }

        reset() {
            this.y = this.groundY;
            this.jumping = false;
            this.ducking = false;
            this.jumpVelocity = 0;
            this.jumpTime = 0;
            this.status = 'running';
            this.jumpCount = 0;
        }

        draw() {
            if (!this.imagesLoaded) return;

            const ctx = this.ctx;
            ctx.save();

            let currentImage;
            let drawWidth = this.width;
            let drawHeight = this.height;
            let drawY = this.y;

            // 根据状态选择图片
            if (this.status === 'crashed') {
                currentImage = this.images.crash;
            } else if (this.ducking) {
                currentImage = this.images.duck;
                drawHeight = this.duckHeight;
                drawY = this.y;
            } else if (this.jumping) {
                currentImage = this.images.jump;
            } else if (this.status === 'waiting') {
                currentImage = this.images.idle;
            } else {
                // 跑步动画 - 循环使用 run1, run2, run3
                const runImages = [this.images.run1, this.images.run2, this.images.run3];
                currentImage = runImages[this.frame];
            }

            // 绘制图片
            if (currentImage && currentImage.complete) {
                ctx.drawImage(currentImage, this.x, drawY, drawWidth, drawHeight);
            }

            ctx.restore();
        }

        getCollisionBox() {
            if (this.ducking) {
                return {
                    x: this.x + 5,
                    y: this.y + 5,
                    width: 40,
                    height: this.duckHeight - 10
                };
            }
            return {
                x: this.x + 5,
                y: this.y + 5,
                width: 30,
                height: this.height - 10
            };
        }
    }

    // ============== 障礙物：鬱金香 ==============
    class Tulip {
        constructor(canvas, x, size = 'small') {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x;
            this.size = size;
            this.width = size === 'small' ? 18 : 26;
            this.height = size === 'small' ? 28 : 38;
            this.y = 0;
            this.remove = false;
            this.palette = getTulipPalette();
        }

        init(groundY) {
            this.y = groundY - this.height;
        }

        update(speed) {
            this.x -= speed;
            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();
            drawTulip(ctx, this.x, this.y, this.width, this.height, this.palette);
            ctx.restore();
        }

        getCollisionBox() {
            return {
                x: this.x + 2,
                y: this.y + 4,
                width: this.width - 4,
                height: this.height - 6
            };
        }
    }

    // ============== 障礙物：鬱金香叢 ==============
    class TulipCluster {
        constructor(canvas, x, count = 3, options = {}) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x;
            const clusterConfig = (MiffyConfig.obstacles && MiffyConfig.obstacles.tulipCluster) || {};
            const minCount = Number.isFinite(clusterConfig.minCount) ? clusterConfig.minCount : 2;
            const maxCount = Number.isFinite(clusterConfig.maxCount) ? clusterConfig.maxCount : 4;
            this.count = Math.max(minCount, Math.min(maxCount, count));
            this.spacing = Number.isFinite(options.spacing) ? options.spacing : (clusterConfig.spacing || 6.5);
            this.tulips = [];
            this.width = 0;
            this.height = 0;
            this.y = 0;
            this.remove = false;

            const sizeMode = options.sizeMode || 'mixed';
            const largeChance = Number.isFinite(options.largeChance) ? options.largeChance : (clusterConfig.largeChance || 0.4);

            for (let i = 0; i < this.count; i++) {
                const size = sizeMode === 'smallOnly' ? 'small' : (Math.random() < largeChance ? 'large' : 'small');
                const width = size === 'small' ? 18 : 26;
                const height = size === 'small' ? 28 : 38;
                this.tulips.push({
                    width,
                    height,
                    palette: getTulipPalette(),
                    offsetX: i * (width + this.spacing)
                });
            }

            this.width = this.tulips[this.tulips.length - 1].offsetX + this.tulips[this.tulips.length - 1].width;
            this.height = Math.max(...this.tulips.map(t => t.height));
        }

        init(groundY) {
            this.y = groundY - this.height;
        }

        update(speed) {
            this.x -= speed;
            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            this.tulips.forEach(tulip => {
                const tulipY = this.y + (this.height - tulip.height);
                drawTulip(ctx, this.x + tulip.offsetX, tulipY, tulip.width, tulip.height, tulip.palette);
            });

            ctx.restore();
        }

        getCollisionBox() {
            return {
                x: this.x + 2,
                y: this.y + 4,
                width: this.width - 4,
                height: this.height - 6
            };
        }
    }

    // ============== 障礙物：蝴蝶 ==============
    class Butterfly {
        constructor(canvas, x) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x;
            this.width = 40;
            this.height = 30;
            this.y = 0;
            this.remove = false;

            this.wingFrame = 0;
            this.wingTimer = 0;
            this.wingInterval = 80;

            // 飞行路径参数
            this.time = Math.random() * Math.PI * 2;
            this.amplitude = 15 + Math.random() * 10;
            this.frequency = 0.002 + Math.random() * 0.001;
            this.speedVariation = 0.8 + Math.random() * 0.4;
            this.tilt = 0;
            this.targetTilt = 0;

            this.color1 = this.getRandomColor();
            this.color2 = this.getRandomColor();
        }

        init(groundY) {
            const heights = [groundY - 80, groundY - 60, groundY - 40];
            this.baseY = heights[Math.floor(Math.random() * heights.length)];
            this.y = this.baseY;
        }

        getRandomColor() {
            const colors = ['#FF69B4', '#DDA0DD', '#87CEEB', '#FFD700', '#98FB98', '#FFA07A'];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update(speed, deltaTime) {
            // 速度变化模拟自然飞行
            const speedMod = 1 + Math.sin(this.time * 2) * 0.2;
            this.x -= speed * 1.2 * this.speedVariation * speedMod;

            // 更快的翅膀拍打
            this.wingTimer += deltaTime;
            if (this.wingTimer >= this.wingInterval) {
                this.wingFrame = (this.wingFrame + 1) % 2;
                this.wingTimer = 0;
            }

            // 正弦波动模拟自然飞行路径
            this.time += this.frequency * deltaTime;
            const yOffset = Math.sin(this.time) * this.amplitude;
            this.y = this.baseY + yOffset;

            // 根据Y轴变化计算倾斜角度
            const yVelocity = Math.cos(this.time) * this.amplitude * this.frequency;
            this.targetTilt = Math.max(-0.3, Math.min(0.3, yVelocity * 0.02));
            this.tilt += (this.targetTilt - this.tilt) * 0.1;

            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            const x = this.x + this.width / 2;
            const y = this.y + this.height / 2;

            // 更自然的翅膀拍动角度
            const wingAngle = this.wingFrame === 0 ? 0.4 : -0.2;

            // 整体倾斜
            ctx.translate(x, y);
            ctx.rotate(this.tilt);
            ctx.translate(-x, -y);

            // 身体
            const bodyGradient = ctx.createLinearGradient(x, y - 12, x, y + 12);
            bodyGradient.addColorStop(0, '#5A3E2B');
            bodyGradient.addColorStop(1, '#2B1B12');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y, 4, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // 头部
            ctx.fillStyle = '#3B2A1C';
            ctx.beginPath();
            ctx.arc(x, y - 11, 3, 0, Math.PI * 2);
            ctx.fill();

            // 左翅膀
            ctx.save();
            ctx.translate(x - 2, y);
            ctx.rotate(wingAngle);

            // 渐变效果
            const gradient1 = ctx.createRadialGradient(-12, -6, 0, -12, -6, 16);
            gradient1.addColorStop(0, this.color1);
            gradient1.addColorStop(0.6, this.color2);
            gradient1.addColorStop(1, this.color1 + '55');
            ctx.fillStyle = gradient1;
            ctx.beginPath();
            ctx.ellipse(-12, -6, 14, 9, -0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.color2 + 'CC';
            ctx.beginPath();
            ctx.ellipse(-9, 6, 11, 7, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // 花纹
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.ellipse(-14, -8, 4, 2, -0.2, 0, Math.PI * 2);
            ctx.ellipse(-9, 2, 3, 2, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 右翅膀
            ctx.save();
            ctx.translate(x + 2, y);
            ctx.rotate(-wingAngle);

            const gradient2 = ctx.createRadialGradient(12, -6, 0, 12, -6, 16);
            gradient2.addColorStop(0, this.color1);
            gradient2.addColorStop(0.6, this.color2);
            gradient2.addColorStop(1, this.color1 + '55');
            ctx.fillStyle = gradient2;
            ctx.beginPath();
            ctx.ellipse(12, -6, 14, 9, 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = this.color2 + 'CC';
            ctx.beginPath();
            ctx.ellipse(9, 6, 11, 7, -0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.ellipse(14, -8, 4, 2, 0.2, 0, Math.PI * 2);
            ctx.ellipse(9, 2, 3, 2, -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 触角
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 2, y - 10);
            ctx.quadraticCurveTo(x - 5, y - 15, x - 3, y - 18);
            ctx.moveTo(x + 2, y - 10);
            ctx.quadraticCurveTo(x + 5, y - 15, x + 3, y - 18);
            ctx.stroke();

            ctx.restore();
        }

        getCollisionBox() {
            return {
                x: this.x + 5,
                y: this.y + 5,
                width: this.width - 10,
                height: this.height - 10
            };
        }
    }

    // 低飞熊障碍物 - 需要趴下才能躲过
    class Bear {
        constructor(canvas, x) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x;
            this.width = 50;
            this.height = 50;
            this.y = 0;
            this.remove = false;

            // 浮动动画
            this.time = Math.random() * Math.PI * 2;
            this.amplitude = 5;
            this.frequency = 0.003;
        }

        init(groundY) {
            // 低飞高度 - Miffy站立时会撞到，趴下可以通过
            this.baseY = groundY - 55;
            this.y = this.baseY;
        }

        update(speed, deltaTime) {
            this.x -= speed * 0.9;

            // 轻微浮动
            this.time += this.frequency * deltaTime;
            this.y = this.baseY + Math.sin(this.time) * this.amplitude;

            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            const x = this.x;
            const y = this.y;

            ctx.save();

            // 脸
            const faceGradient = ctx.createRadialGradient(x + 25, y + 20, 5, x + 25, y + 20, 20);
            faceGradient.addColorStop(0, '#D2691E');
            faceGradient.addColorStop(1, '#8B4513');
            ctx.fillStyle = faceGradient;
            ctx.beginPath();
            ctx.ellipse(x + 25, y + 25, 18, 16, 0, 0, Math.PI * 2);
            ctx.fill();

            // 耳朵
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.arc(x + 12, y + 12, 8, 0, Math.PI * 2);
            ctx.arc(x + 38, y + 12, 8, 0, Math.PI * 2);
            ctx.fill();

            // 鼻子区域
            ctx.fillStyle = '#DEB887';
            ctx.beginPath();
            ctx.ellipse(x + 25, y + 28, 12, 10, 0, 0, Math.PI);
            ctx.fill();

            // 鼻子
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x + 25, y + 25, 4, 0, Math.PI * 2);
            ctx.fill();

            // 眼睛
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x + 18, y + 20, 3, 0, Math.PI * 2);
            ctx.arc(x + 32, y + 20, 3, 0, Math.PI * 2);
            ctx.fill();

            // 眼睛高光
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x + 19, y + 19, 1.5, 0, Math.PI * 2);
            ctx.arc(x + 33, y + 19, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // 嘴巴
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(x + 25, y + 25, 6, 0.2, Math.PI - 0.2);
            ctx.stroke();

            ctx.restore();
        }

        getCollisionBox() {
            return {
                x: this.x + 8,
                y: this.y + 8,
                width: this.width - 16,
                height: this.height - 16
            };
        }
    }

    // ============== 雲朵 ==============
    class Cloud {
        constructor(canvas, x) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x || canvas.width;
            this.y = getRandomNum(20, 60);
            this.width = getRandomNum(40, 70);
            this.speed = 0.5;
            this.remove = false;
        }

        update(speed) {
            this.x -= this.speed + speed * 0.1;
            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            ctx.fillStyle = MiffyConfig.seasons[MiffyConfig.season].cloudColor;
            ctx.globalAlpha = 0.8;

            const x = this.x;
            const y = this.y;
            const w = this.width;

            ctx.beginPath();
            ctx.arc(x + w * 0.3, y + 10, 15, 0, Math.PI * 2);
            ctx.arc(x + w * 0.5, y + 5, 18, 0, Math.PI * 2);
            ctx.arc(x + w * 0.7, y + 10, 15, 0, Math.PI * 2);
            ctx.arc(x + w * 0.4, y + 15, 12, 0, Math.PI * 2);
            ctx.arc(x + w * 0.6, y + 15, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // ============== 裝飾物 ==============
    class Decoration {
        constructor(canvas, x, type) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x || canvas.width;
            this.y = getRandomNum(26, 90);
            this.type = type;
            this.scale = 0.8 + Math.random() * 0.4;
            this.speed = 0.5 + Math.random() * 0.4;
            this.wingPhase = Math.random() * Math.PI * 2;
            this.floatPhase = Math.random() * Math.PI * 2;
            this.remove = false;
        }

        update(speed, deltaTime = 16) {
            this.x -= this.speed + speed * 0.08;
            this.wingPhase += 0.18 + deltaTime * 0.002;
            this.floatPhase += 0.03;
            this.y += Math.sin(this.floatPhase) * 0.2;
            if (this.x < -40) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(this.scale, this.scale);

            switch (this.type) {
                case 'bee':
                    this.drawBee(ctx);
                    break;
                case 'bird':
                    this.drawBird(ctx);
                    break;
                case 'squirrel':
                    this.drawSquirrel(ctx);
                    break;
                case 'butterfly':
                default:
                    this.drawButterfly(ctx);
                    break;
            }

            ctx.restore();
        }

        drawBee(ctx) {
            const wing = Math.sin(this.wingPhase) * 0.6;

            ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#E6F7FF';
            ctx.beginPath();
            ctx.ellipse(-6, -8, 7, 4, -0.4 + wing, 0, Math.PI * 2);
            ctx.ellipse(6, -8, 7, 4, 0.4 - wing, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 1;
            const bodyGradient = ctx.createLinearGradient(-10, 0, 10, 0);
            bodyGradient.addColorStop(0, '#FFD34D');
            bodyGradient.addColorStop(1, '#F8B400');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#3B2A1C';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-5, -6);
            ctx.lineTo(-5, 6);
            ctx.moveTo(0, -7);
            ctx.lineTo(0, 7);
            ctx.moveTo(5, -6);
            ctx.lineTo(5, 6);
            ctx.stroke();

            ctx.fillStyle = '#2B1B12';
            ctx.beginPath();
            ctx.arc(-9, -2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        drawBird(ctx) {
            const flap = Math.sin(this.wingPhase) * 0.6;

            ctx.fillStyle = '#FFCE6B';
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#F8A44B';
            ctx.beginPath();
            ctx.ellipse(6, -2, 5, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#E76F51';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(10, -2);
            ctx.lineTo(14, -4);
            ctx.stroke();

            ctx.strokeStyle = '#FFB4C8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-4, -1);
            ctx.quadraticCurveTo(-14, -10 + flap * 6, -20, -4);
            ctx.moveTo(-2, 1);
            ctx.quadraticCurveTo(-12, -6 + flap * 5, -18, -1);
            ctx.stroke();
        }

        drawSquirrel(ctx) {
            ctx.fillStyle = '#C97A4B';
            ctx.beginPath();
            ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#B5623B';
            ctx.beginPath();
            ctx.ellipse(-10, -6, 7, 10, -0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#F7E0C8';
            ctx.beginPath();
            ctx.ellipse(4, 2, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3B2A1C';
            ctx.beginPath();
            ctx.arc(4, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        drawButterfly(ctx) {
            const wing = Math.sin(this.wingPhase) * 0.7;
            const leftGradient = ctx.createRadialGradient(-10, -6, 0, -10, -6, 14);
            leftGradient.addColorStop(0, '#FFD1F0');
            leftGradient.addColorStop(1, '#FF7EB3');
            ctx.fillStyle = leftGradient;
            ctx.beginPath();
            ctx.ellipse(-10, -6, 12, 8, -0.3 + wing, 0, Math.PI * 2);
            ctx.ellipse(-8, 6, 10, 6, 0.2 + wing, 0, Math.PI * 2);
            ctx.fill();

            const rightGradient = ctx.createRadialGradient(10, -6, 0, 10, -6, 14);
            rightGradient.addColorStop(0, '#FFF1B6');
            rightGradient.addColorStop(1, '#FFB347');
            ctx.fillStyle = rightGradient;
            ctx.beginPath();
            ctx.ellipse(10, -6, 12, 8, 0.3 - wing, 0, Math.PI * 2);
            ctx.ellipse(8, 6, 10, 6, -0.2 - wing, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#4B3B2A';
            ctx.beginPath();
            ctx.ellipse(0, 0, 3, 9, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 飘落装饰物 - 垂直飘落效果
    class FallingDecoration {
        constructor(canvas, emoji) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = getRandomNum(0, canvas.width);
            this.y = -20;
            this.emoji = emoji;
            this.size = getRandomNum(12, 20);
            this.fallSpeed = 0.5 + Math.random() * 1;
            this.swaySpeed = 0.002 + Math.random() * 0.003;
            this.swayAmount = 10 + Math.random() * 20;
            this.time = Math.random() * Math.PI * 2;
            this.rotation = 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.05;
            this.remove = false;
        }

        update(speed, deltaTime) {
            // 垂直下落
            this.y += this.fallSpeed;

            // 左右摇摆
            this.time += this.swaySpeed * deltaTime;
            const swayOffset = Math.sin(this.time) * this.swayAmount;
            this.displayX = this.x + swayOffset;

            // 旋转
            this.rotation += this.rotationSpeed;

            // 移除条件
            if (this.y > this.canvas.height) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();
            ctx.translate(this.displayX || this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = 0.9;
            ctx.fillText(this.emoji, 0, 0);
            ctx.restore();
        }
    }

    // ============== 爱心收集物 ==============
    class Heart {
        constructor(canvas, x) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = x;
            this.width = 24;
            this.height = 24;
            this.y = 0;
            this.remove = false;
            this.collected = false;

            // 浮动动画
            this.time = Math.random() * Math.PI * 2;
            this.amplitude = 8;
            this.frequency = 0.003;

            // 闪烁效果
            this.pulse = 0;
        }

        init(groundY) {
            const heights = [groundY - 80, groundY - 60, groundY - 40, groundY - 20];
            this.baseY = heights[Math.floor(Math.random() * heights.length)];
            this.y = this.baseY;
        }

        update(speed, deltaTime) {
            this.x -= speed * 0.8;

            // 浮动
            this.time += this.frequency * deltaTime;
            this.y = this.baseY + Math.sin(this.time) * this.amplitude;

            // 脉冲
            this.pulse = (this.pulse + deltaTime * 0.005) % (Math.PI * 2);

            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            const x = this.x + this.width / 2;
            const y = this.y + this.height / 2;

            // 脉冲缩放
            const scale = 1 + Math.sin(this.pulse) * 0.1;
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            ctx.translate(-x, -y);

            // 爱心光晕
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
            gradient.addColorStop(0, 'rgba(255, 20, 147, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 20, 147, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(x - 15, y - 15, 30, 30);

            // 绘制爱心
            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            // 左侧曲线
            ctx.bezierCurveTo(x, y, x - 10, y - 8, x - 10, y - 3);
            ctx.bezierCurveTo(x - 10, y + 2, x, y + 8, x, y + 12);
            // 右侧曲线
            ctx.bezierCurveTo(x, y + 8, x + 10, y + 2, x + 10, y - 3);
            ctx.bezierCurveTo(x + 10, y - 8, x, y, x, y + 5);
            ctx.closePath();
            ctx.fill();

            // 高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(x - 3, y - 2, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        getCollisionBox() {
            return {
                x: this.x + 2,
                y: this.y + 2,
                width: this.width - 4,
                height: this.height - 4
            };
        }
    }

    // ============== 目標蛋糕 ==============
    class Cake {
        constructor(canvas, x, image) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.image = image;
            this.x = x;
            this.y = 0;
            this.width = 36;
            this.height = 28;
            this.remove = false;
            this.collected = false;
            this.floatPhase = Math.random() * Math.PI * 2;
        }

        init(groundY) {
            this.y = groundY - this.height - 4;
        }

        update(speed, deltaTime) {
            this.x -= speed * 0.6;
            this.floatPhase += deltaTime * 0.004;
            this.y += Math.sin(this.floatPhase) * 0.4;
            if (this.x + this.width < 0) {
                this.remove = true;
            }
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();
            if (this.image && this.image.complete) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = '#F6C2D1';
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
            ctx.restore();
        }

        getCollisionBox() {
            return {
                x: this.x + 4,
                y: this.y + 4,
                width: this.width - 8,
                height: this.height - 8
            };
        }
    }

    // ============== 地面 ==============
    class Ground {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.x = 0;
            this.y = canvas.height - GROUND_HEIGHT;
            this.width = canvas.width;
            this.height = GROUND_HEIGHT;
            this.offset = 0;

            this.grassPatches = [];
            for (let i = 0; i < 30; i++) {
                this.grassPatches.push({
                    x: Math.random() * canvas.width * 2,
                    height: 3 + Math.random() * 5
                });
            }
        }

        update(speed) {
            this.offset -= speed;
            if (this.offset <= -20) {
                this.offset = 0;
            }

            this.grassPatches.forEach(grass => {
                grass.x -= speed;
                if (grass.x < -10) {
                    grass.x = this.canvas.width + Math.random() * 100;
                }
            });
        }

        draw() {
            const ctx = this.ctx;
            const season = MiffyConfig.seasons[MiffyConfig.season];

            ctx.fillStyle = season.ground;
            ctx.fillRect(0, this.y, this.width, this.height);

            ctx.strokeStyle = season.groundLine;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, this.y);
            ctx.lineTo(this.width, this.y);
            ctx.stroke();

            ctx.strokeStyle = season.groundLine;
            ctx.lineWidth = 1;
            this.grassPatches.forEach(grass => {
                if (grass.x > 0 && grass.x < this.width) {
                    ctx.beginPath();
                    ctx.moveTo(grass.x, this.y);
                    ctx.lineTo(grass.x - 2, this.y - grass.height);
                    ctx.moveTo(grass.x, this.y);
                    ctx.lineTo(grass.x + 2, this.y - grass.height - 2);
                    ctx.stroke();
                }
            });
        }
    }

    // ============== 成就通知 ==============
    class AchievementNotification {
        constructor(achievement) {
            this.achievement = achievement;
            this.x = DEFAULT_WIDTH;
            this.y = 10;
            this.width = 200;
            this.height = 50;
            this.alpha = 0;
            this.state = 'entering';
            this.timer = 0;
            this.showDuration = 3000;
        }

        update(deltaTime) {
            this.timer += deltaTime;

            switch (this.state) {
                case 'entering':
                    this.alpha = Math.min(1, this.alpha + 0.05);
                    this.x = Math.max(DEFAULT_WIDTH - this.width - 20, this.x - 10);
                    if (this.x <= DEFAULT_WIDTH - this.width - 20) {
                        this.state = 'showing';
                        this.timer = 0;
                    }
                    break;
                case 'showing':
                    if (this.timer >= this.showDuration) {
                        this.state = 'leaving';
                    }
                    break;
                case 'leaving':
                    this.alpha = Math.max(0, this.alpha - 0.05);
                    this.x += 5;
                    if (this.alpha <= 0) {
                        this.state = 'done';
                    }
                    break;
            }
        }

        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.alpha;

            ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.strokeStyle = '#DAA520';
            ctx.lineWidth = 2;

            const r = 10;
            ctx.beginPath();
            ctx.moveTo(this.x + r, this.y);
            ctx.lineTo(this.x + this.width - r, this.y);
            ctx.arc(this.x + this.width - r, this.y + r, r, -Math.PI / 2, 0);
            ctx.lineTo(this.x + this.width, this.y + this.height - r);
            ctx.arc(this.x + this.width - r, this.y + this.height - r, r, 0, Math.PI / 2);
            ctx.lineTo(this.x + r, this.y + this.height);
            ctx.arc(this.x + r, this.y + this.height - r, r, Math.PI / 2, Math.PI);
            ctx.lineTo(this.x, this.y + r);
            ctx.arc(this.x + r, this.y + r, r, Math.PI, -Math.PI / 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.font = '24px Arial';
            ctx.fillStyle = '#333';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.achievement.icon, this.x + 10, this.y + this.height / 2);

            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('🏆 Achievement unlocked!', this.x + 45, this.y + 15);

            ctx.font = '11px Arial';
            ctx.fillText(this.achievement.name, this.x + 45, this.y + 32);

            ctx.restore();
        }

        isDone() {
            return this.state === 'done';
        }
    }

    // ============== 分數顯示 ==============
    class ScoreDisplay {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.score = 0;
            this.highScore = this.loadHighScore();
            this.flashTimer = 0;
            this.flashing = false;
        }

        loadHighScore() {
            try {
                return parseInt(localStorage.getItem('miffyRunnerHighScore')) || 0;
            } catch (e) {
                return 0;
            }
        }

        saveHighScore() {
            try {
                localStorage.setItem('miffyRunnerHighScore', this.highScore.toString());
            } catch (e) { }
        }

        update(distance, deltaTime) {
            const newScore = Math.floor(distance / 10);

            if (newScore > 0 && newScore % 100 === 0 && newScore !== this.score) {
                this.flashing = true;
                this.flashTimer = 0;
            }

            this.score = newScore;

            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.saveHighScore();
            }

            if (this.flashing) {
                this.flashTimer += deltaTime;
                if (this.flashTimer >= 1000) {
                    this.flashing = false;
                }
            }

            return this.score > 0 && this.score % 100 === 0 && this.flashTimer < 50;
        }

        draw() {
            const ctx = this.ctx;
            ctx.save();

            const shouldHide = this.flashing && Math.floor(this.flashTimer / 100) % 2 === 0;

            if (!shouldHide) {
                ctx.font = 'bold 16px "Courier New", monospace';
                ctx.fillStyle = '#333';
                ctx.textAlign = 'right';
                ctx.fillText(this.score.toString().padStart(5, '0'), this.canvas.width - 10, 25);
            }

            if (this.highScore > 0) {
                ctx.font = '12px "Courier New", monospace';
                ctx.fillStyle = '#666';
                ctx.fillText('HI ' + this.highScore.toString().padStart(5, '0'), this.canvas.width - 80, 25);
            }

            ctx.restore();
        }

        reset() {
            this.score = 0;
            this.flashing = false;
        }
    }

    // ============== 遊戲結束畫面 ==============
    class GameOverPanel {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
        }

        draw(score, highScore, isNewRecord) {
            const ctx = this.ctx;
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;

            ctx.save();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.font = 'bold 24px Arial';
            ctx.fillStyle = '#FF69B4';
            ctx.textAlign = 'center';
            ctx.fillText('💔 Game Over 💔', centerX, centerY - 30);

            ctx.font = '16px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText(`Score: ${score}`, centerX, centerY + 5);

            if (isNewRecord) {
                ctx.font = 'bold 14px Arial';
                ctx.fillStyle = '#FFD700';
                ctx.fillText('🎉 New Record! 🎉', centerX, centerY + 25);
            }

            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText('Tap / Space to restart', centerX, centerY + 50);

            ctx.restore();
        }
    }

    // ============== 主遊戲類別 ==============
    class MiffyRunner {
        constructor(containerId) {
            this.container = document.querySelector(containerId);
            this.canvas = null;
            this.ctx = null;

            this.width = DEFAULT_WIDTH;
            this.height = DEFAULT_HEIGHT;

            this.miffy = null;
            this.ground = null;
            this.obstacles = [];
            this.hearts = []; // 爱心收集物
            this.heartsCollected = 0; // 已收集的爱心数
            const collectiblesConfig = MiffyConfig.collectibles || {};
            this.goalScore = collectiblesConfig.cakeStartScore || 1000;
            this.cakes = [];
            this.cakeCollectedCount = 0;
            this.cakeTimer = 0;
            this.nextCakeInterval = 0;
            this.cakeImage = new Image();
            this.cakeReady = false;
            this.fenceImage = new Image();
            this.fenceReady = false;
            this.clouds = [];
            this.decorations = [];
            this.fallingDecorations = []; // 飘落装饰物
            this.particles = new ParticleSystem();

            this.scoreDisplay = null;
            this.gameOverPanel = null;
            this.achievementNotifications = [];

            this.soundGenerator = new SoundGenerator();
            this.achievementSystem = new AchievementSystem();

            this.distance = 0;
            this.speed = MiffyConfig.difficulty.initialSpeed;
            this.speedMultiplier = MiffyConfig.difficulty.speedMultiplier || 1;
            this.currentSpeed = this.speed * this.speedMultiplier;
            this.time = 0;
            this.deltaTime = 0;

            this.playing = false;
            this.crashed = false;
            this.started = false;

            this.obstacleTimer = 0;
            const obstacleConfig = MiffyConfig.obstacles || {};
            this.obstacleInterval = obstacleConfig.baseInterval || 1650;
            this.cloudTimer = 0;
            this.decorationTimer = 0;

            this.dodgeCount = 0;
            this.lastObstacleX = 0;

            this.customBackground = null;
            this.backgroundCache = null;
            this.backgroundCacheCtx = null;
            this.backgroundCacheKey = '';
            this.scale = MiffyConfig.view?.scale || 1;
            this.photoWallImages = [];
            this.photoWallOffset = 0;
            this.photoWallFrames = [];
            this.photoWallVisibleUntil = 0;
            this.nextPhotoWallTime = 0;
            this.now = 0;
            this.runStartTime = 0;

            this.touchStartX = null;
            this.touchStartY = null;
            this.touchMoved = false;
            this.touchDucking = false;
            this.touchSwipeThreshold = 24;
            this.touchHorizontalTolerance = 56;
            this.lastTouchTime = 0;
            this.touchClickBlockMs = 550;

            this.init();
        }

        init() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            this.canvas.className = 'game-canvas';
            const contextAttributes = (MiffyConfig.performance && MiffyConfig.performance.contextAttributes) || undefined;
            this.ctx = this.canvas.getContext('2d', contextAttributes);

            this.container.innerHTML = '';
            this.container.appendChild(this.canvas);
            this.setScale(this.scale);

            this.cakeImage.src = 'assets/miffy/tiramisu.png';
            this.cakeImage.onload = () => {
                this.cakeReady = true;
            };
            this.fenceImage.src = 'assets/miffy/fence.png';
            this.fenceImage.onload = () => {
                this.fenceReady = true;
                this.backgroundCacheKey = '';
            };
            this.loadPhotoWallImages();

            this.ground = new Ground(this.canvas);
            this.miffy = new Miffy(this.canvas);
            this.miffy.init(this.height - GROUND_HEIGHT);

            this.scoreDisplay = new ScoreDisplay(this.canvas);
            this.gameOverPanel = new GameOverPanel(this.canvas);

            const cloudConfig = MiffyConfig.clouds || {};
            const initialClouds = cloudConfig.initialCount || 3;
            for (let i = 0; i < initialClouds; i++) {
                this.clouds.push(new Cloud(this.canvas, getRandomNum(50, this.width - 50)));
            }

            this.bindEvents();

            this.time = getTimeStamp();
            this.gameLoop();
        }

        bindEvents() {
            document.addEventListener('keydown', (e) => this.onKeyDown(e));
            document.addEventListener('keyup', (e) => this.onKeyUp(e));

            const messageBox = document.getElementById('messageBox');
            if (messageBox) {
                messageBox.addEventListener('click', () => {
                    this.soundGenerator.wake();
                    this.onTap();
                });
                messageBox.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.lastTouchTime = getTimeStamp();
                    this.soundGenerator.wake();
                    this.onTap();
                }, { passive: false });
            }

            this.canvas.addEventListener('click', () => {
                if (getTimeStamp() - this.lastTouchTime < this.touchClickBlockMs) {
                    return;
                }
                this.soundGenerator.wake();
                this.onTap();
            });

            this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
            this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
            this.canvas.addEventListener('touchcancel', (e) => this.onTouchCancel(e), { passive: false });
        }

        onTouchStart(e) {
            if (!e.touches || !e.touches.length) {
                return;
            }

            this.soundGenerator.wake();
            const touch = e.touches[0];
            this.lastTouchTime = getTimeStamp();
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            this.touchMoved = false;
            this.touchDucking = false;
            e.preventDefault();
        }

        onTouchMove(e) {
            if (this.touchStartY === null || !e.touches || !e.touches.length) {
                return;
            }

            const touch = e.touches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) {
                this.touchMoved = true;
            }

            if (
                deltaY > this.touchSwipeThreshold &&
                Math.abs(deltaX) < this.touchHorizontalTolerance &&
                this.playing &&
                !this.crashed
            ) {
                e.preventDefault();
                if (this.miffy.jumping) {
                    this.miffy.speedDrop();
                } else {
                    this.miffy.duck(true);
                    this.touchDucking = true;
                }
            }
        }

        onTouchEnd(e) {
            e.preventDefault();

            const endTouch = e.changedTouches && e.changedTouches.length ? e.changedTouches[0] : null;
            const deltaX = endTouch && this.touchStartX !== null ? endTouch.clientX - this.touchStartX : 0;
            const deltaY = endTouch && this.touchStartY !== null ? endTouch.clientY - this.touchStartY : 0;
            const withinTapRange = (
                Math.abs(deltaX) < this.touchHorizontalTolerance &&
                Math.abs(deltaY) < this.touchSwipeThreshold
            );
            const shouldTap = !this.touchDucking && (withinTapRange || !this.started);

            if (this.touchDucking && this.playing && !this.crashed) {
                this.miffy.duck(false);
            }

            this.touchStartX = null;
            this.touchStartY = null;
            this.touchMoved = false;
            this.touchDucking = false;

            if (shouldTap) {
                this.onTap();
            }
        }

        onTouchCancel(e) {
            e.preventDefault();
            if (this.touchDucking && this.playing && !this.crashed) {
                this.miffy.duck(false);
            }

            this.touchStartX = null;
            this.touchStartY = null;
            this.touchMoved = false;
            this.touchDucking = false;
        }

        onKeyDown(e) {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.soundGenerator.wake();
                this.onTap();
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.soundGenerator.wake();
                if (this.playing && !this.crashed) {
                    if (this.miffy.jumping) {
                        this.miffy.speedDrop();
                    } else {
                        this.miffy.duck(true);
                    }
                }
            }
        }

        onKeyUp(e) {
            if (e.code === 'ArrowDown') {
                if (this.playing && !this.crashed) {
                    this.miffy.duck(false);
                }
            }
        }

        onTap() {
            this.soundGenerator.wake();
            if (!this.started) {
                this.start();
            } else if (this.crashed) {
                this.restart();
            } else if (this.playing) {
                if (this.miffy.jump()) {
                    this.soundGenerator.playJump();
                    this.particles.emit(
                        this.miffy.x + 20,
                        this.miffy.y + this.miffy.height,
                        5,
                        '#90EE90',
                        'circle'
                    );
                }
            }
        }

        start() {
            this.started = true;
            this.playing = true;
            this.soundGenerator.init();
            this.miffy.status = 'running';
            this.runStartTime = getTimeStamp();

            const messageBox = document.getElementById('messageBox');
            if (messageBox) {
                messageBox.style.display = 'none';
            }
        }

        restart() {
            this.achievementSystem.checkAchievements({
                score: this.scoreDisplay.score,
                jumpCount: this.miffy.jumpCount,
                dodges: this.dodgeCount
            });

            this.playing = true;
            this.crashed = false;
            this.distance = 0;
            this.speed = MiffyConfig.difficulty.initialSpeed;
            this.currentSpeed = this.speed * this.speedMultiplier;
            const obstacleConfig = MiffyConfig.obstacles || {};
            this.obstacleInterval = obstacleConfig.baseInterval || 1650;
            const collectiblesConfig = MiffyConfig.collectibles || {};
            this.goalScore = collectiblesConfig.cakeStartScore || this.goalScore;
            this.obstacles = [];
            this.hearts = [];
            this.obstacleTimer = 0;
            this.heartTimer = 0;
            this.dodgeCount = 0;
            this.lastObstacleX = 0;

            this.miffy.reset();
            this.scoreDisplay.reset();
            this.particles = new ParticleSystem();
            this.cakes = [];
            this.cakeCollectedCount = 0;
            this.cakeTimer = 0;
            this.nextCakeInterval = 0;
            this.photoWallFrames = [];
            this.photoWallVisibleUntil = 0;
            this.nextPhotoWallTime = 0;
            this.runStartTime = this.now || getTimeStamp();
        }

        update() {
            const now = getTimeStamp();
            const performanceConfig = MiffyConfig.performance || {};
            const maxDeltaTime = Number.isFinite(performanceConfig.maxDeltaTime) ? performanceConfig.maxDeltaTime : 34;
            this.deltaTime = Math.min(now - this.time, maxDeltaTime);
            this.time = now;
            this.now = now;

            if (!this.playing) return;

            if (this.speed < MiffyConfig.difficulty.maxSpeed) {
                this.speed += MiffyConfig.difficulty.acceleration * this.deltaTime;
            }

            this.currentSpeed = this.speed * this.speedMultiplier;
            this.distance += this.currentSpeed * this.deltaTime / 1000 * 60;

            const playScoreSound = this.scoreDisplay.update(this.distance, this.deltaTime);
            if (playScoreSound) {
                this.soundGenerator.playScore();
            }

            this.updateCakes();
            this.updatePhotoWall();

            this.miffy.update(this.deltaTime);
            this.ground.update(this.currentSpeed);
            this.updateClouds();
            this.updateDecorations();
            this.updateObstacles();
            this.updateHearts();
            this.particles.update();
            this.updateAchievementNotifications();
            this.checkCollision();
            this.checkHeartCollection();
            this.checkCakeCollection();
        }

        updateClouds() {
            this.cloudTimer += this.deltaTime;
            const cloudConfig = MiffyConfig.clouds || {};
            const spawnInterval = cloudConfig.spawnIntervalMs || 3000;
            const maxClouds = cloudConfig.maxCount || 5;

            if (this.cloudTimer >= spawnInterval && this.clouds.length < maxClouds) {
                this.clouds.push(new Cloud(this.canvas));
                this.cloudTimer = 0;
            }

            this.clouds = this.clouds.filter(cloud => {
                cloud.update(this.currentSpeed);
                return !cloud.remove;
            });
        }

        updateDecorations() {
            this.decorationTimer += this.deltaTime;

            const decorationConfig = MiffyConfig.decorations || {};
            const decorationSpawnInterval = decorationConfig.spawnIntervalMs || 2000;
            const decorationMaxCount = decorationConfig.maxCount || 8;
            const fallingSpawnInterval = decorationConfig.fallingSpawnIntervalMs || 1500;
            const fallingMaxCount = decorationConfig.fallingMaxCount || 12;

            // 常规装饰物（从右到左）
            if (this.decorationTimer >= decorationSpawnInterval && this.decorations.length < decorationMaxCount) {
                const seasonConfig = MiffyConfig.seasons[MiffyConfig.season];
                const flyingDecorations = seasonConfig.flyingDecorations || [];

                if (flyingDecorations.length > 0) {
                    const type = flyingDecorations[Math.floor(Math.random() * flyingDecorations.length)];
                    this.decorations.push(new Decoration(this.canvas, this.width, type));
                }
                this.decorationTimer = 0;
            }

            this.decorations = this.decorations.filter(dec => {
                dec.update(this.currentSpeed, this.deltaTime);
                return !dec.remove;
            });

            // 飘落装饰物
            this.fallingDecorationTimer = this.fallingDecorationTimer || 0;
            this.fallingDecorationTimer += this.deltaTime;

            if (this.fallingDecorationTimer >= fallingSpawnInterval && this.fallingDecorations.length < fallingMaxCount) {
                const seasonConfig = MiffyConfig.seasons[MiffyConfig.season];
                const fallingEmojis = seasonConfig.fallingDecorations || [];

                if (fallingEmojis.length > 0) {
                    const emoji = fallingEmojis[Math.floor(Math.random() * fallingEmojis.length)];
                    this.fallingDecorations.push(new FallingDecoration(this.canvas, emoji));
                }
                this.fallingDecorationTimer = 0;
            }

            this.fallingDecorations = this.fallingDecorations.filter(dec => {
                dec.update(this.currentSpeed, this.deltaTime);
                return !dec.remove;
            });
        }

        updateObstacles() {
            this.obstacleTimer += this.deltaTime;
            const obstacleConfig = MiffyConfig.obstacles || {};
            const minInterval = Math.max(
                obstacleConfig.minInterval || 800,
                this.obstacleInterval - this.currentSpeed * (obstacleConfig.speedIntervalFactor || 50)
            );

            if (this.obstacleTimer >= minInterval) {
                this.addObstacle();
                this.obstacleTimer = 0;
            }

            this.obstacles = this.obstacles.filter(obs => {
                obs.update(this.currentSpeed, this.deltaTime);

                if (!obs.remove && obs.x + obs.width < this.miffy.x && obs.x + obs.width > this.lastObstacleX) {
                    this.dodgeCount++;
                    this.lastObstacleX = obs.x + obs.width;
                }

                return !obs.remove;
            });
        }

        updateHearts() {
            // 爱心生成计时
            this.heartTimer = this.heartTimer || 0;
            this.heartTimer += this.deltaTime;

            const collectibleConfig = MiffyConfig.collectibles || {};
            const heartMinInterval = collectibleConfig.heartMinIntervalMs || 4000;
            const heartMaxInterval = collectibleConfig.heartMaxIntervalMs || 9000;
            const maxHearts = collectibleConfig.maxHearts || 3;

            if (!this.nextHeartInterval) {
                this.nextHeartInterval = getRandomNum(heartMinInterval, heartMaxInterval);
            }

            // 每5-8秒随机生成一个爱心
            if (this.heartTimer >= this.nextHeartInterval && this.hearts.length < maxHearts) {
                const spawnX = this.width + getRandomNum(20, 120);
                const heart = new Heart(this.canvas, spawnX);
                heart.init(this.height - GROUND_HEIGHT);
                this.hearts.push(heart);
                this.heartTimer = 0;
                this.nextHeartInterval = getRandomNum(heartMinInterval, heartMaxInterval);
            }

            // 更新爱心位置
            this.hearts = this.hearts.filter(heart => {
                heart.update(this.currentSpeed, this.deltaTime);
                return !heart.remove && !heart.collected;
            });
        }

        updateCakes() {
            if (this.scoreDisplay.score < this.goalScore) return;

            this.cakeTimer += this.deltaTime;
            const collectibleConfig = MiffyConfig.collectibles || {};
            const cakeMinInterval = collectibleConfig.cakeMinIntervalMs || 12000;
            const cakeMaxInterval = collectibleConfig.cakeMaxIntervalMs || 20000;
            const maxCakes = collectibleConfig.maxCakes || 2;
            if (!this.nextCakeInterval) {
                this.nextCakeInterval = getRandomNum(cakeMinInterval, cakeMaxInterval);
            }

            if (this.cakeTimer >= this.nextCakeInterval && this.cakes.length < maxCakes) {
                const cake = new Cake(this.canvas, this.width + getRandomNum(60, 140), this.cakeImage);
                cake.init(this.height - GROUND_HEIGHT);
                this.cakes.push(cake);
                this.cakeTimer = 0;
                this.nextCakeInterval = getRandomNum(cakeMinInterval, cakeMaxInterval);
            }

            this.cakes = this.cakes.filter(cake => {
                cake.update(this.currentSpeed, this.deltaTime);
                return !cake.remove && !cake.collected;
            });
        }

        checkHeartCollection() {
            const miffyBox = this.miffy.getCollisionBox();

            for (const heart of this.hearts) {
                const heartBox = heart.getCollisionBox();

                if (this.boxCollision(miffyBox, heartBox) && !heart.collected) {
                    heart.collected = true;
                    this.heartsCollected++;

                    // 播放声音
                    this.soundGenerator.playScore();

                    // 生成爱心粒子特效
                    this.particles.emit(
                        heart.x + heart.width / 2,
                        heart.y + heart.height / 2,
                        8,
                        '#FF1493',
                        'heart'
                    );

                    // 移除已收集的爱心
                    heart.remove = true;
                }
            }
        }

        checkCakeCollection() {
            if (!this.cakes.length) return;
            const miffyBox = this.miffy.getCollisionBox();

            this.cakes.forEach(cake => {
                if (cake.collected) return;
                const cakeBox = cake.getCollisionBox();
                if (this.boxCollision(miffyBox, cakeBox)) {
                    cake.collected = true;
                    this.cakeCollectedCount++;
                    this.soundGenerator.playAchievement();
                    this.particles.emit(
                        cake.x + cake.width / 2,
                        cake.y + cake.height / 2,
                        16,
                        '#F6C2D1',
                        'heart'
                    );
                }
            });
        }

        updatePhotoWall() {
            const wall = MiffyConfig.photoWall;
            if (!wall || !wall.enabled || !this.photoWallImages.length) return;
            const frameWidth = wall.frameWidth || 46;
            const framePadding = wall.frameXPadding || 40;
            const fenceConfig = MiffyConfig.fence || {};
            const fenceHeight = Number.isFinite(fenceConfig.height) ? fenceConfig.height : 25;
            const fenceOffset = Number.isFinite(fenceConfig.yOffset) ? fenceConfig.yOffset : 2;
            const fenceTopY = this.height - GROUND_HEIGHT - fenceHeight + fenceOffset;
            const maxSkyY = Math.max(10, Math.floor(fenceTopY - (wall.frameHeight || 34) - 6));

            if (!this.nextPhotoWallTime) {
                this.nextPhotoWallTime = this.now + getRandomNum(wall.showIntervalMinMs || 6000, wall.showIntervalMaxMs || 12000);
            }

            if (this.now >= this.nextPhotoWallTime) {
                this.photoWallVisibleUntil = this.now + getRandomNum(wall.visibleMinMs || 7000, wall.visibleMaxMs || 11000);
                this.nextPhotoWallTime = this.now + getRandomNum(wall.nextShowMinMs || 9000, wall.nextShowMaxMs || 15000);
                const count = getRandomNum(wall.frameCountMin || 2, wall.frameCountMax || 3);
                const maxX = Math.max(framePadding, this.width - frameWidth - framePadding);
                const minY = Math.max(0, wall.frameYMin || 20);
                const maxY = Math.max(minY, Math.min(wall.frameYMax || 60, maxSkyY));
                const frames = [];
                const gap = 6;
                const maxAttempts = 30;

                for (let i = 0; i < count; i++) {
                    let placed = false;
                    for (let attempt = 0; attempt < maxAttempts; attempt++) {
                        const x = getRandomNum(framePadding, maxX);
                        const y = getRandomNum(minY, maxY);
                        const rect = {
                            x: x - gap,
                            y: y - gap,
                            width: frameWidth + gap * 2,
                            height: (wall.frameHeight || 34) + gap * 2
                        };

                        const overlaps = frames.some((f) => {
                            return rect.x < f.rect.x + f.rect.width &&
                                rect.x + rect.width > f.rect.x &&
                                rect.y < f.rect.y + f.rect.height &&
                                rect.y + rect.height > f.rect.y;
                        });

                        if (!overlaps) {
                            frames.push({
                                x,
                                y,
                                imgIndex: getRandomNum(0, this.photoWallImages.length - 1),
                                tilt: (Math.random() - 0.5) * 0.12,
                                rect
                            });
                            placed = true;
                            break;
                        }
                    }

                    if (!placed) {
                        // If no space found, stop adding more frames
                        break;
                    }
                }

                this.photoWallFrames = frames.map(({ rect, ...frame }) => frame);
            }
        }

        loadPhotoWallImages() {
            const sources = (MiffyConfig.photoWall && MiffyConfig.photoWall.images) || [];
            this.photoWallImages = sources.map((src) => {
                const img = new Image();
                img.src = src;
                return img;
            });
        }

        addObstacle() {
            const obstacleConfig = MiffyConfig.obstacles || {};
            const clusterConfig = obstacleConfig.tulipCluster || {};
            const spawnChances = obstacleConfig.spawnChances || {};
            const bearChance = Number.isFinite(spawnChances.bear) ? spawnChances.bear : 0.2;
            const butterflyChance = Number.isFinite(spawnChances.butterfly) ? spawnChances.butterfly : 0.18;
            const clusterChance = Number.isFinite(spawnChances.tulipCluster) ? spawnChances.tulipCluster : 0.32;

            const minSpeedForBear = obstacleConfig.minSpeedForBear || 6;
            const minSpeedForButterfly = obstacleConfig.minSpeedForButterfly || 8;

            const runTime = this.runStartTime ? (this.now - this.runStartTime) : 0;
            const isEarlyGame = runTime < (obstacleConfig.earlyGameDurationMs || 8000);

            const minClusterCount = Number.isFinite(clusterConfig.minCount) ? clusterConfig.minCount : 2;
            const maxClusterCount = isEarlyGame
                ? (obstacleConfig.earlyGameMaxClusterCount || clusterConfig.maxCount || 2)
                : (clusterConfig.maxCount || 4);
            const clusterCount = getRandomNum(minClusterCount, maxClusterCount);
            const clusterOptions = {
                spacing: isEarlyGame ? (obstacleConfig.earlyGameClusterSpacing || clusterConfig.spacing || 6.5) : (clusterConfig.spacing || 6.5),
                largeChance: isEarlyGame ? (obstacleConfig.earlyGameLargeChance || clusterConfig.largeChance || 0.4) : (clusterConfig.largeChance || 0.4),
                sizeMode: isEarlyGame && obstacleConfig.earlyGameSmallOnly !== false ? 'smallOnly' : 'mixed'
            };

            const random = Math.random();
            let obstacle;

            // 生成需要趴下的熊障碍物
            if (random < bearChance && this.currentSpeed > minSpeedForBear) {
                obstacle = new Bear(this.canvas, this.width);
            } else if (random < bearChance + butterflyChance && this.currentSpeed > minSpeedForButterfly) {
                obstacle = new Butterfly(this.canvas, this.width);
            } else if (random < bearChance + butterflyChance + clusterChance) {
                obstacle = new TulipCluster(this.canvas, this.width, clusterCount, clusterOptions);
            } else {
                const singleLargeChance = isEarlyGame
                    ? (obstacleConfig.earlyGameSingleTulipLargeChance || 0.2)
                    : (obstacleConfig.singleTulipLargeChance || 0.5);
                const size = Math.random() < singleLargeChance ? 'large' : 'small';
                obstacle = new Tulip(this.canvas, this.width, size);
            }

            obstacle.init(this.height - GROUND_HEIGHT);
            this.obstacles.push(obstacle);
        }

        updateAchievementNotifications() {
            const newAchievement = this.achievementSystem.getNextNotification();
            if (newAchievement) {
                this.achievementNotifications.push(new AchievementNotification(newAchievement));
                this.soundGenerator.playAchievement();
            }

            this.achievementNotifications = this.achievementNotifications.filter(notif => {
                notif.update(this.deltaTime);
                return !notif.isDone();
            });
        }

        checkCollision() {
            const miffyBox = this.miffy.getCollisionBox();

            for (const obstacle of this.obstacles) {
                const obsBox = obstacle.getCollisionBox();

                if (this.boxCollision(miffyBox, obsBox)) {
                    this.gameOver();
                    return;
                }
            }
        }

        boxCollision(box1, box2) {
            return box1.x < box2.x + box2.width &&
                box1.x + box1.width > box2.x &&
                box1.y < box2.y + box2.height &&
                box1.y + box1.height > box2.y;
        }

        gameOver() {
            this.playing = false;
            this.crashed = true;
            this.miffy.crash();
            this.soundGenerator.playHit();

            for (let i = 0; i < 10; i++) {
                this.particles.emit(
                    this.miffy.x + 20,
                    this.miffy.y + 25,
                    1,
                    '#FF69B4',
                    'heart'
                );
            }

            this.achievementSystem.checkAchievements({
                score: this.scoreDisplay.score,
                jumpCount: this.miffy.jumpCount,
                dodges: this.dodgeCount
            });
        }

        draw() {
            const ctx = this.ctx;

            this.drawBackground();
            this.clouds.forEach(cloud => cloud.draw());
            this.decorations.forEach(dec => dec.draw());
            this.fallingDecorations.forEach(dec => dec.draw()); // 绘制飘落装饰
            this.ground.draw();
            this.obstacles.forEach(obs => obs.draw());
            this.hearts.forEach(heart => heart.draw()); // 绘制爱心
            this.cakes.forEach(cake => {
                if (!cake.collected) {
                    cake.draw();
                }
            });
            this.miffy.draw();
            this.particles.draw(ctx);
            this.scoreDisplay.draw();
            this.drawHeartCounter(); // 绘制爱心计数器
            this.drawCakeCounter();
            this.achievementNotifications.forEach(notif => notif.draw(ctx));
            this.drawSeasonIndicator();

            if (this.crashed) {
                const isNewRecord = this.scoreDisplay.score >= this.scoreDisplay.highScore && this.scoreDisplay.score > 0;
                this.gameOverPanel.draw(this.scoreDisplay.score, this.scoreDisplay.highScore, isNewRecord);
            }

            if (!this.started) {
                this.drawStartPrompt();
            }
        }

        getBackgroundCacheKey() {
            const seasonKey = MiffyConfig.season || 'default';
            const backgroundKey = this.customBackground ? (this.customBackground.src || 'custom') : 'default';
            const fenceConfig = MiffyConfig.fence || {};
            const fenceHeight = Number.isFinite(fenceConfig.height) ? fenceConfig.height : 25;
            const fenceOffset = Number.isFinite(fenceConfig.yOffset) ? fenceConfig.yOffset : 2;
            const fenceScaleFactor = Number.isFinite(fenceConfig.scalingFactor) ? fenceConfig.scalingFactor : 0;
            return `${this.width}x${this.height}|${seasonKey}|${backgroundKey}|fence:${fenceHeight}:${fenceOffset}:${fenceScaleFactor}`;
        }

        renderBackgroundLayer(targetCtx) {
            const ctx = targetCtx;
            const season = MiffyConfig.seasons[MiffyConfig.season];

            if (this.customBackground) {
                ctx.drawImage(this.customBackground, 0, 0, this.width, this.height);
                return;
            }

            const skyTop = season.skyTop || season.sky;
            const skyBottom = season.skyBottom || this.lightenColor(season.sky, 30);

            const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, skyTop);
            gradient.addColorStop(0.6, skyBottom);
            gradient.addColorStop(1, season.ground);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);

            // Horizon glow
            const glow = ctx.createRadialGradient(this.width * 0.75, this.height * 0.5, 10, this.width * 0.75, this.height * 0.5, 140);
            glow.addColorStop(0, season.horizonGlow || 'rgba(255,255,255,0.8)');
            glow.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, this.width, this.height);

            // Distant sun/moon
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(this.width * 0.18, this.height * 0.28, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Hills layers
            const hills = season.hills || [this.lightenColor(season.ground, 20), season.ground, this.darkenColor(season.ground, 20)];

            ctx.fillStyle = hills[0];
            ctx.beginPath();
            ctx.moveTo(0, this.height - GROUND_HEIGHT - 10);
            ctx.quadraticCurveTo(this.width * 0.2, 70, this.width * 0.45, 90);
            ctx.quadraticCurveTo(this.width * 0.75, 110, this.width, 75);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = hills[1] || season.ground;
            ctx.beginPath();
            ctx.moveTo(0, this.height - GROUND_HEIGHT - 5);
            ctx.quadraticCurveTo(this.width * 0.25, 95, this.width * 0.5, 110);
            ctx.quadraticCurveTo(this.width * 0.8, 125, this.width, 100);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = hills[2] || this.darkenColor(season.ground, 15);
            ctx.beginPath();
            ctx.moveTo(0, this.height - GROUND_HEIGHT);
            ctx.quadraticCurveTo(this.width * 0.3, 110, this.width * 0.6, 120);
            ctx.quadraticCurveTo(this.width * 0.9, 135, this.width, 120);
            ctx.lineTo(this.width, this.height);
            ctx.lineTo(0, this.height);
            ctx.closePath();
            ctx.fill();

            // Fence / railing on grass
            if (this.fenceReady && this.fenceImage && this.fenceImage.complete) {
                const fenceConfig = MiffyConfig.fence || {};
                const fenceHeight = Number.isFinite(fenceConfig.height) ? fenceConfig.height : 25;
                const yOffset = Number.isFinite(fenceConfig.yOffset) ? fenceConfig.yOffset : 2;
                const scalingFactor = Number.isFinite(fenceConfig.scalingFactor) ? fenceConfig.scalingFactor : 0;
                const fenceY = this.height - GROUND_HEIGHT - fenceHeight + yOffset;
                const scale = fenceHeight / (this.fenceImage.naturalHeight || fenceHeight) + scalingFactor;
                const tileWidth = (this.fenceImage.naturalWidth || 60) * scale;

                ctx.save();
                for (let x = 0; x < this.width + tileWidth; x += tileWidth) {
                    ctx.drawImage(this.fenceImage, x, fenceY, tileWidth, fenceHeight);
                }
                ctx.restore();
            }
        }

        drawBackground() {
            const ctx = this.ctx;
            const performanceConfig = MiffyConfig.performance || {};
            const useCache = performanceConfig.enableBackgroundCache !== false;

            if (useCache) {
                const cacheKey = this.getBackgroundCacheKey();
                if (!this.backgroundCache || this.backgroundCacheKey !== cacheKey) {
                    this.backgroundCache = document.createElement('canvas');
                    this.backgroundCache.width = this.width;
                    this.backgroundCache.height = this.height;
                    this.backgroundCacheCtx = this.backgroundCache.getContext('2d');
                    this.backgroundCacheKey = cacheKey;
                    this.renderBackgroundLayer(this.backgroundCacheCtx);
                }
                ctx.drawImage(this.backgroundCache, 0, 0);
            } else {
                this.renderBackgroundLayer(ctx);
            }

            if (!this.customBackground) {
                this.drawPhotoWall();
            }
        }

        drawPhotoWall() {
            const wall = MiffyConfig.photoWall;
            if (!wall || !wall.enabled || !this.photoWallImages.length) return;
            if (this.now > this.photoWallVisibleUntil) return;

            const ctx = this.ctx;
            const frameWidth = wall.frameWidth || 46;
            const frameHeight = wall.frameHeight || 34;
            const baseY = 0;

            this.photoWallFrames.forEach((frame) => {
                const x = frame.x;
                const y = baseY + frame.y;
                const img = this.photoWallImages[frame.imgIndex];

                // Frame shadow
                ctx.save();
                ctx.translate(x + frameWidth / 2, y + frameHeight / 2);
                ctx.rotate(frame.tilt);
                ctx.translate(-x - frameWidth / 2, -y - frameHeight / 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
                drawRoundedRect(ctx, x + 3, y + 3, frameWidth, frameHeight, 6);
                ctx.fill();

                // Frame
                ctx.fillStyle = '#FFF7E8';
                drawRoundedRect(ctx, x, y, frameWidth, frameHeight, 6);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 210, 160, 0.6)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Inner matte
                ctx.fillStyle = '#FFEBDD';
                drawRoundedRect(ctx, x + 4, y + 4, frameWidth - 8, frameHeight - 8, 4);
                ctx.fill();

                if (img && img.complete) {
                    ctx.save();
                    ctx.beginPath();
                    drawRoundedRect(ctx, x + 6, y + 6, frameWidth - 12, frameHeight - 12, 3);
                    ctx.clip();
                    ctx.drawImage(img, x + 6, y + 6, frameWidth - 12, frameHeight - 12);
                    ctx.restore();
                }

                // Fairy garland
                ctx.fillStyle = 'rgba(255, 214, 238, 0.9)';
                ctx.beginPath();
                ctx.arc(x + 8, y - 2, 2.2, 0, Math.PI * 2);
                ctx.arc(x + frameWidth - 8, y - 2, 2.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            });
        }

        lightenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.min(255, (num >> 16) + amt);
            const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
            const B = Math.min(255, (num & 0x0000FF) + amt);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        darkenColor(color, percent) {
            const num = parseInt(color.replace('#', ''), 16);
            const amt = Math.round(2.55 * percent);
            const R = Math.max(0, (num >> 16) - amt);
            const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
            const B = Math.max(0, (num & 0x0000FF) - amt);
            return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
        }

        drawSeasonIndicator() {
            const ctx = this.ctx;
            const seasonEmojis = {
                spring: '🌸',
                summer: '☀️',
                autumn: '🍂',
                winter: '❄️'
            };

            ctx.font = '16px Arial';
            ctx.fillText(seasonEmojis[MiffyConfig.season], 10, 22);
        }

        drawHeartCounter() {
            const ctx = this.ctx;
            ctx.save();
            // 绘制爱心图标
            const x = 14;
            const y = 40;

            ctx.fillStyle = '#FF1493';
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.bezierCurveTo(x, y, x - 6, y - 5, x - 6, y - 2);
            ctx.bezierCurveTo(x - 6, y + 1, x, y + 5, x, y + 7);
            ctx.bezierCurveTo(x, y + 5, x + 6, y + 1, x + 6, y - 2);
            ctx.bezierCurveTo(x + 6, y - 5, x, y, x, y + 5);
            ctx.closePath();
            ctx.fill();

            // 绘制数量
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#FF1493';
            ctx.textAlign = 'left';
            ctx.fillText(`× ${this.heartsCollected}`, x + 12, y + 7);

            ctx.restore();
        }

        drawCakeCounter() {
            if (this.scoreDisplay.score < this.goalScore) return;
            const ctx = this.ctx;
            ctx.save();

            const x = 14;
            const y = 60;

            if (this.cakeReady) {
                ctx.drawImage(this.cakeImage, x - 2, y - 6, 22, 16);
            } else {
                ctx.fillStyle = '#F6C2D1';
                ctx.fillRect(x, y - 6, 18, 12);
            }

            ctx.font = 'bold 13px Arial';
            ctx.fillStyle = '#E890A5';
            ctx.textAlign = 'left';
            ctx.fillText(`× ${this.cakeCollectedCount}`, x + 22, y + 4);

            ctx.restore();
        }

        drawStartPrompt() {
            const ctx = this.ctx;
            ctx.save();

            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = '#FF69B4';
            ctx.textAlign = 'center';
            ctx.fillText('Tap / Space to start', this.width / 2, this.height / 2);

            ctx.font = '12px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText('Tap: Jump · Swipe Down / ⬇️: Duck', this.width / 2, this.height / 2 + 20);

            ctx.restore();
        }

        gameLoop() {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.gameLoop());
        }

        setBackground(imagePath) {
            if (!imagePath) {
                this.customBackground = null;
                this.backgroundCacheKey = '';
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.customBackground = img;
                this.backgroundCacheKey = '';
            };
            img.src = imagePath;
        }

        setSeason(season) {
            if (MiffyConfig.seasons[season]) {
                MiffyConfig.season = season;
                this.backgroundCacheKey = '';
            }
        }

        setSpeedMultiplier(multiplier) {
            const value = Number(multiplier);
            if (Number.isFinite(value)) {
                this.speedMultiplier = Math.min(2, Math.max(0.5, value));
            }
        }

        setScale(scale) {
            const value = Number(scale);
            if (!Number.isFinite(value) || !this.canvas) return;

            // 限制缩放范围
            this.scale = Math.min(1.5, Math.max(0.8, value));
            this.container.style.setProperty('--canvas-scale', this.scale.toString());

            // 同时更新game-shell的CSS变量以确保整体布局适应
            const gameShell = this.container.closest('.game-shell');
            if (gameShell) {
                gameShell.style.setProperty('--canvas-scale', this.scale.toString());
            }
        }

        getAchievements() {
            return this.achievementSystem.achievements;
        }

        getStats() {
            return {
                highScore: this.scoreDisplay.highScore,
                ...this.achievementSystem.stats,
                achievementsUnlocked: this.achievementSystem.getUnlockedCount(),
                achievementsTotal: this.achievementSystem.getTotalCount()
            };
        }
    }

    // ============== Settings helpers ==============
    const SETTINGS_KEY = 'miffyRunnerSettings';

    function loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.log('Unable to save settings');
        }
    }

    function applySettings(settings) {
        if (settings.season) {
            window.MiffyAPI.setSeason(settings.season);
        }
        if (settings.background !== undefined) {
            window.MiffyAPI.setBackground(settings.background);
        }
        if (settings.speedMultiplier) {
            window.MiffyAPI.setSpeedMultiplier(settings.speedMultiplier);
        }
        if (settings.scale) {
            window.MiffyAPI.setScale(settings.scale);
        }
    }

    function initSettingsPanel(initial) {
        const seasonSelect = document.getElementById('seasonSelect');
        const backgroundInput = document.getElementById('backgroundInput');
        const backgroundFile = document.getElementById('backgroundFile');
        const chooseFile = document.getElementById('chooseFile');
        const applyBackground = document.getElementById('applyBackground');
        const clearBackground = document.getElementById('clearBackground');
        const resetRecords = document.getElementById('resetRecords');
        const speedRange = document.getElementById('speedRange');
        const speedValue = document.getElementById('speedValue');
        const scaleRange = document.getElementById('scaleRange');
        const scaleValue = document.getElementById('scaleValue');

        if (!seasonSelect || !backgroundInput || !applyBackground || !speedRange || !speedValue || !scaleRange || !scaleValue) {
            return;
        }

        const settings = {
            season: MiffyConfig.season,
            background: MiffyConfig.background.imagePath || '',
            speedMultiplier: MiffyConfig.difficulty.speedMultiplier || 1,
            scale: MiffyConfig.view?.scale || 1,
            ...initial
        };

        const updateSpeedLabel = (value) => {
            speedValue.textContent = `${Number(value).toFixed(1)}x`;
        };

        const updateScaleLabel = (value) => {
            scaleValue.textContent = `${Math.round(Number(value) * 100)}%`;
        };

        seasonSelect.value = settings.season;
        backgroundInput.value = settings.background;
        speedRange.value = settings.speedMultiplier;
        scaleRange.value = settings.scale;
        updateSpeedLabel(settings.speedMultiplier);
        updateScaleLabel(settings.scale);

        // 季节选择
        seasonSelect.addEventListener('change', () => {
            settings.season = seasonSelect.value;
            window.MiffyAPI.setSeason(settings.season);
            saveSettings(settings);
        });

        // 文件选择按钮
        if (chooseFile && backgroundFile) {
            chooseFile.addEventListener('click', () => {
                backgroundFile.click();
            });

            // 文件选择处理
            backgroundFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const dataUrl = event.target.result;
                        backgroundInput.value = file.name;
                        settings.background = dataUrl;
                        window.MiffyAPI.setBackground(dataUrl);
                        saveSettings(settings);
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('请选择有效的图片文件！');
                }
            });
        }

        // URL输入应用
        applyBackground.addEventListener('click', () => {
            settings.background = backgroundInput.value.trim();
            window.MiffyAPI.setBackground(settings.background);
            saveSettings(settings);
        });

        // 清除背景
        if (clearBackground) {
            clearBackground.addEventListener('click', () => {
                backgroundInput.value = '';
                settings.background = '';
                window.MiffyAPI.setBackground('');
                saveSettings(settings);
                if (backgroundFile) {
                    backgroundFile.value = '';
                }
            });
        }

        // 回车键应用
        backgroundInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                settings.background = backgroundInput.value.trim();
                window.MiffyAPI.setBackground(settings.background);
                saveSettings(settings);
            }
        });

        speedRange.addEventListener('input', () => {
            updateSpeedLabel(speedRange.value);
            settings.speedMultiplier = Number(speedRange.value);
            window.MiffyAPI.setSpeedMultiplier(settings.speedMultiplier);
            saveSettings(settings);
        });

        scaleRange.addEventListener('input', () => {
            updateScaleLabel(scaleRange.value);
            settings.scale = Number(scaleRange.value);
            window.MiffyAPI.setScale(settings.scale);
            saveSettings(settings);
        });

        if (resetRecords) {
            resetRecords.addEventListener('click', () => {
                const confirmed = window.confirm('確定要重置所有紀錄嗎？');
                if (!confirmed) return;
                try {
                    localStorage.removeItem('miffyRunnerHighScore');
                    localStorage.removeItem('miffyRunnerAchievements');
                } catch (e) {
                    // ignore
                }
                window.location.reload();
            });
        }
    }

    // ============== 初始化 ==============
    function onDocumentLoad() {
        window.miffyRunner = new MiffyRunner('.interstitial-wrapper');

        window.MiffyAPI = {
            setBackground: (path) => window.miffyRunner.setBackground(path),
            setSeason: (season) => window.miffyRunner.setSeason(season),
            setSpeedMultiplier: (multiplier) => window.miffyRunner.setSpeedMultiplier(multiplier),
            setScale: (scale) => window.miffyRunner.setScale(scale),
            getAchievements: () => window.miffyRunner.getAchievements(),
            getStats: () => window.miffyRunner.getStats()
        };

        const savedSettings = loadSettings();
        applySettings(savedSettings);
        initSettingsPanel(savedSettings);
    }

    document.addEventListener('DOMContentLoaded', onDocumentLoad);
})();
