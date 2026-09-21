import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { QuizzesService } from './quizzes.service.js';
import { CreateQuizDto, UpdateQuizDto } from './quizzes.dto.js';
import type { Request as ExpressRequest } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService){}

  @Post(':groupId')
  createQuiz(@Body() createQuizDto: CreateQuizDto, @Param('groupId', ParseIntPipe) groupId: number, 
   @Req() req: ExpressRequest & { user: { id: number }} ){
    return this.quizzesService.createQuiz(req.user.id, createQuizDto, groupId)
   }
  
  @Get(':groupIdId')
  getAllQuizzes(@Param('quizId', ParseIntPipe) groupId: number,
   @Req() req: ExpressRequest & { user: {id: number} }){
    return this.quizzesService.getAllQuizzes(req.user.id, groupId)
   }

  @Get(':quizId')
  getQuizById(@Param('quizId', ParseIntPipe) quizId: number,
   @Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.getQuizById(req.user.id, quizId)
   }

  @Patch(':quizId')
  updateQuiz(@Param('quizId', ParseIntPipe) quizId: number,
   @Req() req: ExpressRequest & {user: {id: number}}, 
   @Body() updateQuizDto: UpdateQuizDto){
    return this.quizzesService.updateQuiz(req.user.id, quizId, updateQuizDto)
   }

  @Delete(':quizId')
  deleteQuiz(@Param('quizId', ParseIntPipe) quizId: number,
   @Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.deleteQuiz(req.user.id, quizId)
   }

  @Post(':quizId')
  attemptQuiz(@Param('quizId', ParseIntPipe) quizId: number,
   @Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.attemptQuiz(req.user.id, quizId)
   }

  @Get(':quizId/attempt/:attemptId')
  getAttempt(@Param('quizId', ParseIntPipe) quizId: number,
   @Param('attemptId', ParseIntPipe) attemptId: number,
   @Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.getAttempt(req.user.id, quizId, attemptId)
   }

  @Post('attemptId')
  submitQuiz(@Param('attemptId', ParseIntPipe) attemptId: number,
   @Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.getQuizById(req.user.id, attemptId)
   }

  @Get('quizId')
  getResult(@Param('quizId', ParseIntPipe) quizId: number,
   @Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.getResult(req.user.id, quizId)
   }

  @Get('quizId')
  getAttempts(@Param('quizId', ParseIntPipe) quizId: number,@Req() req: ExpressRequest & {user: {id: number}}){
    return this.quizzesService.getAttempts(req.user.id, quizId)
   }

}
