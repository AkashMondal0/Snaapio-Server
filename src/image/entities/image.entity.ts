export class Image {}
export type ReqFile = {
	fieldname: string,
	originalname: string,
	encoding: string,
	mimetype: string,
	buffer: Buffer,
	size: number
  }