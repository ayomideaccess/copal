import { Controller, Get, Param, ParseIntPipe, Req } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ProgressService } from './progress.service.js';

@Controller('progress')
export class ProgressController {
    constructor(private readonly progressService: ProgressService){}

    @Get('quiz-scores')
    viewQuizScores(@Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.viewQuizScores(req.user.id)
    }

    @Get('average-performance')
    viewAveragePerf(@Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.viewAveragePerf(req.user.id)
    }

    @Get('quiz-stats')
    getQuizStat(@Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.getQuizStats(req.user.id)
    }

    @Get('quiz-attempts')
    getQuizAttempts(@Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.getQuizAttempts(req.user.id)
    }

    @Get('quiz-attempt/:attemptId')
    getAnAttempt(@Param('attemptId', ParseIntPipe) attemptId: number, @Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.getAnAttempt(req.user.id, attemptId)
    }

    @Get('study-groups/performance')
    getGroupsPerf(@Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.getGroupsPerf(req.user.id)
    }

    @Get('performance-over-time')
    getPerfOverTime(@Req() req: ExpressRequest & { user: { id: number } }){
        return this.progressService.getPerfOverTime(req.user.id)
    }
}
