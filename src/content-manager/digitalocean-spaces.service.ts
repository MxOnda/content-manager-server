import { ObjectCannedACL, PutObjectCommand, PutObjectAclCommand, S3, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class DigitaloceanSpacesService {
  private readonly s3Client: S3;
  private readonly assetsBucketName: string;

  constructor(private readonly configService: ConfigService) {
    console.log(this.configService.get<string>("DIGITALOCEAN_SPACES_ACCESS_KEY"));
    
    this.s3Client = new S3({
      region: this.configService.get<string>("AWS_S3_REGION")!,
      credentials: {
        accessKeyId: this.configService.get<string>("DIGITALOCEAN_SPACES_ACCESS_KEY")!,
        secretAccessKey: this.configService.get<string>("DIGITALOCEAN_SPACES_SECRET_KEY")!,
      },
      endpoint: this.configService.get<string>("DIGITALOCEAN_SPACES_ENDPOINT")!,
    });
    this.assetsBucketName = this.configService.get<string>("DIGITALOCEAN_SPACES_ASSETS_BUCKET_NAME")!;
  }

  async upload(file: Express.Multer.File, path: string) {
    const buffer = Buffer.from(file.buffer);
    const randomId = crypto.randomUUID();
    const filename = `${randomId}.${file.originalname.split(".").pop()}`;

    const command = new PutObjectCommand({
      Bucket: this.assetsBucketName,
      Key: `${path}/${filename}`,
      Body: buffer,
      ACL: "public-read",
      ContentType: file.mimetype,
    });

    try {
      const result = await this.s3Client.send(command);

      const multimediaUrl = `https://${this.assetsBucketName}.nyc3.cdn.digitaloceanspaces.com/${path}/${filename}`;
      console.log(multimediaUrl);

      return { filename, statusCode: result.$metadata.httpStatusCode ?? 0, multimediaUrl };
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      
      console.error(`Error uploading file ${filename}: ${error.message}`);
      return { filename, statusCode: 500 };
    }
  }

  async changeFilesVisibility({ paths, visibility }: { paths: string[]; visibility: ObjectCannedACL }) {
    return Promise.all(
      paths.map(async (path) => {
        const command = new PutObjectAclCommand({ Bucket: this.assetsBucketName, Key: path, ACL: visibility });

        try {
          await this.s3Client.send(command);

          return { path, success: true };
        } catch (error) {
          console.error(`Error changing visibility for ${path}: ${error.message}`);
          return { path, success: false };
        }
      }),
    );
  }

  async delete({ paths }: { paths: string[] }) {
    return Promise.all(
      paths.map(async (path) => {
        const command = new DeleteObjectCommand({ Bucket: this.assetsBucketName, Key: path });

        try {
          await this.s3Client.send(command);

          return { path, success: true };
        } catch (error) {
          console.error(`Error deleting file ${path}: ${error.message}`);
          return { path, success: false };
        }
      }),
    );
  }
}
