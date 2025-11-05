// ============================================
// DEBUG PANEL SYSTEM
// ============================================

const DebugPanel = {
    logs: [],
    currentFilter: 'all',
    selectedLogs: new Set(),

    init() {
        const panel = document.getElementById('debug-panel');
        const toggleBtn = document.getElementById('debug-toggle');
        const closeBtn = document.getElementById('debug-close');
        const clearBtn = document.getElementById('debug-clear');
        const copyAllBtn = document.getElementById('debug-copy-all');
        const logsContainer = document.getElementById('debug-logs');

        // Toggle panel visibility
        toggleBtn?.addEventListener('click', () => {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'flex';
        });

        closeBtn?.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        // Filter tabs
        document.querySelectorAll('.debug-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.debug-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.render();
            });
        });

        // Clear logs
        clearBtn?.addEventListener('click', () => {
            this.logs = [];
            this.selectedLogs.clear();
            this.render();
        });

        // Copy all visible logs
        copyAllBtn?.addEventListener('click', () => {
            this.copyFilteredLogs();
        });

        // Context menu for log entries
        logsContainer?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const logEntry = e.target.closest('.debug-log-entry');
            if (logEntry) {
                this.showContextMenu(e.clientX, e.clientY, logEntry);
            }
        });

        // Log selection
        logsContainer?.addEventListener('click', (e) => {
            const logEntry = e.target.closest('.debug-log-entry');
            if (logEntry && e.ctrlKey) {
                const index = parseInt(logEntry.dataset.index);
                if (this.selectedLogs.has(index)) {
                    this.selectedLogs.delete(index);
                    logEntry.classList.remove('selected');
                } else {
                    this.selectedLogs.add(index);
                    logEntry.classList.add('selected');
                }
            }
        });

        // Intercept console methods
        this.interceptConsole();
    },

    interceptConsole() {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        console.log = (...args) => {
            this.addLog('info', args.join(' '));
            originalLog.apply(console, args);
        };

        console.warn = (...args) => {
            this.addLog('warning', args.join(' '));
            originalWarn.apply(console, args);
        };

        console.error = (...args) => {
            this.addLog('error', args.join(' '));
            originalError.apply(console, args);
        };

        console.info = (...args) => {
            this.addLog('info', args.join(' '));
            originalInfo.apply(console, args);
        };
    },

    addLog(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.push({ type, message, timestamp });

        // Keep only last 1000 logs
        if (this.logs.length > 1000) {
            this.logs.shift();
        }

        this.render();
    },

    render() {
        const logsContainer = document.getElementById('debug-logs');
        if (!logsContainer) return;

        const filteredLogs = this.currentFilter === 'all'
            ? this.logs
            : this.logs.filter(log => log.type === this.currentFilter);

        logsContainer.innerHTML = filteredLogs.map((log, index) => `
            <div class="debug-log-entry log-${log.type}" data-index="${index}">
                <span class="debug-log-timestamp">${log.timestamp}</span>
                <span>${log.message}</span>
            </div>
        `).join('');
    },

    showContextMenu(x, y, logEntry) {
        // Remove existing context menu
        document.querySelectorAll('.debug-context-menu').forEach(el => el.remove());

        const menu = document.createElement('div');
        menu.className = 'debug-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        menu.innerHTML = `
            <div class="debug-context-menu-item" data-action="copy-single">Copy This Log</div>
            <div class="debug-context-menu-item" data-action="copy-selected">Copy Selected (${this.selectedLogs.size})</div>
            <div class="debug-context-menu-divider"></div>
            <div class="debug-context-menu-item" data-action="copy-filter">Copy All ${this.currentFilter === 'all' ? '' : this.currentFilter.charAt(0).toUpperCase() + this.currentFilter.slice(1)} Logs</div>
            <div class="debug-context-menu-item" data-action="copy-all">Copy All Logs</div>
        `;

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const index = parseInt(logEntry.dataset.index);

            if (action === 'copy-single') {
                this.copyLog(index);
            } else if (action === 'copy-selected') {
                this.copySelectedLogs();
            } else if (action === 'copy-filter') {
                this.copyFilteredLogs();
            } else if (action === 'copy-all') {
                this.copyAllLogs();
            }

            menu.remove();
        });

        document.body.appendChild(menu);

        // Close menu on click outside
        setTimeout(() => {
            document.addEventListener('click', () => menu.remove(), { once: true });
        }, 100);
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    copyLog(index) {
        const log = this.logs[index];
        navigator.clipboard.writeText(`[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`);
        this.showToast('✓ Log copied to clipboard');
    },

    copySelectedLogs() {
        const selected = Array.from(this.selectedLogs)
            .map(index => {
                const log = this.logs[index];
                return `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`;
            })
            .join('\n');
        navigator.clipboard.writeText(selected);
        this.showToast(`✓ ${this.selectedLogs.size} logs copied to clipboard`);
    },

    copyFilteredLogs() {
        const filtered = (this.currentFilter === 'all' ? this.logs : this.logs.filter(log => log.type === this.currentFilter))
            .map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`)
            .join('\n');
        navigator.clipboard.writeText(filtered);
        const count = this.currentFilter === 'all' ? this.logs.length : this.logs.filter(log => log.type === this.currentFilter).length;
        this.showToast(`✓ ${count} logs copied to clipboard`);
    },

    copyAllLogs() {
        const all = this.logs.map(log => `[${log.timestamp}] ${log.type.toUpperCase()}: ${log.message}`).join('\n');
        navigator.clipboard.writeText(all);
        this.showToast(`✓ All ${this.logs.length} logs copied to clipboard`);
    }
};

// Initialize debug panel when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => DebugPanel.init());
} else {
    DebugPanel.init();
}

console.log('VideoVault Tauri Test - Initializing...');

// Wait for PixiJS to load from CDN
function waitForPixi() {
    return new Promise((resolve) => {
        if (window.PIXI) {
            resolve();
        } else {
            const checkPixi = setInterval(() => {
                if (window.PIXI) {
                    clearInterval(checkPixi);
                    resolve();
                }
            }, 100);
        }
    });
}

// Main initialization
async function init() {
    console.log('[INIT] Step 1: Waiting for PixiJS to load...');
    await waitForPixi();
    console.log('[INIT] Step 2: PixiJS loaded!');

    // ============================================
    // PIXI APPLICATION SETUP
    // ============================================

    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a1a,
        backgroundAlpha: 0,
        antialias: false,  // Disable for better performance
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance',
        transparent: true
    });

    document.getElementById('pixi-container').appendChild(app.view);

    console.log('PixiJS initialized:', {
        renderer: app.renderer.type,
        resolution: app.renderer.resolution,
        width: app.renderer.width,
        height: app.renderer.height
    });

    // ============================================
    // VIEWPORT WITH SMOOTH SCROLLING
    // ============================================

    const viewport = new PIXI.Container();
    app.stage.addChild(viewport);

    let viewportY = 0;
    let targetViewportY = 0;
    const scrollSpeed = 0.15; // Smooth interpolation

    // ============================================
    // THUMBNAIL GRID SETTINGS
    // ============================================

    const THUMBNAIL_SPACING = 10; // Tight gaps between cards
    const MARGIN_HORIZONTAL = 8; // 8px total outer margins
    const TOOLBAR_HEIGHT = 150; // Compact toolbar + filter panel + banner spacing
    const SCROLLBAR_WIDTH = 12;
    const SIDE_MARGIN = 12;

    // Dynamic column count based on orientation
    let COLUMNS = 3;

    // Dynamic thumbnail sizes calculated based on window width
    let THUMBNAIL_WIDTH_LANDSCAPE = 320;
    let THUMBNAIL_HEIGHT_LANDSCAPE = 180;
    let THUMBNAIL_WIDTH_PORTRAIT = 180;
    let THUMBNAIL_HEIGHT_PORTRAIT = 320;
    let THUMBNAIL_WIDTH_SQUARE = 240;
    let THUMBNAIL_HEIGHT_SQUARE = 240;
    let THUMBNAIL_WIDTH_PANORAMA = 480;
    let THUMBNAIL_HEIGHT_PANORAMA = 200;

    let thumbnails = [];
    let filteredThumbnails = []; // Filtered based on orientation
    let spritePool = new Map(); // Reusable sprite pool for culling
    let currentOrientation = 'all';
    let portraitColumns = 3;

    // Image loading optimization - limit concurrent loads
    const MAX_CONCURRENT_LOADS = 20;
    let currentlyLoadingImages = 0;
    const imageLoadQueue = [];

    // Pre-create ONE white texture for maximum batching (tint for colors)
    const cardTextures = {};
    function createCardTexture(width, height) {
        const key = `${width}x${height}`;
        if (cardTextures[key]) return cardTextures[key];

        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xffffff);  // White - will be tinted
        graphics.drawRect(0, 0, width, height);
        graphics.endFill();

        const texture = app.renderer.generateTexture(graphics);
        cardTextures[key] = texture;
        graphics.destroy();
        return texture;
    }

    // Function to load thumbnail image with queue management
    function loadThumbnailImage(sprite) {
        if (currentlyLoadingImages >= MAX_CONCURRENT_LOADS) {
            // Queue for later
            imageLoadQueue.push(sprite);
            return;
        }

        currentlyLoadingImages++;

        const texture = PIXI.Texture.from(sprite.imageUrl, {
            resourceOptions: {
                crossOrigin: 'anonymous'
            }
        });

        texture.baseTexture.on('loaded', () => {
            if (sprite.thumbSprite) {
                sprite.thumbSprite.texture = texture;
                sprite.thumbSprite.alpha = 1;
                if (sprite.placeholder) {
                    sprite.placeholder.alpha = 0;
                }
            }
            currentlyLoadingImages--;
            processImageQueue();
        });

        texture.baseTexture.on('error', () => {
            currentlyLoadingImages--;
            processImageQueue();
        });
    }

    // Process queued image loads
    function processImageQueue() {
        while (imageLoadQueue.length > 0 && currentlyLoadingImages < MAX_CONCURRENT_LOADS) {
            const sprite = imageLoadQueue.shift();
            if (sprite && sprite.visible) {
                loadThumbnailImage(sprite);
            }
        }
    }

    // ============================================
    // DYNAMIC THUMBNAIL SIZE CALCULATION
    // ============================================

    function calculateThumbnailSizes() {
        // Calculate available width for the grid
        const availableWidth = window.innerWidth - SIDE_MARGIN - SCROLLBAR_WIDTH;

        // Calculate thumbnail width to fit current COLUMNS with spacing
        const totalGapWidth = (COLUMNS - 1) * THUMBNAIL_SPACING;
        const calculatedWidth = Math.floor((availableWidth - totalGapWidth) / COLUMNS);

        // For landscape (16:9 aspect ratio) - width fills column
        THUMBNAIL_WIDTH_LANDSCAPE = calculatedWidth;
        THUMBNAIL_HEIGHT_LANDSCAPE = Math.floor(calculatedWidth * 9 / 16);

        // For portrait - width fills column, height varies by column count
        // 2 columns: more compact (1.25:1 ratio)
        // 3-4 columns: moderately taller (1.4:1 ratio)
        THUMBNAIL_WIDTH_PORTRAIT = calculatedWidth;
        if (COLUMNS === 2) {
            THUMBNAIL_HEIGHT_PORTRAIT = Math.floor(calculatedWidth * 1.25);
        } else {
            THUMBNAIL_HEIGHT_PORTRAIT = Math.floor(calculatedWidth * 1.4);
        }

        // For square (1:1 aspect ratio) - width fills column
        THUMBNAIL_WIDTH_SQUARE = calculatedWidth;
        THUMBNAIL_HEIGHT_SQUARE = calculatedWidth;

        // For panorama (wider aspect, ~2.4:1) - width fills column
        THUMBNAIL_WIDTH_PANORAMA = calculatedWidth;
        THUMBNAIL_HEIGHT_PANORAMA = Math.floor(calculatedWidth * 10 / 24);

        console.log('=== DYNAMIC THUMBNAIL SIZES ===');
        console.log('Columns:', COLUMNS);
        console.log('Window width:', window.innerWidth);
        console.log('Available width:', availableWidth);
        console.log('Calculated column width:', calculatedWidth);
        console.log('Landscape:', THUMBNAIL_WIDTH_LANDSCAPE, 'x', THUMBNAIL_HEIGHT_LANDSCAPE);
        console.log('Portrait:', THUMBNAIL_WIDTH_PORTRAIT, 'x', THUMBNAIL_HEIGHT_PORTRAIT);
        console.log('Square:', THUMBNAIL_WIDTH_SQUARE, 'x', THUMBNAIL_HEIGHT_SQUARE);
        console.log('Panorama:', THUMBNAIL_WIDTH_PANORAMA, 'x', THUMBNAIL_HEIGHT_PANORAMA);
        console.log('===============================');
    }

    // Calculate initial sizes
    calculateThumbnailSizes();

    // ============================================
    // THUMBNAIL RENDERING
    // ============================================

    function createThumbnailSprite(data, x, y) {
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;

        // Determine dimensions based on orientation
        let thumbWidth, thumbHeight;
        if (data.orientation === 'portrait') {
            thumbWidth = THUMBNAIL_WIDTH_PORTRAIT;
            thumbHeight = THUMBNAIL_HEIGHT_PORTRAIT;
        } else if (data.orientation === 'square') {
            thumbWidth = THUMBNAIL_WIDTH_SQUARE;
            thumbHeight = THUMBNAIL_HEIGHT_SQUARE;
        } else if (data.orientation === 'panorama') {
            thumbWidth = THUMBNAIL_WIDTH_PANORAMA;
            thumbHeight = THUMBNAIL_HEIGHT_PANORAMA;
        } else {
            thumbWidth = THUMBNAIL_WIDTH_LANDSCAPE;
            thumbHeight = THUMBNAIL_HEIGHT_LANDSCAPE;
        }

        // MAXIMUM BATCHING: One texture + tinting for colors
        const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];
        const color = colors[data.id % colors.length];

        // All sprites share ONE texture, tinted for color (perfect batching!)
        const texture = createCardTexture(thumbWidth, thumbHeight);
        const sprite = new PIXI.Sprite(texture);
        sprite.tint = color;  // Tint the white texture
        container.addChild(sprite);

        // SKIP EVERYTHING ELSE FOR FPS TESTING
        return container;

        // Top corner badges - interactive and translucent by default
        const badgeY = 8;
        const badgeWidth = 80;  // A third bigger (60 * 1.33 = 80)
        const badgeHeight = 26;

        // Track badge selection state (starts as null = unselected)
        let selectedBadge = null; // 'sfw' or 'nsfw' or null

        // SFW badge - top LEFT corner (green, translucent by default)
        const sfwBadgeContainer = new PIXI.Container();
        sfwBadgeContainer.x = 8;
        sfwBadgeContainer.y = badgeY;
        sfwBadgeContainer.interactive = true;
        sfwBadgeContainer.buttonMode = true;

        const sfwBadge = new PIXI.Graphics();
        sfwBadge.lineStyle(2, 0xffffff, 0.4);  // White border for contrast
        sfwBadge.beginFill(0x10b981, 0.3);  // Green with 30% opacity (transparent)
        sfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
        sfwBadge.endFill();
        sfwBadgeContainer.addChild(sfwBadge);

        const sfwText = new PIXI.Text('SFW', {
            fontSize: 12,
            fill: 0xffffff,
            fontFamily: 'Arial, sans-serif',
            fontWeight: '500'
        });
        sfwText.anchor.set(0.5);
        sfwText.x = badgeWidth / 2;
        sfwText.y = badgeHeight / 2;
        sfwBadgeContainer.addChild(sfwText);

        container.addChild(sfwBadgeContainer);

        // NSFW badge - top RIGHT corner (red, translucent by default)
        const nsfwBadgeContainer = new PIXI.Container();
        nsfwBadgeContainer.x = thumbWidth - badgeWidth - 8;
        nsfwBadgeContainer.y = badgeY;
        nsfwBadgeContainer.interactive = true;
        nsfwBadgeContainer.buttonMode = true;

        const nsfwBadge = new PIXI.Graphics();
        nsfwBadge.lineStyle(2, 0xffffff, 0.4);  // White border for contrast
        nsfwBadge.beginFill(0xef4444, 0.3);  // Red with 30% opacity (transparent)
        nsfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
        nsfwBadge.endFill();
        nsfwBadgeContainer.addChild(nsfwBadge);

        const nsfwText = new PIXI.Text('NSFW', {
            fontSize: 11,
            fill: 0xffffff,
            fontFamily: 'Arial, sans-serif',
            fontWeight: '500'
        });
        nsfwText.anchor.set(0.5);
        nsfwText.x = badgeWidth / 2;
        nsfwText.y = badgeHeight / 2;
        nsfwBadgeContainer.addChild(nsfwText);

        container.addChild(nsfwBadgeContainer);

        // Badge click handlers - make selected badge saturated
        sfwBadgeContainer.on('pointertap', (e) => {
            e.stopPropagation(); // Don't trigger card click

            if (selectedBadge === 'sfw') {
                // Deselect
                selectedBadge = null;
                sfwBadge.clear();
                sfwBadge.lineStyle(2, 0xffffff, 0.4);
                sfwBadge.beginFill(0x10b981, 0.3);
                sfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
                sfwBadge.endFill();
            } else {
                // Select SFW, deselect NSFW
                selectedBadge = 'sfw';
                sfwBadge.clear();
                sfwBadge.lineStyle(2, 0xffffff, 0.8);  // Brighter border when selected
                sfwBadge.beginFill(0x10b981, 1.0);  // Full opacity (saturated)
                sfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
                sfwBadge.endFill();

                // Deselect NSFW
                nsfwBadge.clear();
                nsfwBadge.lineStyle(2, 0xffffff, 0.4);
                nsfwBadge.beginFill(0xef4444, 0.3);
                nsfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
                nsfwBadge.endFill();
            }
            console.log('SFW badge clicked:', selectedBadge === 'sfw' ? 'SELECTED' : 'DESELECTED');
        });

        nsfwBadgeContainer.on('pointertap', (e) => {
            e.stopPropagation(); // Don't trigger card click

            if (selectedBadge === 'nsfw') {
                // Deselect
                selectedBadge = null;
                nsfwBadge.clear();
                nsfwBadge.lineStyle(2, 0xffffff, 0.4);
                nsfwBadge.beginFill(0xef4444, 0.3);
                nsfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
                nsfwBadge.endFill();
            } else {
                // Select NSFW, deselect SFW
                selectedBadge = 'nsfw';
                nsfwBadge.clear();
                nsfwBadge.lineStyle(2, 0xffffff, 0.8);  // Brighter border when selected
                nsfwBadge.beginFill(0xef4444, 1.0);  // Full opacity (saturated)
                nsfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
                nsfwBadge.endFill();

                // Deselect SFW
                sfwBadge.clear();
                sfwBadge.lineStyle(2, 0xffffff, 0.4);
                sfwBadge.beginFill(0x10b981, 0.3);
                sfwBadge.drawRoundedRect(0, 0, badgeWidth, badgeHeight, 13);
                sfwBadge.endFill();
            }
            console.log('NSFW badge clicked:', selectedBadge === 'nsfw' ? 'SELECTED' : 'DESELECTED');
        });

        // Optimized overlay background - simpler approach without expensive gradients
        if (currentOrientation === 'portrait' && (COLUMNS === 2 || COLUMNS === 3)) {
            // Portrait 2-3 column: Solid dark background in center
            const overlayHeight = 80;
            const overlayY = (thumbHeight - overlayHeight) / 2;
            const centeredOverlay = new PIXI.Graphics();
            centeredOverlay.beginFill(0x000000, 0.85);
            centeredOverlay.drawRoundedRect(3, overlayY, thumbWidth - 6, overlayHeight, 0);
            centeredOverlay.endFill();
            container.addChild(centeredOverlay);
        } else {
            // All other modes: Simple bottom overlay (no expensive multi-layer gradient)
            const overlayHeight = 60;
            const overlayY = thumbHeight - overlayHeight - 3;
            const bottomOverlay = new PIXI.Graphics();
            bottomOverlay.beginFill(0x000000, 0.75);  // Single solid overlay instead of 20-layer gradient
            bottomOverlay.drawRoundedRect(3, overlayY, thumbWidth - 6, overlayHeight, 0);
            bottomOverlay.endFill();
            container.addChild(bottomOverlay);
        }

        // Filename text styling depends on portrait mode
        const textPadding = 12;
        const textAreaWidth = thumbWidth - textPadding * 2;

        let filename;
        if (currentOrientation === 'portrait' && (COLUMNS === 2 || COLUMNS === 3)) {
            // Portrait 2-3 column: Centered cyan title (matching old app)
            filename = new PIXI.Text(data.title, {
                fontSize: 16,  // 1rem
                fill: 0x00d9ff,  // #00D9FF cyan
                fontFamily: 'Arial Black, Arial Bold, sans-serif',
                fontWeight: '900',
                wordWrap: true,
                wordWrapWidth: textAreaWidth,
                align: 'center'
            });
            filename.anchor.set(0.5, 0.5);
            filename.x = thumbWidth / 2;
            filename.y = thumbHeight / 2;
        } else {
            // Default: White text at bottom
            filename = new PIXI.Text(data.title, {
                fontSize: 12,  // 0.75rem
                fill: 0xffffff,  // White
                fontFamily: 'Arial, sans-serif',
                fontWeight: '500',
                wordWrap: true,
                wordWrapWidth: textAreaWidth,
                lineHeight: 16
            });
            filename.x = textPadding;
            filename.y = thumbHeight - 8 - filename.height;  // 8px from bottom
        }
        container.addChild(filename);

        // Hover effect matching old application
        container.interactive = true;
        container.buttonMode = true;
        container.on('pointerover', () => {
            bg.clear();
            bg.lineStyle(3, 0x8b5cf6, 0);
            bg.beginFill(0x8b5cf6, 0.6);  // rgba(139, 92, 246, 0.6) on hover
            bg.drawRoundedRect(0, 0, thumbWidth, thumbHeight, 16);
            bg.endFill();
        });
        container.on('pointerout', () => {
            bg.clear();
            bg.lineStyle(3, 0x8b5cf6, 0);
            bg.beginFill(0x8b5cf6, 0.4);  // rgba(139, 92, 246, 0.4) default
            bg.drawRoundedRect(0, 0, thumbWidth, thumbHeight, 16);
            bg.endFill();
        });
        container.on('pointertap', () => {
            console.log('Clicked:', data.title, data.file_path);
            updateStats();
        });

        return container;
    }

    // ============================================
    // LOAD THUMBNAILS
    // ============================================

    function applyFilters() {
        // Filter by orientation
        if (currentOrientation === 'portrait') {
            filteredThumbnails = thumbnails.filter(t => t.orientation === 'portrait');
            COLUMNS = portraitColumns; // Use selected portrait column count (2, 3, or 4)
        } else if (currentOrientation === 'landscape') {
            filteredThumbnails = thumbnails.filter(t => t.orientation === 'landscape');
            COLUMNS = 3; // Always 3 for landscape
        } else if (currentOrientation === 'square') {
            filteredThumbnails = thumbnails.filter(t => t.orientation === 'square');
            COLUMNS = 4; // 4 columns for square (2 rows of 4 = 8 visible)
        } else if (currentOrientation === 'panorama') {
            filteredThumbnails = thumbnails.filter(t => t.orientation === 'panorama');
            COLUMNS = 3; // Always 3 for panorama
        } else {
            filteredThumbnails = thumbnails;
            COLUMNS = 3; // Always 3 for "all" mode (will fix later)
        }

        // Recalculate thumbnail sizes for current window width
        calculateThumbnailSizes();

        // Clear sprite pool and re-render
        spritePool.forEach(sprite => sprite.destroy());
        spritePool.clear();
        viewport.removeChildren();

        viewportY = 0;
        targetViewportY = 0;
        viewport.y = 0;

        updateStats();
        updateVisibleSprites();
        updateScrollbar();

        console.log(`Filtered: ${filteredThumbnails.length} / ${thumbnails.length} (${currentOrientation}, ${COLUMNS} cols)`);
    }

    async function loadThumbnails(count) {
        console.log(`Loading ${count} thumbnails...`);

        // Clear existing
        spritePool.forEach(sprite => sprite.destroy());
        spritePool.clear();
        viewport.removeChildren();

        // Get mock data from Tauri backend
        try {
            const invoke = window.__TAURI__?.tauri?.invoke || window.__TAURI_INVOKE__;
            thumbnails = await invoke('get_mock_thumbnails', { count });
        } catch (err) {
            console.warn('Tauri invoke failed, using local mock:', err);
            thumbnails = Array.from({ length: count }, (_, i) => {
                let orientation;
                const rand = i % 5;
                if (rand === 0) orientation = 'portrait';
                else if (rand === 1) orientation = 'square';
                else if (rand === 2) orientation = 'panorama';
                else orientation = 'landscape';

                return {
                    id: i,
                    title: `Video_${String(i).padStart(5, '0')}`,
                    width: 320,
                    height: 180,
                    orientation: orientation,
                    tags: ['test', 'mock'],
                    file_path: `C:\\Videos\\video_${String(i).padStart(5, '0')}.mp4`
                };
            });
        }

        // Apply current filters
        applyFilters();
    }

    // ============================================
    // VIEWPORT CULLING - Only render visible items
    // ============================================

    // Track previous visible range to optimize visibility updates
    let prevFirstVisibleIndex = -1;
    let prevLastVisibleIndex = -1;

    function updateVisibleSprites() {
        if (filteredThumbnails.length === 0) return;

        // Calculate row height based on current orientation
        // Card height = thumbnail height (metadata is overlaid)
        let cardHeight;
        if (currentOrientation === 'portrait') {
            cardHeight = THUMBNAIL_HEIGHT_PORTRAIT;
        } else if (currentOrientation === 'square') {
            cardHeight = THUMBNAIL_HEIGHT_SQUARE;
        } else if (currentOrientation === 'panorama') {
            cardHeight = THUMBNAIL_HEIGHT_PANORAMA;
        } else if (currentOrientation === 'landscape') {
            cardHeight = THUMBNAIL_HEIGHT_LANDSCAPE;
        } else {
            // For "all" mode, use portrait height (tallest)
            cardHeight = THUMBNAIL_HEIGHT_PORTRAIT;
        }

        // Row height = card height + vertical spacing (10px, same as horizontal)
        const rowHeight = cardHeight + THUMBNAIL_SPACING;

        // Calculate grid width based on current mode
        let gridWidth;
        if (currentOrientation === 'portrait') {
            gridWidth = COLUMNS * THUMBNAIL_WIDTH_PORTRAIT + (COLUMNS - 1) * THUMBNAIL_SPACING;
        } else if (currentOrientation === 'square') {
            gridWidth = COLUMNS * THUMBNAIL_WIDTH_SQUARE + (COLUMNS - 1) * THUMBNAIL_SPACING;
        } else if (currentOrientation === 'panorama') {
            gridWidth = COLUMNS * THUMBNAIL_WIDTH_PANORAMA + (COLUMNS - 1) * THUMBNAIL_SPACING;
        } else {
            gridWidth = COLUMNS * THUMBNAIL_WIDTH_LANDSCAPE + (COLUMNS - 1) * THUMBNAIL_SPACING;
        }

        // Calculate available space between left margin and scrollbar
        const availableWidth = window.innerWidth - SIDE_MARGIN - SCROLLBAR_WIDTH;

        // Center the grid within the available space
        const startX = SIDE_MARGIN + Math.max(0, (availableWidth - gridWidth) / 2);
        const startY = TOOLBAR_HEIGHT;

        // Calculate visible range with buffer
        const scrollY = -viewportY;
        const viewportHeight = window.innerHeight;
        const bufferRows = 0; // NO buffer - only render exactly what's visible for max FPS

        const firstVisibleRow = Math.max(0, Math.floor(scrollY / rowHeight) - bufferRows);
        const lastVisibleRow = Math.min(
            Math.ceil(filteredThumbnails.length / COLUMNS),
            Math.ceil((scrollY + viewportHeight) / rowHeight) + bufferRows
        );

        const firstVisibleIndex = firstVisibleRow * COLUMNS;
        const lastVisibleIndex = Math.min(filteredThumbnails.length, lastVisibleRow * COLUMNS);

        // Only update visibility if range changed (optimization!)
        if (firstVisibleIndex !== prevFirstVisibleIndex || lastVisibleIndex !== prevLastVisibleIndex) {
            // Hide sprites that are no longer visible
            if (prevFirstVisibleIndex !== -1) {
                // Hide sprites before new visible range
                for (let i = prevFirstVisibleIndex; i < Math.min(firstVisibleIndex, prevLastVisibleIndex); i++) {
                    const sprite = spritePool.get(i);
                    if (sprite) sprite.visible = false;
                }
                // Hide sprites after new visible range
                for (let i = Math.max(lastVisibleIndex, prevFirstVisibleIndex); i < prevLastVisibleIndex; i++) {
                    const sprite = spritePool.get(i);
                    if (sprite) sprite.visible = false;
                }
            }

            // Show/create sprites in visible range
            for (let index = firstVisibleIndex; index < lastVisibleIndex; index++) {
                if (index >= filteredThumbnails.length) break;

                let sprite = spritePool.get(index);

                if (!sprite) {
                    // Create new sprite
                    const data = filteredThumbnails[index];
                    const col = index % COLUMNS;
                    const row = Math.floor(index / COLUMNS);

                    let thumbWidth;
                    if (data.orientation === 'portrait') thumbWidth = THUMBNAIL_WIDTH_PORTRAIT;
                    else if (data.orientation === 'square') thumbWidth = THUMBNAIL_WIDTH_SQUARE;
                    else if (data.orientation === 'panorama') thumbWidth = THUMBNAIL_WIDTH_PANORAMA;
                    else thumbWidth = THUMBNAIL_WIDTH_LANDSCAPE;

                    const x = startX + col * (thumbWidth + THUMBNAIL_SPACING);
                    const y = startY + row * rowHeight;

                    sprite = createThumbnailSprite(data, x, y);
                    viewport.addChild(sprite);
                    spritePool.set(index, sprite);
                } else {
                    sprite.visible = true;
                }
            }

            // Update previous range
            prevFirstVisibleIndex = firstVisibleIndex;
            prevLastVisibleIndex = lastVisibleIndex;
        }
    }

    // ============================================
    // SMOOTH SCROLLING
    // ============================================

    const contentHeight = () => {
        if (filteredThumbnails.length === 0) return 0;
        const rows = Math.ceil(filteredThumbnails.length / COLUMNS);

        // Calculate card height based on current orientation (metadata is overlaid)
        let cardHeight;
        if (currentOrientation === 'portrait') {
            cardHeight = THUMBNAIL_HEIGHT_PORTRAIT;
        } else if (currentOrientation === 'square') {
            cardHeight = THUMBNAIL_HEIGHT_SQUARE;
        } else if (currentOrientation === 'panorama') {
            cardHeight = THUMBNAIL_HEIGHT_PANORAMA;
        } else if (currentOrientation === 'landscape') {
            cardHeight = THUMBNAIL_HEIGHT_LANDSCAPE;
        } else {
            // For "all" mode, use portrait height (tallest)
            cardHeight = THUMBNAIL_HEIGHT_PORTRAIT;
        }

        const rowHeight = cardHeight + THUMBNAIL_SPACING;
        return TOOLBAR_HEIGHT + rows * rowHeight + THUMBNAIL_SPACING;
    };

    // ============================================
    // SCROLLBAR INDICATOR
    // ============================================

    function updateScrollbar() {
        const scrollbar = document.getElementById('custom-scrollbar');
        const scrollThumb = document.getElementById('scroll-thumb');

        if (!scrollbar || !scrollThumb) return;

        const totalHeight = contentHeight();
        const viewportHeight = window.innerHeight;

        // Hide scrollbar if content fits in viewport
        if (totalHeight <= viewportHeight) {
            scrollbar.classList.remove('visible');
            return;
        }

        scrollbar.classList.add('visible');

        // Calculate thumb size and position
        const scrollbarHeight = viewportHeight - TOOLBAR_HEIGHT;
        const thumbHeight = Math.max(50, (viewportHeight / totalHeight) * scrollbarHeight);
        const maxScroll = totalHeight - viewportHeight;
        const scrollPercentage = Math.abs(viewportY) / maxScroll;
        const thumbTop = TOOLBAR_HEIGHT + scrollPercentage * (scrollbarHeight - thumbHeight);

        scrollThumb.style.height = thumbHeight + 'px';
        scrollThumb.style.top = thumbTop + 'px';
    }

    window.addEventListener('wheel', (e) => {
        // Allow native scrolling inside debug panel and other scrollable UI elements
        const debugPanel = document.getElementById('debug-logs');
        if (debugPanel && debugPanel.contains(e.target)) {
            return; // Let the debug panel scroll naturally
        }

        e.preventDefault();

        const maxScroll = Math.max(0, contentHeight() - window.innerHeight);
        targetViewportY = Math.max(-maxScroll, Math.min(0, targetViewportY - e.deltaY));
    }, { passive: false });

    // Optimized scroll interpolation - skip when not actively scrolling
    let lastUpdateY = 0;
    let scrollFrameCount = 0;
    app.ticker.add(() => {
        scrollFrameCount++;

        // Only interpolate if there's significant difference (save CPU when idle)
        const diff = Math.abs(targetViewportY - viewportY);
        if (diff > 0.5) {
            viewportY += (targetViewportY - viewportY) * scrollSpeed;
            viewport.y = Math.round(viewportY);

            // Update scrollbar less frequently
            if (scrollFrameCount % 2 === 0) {
                updateScrollbar();
            }
        }

        // Update visible sprites only every 30 frames OR very large position change
        if (scrollFrameCount % 30 === 0 || Math.abs(viewportY - lastUpdateY) > 1500) {
            updateVisibleSprites();
            lastUpdateY = viewportY;
        }
    });

    // ============================================
    // FPS COUNTER WITH STATISTICS
    // ============================================

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    // FPS statistics tracking
    let fpsHistory = [];
    let minFPS = Infinity;
    let maxFPS = 0;
    let avgFPS = 0;
    let efficiency = 0;
    const FPS_HISTORY_SIZE = 60; // Track last 60 readings

    app.ticker.add(() => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
            fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;

            // Update FPS statistics
            fpsHistory.push(fps);
            if (fpsHistory.length > FPS_HISTORY_SIZE) {
                fpsHistory.shift(); // Keep only last 60 readings
            }

            // Calculate min/max
            minFPS = Math.min(minFPS, fps);
            maxFPS = Math.max(maxFPS, fps);

            // Calculate average
            avgFPS = Math.round(fpsHistory.reduce((sum, val) => sum + val, 0) / fpsHistory.length);

            // Calculate efficiency (percentage of how well we maintain 60 FPS)
            efficiency = Math.round((avgFPS / 60) * 100);

            updateStats();
        }
    });

    function updateStats() {
        const showing = filteredThumbnails.length;
        const total = thumbnails.length;

        // Determine efficiency color
        let effColor = '#34d399'; // Green
        if (efficiency < 80) effColor = '#fbbf24'; // Yellow
        if (efficiency < 60) effColor = '#f87171'; // Red

        const itemsText = showing === total
            ? `Items: ${total.toLocaleString()}`
            : `Items: ${showing.toLocaleString()} / ${total.toLocaleString()}`;

        const fpsText = fpsHistory.length < 3
            ? `FPS: ${fps}`
            : `FPS: ${fps} | Min: ${minFPS} | Max: ${maxFPS} | Avg: ${avgFPS} | <span style="color: ${effColor}">Eff: ${efficiency}%</span>`;

        document.getElementById('stats').innerHTML = `${itemsText} | ${fpsText}`;
    }

    // ============================================
    // UI CONTROLS
    // ============================================

    document.getElementById('load-1k').addEventListener('click', () => loadThumbnails(1000));
    document.getElementById('load-10k').addEventListener('click', () => loadThumbnails(10000));
    document.getElementById('load-50k').addEventListener('click', () => loadThumbnails(50000));
    document.getElementById('clear').addEventListener('click', () => loadThumbnails(0));

    // Orientation filter buttons
    document.querySelectorAll('[data-orientation]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from orientation buttons
            document.querySelectorAll('[data-orientation]').forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            e.target.classList.add('active');

            // Update orientation
            currentOrientation = e.target.dataset.orientation;

            if (thumbnails.length > 0) {
                applyFilters();
            }
        });
    });

    // Column count filter buttons
    document.querySelectorAll('[data-columns]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from column buttons
            document.querySelectorAll('[data-columns]').forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            e.target.classList.add('active');

            // Update column count
            portraitColumns = parseInt(e.target.dataset.columns);

            if (thumbnails.length > 0) {
                applyFilters();
            }
        });
    });

    // ============================================
    // WINDOW RESIZE
    // ============================================

    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);

        // Recalculate thumbnail sizes for new window width
        calculateThumbnailSizes();

        // Clear and regenerate sprites with new sizes
        spritePool.forEach(sprite => sprite.destroy());
        spritePool.clear();
        viewport.removeChildren();

        updateVisibleSprites();
        updateScrollbar();
    });

    // ============================================
    // INITIAL LOAD
    // ============================================

    console.log('[INIT] Step 100: App ready. Click "Load 1,000" to start.');
    updateStats();
    console.log('[INIT] COMPLETE - All event handlers attached');
}

// Start the app
console.log('[APP] Starting initialization...');
init().catch(err => {
    console.error('[APP] CRITICAL ERROR - Failed to initialize app:', err);
    console.error('[APP] Error stack:', err.stack);
    document.body.innerHTML = '<div style="color: white; padding: 20px;">Error: ' + err.message + '<br><br>' + err.stack + '</div>';
});
