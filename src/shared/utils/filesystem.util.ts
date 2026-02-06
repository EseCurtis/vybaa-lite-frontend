import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function shareImageBlob(blob: Blob, fileName = 'image.jpg') {
  try {
    // 1. Convert Blob → base64 (Filesystem.writeFile expects base64 string)
    const base64 = await blobToBase64(blob);

    // 2. Write to cache directory (safest & works without extra Android config)
    const result = await Filesystem.writeFile({
      path: fileName,                    // e.g. 'shared-image-123.jpg'
      data: base64,
      directory: Directory.Cache,        // ← use Cache, no special permissions needed
      recursive: true,
    });

    // 3. Get the file:// URI
    const uriResult = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    const fileUri = uriResult.uri;   // this is file:///... path

    // 4. Share it
    await Share.share({
      title: 'Check out this image',
      text: 'Shared from my app',
      url: fileUri,                    // single file
      // OR for multiple files: files: [fileUri, anotherUri]
      dialogTitle: 'Share this image',
    });

    // Optional: clean up after sharing (good practice)
    // await Filesystem.deleteFile({ path: fileName, directory: Directory.Cache });

  } catch (err) {
    console.error('Sharing failed:', err);
  }
}

// Helper
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]); // remove data:image/...;base64, prefix
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}