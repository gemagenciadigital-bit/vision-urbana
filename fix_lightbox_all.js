const fs = require('fs');
const path = require('path');

const detailsDir = path.join(__dirname, 'web', 'detalles');
const files = fs.readdirSync(detailsDir).filter(f => f.endsWith('.html'));

const lightboxModal = `    <!-- Lightbox Modal -->
    <div id="lightbox" onclick="closeLightbox()"
        class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out">
        
        <!-- Photo Counter -->
        <div id="lightbox-counter" class="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold z-[210]">
            1 / 1
        </div>
        
        <!-- Close Button -->
        <button onclick="event.stopPropagation(); closeLightbox()"
            class="absolute top-6 right-6 text-white/80 hover:text-white text-5xl z-[210] transition-colors">&times;</button>
        
        <!-- Navigation Arrows -->
        <button onclick="event.stopPropagation(); changeLightboxPhoto(-1)" 
            class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full text-white transition-all z-[210] hidden md:block">
            <span class="material-symbols-outlined text-4xl">chevron_left</span>
        </button>
        
        <button onclick="event.stopPropagation(); changeLightboxPhoto(1)" 
            class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-4 rounded-full text-white transition-all z-[210] hidden md:block">
            <span class="material-symbols-outlined text-4xl">chevron_right</span>
        </button>

        <img id="lightbox-img" src=""
            class="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-300"
            onclick="event.stopPropagation()">
            
        <!-- Mobile Hint -->
        <div class="absolute bottom-10 text-white/40 text-xs font-medium tracking-widest uppercase md:hidden pointer-events-none">
            Desliza para navegar
        </div>
    </div>`;

const lightboxJS = `
        // ---- Lightbox ----
        let touchStartX = 0;
        let touchEndX = 0;

        function openLightbox(index) {
            currentIndex = index;
            const lightbox = document.getElementById('lightbox');
            updateLightboxImage();
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            document.body.style.overflow = 'hidden';
            lightbox.addEventListener('touchstart', handleTouchStart, false);
            lightbox.addEventListener('touchend', handleTouchEnd, false);
        }

        function handleTouchStart(e) { touchStartX = e.changedTouches[0].screenX; }
        function handleTouchEnd(e) { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }

        function handleSwipe() {
            if (touchStartX - touchEndX > 50) changeLightboxPhoto(1);
            if (touchEndX - touchStartX > 50) changeLightboxPhoto(-1);
        }

        function changeLightboxPhoto(step) {
            currentIndex = (currentIndex + step + propertyPhotos.length) % propertyPhotos.length;
            updateLightboxImage();
            if (typeof updateCarousel === 'function') updateCarousel();
        }

        function updateLightboxImage() {
            const img = document.getElementById('lightbox-img');
            const counter = document.getElementById('lightbox-counter');
            img.src = propertyPhotos[currentIndex];
            if (counter) counter.innerText = (currentIndex + 1) + ' / ' + propertyPhotos.length;
        }

        function closeLightbox() {
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            document.body.style.overflow = 'auto';
            lightbox.removeEventListener('touchstart', handleTouchStart);
            lightbox.removeEventListener('touchend', handleTouchEnd);
        }
        // ------------------`;

files.forEach(file => {
    const filePath = path.join(detailsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove any existing lightbox modal HTML (old or new version)
    content = content.replace(/\s*<!-- Lightbox Modal -->[\s\S]*?<\/div>\s*(?=<\/body>)/g, '\n');

    // 2. Remove any existing lightbox JS block (old or new version)
    // Matches from the lightbox comment or touchStartX declaration to the end of closeLightbox
    content = content.replace(/\s*\/\/ ---- Lightbox ----[\s\S]*?\/\/ ------------------/g, '');
    content = content.replace(/\s*let touchStartX[\s\S]*?lightbox\.removeEventListener\('touchend', handleTouchEnd\);\s*\}/g, '');

    // 3. Update image onclick to use index-based openLightbox
    content = content.replace(
        /onclick="openLightbox\('[^']*'\)"/g,
        'LIGHTBOX_ONCLICK_PLACEHOLDER'
    );
    // Also update initCarousel to use index
    content = content.replace(
        /wrapper\.innerHTML = propertyPhotos\.map\(photo => `[\s\S]*?`\)\.join\(''\);/g,
        "wrapper.innerHTML = propertyPhotos.map((photo, index) => `\n                <div class=\"min-w-full h-full\">\n                    <img src=\"${photo}\" class=\"w-full h-full object-cover cursor-zoom-in\" onclick=\"openLightbox(${index})\">\n                </div>\n            `).join('');"
    );
    content = content.replace(
        /wrapper\.innerHTML = propertyPhotos\.map\((photo, index)\s*=>/g,
        'wrapper.innerHTML = propertyPhotos.map((photo, index) =>'
    );
    // Handle already-indexed versions
    content = content.replace('LIGHTBOX_ONCLICK_PLACEHOLDER', '');

    // 4. Inject new lightbox JS before closing script tag
    content = content.replace(/(\s*initCarousel\(\);[\s\S]*?<\/script>)/, `${lightboxJS}\n$1`);

    // 5. Inject new lightbox modal before </body>
    content = content.replace(/(\s*<\/body>)/, `\n${lightboxModal}\n$1`);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
});

console.log('\nAll done!');
