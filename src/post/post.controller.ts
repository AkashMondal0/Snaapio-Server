import { FastifyReply } from 'fastify';
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors, } from '@nestjs/common';
import { PostService } from './post.service';
import { FileInterceptor } from '@nest-lab/fastify-multer';
// import { CreatePostPayload, CreatePostSchema, UpdatePostPayload, UpdatePostSchema } from 'src/lib/validation/ZodSchema';
// import { ZodValidationPipe } from 'src/lib/validation/Validation';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';
import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import path from 'path';
import { generateRandomString } from 'src/lib/id-generate';
@Controller({
    path: 'post',
    version: ['1']
})
export class PostController {
    constructor(private readonly postService: PostService) { }

    @Get(':id')
    async findOne(@Param('id') id: string, @Res() res: FastifyReply) {

        try {
            const Post = await this.postService.findPublicPostData(id);
            if (!Post) {
                throw new HttpException('Post Not Found', HttpStatus.NOT_FOUND);
            }
            return res.send(Post)
        } catch (error) {
            throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }

    }

    @Post('/uploadImage')
    // @UseGuards(MyAuthGuard)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } })) // 5MB limit
    async uploadImage(@UploadedFile() file, @Body() body) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        const ASPECT_RATIOS = {
            "1:1": { width: 300, height: 300 },
            "4:5": { width: 1080, height: 1350 },
            "16:9": { width: 1920, height: 1080 },
        };

        // Validate aspect ratio
        if (!ASPECT_RATIOS["1:1"]) {
            return { message: 'Invalid aspect ratio' };
        }

        const { width, height } = ASPECT_RATIOS["4:5"];

        // Compress image with Sharp
        const compressedImage = await sharp(file.buffer)
            .resize({ width, height, fit: "cover" }) // Crop to fit aspect ratio
            .jpeg({ quality: 70 }) // Convert to JPEG and reduce quality to 70%
            .toBuffer();

        await writeFile(`uploads/${generateRandomString({})}${file.originalname}`, compressedImage);
        const imageDirectory = path.join(__dirname, 'uploads');
        const imageName = `compressed_${file.originalname}`;
        const imageLink = path.join(imageDirectory, imageName);
        return imageLink;
    }

    // @Put()
    // @Version('1')
    // @HttpCode(HttpStatus.OK)
    // @UseGuards(MyAuthGuard)
    // @UsePipes(new ZodValidationPipe(UpdatePostSchema))
    // async UpdatePost(@Req() req: FastifyRequest, @Body() body: UpdatePostPayload) {
    //     req.user
    //     return this.postService.create(body);
    // }

    // @Delete()
    // @Version('1')
    // @HttpCode(HttpStatus.OK)
    // @UsePipes(new ZodValidationPipe(UpdatePostSchema))
    // @UseGuards(MyAuthGuard)
    // async DeletePost(@Res() res: FastifyReply, @Body() body: { id: string }): Promise<void> {
    //     const data = await this.postService.remove(body.id);
    //     if (!data) {
    //         res.status(200).send({ message: 'Post deleted successfully' });
    //         return;
    //     }
    //     throw new HttpException('Internal Server Error', 500);
    // }
}
