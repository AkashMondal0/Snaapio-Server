import * as bcrypt from "bcryptjs";


const createHash = async (password: string) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
}

export { createHash, comparePassword };