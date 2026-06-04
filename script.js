document.addEventListener('DOMContentLoaded', () => {
    
    const appIcons = document.querySelectorAll('.app-icon');
    const closeButtons = document.querySelectorAll('.close-btn');
    const modals = document.querySelectorAll('.modal');
    
    window.highestZIndex = 10;
    const desktopMargin = 20; 
    const gridSize = 20; 

    // =========================================================
    // --- SMART SPAWNER (AUTO-FITS WINDOWS ON OPEN) ---
    // =========================================================
    window.safeOpenModal = function(modal) {
        // 1. Make it visible first so the browser can measure it
        modal.style.display = 'block';

        // 2. Read the safe screen dimensions (ignoring scrollbars)
        const screenW = document.documentElement.clientWidth;
        const screenH = document.documentElement.clientHeight;
        const margin = 20; // Your desktop margin

        // 3. Read the window's current CSS dimensions
        let currentW = modal.offsetWidth;
        let currentH = modal.offsetHeight;

        // 4. THE SHRINKER: If it's bigger than the screen, crush it down!
        if (currentW > screenW - (margin * 2)) {
            currentW = screenW - (margin * 2);
            modal.style.width = `${currentW}px`;
        }
        if (currentH > screenH - (margin * 2)) {
            currentH = screenH - (margin * 2);
            modal.style.height = `${currentH}px`;
        }

        // 5. Read where CSS *tried* to spawn it
        let currentLeft = modal.offsetLeft;
        let currentTop = modal.offsetTop;

        // 6. THE BUMPER: Calculate the maximum safe coordinates
        const maxLeft = screenW - currentW - margin;
        const maxTop = screenH - currentH - margin;

        // Nudge it back if it's bleeding off the right/bottom
        if (currentLeft > maxLeft) currentLeft = maxLeft;
        if (currentTop > maxTop) currentTop = maxTop;
        
        // Nudge it back if it's bleeding off the left/top
        if (currentLeft < margin) currentLeft = margin;
        if (currentTop < margin) currentTop = margin;

        // 7. Snap the final coordinates to your 20px retro grid!
        currentLeft = Math.round(currentLeft / gridSize) * gridSize;
        currentTop = Math.round(currentTop / gridSize) * gridSize;

        // 8. Apply the safe coordinates and bring to front
        modal.style.left = `${currentLeft}px`;
        modal.style.top = `${currentTop}px`;
        
        window.highestZIndex++;
        modal.style.zIndex = window.highestZIndex;
    };
    
    // ... (Your existing Window Memory code might be here, keep it!) ...
    const allModals = document.querySelectorAll('.modal');
    allModals.forEach(modal => {
        modal.dataset.origTop = modal.style.top || '';
        modal.dataset.origLeft = modal.style.left || '';
        modal.dataset.origWidth = modal.style.width || '';
        modal.dataset.origHeight = modal.style.height || '';

    // =========================================================
    // --- NEW: URL PARAMETER AUTO-OPENER ---
    // =========================================================
    
    // 1. Ask the browser to read the current URL's search parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    // 2. Look specifically for a parameter named "open"
    const windowToOpen = urlParams.get('open'); 

    // 3. If the "open" parameter exists in the URL...
    if (windowToOpen) {
        // Find the window with the exact ID matching the parameter
        const targetModal = document.getElementById(windowToOpen);
        
        // If that window actually exists in your HTML, open it!
        if (targetModal) {
            window.safeOpenModal(targetModal);
            
            // Optional: Bring it to the absolute front just to be safe
            targetModal.style.zIndex = 1000; 
        }
    }
});

// --- REUSABLE DRAG FUNCTION (UPGRADED FOR TOUCHSCREENS) ---
    function makeDraggable(element, dragHandle, isIcon = false) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        let hasMoved = false; 

        element.addEventListener('pointerdown', () => {
            highestZIndex++;
            element.style.zIndex = highestZIndex;
        });

        const onPointerMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
                hasMoved = true;
            }
            
            let newLeft = initialLeft + deltaX;
            let newTop = initialTop + deltaY;

            const rect = element.getBoundingClientRect();
            const maxLeft = document.documentElement.clientWidth - rect.width - desktopMargin;
            const maxTop = document.documentElement.clientHeight - rect.height - desktopMargin;

            if (newLeft < desktopMargin) newLeft = desktopMargin;
            if (newTop < desktopMargin) newTop = desktopMargin;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop > maxTop) newTop = maxTop;
            
            element.style.left = `${newLeft}px`;
            element.style.top = `${newTop}px`;
        };

        const stopDragging = () => {
            if (!isDragging) return;
            isDragging = false;
            
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', stopDragging);
            document.removeEventListener('pointercancel', stopDragging);

            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.style.pointerEvents = 'auto';
            });
            
            if (isIcon && !hasMoved) {
                const targetModalId = element.getAttribute('data-target');
                const modal = document.getElementById(targetModalId);
                
                if (modal) {
                    modal.style.display = 'block';
                    highestZIndex++;
                    modal.style.zIndex = highestZIndex;
                    
                    if (!modal.style.left) {
                        const rect = modal.getBoundingClientRect();
                        modal.style.left = `${Math.round(rect.left / gridSize) * gridSize}px`;
                        modal.style.top = `${Math.round(rect.top / gridSize) * gridSize}px`;
                        modal.style.width = `${Math.round(rect.width / gridSize) * gridSize}px`;
                        modal.style.height = `${Math.round(rect.height / gridSize) * gridSize}px`;
                    }
                }
            } 
            else if (hasMoved) {
                let currentLeft = parseFloat(element.style.left);
                let currentTop = parseFloat(element.style.top);

                let snappedLeft = Math.round(currentLeft / gridSize) * gridSize;
                let snappedTop = Math.round(currentTop / gridSize) * gridSize;

                const rect = element.getBoundingClientRect();
                const maxLeft = Math.floor((document.documentElement.clientWidth - rect.width - desktopMargin) / gridSize) * gridSize;
                const maxTop = Math.floor((document.documentElement.clientHeight - rect.height - desktopMargin) / gridSize) * gridSize;

                if (snappedLeft < desktopMargin) snappedLeft = desktopMargin;
                if (snappedTop < desktopMargin) snappedTop = desktopMargin;
                if (snappedLeft > maxLeft) snappedLeft = maxLeft;
                if (snappedTop > maxTop) snappedTop = maxTop;

                element.style.transition = 'top 0.15s ease-out, left 0.15s ease-out';
                element.style.left = `${snappedLeft}px`;
                element.style.top = `${snappedTop}px`;

                setTimeout(() => {
                    element.style.transition = 'none';
                }, 150);
            }
        };

        dragHandle.addEventListener('pointerdown', (e) => {
            isDragging = true;
            hasMoved = false; 
            
            element.style.transition = 'none';
            
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = element.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.style.pointerEvents = 'none';
            });

            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', stopDragging);
            document.addEventListener('pointercancel', stopDragging);
        });
    }
// --- SETUP ICONS (CUSTOM SCENE LAYOUT & CLICK LOGIC) ---
    const iconWidth = 130; 
    const iconHeight = 100;

    appIcons.forEach((icon, index) => {
        
        let baseSpawnX, baseSpawnY;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // 1. ASSIGN SPECIFIC SPAWN ZONES BASED ON ICON ORDER
        if (index === 0) {
            baseSpawnX = screenW * 0.15;
            baseSpawnY = desktopMargin + 40;
        } 
        else if (index === 1) {
            baseSpawnX = (screenW / 2) - (iconWidth / 2);
            baseSpawnY = desktopMargin + 40;
        } 
        else if (index === 2) {
            baseSpawnX = screenW * 0.85 - iconWidth;
            baseSpawnY = desktopMargin + 40;
        } 
        else if (index === 3) {
            baseSpawnX = screenW * 0.20;
            baseSpawnY = screenH * 0.65; 
        } 
        else if (index === 4) {
            baseSpawnX = (screenW * 0.20) + 160; 
            baseSpawnY = screenH * 0.65;
        } 
        else {
            baseSpawnX = desktopMargin;
            baseSpawnY = desktopMargin;
        }

        // 2. THE ROUGHNESS (JITTER)
        let jitterX = (Math.floor(Math.random() * 3) - 1) * gridSize; 
        let jitterY = (Math.floor(Math.random() * 3) - 1) * gridSize;

        let spawnX = baseSpawnX + jitterX;
        let spawnY = baseSpawnY + jitterY;

        // 3. SNAP TO THE 20px GRID
        spawnX = Math.round(spawnX / gridSize) * gridSize;
        spawnY = Math.round(spawnY / gridSize) * gridSize;

        // 4. THE SAFETY NET (Keeps them on screen)
        if (spawnX < desktopMargin) spawnX = desktopMargin;
        if (spawnY < desktopMargin) spawnY = desktopMargin;
        if (spawnX > screenW - iconWidth - desktopMargin) spawnX = screenW - iconWidth - desktopMargin;
        if (spawnY > screenH - iconHeight - desktopMargin) spawnY = screenH - iconHeight - desktopMargin;

        // 5. PLACE THE ICON
        icon.style.left = `${spawnX}px`;
        icon.style.top = `${spawnY}px`;

        // Make it draggable
        makeDraggable(icon, icon, true);

        // ==========================================
        // 6. THE NEW CLICK LOGIC (Opening Windows)
        // ==========================================
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            let targetModal = null;

            // --- THE RANDOMIZER ---
            if (targetId === 'random') {
                const randomPool = [
                    'modal-gastro-gallery',
                    'modal-Paul-gallery',
                    'modal-CSM-gallery',
                    'modal-Space-gallery',
                    'modal-Nature-gallery'
                ];
                
                const randomIndex = Math.floor(Math.random() * randomPool.length);
                const randomlyChosenId = randomPool[randomIndex];
                
                targetModal = document.getElementById(randomlyChosenId);
            } 
            // --- NORMAL ICONS ---
            else {
                targetModal = document.getElementById(targetId);
            }

            // If we found a window, safely open it!
            if (targetModal) {
                window.safeOpenModal(targetModal);
            }
        });
    });

  // --- SETUP WINDOWS & CUSTOM MULTI-DIRECTIONAL RESIZE LOGIC ---
    let resizingModal = null;
    let resizeDirection = '';
    let startW, startH, startX, startY, startLeft, startTop;

 function makeResizable(modal) {
        const edgeSize = 20; 

        // Change 'mousemove' to 'pointermove'
        modal.addEventListener('pointermove', (e) => {
            if (resizingModal) return; 

            const rect = modal.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            let dir = '';
            if (y > rect.height - edgeSize) dir += 's'; 
            if (x > rect.width - edgeSize) dir += 'e';  
            if (x < edgeSize) dir += 'w';               

            if (dir) {
                modal.style.cursor = dir + '-resize';
                resizeDirection = dir;
            } else {
                modal.style.cursor = 'default';
                resizeDirection = '';
            }
        });

        // Change 'mousedown' to 'pointerdown'
        modal.addEventListener('pointerdown', (e) => {
            if (resizeDirection && !e.target.closest('.modal-header')) {
                resizingModal = modal;
                
                startX = e.clientX;
                startY = e.clientY;
                
                const rect = modal.getBoundingClientRect();
                startW = rect.width;
                startH = rect.height;
                startLeft = rect.left;
                startTop = rect.top;

                document.querySelectorAll('iframe').forEach(iframe => {
                    iframe.style.pointerEvents = 'none';
                });

                e.preventDefault(); 
            }
        });
    }

    // Apply the resizer to all windows
    modals.forEach(modal => {
        const header = modal.querySelector('.modal-header');
        makeDraggable(modal, header, false); // Keep the header draggable
        makeResizable(modal);                // Make the edges resizable!
    });

// The actual math for stretching the window
    document.addEventListener('pointermove', (e) => {
        if (!resizingModal) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newW = startW;
        let newH = startH;

        // If dragging the RIGHT side
        if (resizeDirection.includes('e')) {
            newW = startW + deltaX;
        }
        // If dragging the LEFT side
        if (resizeDirection.includes('w')) {
            newW = startW - deltaX;
        }
        // If dragging the BOTTOM side
        if (resizeDirection.includes('s')) {
            newH = startH + deltaY;
        }

        // --- NEW: THE PERFECT RATIO LOCK ---
        // Checks if this is a gallery window
        if (resizingModal.id.includes('-gallery')) {
            const startRatio = startW / startH; // Calculates the exact shape it spawned with!
            
            // If dragging the sides, force the height to scale proportionally
            if (resizeDirection.includes('e') || resizeDirection.includes('w')) {
                newH = newW / startRatio; 
            } 
            // If dragging the bottom, force the width to scale proportionally
            else if (resizeDirection === 's') {
                newW = newH * startRatio; 
            }
        }

        // 1. Apply width and height FIRST so CSS limits can kick in
        resizingModal.style.width = `${newW}px`;
        resizingModal.style.height = `${newH}px`;

        // 2. If dragging the left side, lock the Right Edge in place!
        if (resizeDirection.includes('w')) {
            const originalRightEdge = startLeft + startW;
            const actualWidth = resizingModal.offsetWidth; 
            resizingModal.style.left = `${originalRightEdge - actualWidth}px`;
        }
    });

    // When they let go, SNAP to the 20px Grid!
    document.addEventListener('pointerup', () => {
        if (resizingModal) {
            const modal = resizingModal;
            const rect = modal.getBoundingClientRect();

            // Turn iframes back on
            document.querySelectorAll('iframe').forEach(iframe => {
                iframe.style.pointerEvents = 'auto';
            });

            // Snap Width & Height to grid based on the actual rendered size
            let snappedW = Math.round(rect.width / gridSize) * gridSize;
            let snappedH = Math.round(rect.height / gridSize) * gridSize;
            let snappedLeft = Math.round(rect.left / gridSize) * gridSize;

            // --- NEW: RATIO SNAP ---
            // Ensures the final grid snap also respects the perfect gallery ratio!
            if (modal.id.includes('-gallery')) {
                const startRatio = startW / startH;
                snappedH = Math.round((snappedW / startRatio) / gridSize) * gridSize;
            }

            // Keep the right edge locked when snapping the left side
            if (resizeDirection.includes('w')) {
                const originalRightEdge = startLeft + startW;
                snappedLeft = originalRightEdge - snappedW;
                snappedLeft = Math.round(snappedLeft / gridSize) * gridSize; 

                // Stop it from being dragged completely off the left side of the screen
                if (snappedLeft < desktopMargin) {
                    snappedLeft = desktopMargin;
                    snappedW = originalRightEdge - desktopMargin;
                    snappedW = Math.round(snappedW / gridSize) * gridSize;
                }
            }

            // Enforce Maximums so right/bottom don't go off screen
            const maxW_Right = Math.floor((window.innerWidth - snappedLeft - desktopMargin) / gridSize) * gridSize;
            const maxH = Math.floor((window.innerHeight - rect.top - desktopMargin) / gridSize) * gridSize;

            if (resizeDirection.includes('e') && snappedW > maxW_Right) snappedW = maxW_Right;
            if (snappedH > maxH) snappedH = maxH;

            // Apply smooth snapping transition
            modal.style.transition = 'width 0.15s ease-out, height 0.15s ease-out, left 0.15s ease-out';
            modal.style.width = `${snappedW}px`;
            modal.style.height = `${snappedH}px`;
            if (resizeDirection.includes('w')) {
                modal.style.left = `${snappedLeft}px`;
            }

            setTimeout(() => {
                modal.style.transition = 'none';
            }, 150);

            // Reset variables
            resizingModal.style.cursor = 'default';
            resizingModal = null;
            resizeDirection = '';
        }
    });
// --- MINIMIZE / MAXIMIZE TOGGLE LOGIC ---
    const minButtons = document.querySelectorAll('.min-btn');

    minButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            if (!modal) return;

            // The absolute minimum size of your windows
            const minW = 700;
            const minH = 400;

            // The maximum available size on the current screen (snapped to your grid)
            const maxW = Math.floor((window.innerWidth - (desktopMargin * 2)) / gridSize) * gridSize;
            const maxH = Math.floor((window.innerHeight - (desktopMargin * 2)) / gridSize) * gridSize;

            // Get the current rendered size of the window
            const currentW = Math.round(modal.offsetWidth / gridSize) * gridSize;
            const currentH = Math.round(modal.offsetHeight / gridSize) * gridSize;

            // --- THE INVERTED LOGIC ---
            // Check if we are currently at the maximum size (or larger)
            const isAtMaxSize = currentW >= maxW && currentH >= maxH;

            // Add a smooth transition for the snap effect
            modal.style.transition = 'all 0.2s ease-out';

            if (isAtMaxSize) {
                // --- MINIMIZE IT --- (Because it is already massive!)
                modal.style.maxWidth = '';
                modal.style.maxHeight = '';

                modal.style.width = `${minW}px`;
                modal.style.height = `${minH}px`;
                
            } else {
                // --- MAXIMIZE IT --- (Because it is not currently fullscreen!)
                modal.style.maxWidth = 'none';
                modal.style.maxHeight = 'none';
                
                modal.style.width = `${maxW}px`;
                modal.style.height = `${maxH}px`;
                
                // Move it to the top left corner so it perfectly fits the screen
                modal.style.left = `${desktopMargin}px`;
                modal.style.top = `${desktopMargin}px`;
            }

            // Remove the transition after the animation finishes
            setTimeout(() => {
                modal.style.transition = 'none';
            }, 200);
        });
    });

// --- CLOSE BUTTON LOGIC ---
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal');
            if (modal) {
                // 1. Hide the window
                modal.style.display = 'none';

                // 2. Erase the dragged/resized positions and restore the memory!
                modal.style.top = modal.dataset.origTop;
                modal.style.left = modal.dataset.origLeft;
                modal.style.width = modal.dataset.origWidth;
                modal.style.height = modal.dataset.origHeight;

                // 3. Reset the max-width/height just in case they closed it while it was Maximized!
                modal.style.maxWidth = '';
                modal.style.maxHeight = '';
            }
        });
    });

    // --- DYNAMIC BROWSER RESIZING (FLEXING) ---
    let prevScreenW = window.innerWidth;
    let prevScreenH = window.innerHeight;

    window.addEventListener('resize', () => {
        const currentScreenW = window.innerWidth;
        const currentScreenH = window.innerHeight;

        // Calculate the percentage the screen changed
        const scaleX = currentScreenW / prevScreenW;
        const scaleY = currentScreenH / prevScreenH;

        // 1. Flex Icons
        appIcons.forEach(icon => {
            let currentLeft = parseFloat(icon.style.left) || 0;
            let currentTop = parseFloat(icon.style.top) || 0;

            let newLeft = Math.round((currentLeft * scaleX) / gridSize) * gridSize;
            let newTop = Math.round((currentTop * scaleY) / gridSize) * gridSize;

            const maxLeft = Math.floor((currentScreenW - 130 - desktopMargin) / gridSize) * gridSize;
            const maxTop = Math.floor((currentScreenH - 100 - desktopMargin) / gridSize) * gridSize;

            if (newLeft < desktopMargin) newLeft = desktopMargin;
            if (newTop < desktopMargin) newTop = desktopMargin;
            if (newLeft > maxLeft) newLeft = maxLeft;
            if (newTop > maxTop) newTop = maxTop;

            icon.style.transition = 'top 0.1s ease-out, left 0.1s ease-out';
            icon.style.left = `${newLeft}px`;
            icon.style.top = `${newTop}px`;
            
            setTimeout(() => icon.style.transition = 'none', 100);
        });

        // 2. Flex Windows
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                let currentLeft = parseFloat(modal.style.left) || modal.getBoundingClientRect().left;
                let currentTop = parseFloat(modal.style.top) || modal.getBoundingClientRect().top;
                let currentWidth = parseFloat(modal.style.width) || modal.offsetWidth;
                let currentHeight = parseFloat(modal.style.height) || modal.offsetHeight;

                let newLeft = Math.round((currentLeft * scaleX) / gridSize) * gridSize;
                let newTop = Math.round((currentTop * scaleY) / gridSize) * gridSize;
                let newWidth = Math.round((currentWidth * scaleX) / gridSize) * gridSize;
                let newHeight = Math.round((currentHeight * scaleY) / gridSize) * gridSize;

                // Enforce absolute CSS minimums so they don't crush
                if (newWidth < 700) newWidth = 700;
                if (newHeight < 400) newHeight = 400;

                const maxLeft = Math.floor((currentScreenW - newWidth - desktopMargin) / gridSize) * gridSize;
                const maxTop = Math.floor((currentScreenH - newHeight - desktopMargin) / gridSize) * gridSize;

                if (newLeft < desktopMargin) newLeft = desktopMargin;
                if (newTop < desktopMargin) newTop = desktopMargin;
                if (newLeft > maxLeft) newLeft = maxLeft;
                if (newTop > maxTop) newTop = maxTop;

                modal.style.transition = 'all 0.1s ease-out';
                modal.style.left = `${newLeft}px`;
                modal.style.top = `${newTop}px`;
                modal.style.width = `${newWidth}px`;
                modal.style.height = `${newHeight}px`;

                setTimeout(() => modal.style.transition = 'none', 100);
            }
        });

        // Save new dimensions for the next time the window is resized
        prevScreenW = currentScreenW;
        prevScreenH = currentScreenH;
    });

// --- IMAGE ZOOM LOGIC ---
document.addEventListener('click', (e) => {
    
    // THE UPDATE: Added the 3 new CSM layout classes to the listener list!
    if (e.target.matches('.masonry-gallery img, .project-gallery-6imgs img, .csm-full-width img, .csm-three-col img, .csm-gif-grid img')) {
        const clickedImg = e.target;
        const modal = clickedImg.closest('.modal');
        const modalContent = clickedImg.closest('.modal-content');
        
        if (!modalContent || !modal) return;

            // --- THE ALIGNMENT FIX ---
            // 1. Find exactly how far down the page the user is currently looking
            const currentScroll = modalContent.scrollTop;

            // 2. Freeze the background and force it to hold that exact scroll position
            modalContent.style.overflow = 'hidden';
            modalContent.scrollTop = currentScroll; 

            // Save the window's exact height before we change it so we can revert back later!
            modal.setAttribute('data-orig-height', modal.style.height || modal.offsetHeight + 'px');

            // --- WINDOW SCALING MATH ---
            const aspect = clickedImg.naturalHeight / clickedImg.naturalWidth;
            const header = modal.querySelector('.modal-header');
            const headerH = header ? header.offsetHeight : 0;

            const renderedImgW = modal.offsetWidth * 0.9;
            const renderedImgH = renderedImgW * aspect;
            const verticalPadding = modal.offsetWidth * 0.1; 

            let targetH = headerH + renderedImgH + verticalPadding;

            const maxH = Math.floor((window.innerHeight - (desktopMargin * 2)) / gridSize) * gridSize;
            if (targetH > maxH) targetH = maxH;

            targetH = Math.round(targetH / gridSize) * gridSize;

            modal.style.transition = 'height 0.2s ease-out';
            modal.style.height = `${targetH}px`;

            // --- CREATE THE OVERLAY ---
            const zoomOverlay = document.createElement('div');
            zoomOverlay.className = 'zoomed-view';
            
            // 3. Push the overlay down so it perfectly covers the visible area!
            zoomOverlay.style.top = `${currentScroll}px`;
            
            const zoomedImg = document.createElement('img');
            zoomedImg.src = clickedImg.src;
            zoomedImg.alt = clickedImg.alt;
            
            zoomOverlay.appendChild(zoomedImg);
            modalContent.appendChild(zoomOverlay);

            setTimeout(() => { modal.style.transition = 'none'; }, 200);
        }
        
        // 2. IF THEY CLICK THE ZOOMED OVERLAY: Close it and restore window!
        if (e.target.matches('.zoomed-view') || e.target.matches('.zoomed-view img')) {
            const overlay = e.target.closest('.zoomed-view');
            const modal = overlay.closest('.modal');
            const modalContent = overlay.closest('.modal-content');
            
            if (overlay) {
                overlay.remove(); // Destroy the image
            }

            if (modalContent) {
                // Safely restore the scrollbar without making the page jump
                const savedScroll = modalContent.scrollTop;
                modalContent.style.overflow = ''; 
                modalContent.scrollTop = savedScroll;
            }

            // Restore the window's original height smoothly
            if (modal) {
                const origHeight = modal.getAttribute('data-orig-height');
                if (origHeight) {
                    modal.style.transition = 'height 0.2s ease-out';
                    modal.style.height = origHeight;
                    
                    setTimeout(() => { modal.style.transition = 'none'; }, 200);
                }
            }
        }
    });


// --- AUTO-OPEN ABOUT ME WINDOW ON LOAD ---
    const aboutModal = document.getElementById('modal-about');
    
    if (aboutModal) {
        // 1. Get the safe screen dimensions
        const margin = 20;
        const screenW = document.documentElement.clientWidth;
        const screenH = document.documentElement.clientHeight;
        
        // 2. Your ideal starting sizes
        let modalWidth = 800; 
        let modalHeight = 650; 
        
        // 3. THE SHRINKER: Crush the window if the screen is too small (e.g., phones)
        if (modalWidth > screenW - (margin * 2)) modalWidth = screenW - (margin * 2);
        if (modalHeight > screenH - (margin * 2)) modalHeight = screenH - (margin * 2);

        // 4. Calculate the target position (Right side, 45% down)
        let targetX = screenW - modalWidth - 60; 
        let targetY = screenH * 0.45; 
        
        // 5. THE BUMPER: Prevent it from bleeding off the left or top on tiny screens
        if (targetX < margin) targetX = margin;
        if (targetY < margin) targetY = margin;
        
        // Prevent it from bleeding off the bottom edge
        if (targetY + modalHeight > screenH - margin) {
            targetY = screenH - modalHeight - margin;
        }

        // 6. Snap the window to your 20px grid
        targetX = Math.round(targetX / gridSize) * gridSize;
        targetY = Math.round(targetY / gridSize) * gridSize;
        
        // 7. Apply the safe math to the window!
        aboutModal.style.width = `${modalWidth}px`;
        aboutModal.style.height = `${modalHeight}px`;
        aboutModal.style.left = `${targetX}px`;
        aboutModal.style.top = `${targetY}px`;
        
        // 8. Open the window and bring it to the front
        aboutModal.style.display = 'block';
        window.highestZIndex++;
        aboutModal.style.zIndex = window.highestZIndex;
    }
});

/* ========================================================= */
/* --- AMBIENT CLOUD GENERATOR (PARALLAX & CLUMPS) --- */
/* ========================================================= */

const cloudLayer = document.getElementById('cloud-layer');

const cloudImages = [
    'BackdropImg/Cloud1.png', 
    'BackdropImg/Cloud2.png', 
    'BackdropImg/Cloud3.png',
    'BackdropImg/Cloud4.png', 
    'BackdropImg/Cloud5.png', 
    'BackdropImg/Cloud6.png'
];
function spawnCloudClump() {
    if (!cloudLayer) return;

    // --- 1. CLUMP SETTINGS ---
    const cloudsInClump = Math.floor(Math.random() * 4) + 1;
    const baseTopPos = Math.floor(Math.random() * 35) + 5;

    for (let i = 0; i < cloudsInClump; i++) {
        const cloud = document.createElement('img');
        const randomImg = cloudImages[Math.floor(Math.random() * cloudImages.length)];
        cloud.src = randomImg;
        cloud.className = 'animated-cloud';

        // THE DISTANCE VARIABLE
        const depth = Math.random(); 

        // --- TWEAK THE SIZES ---
        const minSize = 100;       
        const maxSizeAdd = 350;    
        const size = minSize + (depth * maxSizeAdd);
        cloud.style.width = `${size}px`;
        cloud.style.height = 'auto';

        // --- TWEAK THE OPACITY ---
        const minOpacity = 0.5;    
        const maxOpacityAdd = 0.9; 
        cloud.style.opacity = minOpacity + (depth * maxOpacityAdd);

        // --- TWEAK THE SPEED ---
        const maxTime = 200;       
        const timeDiff = 90;       
        const duration = maxTime - (depth * timeDiff);
        cloud.style.animation = `floatCloud ${duration}s linear forwards`;

        // --- TWEAK THE HEIGHT ---
        const verticalJitter = Math.floor(Math.random() * 9) - 4; 
        cloud.style.top = `${baseTopPos + verticalJitter}vh`;

        // ====================================================================
        // THE FIX: HORIZONTAL STAGGER (POSITIVE DELAY)
        // ====================================================================
        // Gives a random waiting time (0 to 4 seconds) before it starts moving
        const staggerDelay = Math.random() * 4;
        cloud.style.animationDelay = `${staggerDelay}s`;
        
        // Pins the cloud completely off-screen to the right while it waits!
        cloud.style.left = '100vw'; 

        // --- PARALLAX Z-INDEX FIX ---
        cloud.style.zIndex = Math.floor(depth * 100);
        
        // Drop the cloud into the sky!
        cloudLayer.appendChild(cloud);

        // CLEANUP: Delete the cloud when its duration PLUS its waiting delay finishes
        setTimeout(() => {
            cloud.remove();
        }, (duration + staggerDelay) * 1000);
    }

    // --- 2. TWEAK HOW OFTEN CLUMPS SPAWN ---
    const minSpawnTime = 6000;      
    const randomSpawnAdd = 12000;   
    const nextSpawnTime = minSpawnTime + Math.floor(Math.random() * randomSpawnAdd);
    
    setTimeout(spawnCloudClump, nextSpawnTime);
}

// Start the weather engine when the page loads!
window.addEventListener('load', () => {
    // Start the wobbly text
    animateSkyText();
    // Spawns the first clump immediately
    spawnCloudClump();
});

/* ========================================================= */
/* --- FLOATING SKY TEXT ANIMATOR --- */
/* ========================================================= */

function animateSkyText() {
    // THE FIX: Grabs BOTH lines of text!
    const skyTexts = document.querySelectorAll('#sky-text, #sky-name');

    // Loop through both the Name and the Portfolio text
    skyTexts.forEach(skyText => {
        
        const originalText = skyText.innerText;
        skyText.innerHTML = '';

        originalText.split('').forEach((char, index) => {
            const letterSpan = document.createElement('span');
            
            if (char === ' ') {
                letterSpan.innerHTML = '&nbsp;';
            } else {
                letterSpan.innerText = char;
            }

            letterSpan.className = 'wobble-letter';
            letterSpan.style.animationDelay = `${index * 0.15}s`;
            
            skyText.appendChild(letterSpan);
        });
    });
}

/* ========================================================= */
/* --- ANTHRO MACHINE AUTO-CAROUSEL --- */
/* ========================================================= */

const anthroTrack = document.getElementById('anthro-track');

if (anthroTrack) {
    let currentCarouselIndex = 0;
    const totalCarouselImages = anthroTrack.children.length;

    // Run this block of code every 3000 milliseconds (3 seconds)
    setInterval(() => {
        currentCarouselIndex++;
        
        // If we hit the end of the images, reset back to the first one!
        if (currentCarouselIndex >= totalCarouselImages) {
            currentCarouselIndex = 0; 
        }
        
        // Physically slide the track left by 100% per image
        anthroTrack.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;
        
    }, 3000); 
}

/* ========================================================= */
/* --- UNIVERSAL FLASHING ANIMATION --- */
/* ========================================================= */

// THE FIX: Added a comma and '.nature-flasher' to the search list!
const flasherContainers = document.querySelectorAll('.gastro-flasher, .nature-flasher');

flasherContainers.forEach(container => {
    const flashImages = container.querySelectorAll('img');
    let currentFlashIndex = 0;

    if (flashImages.length > 1) {
        setInterval(() => {
            flashImages[currentFlashIndex].classList.remove('active-flash');
            
            currentFlashIndex++;
            if (currentFlashIndex >= flashImages.length) {
                currentFlashIndex = 0;
            }
            
            flashImages[currentFlashIndex].classList.add('active-flash');
        }, 2000); 
    }
});

/* ========================================================= */
/* --- WINDOW MEMORY (For Resetting on Close) --- */
/* ========================================================= */

// When the page finishes loading...
document.addEventListener('DOMContentLoaded', () => {
    const allModals = document.querySelectorAll('.modal');
    
    allModals.forEach(modal => {
        // Save the exact inline styles into secret "data" attributes
        modal.dataset.origTop = modal.style.top || '';
        modal.dataset.origLeft = modal.style.left || '';
        modal.dataset.origWidth = modal.style.width || '';
        modal.dataset.origHeight = modal.style.height || '';
    });
});