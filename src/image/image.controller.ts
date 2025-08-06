import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, HttpException, HttpStatus, Logger, UseGuards, UseInterceptors, UploadedFiles, Req, ParseFilePipeBuilder } from '@nestjs/common';
import { ImageService } from './image.service';
import { FastifyReply } from 'fastify';
import { FilesInterceptor } from '@nest-lab/fastify-multer';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import { Author } from 'src/users/entities/author.entity';
import { ReqFile, shortUploadType } from './entities/image.entity';
import { AssetUrls } from 'src/post/entities/post.entity';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) { }

  @Post('/upload')
  @UseGuards(MyAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 100 * 1024 * 1024 } }))
  async uploadImage(@UploadedFiles() files: ReqFile[], @RestApiSessionUser() session: Author) {
    const data = await this.imageService.uploadImage(files, session.id)
    return data;
  }

  @Post('/upload_variant')
  @UseGuards(MyAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit per file
    })
  )
  async uploadImageVariant(
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: 'image/jpeg' }) // use `image/jpeg` not just `jpeg`
        .addMaxSizeValidator({ maxSize: 100 * 1024 * 1024 }) // 100MB in bytes
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        })
    )
    files: ReqFile[],
    @RestApiSessionUser() session: Author,
  ): Promise<AssetUrls[]> {
    const data = await this.imageService.compressedImages(files, session.id);
    return data;
  }

  @Get(':id/:path')
  async findImage(
    @Param('id') id: string,
    @Param('path') path: string,
    @Res() res: FastifyReply,
    @Query("w") w?: string,
    @Query("h") h?: string,
    @Query("q") q?: string,
  ) {
    const optimizedImage = await this.imageService.imageOptimization({ id, path, w, h, q });
    res.type("image/jpeg").send(optimizedImage);
  }

}
