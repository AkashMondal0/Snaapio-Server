import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VideoTranscodeProcessor } from './services/video.transcode.processor';
import configuration from 'src/configs/configuration';
import { FileModule } from 'src/file/file.module';
import { ImageProcessor } from './services/image.processor';
import { ImageModule } from 'src/image/image.module';


@Module({
    imports: [
        FileModule,
        ImageModule,
        BullModule.forRoot({
            connection: {
                url: configuration().REDIS_URL
            }
        }),
    ],
    providers: [VideoTranscodeProcessor, ImageProcessor],
    exports: [],
})
export class QueueModule { }
