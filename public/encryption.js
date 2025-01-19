/**
 * @param {string} b64key - The key to encrypt the plaintext, in base64 format
 * @param {Uint8Array} plaintext - The plaintext to encrypt, as a Uint8Array
 * @returns {Promise<string>} - The encrypted data as a base64 string
 * @description: Encrypts the plaintext
 */
async function encrypt(b64key, plaintext) {
    const key = await importKey(b64key);
    const nonce = crypto.getRandomValues(new Uint8Array(12)); // Generate a 12-byte random IV
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: nonce,
        },
        key,
        plaintext
    );

    // Concatenate nonce and ciphertext and return as base64
    const combined = new Uint8Array(nonce.length + encryptedData.byteLength);
    combined.set(nonce);
    combined.set(new Uint8Array(encryptedData), nonce.length);
    return combined.buffer;
}

/**
 * @param {string} b64key - The key in base64 format
 * @param {string} ciphertext - The ciphertext to decrypt, in base64 format
 * @returns {Promise<Uint8Array>} - The decrypted data as a Uint8Array
 * @description: Decrypts the ciphertext
 */
async function decrypt(b64key, ciphertext) {
    const key = await importKey(b64key);
    const combined = ciphertext;
    const nonce = combined.slice(0, 12); // Extract the nonce
    const encryptedData = combined.slice(12); // Extract the ciphertext and tag

    try {
        const decryptedData = await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: nonce,
            },
            key,
            encryptedData
        );
        return new Uint8Array(decryptedData);
    } catch (e) {
        console.error("Decryption failed:", e);
    }
}

/**
 * Helper function to import a base64 key for AES-GCM
 * @param {string} b64key - The base64-encoded key
 * @returns {Promise<CryptoKey>} - The imported CryptoKey
 */
async function importKey(b64key) {
    const rawKey = base64ToArrayBuffer(b64key);
    return crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt", "decrypt"]);
}

/**
 * Converts a base64 string to an ArrayBuffer
 * @param {string} base64 - The base64 string
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Converts an ArrayBuffer to a base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function BlobToBuffer(blob){
    return new Uint8Array(await blob.arrayBuffer())
  };