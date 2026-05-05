import sha1 from "crypto-js/sha1";

export const checkPassword = async (password) => {

    const hash = sha1(password).toString().toUpperCase();

    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);

    const response = await fetch(
        `https://api.pwnedpasswords.com/range/${prefix}`
    );

    const data = await response.text();

    const lines = data.split("\n");

    for (let line of lines) {
        const [hashSuffix, count] = line.split(":");

        if (hashSuffix === suffix) {
            return {
                compromised: true,
                count: parseInt(count)
            };
        }
    }

    return {
        compromised: false,
        count: 0
    };
};