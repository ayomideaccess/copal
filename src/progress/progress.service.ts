import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProgressService {
    constructor(private readonly prisma: PrismaService){}

    async viewQuizScores(userId: number){
        return this.prisma.quizAttempt.findMany({
            where: {
                userId,
                completedAt: {
                    not: null
                }
            },
            select: {
                id: true,
                score: true,
                completedAt: true,
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        group: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    },
                },
            },
            orderBy: {
                completedAt: 'desc',
            },
        });
    }

    async viewAveragePerf(userId: number){
        const result = await this.prisma.quizAttempt.aggregate({
            where: {
                userId,
                completedAt: {
                    not: null,
                },
                score: {
                    not: null,
                },
            },
            _avg: {
                score: true,
            },
    });

    return {
        averageScore: result._avg.score ?? 0,
    };
    }

    async getQuizStats(userId: number){
        const stats = await this.prisma.quizAttempt.aggregate({
            where: {
                userId,
                completedAt: {
                    not: null,
                },
                score: {
                    not: null,
                },
            },
            _count: {
                id: true,
            },
            _avg: {
                score: true,
            },
            _max: {
                score: true,
            },
            _min: {
                score: true,
            },
        });

        return {
            totalQuizzes: stats._count.id,
            averageScore: stats._avg.score ?? 0,
            highestScore: stats._max.score ?? 0,
            lowestScore: stats._min.score ?? 0,
        };
    }

    async getQuizAttempts(userId: number){
        return this.prisma.quizAttempt.findMany({
            where: {
                userId,
            },
            select: {
                id: true,
                score: true,
                startedAt: true,
                completedAt: true,
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        timeLimit: true,
                        group: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startedAt: 'desc',
            },
        });
    }

    async getAnAttempt(userId: number, attemptId: number){
        return this.prisma.quizAttempt.findFirst({
            where: {
                id: attemptId,
                userId,
            },
            select: {
                id: true,
                score: true,
                startedAt: true,
                completedAt: true,
                quiz: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                answers: {
                    select: {
                        id: true,
                        answerText: true,
                        isCorrect: true,
                        selectedOption: {
                            select: {
                                id: true,
                                text: true,
                            },
                        },
                        question: {
                            select: {
                                id: true,
                                text: true,
                                type: true,
                                correctAnswer: true,
                                explanation: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async getGroupsPerf(userId: number){
        const attempts = await this.prisma.quizAttempt.findMany({
            where: {
                userId,
                completedAt: {
                    not: null,
                },
                score: {
                    not: null,
                },
            },
            select: {
                score: true,
                quiz: {
                    select: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        const groups = new Map<
            number,
            {
                groupId: number;
                groupName: string;
                totalQuizzes: number;
                totalScore: number;
            }
        >();

        for (const attempt of attempts) {
            const group = attempt.quiz.group;

            if (!group || attempt.score === null) {
                continue;
            }

            const existing = groups.get(group.id);

            if (existing) {
                existing.totalQuizzes += 1;
                existing.totalScore += attempt.score;
            } else {
                groups.set(group.id, {
                    groupId: group.id,
                    groupName: group.name,
                    totalQuizzes: 1,
                    totalScore: attempt.score,
                });
            }
        }

        return Array.from(groups.values()).map((group) => ({
            groupId: group.groupId,
            groupName: group.groupName,
            quizzesTaken: group.totalQuizzes,
            averageScore: group.totalScore / group.totalQuizzes,
        }));
    }

    async getPerfOverTime(userId: number){
        return this.prisma.quizAttempt.findMany({
            where: {
                userId,
                completedAt: {
                    not: null,
                },
                score: {
                    not: null,
                },
            },
            select: {
                score: true,
                completedAt: true,
                quiz: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: {
                completedAt: 'asc',
            },
        });
    }
}
