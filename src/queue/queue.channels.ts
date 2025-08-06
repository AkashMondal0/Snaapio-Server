import { BullModule } from "@nestjs/bullmq";

export const VideoTranscodeQueue = BullModule.registerQueue({
    name: 'VideoTranscodeQueue',
});

export const ImageProcessQueue = BullModule.registerQueue({
    name: 'ImageProcessQueue',
});