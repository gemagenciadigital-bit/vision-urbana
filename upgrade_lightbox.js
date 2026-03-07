const fs = require('fs');
const path = require('path');

const detailsDir = path.join(__dirname, 'web', 'detalles');
const files = fs.readdirSync(detailsDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(detailsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update initCarousel to pass index
    content = content.replace(
        /wrapper\.innerHTML = propertyPhotos\.map\(photo => `\s*<div class="min-w-full h-full">\s*<img src="\$\{photo\}" class="w-full h-full object-cover cursor-zoom-in" onclick="openLightbox\('\$\{photo\}'\)">\s*<\/div>\s*`\)\.join\(''\);/g,
        'wrapper.innerHTML = propertyPhotos.map((photo, index) => `\n                <div class="min-w-full h-full">\n                    <img src="${photo}" class="w-full h-full object-cover cursor-zoom-in" onclick="openLightbox(${index})">\n                </div>\n            `).join(\'\');'
    );

    // 2. Update openLightbox to handle index and add touch support
    const newJsFunctions = `
        let touchStartX = 0;
        let touchEndX = 0;

        function openLightbox(index) {
            currentIndex = index;
            const lightbox = document.getElementById('lightbox');
            updateLightboxImage();
            lightbox.classList.remove('hidden');
            lightbox.classList.add('flex');
            document.body.style.overflow = 'hidden';
            
            // Add touch listeners
            lightbox.addEventListener('touchstart', handleTouchStart, false);
            lightbox.addEventListener('touchend', handleTouchEnd, false);
        }

        function handleTouchStart(e) {
            touchStartX = e.changedTouches[0].screenX;
        }

        function handleTouchEnd(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }

        function handleSwipe() {
            if (touchStartX - touchEndX > 50) changeLightboxPhoto(1);
            if (touchEndX - touchStartX > 50) changeLightboxPhoto(-1);
        }

        function changeLightboxPhoto(step) {
            currentIndex = (currentIndex + step + totalSlides) % totalSlides;
            updateLightboxImage();
            updateCarousel(); // Sync main carousel
        }

        function updateLightboxImage() {
            const img = document.getElementById('lightbox-img');
            img.src = propertyPhotos[currentIndex];
        }

        function closeLightbox() {
            const lightbox = document.getElementById('lightbox');
            lightbox.classList.add('hidden');
            lightbox.classList.remove('flex');
            document.body.style.overflow = 'auto';
            lightbox.removeEventListener('touchstart', handleTouchStart);
            lightbox.removeEventListener('touchend', handleTouchEnd);
        }
    `;

    // Replace the old openLightbox and closeLightbox functions
    content = content.replace(/function openLightbox\(src\) \{[\s\S]*?function closeLightbox\(\) \{[\s\S]*?document\.body\.style\.overflow = 'auto';\s*\}/g, newJsFunctions);

    // 3. Update Lightbox Modal HTML to include navigation buttons
    const newLightboxHtml = `
    <!-- Lightbox Modal -->
    <div id="lightbox" onclick="closeLightbox()"
        class="fixed inset-0 z-[200] bg-black/95 hidden items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out">
        
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
    </div>
    `;

    content = content.replace(/<!-- Lightbox Modal -->[\s\S]*?<\/div>\s*<\/body>/g, `${newLightboxHtml}\n</body>`);

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log(`Upgraded Lightbox for ${file}`);
});
