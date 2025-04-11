import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePayment, SheetSuccessBody } from './entities/payment.entity';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import { Author } from 'src/users/entities/author.entity';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';
@Controller({
  path: 'payment',
  version: '1',
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @UseGuards(MyAuthGuard)
  @Post("sheet")
  async Create(@Body() data: CreatePayment) {
    return await this.paymentService.paymentSheet(data);
  };
  
  @UseGuards(MyAuthGuard)
  @Post("sheet-success")
  async SheetSuccess(@Body() data: SheetSuccessBody, @RestApiSessionUser() session: Author,) {
    return await this.paymentService.sheetSuccess(session, data);
  }
}
