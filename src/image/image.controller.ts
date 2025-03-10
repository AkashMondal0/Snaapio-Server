import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query, HttpException, HttpStatus, Logger, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ImageService } from './image.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { supabase } from 'src/lib/Supabase';
import { FastifyReply } from 'fastify';
import { FilesInterceptor } from '@nest-lab/fastify-multer';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import { Author } from 'src/users/entities/author.entity';
import { ReqFile } from './entities/image.entity';
import sharp from 'sharp';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) { }

  @Post()
  create(@Body() createImageDto: CreateImageDto) {
    return this.imageService.create(createImageDto);
  }

  @Get()
  findAll() {
    return this.imageService.findAll();
  }

  @Post('/upload')
  @UseGuards(MyAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 5, { limits: { fileSize: 20 * 1024 * 1024 } }))
  async uploadImage(@UploadedFiles() files: ReqFile[], @RestApiSessionUser() session: Author) {
    try {
      const data = await this.imageService.compressedImages(files, session.id)
      return data;
    } catch (error) {
      console.log(error)
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findImage(
    @Param('id') id: string,
    @Res() res: FastifyReply,
    @Query("w") w?: string,
    @Query("h") h?: string,
    @Query("q") q?: string,
  ) {
    try {
      // Get the original image from the Supabase bucket
      const { data: originalImage, error: downloadError } = await supabase.storage.from('snaapio-production').download(id);
      if (downloadError || !originalImage) {
        throw new HttpException(`Failed to download image: ${downloadError?.message}`, HttpStatus.NOT_FOUND);
      }

      // Convert original image to Buffer
      const imageBuffer = Buffer.from(await originalImage.arrayBuffer());

      // Optimize the image using sharp
      const optimizedImage = await sharp(imageBuffer)
        .resize(w ? Number(w) : undefined, h ? Number(h) : undefined) // Allow optional resizing
        .jpeg({ quality: q ? Number(q) : 70 }) // Default quality if not provided
        .toBuffer();

      // Send the optimized image
      res.type("image/jpeg").send(optimizedImage);
    } catch (error) {
      Logger.error("Image processing failed:", error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
    return this.imageService.update(+id, updateImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imageService.remove(+id);
  }
}
