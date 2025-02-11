import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationResolver } from './notification.resolver';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { NotificationController } from './notification.controller';
import { EventsModule } from 'src/event/event.module';

@Module({
  imports: [DrizzleModule, EventsModule],
  providers: [NotificationResolver, NotificationService, EventsModule],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule { }
