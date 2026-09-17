import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateResourceDto, UploadResourceDto } from './resources.dto.js';
import { CloudinaryService } from './cloudinary.service.js';

@Injectable()
export class ResourcesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService
    ){}

    async uploadResource(userId: number, dto: UploadResourceDto, file: Express.Multer.File){
      const user = await this.prisma.user.findUnique({
        where: {
            id: userId
        }
      });
      if (!user){
        throw new NotFoundException('User not found');
      }
      const uploadResult = await this.cloudinary.uploadFile(file);
      
      const storage = uploadResult.public_id;
      
      return await this.prisma.resource.create({
        data: {
            title: dto.title,
            description: dto.description,
            course: dto.course,
            uploaderId: user.id,

            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            storageKey: storage
        }
      })
    }
    async getMyResources(userId: number){
      const resources = await this.prisma.resource.findMany({
        where: {
            uploaderId: userId
        },
        select: { fileName: true, title: true }
      });

      return resources;
    }

    async getOneResource(userId:number, resourceId: number){
        const resource = await this.prisma.resource.findFirst({
            where: {
                id: resourceId,
                uploaderId: userId
            }
        })
        if (!resource){
            throw new NotFoundException('Resource not found')
        }
        return resource;
    }

    async updateResource(userId: number, resourceId: number, dto: UpdateResourceDto){
        const resource = await this.prisma.resource.findFirst({
            where: {
                id: resourceId,
                uploaderId: userId
            }
        })
        if (!resource){
            throw new NotFoundException('Resource not found')
        }
        return await this.prisma.resource.update({
            where: {
                id: resource.id
            },
            data: dto
        });
    }
    async deleteResource(userId: number, resourceId: number){
        const resource = await this.prisma.resource.findUnique({
            where: {
                id: resourceId,
                uploaderId: userId
            }
        })
        if (!resource){
            throw new NotFoundException('Resource not found')
        }
        return await this.prisma.resource.delete({
            where: {
                id: resource.id
            }
        });    
    }
    async getGroupResources(userId: number, groupId: number){
        const resources = await this.prisma.resource.findMany({
            where: {
                uploaderId: userId,
                groupLinks: {
                    some: {
                        id: groupId
                    }
                }
            }
        })
        if (!resources){
            throw new NotFoundException('Resources not found')
        }
    
        return resources;
    }
}
