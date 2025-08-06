import { FastifyReply, FastifyRequest } from 'fastify';
import { Controller, Get, Query, Post, Body, Put, Param, Delete, HttpStatus, Res, Req, HttpException } from '@nestjs/common';
import { UsersService } from './users.service';
import { KafkaService } from 'src/kafka/kafka.producer';


@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private usersService: UsersService,
    private kafkaService: KafkaService
  ) { }

  @Get(':user')
  async findOne(@Param('user') id: string, @Res() res: FastifyReply) {

    try {
      const user = await this.usersService.findUserPublicData(id);
      if (!user) {
        throw new HttpException('User Not Found', HttpStatus.NOT_FOUND);
      }
      return res.send(user)
    } catch (error) {
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }

  }

  @Get('create')
  async create(@Res() res: FastifyReply): Promise<any> {
    try {
      await this.kafkaService.sendTopicMessage('test-topic', 'create a user');
      return res.send("create a user");
    } catch (error) {
      console.error(error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // @Get('nearest')
  // async findNearByUsers(
  //   @Query('latitude') latitude: string,
  //   @Query('longitude') longitude: string,
  //   @Query('distance') distance: string,
  // ): Promise<any> {
  //   try {
  //     const parsedLat = parseFloat(latitude);
  //     const parsedLon = parseFloat(longitude);
  //     const parsedDistance = parseFloat(distance);

  //     if (isNaN(parsedLat) || isNaN(parsedLon) || isNaN(parsedDistance)) {
  //       throw new HttpException('Invalid query parameters', HttpStatus.BAD_REQUEST);
  //     }

  //     const users = await this.usersService.findNearestUsers(parsedLat, parsedLon, parsedDistance);
  //     return users;
  //   } catch (error) {
  //     console.error(error);
  //     throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
  //   }
  // }


  // @Put(':id')
  // update(@Param('id') id: string, @Body() updateCatDto: UpdateCatDto) {
  //     return `This action updates a #${id} cat`;
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //     return `This action removes a #${id} cat`;
  // }
}
