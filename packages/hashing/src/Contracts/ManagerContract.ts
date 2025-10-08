export type HashAlgorithm = 'bcrypt' | 'argon' | 'argon2id' //| 'argon2i' | 'argon2' | 'unknown'

export interface Configuration {
    [key: string]: any;
    /**
     * Default Hash Driver
     * -------------------
     * This option controls the default hash driver that will be used to hash
     * passwords for your application. By default, the bcrypt algorithm is
     * used; however, you remain free to modify this option if you wish.
     */
    driver: HashAlgorithm;

    /**
     * Bcrypt Options
     * --------------
     * Here you may specify the configuration options that should be used when
     * passwords are hashed using the Bcrypt algorithm. This will allow you
     * to control the amount of time it takes to hash the given password.
     */
    bcrypt: {
        rounds: number;
        verify: boolean;
        limit: number | null;
    },

    /**
     * Argon Options
     * -------------
     * Here you may specify the configuration options that should be used when
     * passwords are hashed using the Argon algorithm. These will allow you
     * to control the amount of time it takes to hash the given password.
     */
    argon: {
        memory: number;
        threads: number;
        time: number;
        verify: boolean;
    },
}

export type Options = Partial<Configuration['bcrypt'] & Configuration['argon']>

export interface BcryptOptions {
    cost: number
}

export interface Argon2Options {
    memoryCost: number
    timeCost: number
    threads: number
}

export interface UnknownOptions {
    [key: string]: any
}

export interface Info {
    algo: number;

    algoName: HashAlgorithm;

    options: {
        cost?: number | undefined
        memoryCost?: number | undefined
        timeCost?: number | undefined
        threads?: number | undefined
        [key: string]: number | undefined
    }
} 
