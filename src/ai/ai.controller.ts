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

  @Post('/gemini2/:id')
  @UseGuards(MyAuthGuard)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async textToText(
    @UploadedFile() file: ReqFile | undefined,
    @RestApiSessionUser() session: Author,
    @Query('prompt') prompt: string,
    @Param('id') id: string
  ) {
    if (!prompt) { throw new HttpException('Empty Input Not Allow', HttpStatus.BAD_REQUEST); }
    return await this.aiService.modelGemini2Flash(session.id, id, prompt, file);
  }

  @Post('/text-to-image/:id')
  @UseGuards(MyAuthGuard)
  async textToImage(
    @RestApiSessionUser() session: Author,
    @Param('id') id: string,
    @Body('prompt') prompt: string,
  ) {
    if (!prompt) { throw new HttpException('Empty Input Not Allow', HttpStatus.BAD_REQUEST); }
    return await this.aiService.modelGemini2FlashImageGeneration(session?.id, id, prompt);
  }

  @Post('/create')
  @UseGuards(MyAuthGuard)
  async createChatSession(
    @RestApiSessionUser() session: Author,
    @Body('data') data: any,
  ) {
    return await this.aiService.createAiChatSession(session, data);
  }
}
