import { Controller, Get, Post, Body, Patch, Param, Delete, UploadedFile, UseInterceptors, UseGuards, HttpStatus, HttpException, Query, Redirect } from '@nestjs/common';
import { AiService } from './ai.service';
import { Author } from 'src/users/entities/author.entity';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import { ReqFile } from 'src/image/entities/image.entity';
import { FileInterceptor } from '@nest-lab/fastify-multer';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) { }

  @Post('/prompt-image/:id')
  // @UseGuards(MyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async textToImage(
    @UploadedFile() file: ReqFile | undefined,
    @RestApiSessionUser() session: Author,
    @Query('prompt') prompt: string,
    @Param('id') id: string
  ) {
    if (!prompt) { throw new HttpException('Empty Input Not Allow', HttpStatus.BAD_REQUEST); }
    const data = await this.aiService.textToImageGenerate(session.id, id, prompt, file);
    return data;
  }

  @Post('/create/:id')
  // @UseGuards(MyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async createAiChatSession(
    @UploadedFile() file: ReqFile | undefined,
    @RestApiSessionUser() session: Author,
    @Query('prompt') prompt: string,
    @Param('id') id: string
  ) {
    if (!prompt) { throw new HttpException('Empty Input Not Allow', HttpStatus.BAD_REQUEST); }
    const data = await this.aiService.createAiChatSession(session?.id);
    return data;
  }

  @Post('/prompt/:id')
  // @UseGuards(MyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async textToText(
    @UploadedFile() file: ReqFile | undefined,
    @RestApiSessionUser() session: Author,
    @Query('prompt') prompt: string,
    @Param('id') id: string
  ) {
    if (!prompt) { throw new HttpException('Empty Input Not Allow', HttpStatus.BAD_REQUEST); }
    const data = await this.aiService.textToTextGenerate(session?.id, id, prompt, file);
    return data;
  }
}
