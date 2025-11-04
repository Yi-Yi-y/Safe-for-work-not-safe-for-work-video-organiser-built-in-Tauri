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
    console.log('Waiting for PixiJS to load...');
    await waitForPixi();
    console.log('PixiJS loaded!');

    // ============================================
    // PIXI APPLICATION SETUP
    // ============================================

    const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a1a,
        backgroundAlpha: 0,
        antialias: true,
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

        // Drop shadow effect (simulated with offset rectangles)
        const shadow1 = new PIXI.Graphics();
        shadow1.beginFill(0x000000, 0.15);
        shadow1.drawRoundedRect(4, 4, thumbWidth, thumbHeight, 14);
        shadow1.endFill();
        container.addChild(shadow1);

        const shadow2 = new PIXI.Graphics();
        shadow2.beginFill(0x000000, 0.15);
        shadow2.drawRoundedRect(3, 3, thumbWidth, thumbHeight, 14);
        shadow2.endFill();
        container.addChild(shadow2);

        const shadow3 = new PIXI.Graphics();
        shadow3.beginFill(0x000000, 0.2);
        shadow3.drawRoundedRect(2, 2, thumbWidth, thumbHeight, 14);
        shadow3.endFill();
        container.addChild(shadow3);

        // Background card with rounded corners and gradient border
        const bg = new PIXI.Graphics();
        bg.lineStyle(2, 0x8b5cf6, 0.8);
        bg.beginFill(0x1f1f1f);
        bg.drawRoundedRect(0, 0, thumbWidth, thumbHeight, 14);
        bg.endFill();
        container.addChild(bg);

        // Mock thumbnail image (colored rectangle with rounded corners)
        const colors = [0x3498db, 0xe74c3c, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];
        const color = colors[data.id % colors.length];

        const thumb = new PIXI.Graphics();
        thumb.beginFill(color);
        thumb.drawRoundedRect(5, 5, thumbWidth - 10, thumbHeight - 10, 10);
        thumb.endFill();
        container.addChild(thumb);

        // Top tag badges with blur effect simulation
        const tagY = 8;
        const tagSpacing = 52;

        // SFW badge
        const sfwBadge = new PIXI.Graphics();
        sfwBadge.beginFill(0x10b981, 0.85);
        sfwBadge.drawRoundedRect(8, tagY, 48, 20, 10);
        sfwBadge.endFill();
        container.addChild(sfwBadge);

        const sfwText = new PIXI.Text('SFW', {
            fontSize: 11,
            fill: 0xffffff,
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 'bold'
        });
        sfwText.x = 20;
        sfwText.y = tagY + 3;
        container.addChild(sfwText);

        // NSFW badge
        const nsfwBadge = new PIXI.Graphics();
        nsfwBadge.beginFill(0xef4444, 0.85);
        nsfwBadge.drawRoundedRect(8 + tagSpacing, tagY, 52, 20, 10);
        nsfwBadge.endFill();
        container.addChild(nsfwBadge);

        const nsfwText = new PIXI.Text('NSFW', {
            fontSize: 11,
            fill: 0xffffff,
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 'bold'
        });
        nsfwText.x = 14 + tagSpacing;
        nsfwText.y = tagY + 3;
        container.addChild(nsfwText);

        // Blank badge
        const blankBadge = new PIXI.Graphics();
        blankBadge.beginFill(0x6b7280, 0.85);
        blankBadge.drawRoundedRect(8 + tagSpacing * 2, tagY, 48, 20, 10);
        blankBadge.endFill();
        container.addChild(blankBadge);

        const blankText = new PIXI.Text('Blank', {
            fontSize: 11,
            fill: 0xffffff,
            fontFamily: 'Segoe UI, sans-serif',
            fontWeight: 'bold'
        });
        blankText.x = 14 + tagSpacing * 2;
        blankText.y = tagY + 3;
        container.addChild(blankText);

        // Glassmorphism overlay position depends on orientation and column count
        const glassHeight = 50;
        let glassY;

        // For portrait mode with 2 or 3 columns: center the text overlay
        // For portrait mode with 4 columns or all other modes: text at bottom
        if (currentOrientation === 'portrait' && (COLUMNS === 2 || COLUMNS === 3)) {
            glassY = (thumbHeight - glassHeight) / 2; // Centered
        } else {
            glassY = thumbHeight - glassHeight - 5; // Bottom
        }

        // Multi-layered glassmorphism effect
        // Layer 1: Darker semi-transparent base
        const glassBase = new PIXI.Graphics();
        glassBase.beginFill(0x000000, 0.35);
        glassBase.drawRoundedRect(5, glassY, thumbWidth - 10, glassHeight, 8);
        glassBase.endFill();
        container.addChild(glassBase);

        // Layer 2: Lighter overlay for glass effect
        const glassOverlay = new PIXI.Graphics();
        glassOverlay.beginFill(0xffffff, 0.08);
        glassOverlay.drawRoundedRect(5, glassY, thumbWidth - 10, glassHeight, 8);
        glassOverlay.endFill();
        container.addChild(glassOverlay);

        // Layer 3: Top edge highlight
        const glassHighlight = new PIXI.Graphics();
        glassHighlight.beginFill(0xffffff, 0.12);
        glassHighlight.drawRoundedRect(5, glassY, thumbWidth - 10, 2, 8);
        glassHighlight.endFill();
        container.addChild(glassHighlight);

        // Calculate text area width (full glass width minus padding)
        const textPadding = 20;
        const textAreaWidth = thumbWidth - textPadding - 10;

        // Filename in cyan with drop shadow - larger font with letter spacing
        const filenameShadow = new PIXI.Text(data.title, {
            fontSize: 18,
            fill: 0x000000,
            fontFamily: 'Consolas, "Courier New", monospace',
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: textAreaWidth,
            letterSpacing: 2 // Add space between characters
        });
        filenameShadow.x = textPadding / 2;
        filenameShadow.y = glassY + 7;
        filenameShadow.alpha = 0.6;
        container.addChild(filenameShadow);

        const filename = new PIXI.Text(data.title, {
            fontSize: 18,
            fill: 0x00ffff, // Bright cyan
            fontFamily: 'Consolas, "Courier New", monospace',
            fontWeight: 'bold',
            wordWrap: true,
            wordWrapWidth: textAreaWidth,
            letterSpacing: 2 // Add space between characters
        });
        filename.x = textPadding / 2 - 1;
        filename.y = glassY + 6;
        container.addChild(filename);

        // Additional metadata with drop shadow - larger font
        const metadataText = `${data.file_path.split('\\').pop()}`;
        const metadataShadow = new PIXI.Text(metadataText, {
            fontSize: 13,
            fill: 0x000000,
            fontFamily: 'Consolas, "Courier New", monospace',
            wordWrap: true,
            wordWrapWidth: textAreaWidth
        });
        metadataShadow.x = textPadding / 2;
        metadataShadow.y = glassY + 29;
        metadataShadow.alpha = 0.6;
        container.addChild(metadataShadow);

        const metadata = new PIXI.Text(metadataText, {
            fontSize: 13,
            fill: 0x66ffff, // Light cyan
            fontFamily: 'Consolas, "Courier New", monospace',
            wordWrap: true,
            wordWrapWidth: textAreaWidth
        });
        metadata.x = textPadding / 2 - 1;
        metadata.y = glassY + 28;
        container.addChild(metadata);

        // Hover effect with glow
        container.interactive = true;
        container.buttonMode = true;
        container.on('pointerover', () => {
            bg.clear();
            bg.lineStyle(3, 0xc084fc, 1);
            bg.beginFill(0x2a2a2a);
            bg.drawRoundedRect(0, 0, thumbWidth, thumbHeight, 14);
            bg.endFill();
        });
        container.on('pointerout', () => {
            bg.clear();
            bg.lineStyle(2, 0x8b5cf6, 0.8);
            bg.beginFill(0x1f1f1f);
            bg.drawRoundedRect(0, 0, thumbWidth, thumbHeight, 14);
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

        // DEBUG: Log the calculations
        console.log('=== GRID POSITIONING DEBUG ===');
        console.log('Window width:', window.innerWidth);
        console.log('Grid width:', gridWidth);
        console.log('Columns:', COLUMNS, '(fixed)');
        console.log('Available width:', availableWidth);
        console.log('Start X:', startX);
        console.log('Grid end X:', startX + gridWidth);
        console.log('Should end at:', availableWidth + SIDE_MARGIN);
        console.log('Centered offset:', (availableWidth - gridWidth) / 2);
        console.log('Right overflow?', (startX + gridWidth) > (window.innerWidth - SCROLLBAR_WIDTH));
        console.log('=============================');

        // Calculate visible range with buffer
        const scrollY = -viewportY;
        const viewportHeight = window.innerHeight;
        const bufferRows = 2; // Render extra rows above/below for smooth scrolling

        const firstVisibleRow = Math.max(0, Math.floor(scrollY / rowHeight) - bufferRows);
        const lastVisibleRow = Math.min(
            Math.ceil(filteredThumbnails.length / COLUMNS),
            Math.ceil((scrollY + viewportHeight) / rowHeight) + bufferRows
        );

        const firstVisibleIndex = firstVisibleRow * COLUMNS;
        const lastVisibleIndex = Math.min(filteredThumbnails.length, lastVisibleRow * COLUMNS);

        // Hide sprites outside visible range
        spritePool.forEach((sprite, index) => {
            if (index < firstVisibleIndex || index >= lastVisibleIndex) {
                sprite.visible = false;
            }
        });

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
        e.preventDefault();

        const maxScroll = Math.max(0, contentHeight() - window.innerHeight);
        targetViewportY = Math.max(-maxScroll, Math.min(0, targetViewportY - e.deltaY));
    }, { passive: false });

    // Smooth scroll interpolation
    let lastUpdateY = 0;
    app.ticker.add(() => {
        viewportY += (targetViewportY - viewportY) * scrollSpeed;
        viewport.y = Math.round(viewportY);
        updateScrollbar();

        // Update visible sprites when scroll position changes significantly
        if (Math.abs(viewportY - lastUpdateY) > 100) {
            updateVisibleSprites();
            lastUpdateY = viewportY;
        }
    });

    // ============================================
    // FPS COUNTER
    // ============================================

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    app.ticker.add(() => {
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
            fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
            updateStats();
        }
    });

    function updateStats() {
        const showing = filteredThumbnails.length;
        const total = thumbnails.length;
        const text = showing === total
            ? `Items: ${total.toLocaleString()} | FPS: ${fps}`
            : `Items: ${showing.toLocaleString()} / ${total.toLocaleString()} | FPS: ${fps}`;
        document.getElementById('stats').textContent = text;
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

    console.log('App ready. Click "Load 1,000" to start.');
    updateStats();
}

// Start the app
init().catch(err => {
    console.error('Failed to initialize app:', err);
    document.body.innerHTML = '<div style="color: white; padding: 20px;">Error: ' + err.message + '</div>';
});
