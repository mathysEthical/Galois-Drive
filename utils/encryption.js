import crypto from 'crypto';

/**
 * @param {string} key - The key to encrypt the plaintext
 * @param {Buffer} plaintext - The buffer to encrypt
 * @returns: string
 * @description: Encrypts the plaintext
*/
function encrypt(b64key, plaintext) {
    var key = Buffer.from(b64key, 'base64');
    var nonce = getRandomIV();

    var cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    var nonceCiphertextTag = Buffer.concat([
        nonce, 
        cipher.update(plaintext), 
        cipher.final(), 
        cipher.getAuthTag() // Fix: Get tag with cipher.getAuthTag() and concatenate: nonce|ciphertext|tag
    ]); 
    return nonceCiphertextTag;
  }
  
  function getRandomIV() {
    return crypto.randomBytes(12);
  }

  
  /**
   * @param {String} ciphertext - The ciphertext to decrypt in base64 format
   * @param {Buffer} key - The key to decrypt the ciphertext
   * @returns: Buffer
   * @description: Decrypts the ciphertext
  */
 
  function decrypt(key, nonceCiphertextTag) {
    var aesKey = base64ToArrayBuffer(key);
    var nonceCiphertextTag = nonceCiphertextTag
    var nonce = nonceCiphertextTag.slice(0, 12);
    var ciphertext = nonceCiphertextTag.slice(12, -16);
    var tag = nonceCiphertextTag.slice(-16);
    
    try{
      var decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, nonce);
      decipher.setAuthTag(tag);
      var plaintext = decipher.update(ciphertext);
      return Buffer.concat([plaintext, decipher.final()]);
    }catch(e){
      console.log(e)
    }
  }
  
  function base64ToArrayBuffer(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }


  export {encrypt,decrypt,base64ToArrayBuffer}