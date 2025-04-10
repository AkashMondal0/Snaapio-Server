import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
