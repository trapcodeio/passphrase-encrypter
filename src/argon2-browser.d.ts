declare module "argon2-browser" {
  const ArgonType: {
    Argon2d: 0;
    Argon2i: 1;
    Argon2id: 2;
  };

  interface ArgonHashOptions {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    time?: number;
    mem?: number;
    hashLen?: number;
    parallelism?: number;
    type?: number;
  }

  interface ArgonHashResult {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }

  function hash(options: ArgonHashOptions): Promise<ArgonHashResult>;
  function verify(options: {
    pass: string | Uint8Array;
    encoded: string;
    type?: number;
  }): Promise<boolean>;

  export { ArgonType, hash, verify };
}

declare module "argon2-browser/dist/argon2-bundled.min.js" {
  const argon2: {
    ArgonType: {
      Argon2d: 0;
      Argon2i: 1;
      Argon2id: 2;
    };
    hash(options: {
      pass: string | Uint8Array;
      salt: string | Uint8Array;
      time?: number;
      mem?: number;
      hashLen?: number;
      parallelism?: number;
      type?: number;
    }): Promise<{
      hash: Uint8Array;
      hashHex: string;
      encoded: string;
    }>;
  };
  export default argon2;
}
