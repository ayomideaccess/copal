import { Module } from '@nestjs/common';
import { ResourcesController } from './resources.controller.js';
import { ResourcesService } from './resources.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PassportModule } from '@nestjs/passport';
import { CloudinaryService } from './cloudinary.service.js';

@Module({
  imports: [PrismaModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    })
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService, CloudinaryService]
})
export class ResourcesModule {}
