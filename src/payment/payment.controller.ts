import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FastifyReply } from 'fastify';
@Controller({
  path: 'payment',
  version: '1',
})
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post("sheet")
  async create(@Body() data: any,
    @Res() Res: FastifyReply
  ) {
    const res = await this.paymentService.paymentSheet();
    return Res.status(200).send(res);
  }
}
