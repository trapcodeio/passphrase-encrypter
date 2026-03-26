// This shim replaces argon2-browser's bundled WASM version in tests.
// It uses the native Node.js 'argon2' package which produces identical output.
import argon2Native from "argon2";

const argon2 = {
  ArgonType: {
    Argon2d: 0 as const,
    Argon2i: 1 as const,
    Argon2id: 2 as const
  },
  async hash(options: {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    time?: number;
    mem?: number;
    hashLen?: number;
    parallelism?: number;
    type?: number;
  }) {
    const salt = Buffer.from(
      options.salt instanceof Uint8Array
        ? options.salt
        : new TextEncoder().encode(options.salt)
    );
    const pass =
      typeof options.pass === "string" ? options.pass : Buffer.from(options.pass);

    const hash = await argon2Native.hash(pass, {
      salt,
      timeCost: options.time || 2,
      memoryCost: options.mem || 2048,
      parallelism: options.parallelism || 1,
      hashLength: options.hashLen || 32,
      type: argon2Native.argon2id,
      raw: true
    });

    return {
      hash: new Uint8Array(hash),
      hashHex: Buffer.from(hash).toString("hex"),
      encoded: ""
    };
  }
};

export default argon2;
