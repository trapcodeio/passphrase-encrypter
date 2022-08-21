const {createInterface} = require('readline');

/**
 * Decrypt Standalone File.
 */
const MD5 = require('crypto-js/md5');
const AES = require('crypto-js/aes');
const encUtf8 = require('crypto-js/enc-utf8');

// Constant and never changes
const COMPLEX_ENCRYPTION_KEY = '|!@#$%^&*(MPPE)|';

/**
 * Inject Encrypted data
 */
// ===== injection =====
const encryptedData = {
  name: 'ledger',
  date: '2022-08-12T22:34:31.081Z',
  value:
      'U2FsdGVkX1+bHiU54zCH40UwGC1cSUmORHbPRJzdxI4aN//2xf5q2fCL4/6YXT/SpKfs/rY9mJ+E4JsCKJlm8nWWMa7TnTTmLMU1K++vcDtz8Mx1qgpWPsy20DSKqKfJLenLpD6ZSsfLTP3fDz+6sgchoYbK/Bt1HhMYXVyBSSR3gTTjBA8WsWUaWZaWVdy2mXGdQAUAtJ2qq1CKF2lheJW0cv5dRlxldlONbBAFLkQ=',
};

// ===== injection =====

/**
 * Ask for password
 * @return {Promise<unknown>}
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout,
      
    });
    
    readline.question(question, name => {
      readline.close();
      resolve(name);
    });
  });
}

/**
 * AES decrypt a string
 * @param str - String to encrypt
 * @param key - Key to use for encryption
 * @returns string
 */
function aesDecrypt(str, key) {
  return AES.decrypt(str, key).toString(encUtf8);
}

/**
 * Generate a complex password
 */
function generateComplexPassword(password, complexKey) {
  /**
   * Complex Encryption Steps
   *  1. Split each character in password.
   *  2. Map and convert to md5 hash of each character + substring value of index.
   *  3. Join with complex key repeated to length of password.
   */
  
  // Encrypt each character in the pass phrase & join the encrypted characters
  return password.split('').map((c, i) => {
    return MD5(password + password.substring(0, i)).toString();
  }).join(complexKey.repeat(password.length));
}

/**
 * Main async function
 * @return {Promise<void>}
 * @constructor
 */
async function Main() {
  // Ask for method
  const method = await askQuestion('Enter method: <simple|complex> ');
  
  // Ask for password
  const password = await askQuestion('Password: ');
  
  try {
    let data = aesDecrypt(
        encryptedData.value,
        method === 'complex'
            ? generateComplexPassword(password, COMPLEX_ENCRYPTION_KEY)
            : password,
    );
    
    // parse to object
    data = JSON.parse(data);
    
    // Parse Date
    if (data.date) {
      data.date = new Date(data.date);
      data.date = data.date.toDateString() + ' - ' +
          data.date.toLocaleTimeString();
    }
    
    const {words, ...rest} = data;
    console.dir(rest, {depth: null});
    console.table(words);
  } catch (e) {
    console.log('Cannot decrypt data using the password provided!');
  }
  
}

// Run Main
Main().catch(console.error);