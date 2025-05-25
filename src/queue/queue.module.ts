import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VideoTranscodeProcessor } from './video.transcode.processor';
import configuration from 'src/configs/configuration';
import { FileModule } from 'src/file/file.module';


@Module({
    imports: [
        FileModule,
        BullModule.forRoot({
            connection: {
                url: configuration().REDIS_URL
            }
        }),
    ],
    providers: [VideoTranscodeProcessor],
    exports: [],
})
export class QueueModule { }
