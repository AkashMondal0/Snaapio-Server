import * as crypto from 'crypto';
type CharacterSet = 'numeric' | 'upper' | 'lower' | 'uppernumeric' | 'lowernumeric' | 'scoped' | 'default';

export const generateRandomString = ({ length = 12, type = "default" }: { length?: number, type?: CharacterSet }): string => {
    let characters = '';
    switch (type) {
        case 'numeric':
            characters = '0123456789';
            break;
        case 'upper':
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            break;
        case 'lower':
            characters = 'abcdefghijklmnopqrstuvwxyz';
            break;
        case 'uppernumeric':
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            break;
        case 'lowernumeric':
            characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
            break;
        case 'scoped':
            characters = 'ABCDEF';
            break;
        default:
            characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }

    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(crypto.randomBytes(1)[0] % charactersLength));
    }

    return result;
}