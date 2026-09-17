import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ResourcesService } from './resources.service.js';
import { UploadResourceDto, UpdateResourceDto } from './resources.dto.js';
import type { Request as ExpressRequest, Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService){}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadResources(@UploadedFile() file: Express.Multer.File ,@Body() uploadResourcesDto: UploadResourceDto, @Req() req: ExpressRequest & { user: { id: number } }) {
    return this.resourcesService.uploadResource(req.user.id, uploadResourcesDto, file)
  }

  @Get('all')
  getMyResources(@Req() req: ExpressRequest & { user: { id: number } }){
    return this.resourcesService.getMyResources(req.user.id)
  }

  @Get(':resourceId')
  getAResource(@Param('resourceId', ParseIntPipe) resourceId: number, @Req() req: ExpressRequest & { user: { id: number } }){
    return this.resourcesService.getOneResource(req.user.id, resourceId)
  }

  @Patch('/:resourceId')
  updateResources(@Param('resourceId', ParseIntPipe) resourceId: number,
   @Req() req: ExpressRequest & { user: { id: number } }, @Body() updateResourceDto: UpdateResourceDto) {
    return this.resourcesService.updateResource(req.user.id, resourceId, updateResourceDto)
  }

  @Delete(':resourceId')
  deleteResources(@Param('resourceId', ParseIntPipe) resourceId: number, @Req() req: ExpressRequest & { user: { id: number } }) {
    return this.resourcesService.deleteResource(req.user.id, resourceId)
  }
  @Get('group/:groupId')
  getGroupResource(@Param('groupId', ParseIntPipe) groupId: number,
   @Req() req: ExpressRequest & { user: { id: number } }) {
    return this.resourcesService.getGroupResources(req.user.id, groupId)
  }
}


