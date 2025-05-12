import { Author } from "src/users/entities/author.entity";

export class Image { }
export type ReqFile = {
	fieldname: string,
	originalname: string,
	encoding: string,
	mimetype: string,
	buffer: Buffer,
	size: number
}

export type shortUploadType = {
	url: string,
	title: any,
	content: any,
	authorId: Author["id"],
	thumbnailUrl: string
}