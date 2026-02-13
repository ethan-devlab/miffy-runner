/**
 * Miffy Runner game configuration
 * User-customizable settings
 */
const MiffyConfig = {
    // Background settings
    background: {
        enabled: true,
        // Custom background image path (empty = default gradient)
        // 建議尺寸：600×150 (1x) 或 1200×300 (2x / 視網膜)
        // 若想要更細緻，可用 1800×450，再讓畫面自動縮放
        imagePath: '',
        color: '#87CEEB' // Sky blue
    },

    // Fence settings
    fence: {
        height: 25,
        yOffset: 2,
        scalingFactor: 0.05
    },

    // Season theme
    season: 'spring', // 'spring', 'summer', 'autumn', 'winter'

    // Season palette
    seasons: {
        spring: {
            sky: '#87CEEB',
            skyTop: '#BFE7FF',
            skyBottom: '#FDEBFF',
            horizonGlow: '#FFF6D6',
            ground: '#90EE90',
            groundLine: '#228B22',
            tulipColors: ['#FF6FAE', '#FF8BC6', '#FF4F8C'],
            tulipPalette: [
                { petal: '#FF6FAE', shadow: '#E64F8E', highlight: '#FFD3E7' },
                { petal: '#FF8BC6', shadow: '#E66BA6', highlight: '#FFE0F0' },
                { petal: '#FF4F8C', shadow: '#D63B6E', highlight: '#FFC2DB' }
            ],
            cloudColor: '#FFFFFF',
            decorations: ['🌸', '🌷', '🐝'],
            fallingDecorations: ['🌸'], // 飘落的樱花
            flyingDecorations: ['bird', 'bee', 'butterfly'],
            hills: ['#A7E6C2', '#7CD4A3', '#57BF86']
        },
        summer: {
            sky: '#00BFFF',
            skyTop: '#9EEBFF',
            skyBottom: '#FFF3C6',
            horizonGlow: '#FFE9A8',
            ground: '#9ACD32',
            groundLine: '#006400',
            tulipColors: ['#FFB347', '#FF7F50', '#FF6B6B'],
            tulipPalette: [
                { petal: '#FFB347', shadow: '#E79B34', highlight: '#FFE2B0' },
                { petal: '#FF7F50', shadow: '#E8653A', highlight: '#FFD4C2' },
                { petal: '#FF6B6B', shadow: '#E65252', highlight: '#FFD1D1' }
            ],
            cloudColor: '#FFFFFF',
            decorations: ['🌻', '☀️', '🦋'],
            fallingDecorations: [],
            flyingDecorations: ['butterfly', 'bee', 'bird'],
            hills: ['#9ED06E', '#78B955', '#4EA03F']
        },
        autumn: {
            sky: '#F4C98B',
            skyTop: '#FFE2B8',
            skyBottom: '#FFF3DB',
            horizonGlow: '#FFE9C4',
            ground: '#E6A556',
            groundLine: '#C56A2A',
            tulipColors: ['#FF8C42', '#E84A5F', '#C0392B'],
            tulipPalette: [
                { petal: '#FF8C42', shadow: '#E0702C', highlight: '#FFD4AD' },
                { petal: '#E84A5F', shadow: '#C8374D', highlight: '#FFC2CB' },
                { petal: '#C0392B', shadow: '#A02E22', highlight: '#F3B8B1' }
            ],
            cloudColor: '#FFF1D8',
            decorations: ['🍂', '🍁', '🌰'],
            fallingDecorations: ['🍂', '🍁'], // 飘落的枫叶
            flyingDecorations: ['bird', 'squirrel'],
            hills: ['#F2C88F', '#E5A96A', '#CF8A46']
        },
        winter: {
            sky: '#B0C4DE',
            skyTop: '#DCEBFF',
            skyBottom: '#F5F8FF',
            horizonGlow: '#FFFFFF',
            ground: '#FFFAFA',
            groundLine: '#708090',
            tulipColors: ['#D7E4FF', '#C7B8FF', '#B28DFF'],
            tulipPalette: [
                { petal: '#D7E4FF', shadow: '#B7C8F2', highlight: '#F4F8FF' },
                { petal: '#C7B8FF', shadow: '#A79AE8', highlight: '#ECE3FF' },
                { petal: '#B28DFF', shadow: '#9272E6', highlight: '#E7D7FF' }
            ],
            cloudColor: '#F0F8FF',
            decorations: ['❄️', '⛄', '🎄'],
            fallingDecorations: ['❄️'], // 飘落的雪花
            flyingDecorations: ['bird'],
            hills: ['#DCE6F2', '#C5D4E6', '#A9BDD4']
        }
    },

    // Difficulty settings
    difficulty: {
        initialSpeed: 6,
        maxSpeed: 13,
        acceleration: 0.0001,
        speedMultiplier: 1
    },

    // Sound settings (Web Audio API)
    sounds: {
        enabled: true,
        volume: 0.3
    },

    // View settings
    view: {
        width: 600,
        height: 150,
        groundHeight: 20,
        scale: 1.5
    },

    // Character settings
    character: {
        width: 40,
        height: 50,
        duckHeight: 30,
        startX: 50,
        frameInterval: 100,
        jumpDuration: 520,
        jumpHeight: 65,
        speedDropRatio: 0.85
    },

    // Performance tweaks
    performance: {
        targetFps: 60,
        maxDeltaTime: 34, // ms, avoid giant frame spikes
        enableBackgroundCache: true,
        enableParticles: true,
        maxParticles: 160,
        contextAttributes: {
            alpha: false
        }
    },

    // Obstacle & spawn settings
    obstacles: {
        baseInterval: 1650,
        minInterval: 850,
        speedIntervalFactor: 50,
        minSpeedForBear: 6,
        minSpeedForButterfly: 8,
        spawnChances: {
            bear: 0.2,
            butterfly: 0.18,
            tulipCluster: 0.32
        },
        tulipCluster: {
            minCount: 2,
            maxCount: 4,
            spacing: 6.5,
            largeChance: 0.4
        },
        singleTulipLargeChance: 0.5,
        // Early game tuning to avoid too-wide tulip clusters
        earlyGameDurationMs: 20000,
        earlyGameMaxClusterCount: 2,
        earlyGameSmallOnly: true,
        earlyGameLargeChance: 0.15,
        earlyGameSingleTulipLargeChance: 0.2,
        earlyGameClusterSpacing: 4.5
    },

    // Environment spawns
    clouds: {
        initialCount: 3,
        maxCount: 5,
        spawnIntervalMs: 3000
    },

    decorations: {
        maxCount: 8,
        spawnIntervalMs: 2000,
        fallingMaxCount: 12,
        fallingSpawnIntervalMs: 1500
    },

    // Collectibles
    collectibles: {
        heartMinIntervalMs: 4000,
        heartMaxIntervalMs: 9000,
        maxHearts: 3,
        cakeStartScore: 1000,
        cakeMinIntervalMs: 12000,
        cakeMaxIntervalMs: 20000,
        maxCakes: 2
    },

    // Photo wall settings
    photoWall: {
        enabled: true,
        images: [
            // Add your image paths here, e.g. 'assets/miffy/photo-1.jpg'
            'assets/miffy/IMG_4187.jpg',
        ],
        showIntervalMinMs: 3000,
        showIntervalMaxMs: 6000,
        visibleMinMs: 12000,
        visibleMaxMs: 16000,
        nextShowMinMs: 4000,
        nextShowMaxMs: 7000,
        frameCountMin: 4,
        frameCountMax: 6,
        frameXPadding: 40,
        frameYMin: 0,
        frameYMax: 10,
        frameWidth: 46,
        frameHeight: 34
    }
};
