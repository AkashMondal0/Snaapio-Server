import fs from 'node:fs';
import path from "node:path";

export const dataParser = (data: any) => {
    return JSON.parse(data, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
            return new Date(value);
        }
        return value;
    });
};