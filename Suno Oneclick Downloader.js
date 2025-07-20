(async () => {
    try {
        console.log("--- Script starting... ---");

        // 1) Get the main grid element
        const gridElement = document.querySelector('[role="grid"]');
        if (!gridElement) {
            throw new Error('Grid element (`[role="grid"]`) not found. The page structure might have changed.');
        }
        console.log("✅ Found grid element:", gridElement);

        // 2) Find the React props key and get the props object
        const reactPropsKey = Object.keys(gridElement).find(key => key.startsWith('__reactProps$'));
        if (!reactPropsKey) {
            throw new Error('Could not find React props on the grid element. The website\'s framework may have been updated.');
        }
        const gridProps = gridElement[reactPropsKey];
        console.log("✅ Found React props object. Inspect this object in the console to find the data path:", gridProps);

        // 3) Safely access the items array with detailed step-by-step logging
        console.log("--- Attempting to access collection data... ---");
        const step1 = gridProps?.children;
        console.log("Step 1 (gridProps.children):", step1);
        const step2 = step1?.[0];
        console.log("Step 2 (children[0]):", step2);
        const step3 = step2?.props;
        console.log("Step 3 (props):", step3);
        const step4 = step3?.values;
        console.log("Step 4 (props.values):", step4);
        const step5 = step4?.[0];
        console.log("Step 5 (values[0]):", step5);
        const step6 = step5?.[1];
        console.log("Step 6 (values[0][1]):", step6);
        
        const collection = step6?.collection;
        console.log("Step 7 (collection):", collection);

        const items = collection ? [...collection] : [];

        if (items.length === 0) {
            console.error('❌ Could not extract the items/collection array. The data structure has likely changed.');
            console.info('ℹ️ Please inspect the logged "React props object" above and adjust the access path in the script.');
            return;
        }
        console.log(`✅ Found ${items.length} items to process.`);
        
        // Get all song (row) elements
        const rows = document.querySelectorAll('[role="grid"] [role="row"]');

        // 4) Common download function
        const downloadBlob = async (url, fileName) => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to download ${url}`);
            const blob = await response.blob();
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(a.href);
            document.body.removeChild(a);
        };

        // 5) Iterate and download
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const row = rows[i];

            if (!item || !item.value || !row) {
                console.warn(`Skipping index ${i} due to missing item data or row element.`);
                continue;
            }
            
            console.log(`--- Processing item ${i + 1} ---`);

            const urls = [];
            if (item.value.audio_url) urls.push(item.value.audio_url);
            if (item.value.video_url) urls.push(item.value.video_url);

            const title = row.querySelector('span.hover\\:underline.cursor-pointer')?.innerText.trim() || `unknown_title_${i+1}`;
            const genre = row.querySelector('div.font-sans.break-all[title]')?.getAttribute('title').trim().replace(/\s*\\n\s*/g, ' ') || 'unknown_genre';
            const runtime = row.querySelector('span.font-mono')?.innerText.trim() || 'unknown_time';
            let thumbnailUrl = item.value.thumbnail_url?.trim() || row.querySelector('img[alt="Song Image"]')?.getAttribute('src')?.trim();

            const safeTitle = title.replace(/[\\/\\:*?"<>|]/g, '_');
            const safeGenre = genre.replace(/[\\/\\:*?"<>|]/g, '_');
            const safeRuntime = runtime.replace(/[\\/\\:*?"<>|]/g, '_');

            for (const url of urls) {
                const ext = new URL(url).pathname.split('.').pop();
                const fileName = `${safeTitle}_${safeGenre}_running time_${safeRuntime}.${ext}`;
                try {
                    console.log(`Downloading: ${fileName}`);
                    await downloadBlob(url, fileName);
                    console.log(`Download complete: ${fileName}`);
                } catch (error) {
                    console.error(`Error downloading ${fileName}:`, error);
                }
            }

            if (thumbnailUrl) {
                const thumbExt = new URL(thumbnailUrl).pathname.split('.').pop().toLowerCase() || 'jpg';
                const thumbFileName = `${safeTitle}_${safeGenre}_running time_${safeRuntime}_thumbnail.${thumbExt}`;
                try {
                    console.log(`Downloading thumbnail: ${thumbFileName}`);
                    await downloadBlob(thumbnailUrl, thumbFileName);
                    console.log(`Thumbnail download complete: ${thumbFileName}`);
                } catch (error) {
                    console.error(`Error downloading thumbnail ${thumbFileName}:`, error);
                }
            } else {
                console.warn(`Thumbnail URL not found for: ${title}`);
            }
        }

        console.log('--- All downloads attempted. ---');

    } catch (error) {
        console.error('❌ An unexpected error stopped the script:', error);
    }
})();