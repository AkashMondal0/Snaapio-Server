import { BullModule } from "@nestjs/bullmq";

export const VideoTranscodeQueue = BullModule.registerQueue({
    name: 'VideoTranscodeQueue',
});
