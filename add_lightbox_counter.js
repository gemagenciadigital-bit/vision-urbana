const fs = require('fs');
const path = require('path');

const detailsDir = path.join(__dirname, 'web', 'detalles');
const files = fs.readdirSync(detailsDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
    const filePath = path.join(detailsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Update updateLightboxImage to update counter
    content = content.replace(
        /function updateLightboxImage\(\) \{\s*const img = document\.getElementById\('lightbox-img'\);\s*img\.src = propertyPhotos\[currentIndex\];\s*\}/g,
        `function updateLightboxImage() {
            const img = document.getElementById('lightbox-img');
            const counter = document.getElementById('lightbox-counter');
            img.src = propertyPhotos[currentIndex];
            if (counter) counter.innerText = \`\${currentIndex + 1} / \${totalSlides}\`;
        }`
    );

    // 2. Update Lightbox Modal HTML to include the counter
    const counterHtml = `
        <!-- Photo Counter -->
        <div id="lightbox-counter" class="absolute top-6 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold z-[210]">
            1 / 1
        </div>`;

    // Insert counter before the close button or top of the modal
    if (content.includes('id="lightbox"')) {
        content = content.replace(
            /(<div id="lightbox"[\s\S]*?>)/,
            `$1\n        ${counterHtml}`
        );
    }

    fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    console.log(`Added counter to ${file}`);
});
