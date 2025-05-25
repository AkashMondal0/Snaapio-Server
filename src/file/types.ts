import { ReqFile } from "src/image/entities/image.entity";

export type UploadData = {
	file: ReqFile;
	start: any,
	title: any,
	caption: any,
	end: any,
	muted: any,
	resize: any,
	user: any
	ratio: any
}

export type VideoOption = {
	start: string;
	end: string;
	muted: string;
	resize: string;
	ratio: string;
};

export type VideoTranscodeQueuePayload = {
	jobDir: string, jobId: string, url: string, videoOption: VideoOption
} 