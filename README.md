# Mnemonic Pass Phrase Encrypter

<p align="center">
  <img width="500" src="./about/mppe.png"/>
</p>

<p align="center" style="font-size: 16px; font-weight: medium; margin-bottom: 25px">
Encrypt your  passphrase, secretKeys, backup keys e.t.c Using simple or complex <b>AES Encryption</b> on the browser. <span style="color: green">(No server or external requests) 👍 🔒 <span>
</p>
<br>

## How To Use

You can either use the online version: [passphrase-encrypter.pages.dev](https://passphrase-encrypter.pages.dev) or:

### Use Built Files.

- Download the already built [dist.zip](./dist.zip) on any device that runs a browser.
- Extract files to a new folder.
- Open the index.html file.

## Settings

- [Number Of Words](#number-of-words)
- [Verification](#verification)
- [Encryption Method](#encryption-method)
- [Show DATE in public data](#show-date-in-public-data)

### Number of Words

The number of words you want to encrypt. This also determines the number of input boxes that will be provided for you.
<br>
Min: `1` Max: `50` Default: `12`

### Verification

If enabled, This ensures that the words you entered are correct by providing another form for you to re-type and verify words.
<br>
Default: `false`

### Encryption Method

There are two encryption methods provided: `Simple` and `Complex`.
All encryption are done in your browser.

#### Simple Encryption Method

This method is direct and straight to the point. Your data is encrypted using your password directly. This means you can use any **AES Decrypter** to decrypt your **encrypted** value without depending on this application.

```js
password = "1234567";
encrypted = AesEncryptFunction(data, password);
```

#### Complex Encryption Method.

This method is **EXTREMELY SECURE** but can only be **decrypted** using this application because **it does not use your password to encrypt data.**.

Yes! Your password is used to generate a **Longer & Stronger Password** using a **`COMPLEX_ENCRYPTION_KEY` and `Md5 Hashing`** method.

```js
password = "1234567";
generatedPassword = GeneratePassword(password);
encrypted = AesEncryptFunction(data, generatedPassword);
```

### Show DATE in public data.

If enabled, Date of encryption will be publicly visible in the encrypted document. For best anonymity, this should be turned **off**.
<br>
Default: `true`
