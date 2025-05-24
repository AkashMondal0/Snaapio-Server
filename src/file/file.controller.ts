import {
  Controller,
  Get,
  Param,
  Post, Query, UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileService } from './file.service';
import { UploadData } from './types';
import { FileInterceptor } from '@nest-lab/fastify-multer';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import { ReqFile } from 'src/image/entities/image.entity';

@Controller({
  path: 'file',
  version: "1"
})
export class FileController {
  constructor(private readonly fileService: FileService) { }

  @Post('video/upload')
  @UseGuards(MyAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter(req, file, callback) {
      const allowedTypes = ['video/mp4', 'video/mkv', 'video/avi'];
      if (!allowedTypes.includes(file.mimetype)) {
        return callback(new Error('Invalid file type'), false);
      }
      callback(null, true);
    },
  }))
  uploadFile(
    @UploadedFile() file: ReqFile,
    @RestApiSessionUser() user: any,
    @Query("start") start?: number,
    @Query("end") end?: number,
    @Query("muted") muted?: boolean,
    @Query("title") title?: string,
    @Query("caption") caption?: string,
  ) {
    const data: UploadData = {
      file: file,
      user,
      muted,
      title,
      caption,
      start,
      end,
      resize: undefined,
      ratio: undefined,
    };
    return this.fileService.uploadFile(data);
  }

  // @UseGuards(MyAuthGuard)
  // @Get('video/job-status/:jobId')
  // getJobStatus(@Param('jobId') jobId: string, @RestApiSessionUser() user: any) {
  //   // console.log(user)
  //   return this.fileService.getJobStatus(jobId);
  // };

}
