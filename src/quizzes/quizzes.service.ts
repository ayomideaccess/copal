import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateQuizDto, UpdateQuizAnswerDto, UpdateQuizDto } from './quizzes.dto.js';
import { QuestionType } from '@prisma/client';

@Injectable()
export class QuizzesService {
    constructor(
        private readonly prisma: PrismaService
    ){}

    async createQuiz(userId: number, dto: CreateQuizDto, groupId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const group = await this.prisma.studyGroup.findUnique({
            where: { id: groupId },
        });

        if (!group) {
            throw new NotFoundException('Study group not found');
        }

        const membership = await this.prisma.studyGroupMember.findUnique({
            where: {
            userId_groupId: {
                userId,
                groupId: group.id,
            },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
            'You must be a member of this study group',
            );
        }

        return this.prisma.$transaction(async (tx) => {
            const quiz = await tx.quiz.create({
            data: {
                title: dto.title,
                description: dto.description,
                course: dto.course,
                timeLimit: dto.timeLimit,
                creatorId: userId,
                groupId: groupId,
            },
            });

            for (const questionDto of dto.questions) {
            const question = await tx.question.create({
                data: {
                quizId: quiz.id,
                text: questionDto.text,
                type: questionDto.type,
                correctAnswer: questionDto.correctAnswer,
                order: questionDto.order ?? 0,
                },
            });

            if (
                questionDto.type === QuestionType.MULTIPLE_CHOICE &&
                questionDto.options?.length
            ) {
                await tx.quizOption.createMany({
                data: questionDto.options.map((option) => ({
                    questionId: question.id,
                    text: option.text,
                    isCorrect: option.isCorrect ?? false,
                    order: option.order ?? 0,
                })),
                });
            }
            }

            return tx.quiz.findUnique({
            where: { id: quiz.id },
            include: {
                questions: {
                include: {
                    options: true,
                },
                },
            },
            });
        });
    }

    async getAllQuizzes(userId: number, groupId: number){
        const group = await this.prisma.studyGroup.findFirst({
            where: {
                id: groupId,
                members: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        if (!group) {
            throw new NotFoundException('Study Group not found')
        }

        const quizzes = await this.prisma.quiz.findMany({
            where: {
                groupId: group?.id,
                questions: {
                    some: { }
                }
            },
            orderBy: {
                createdAt: "desc",
        },
        });

        return quizzes;

    }

    async getQuizById(userId: number, quizId: number){
        const group = await this.prisma.studyGroup.findFirst({
            where: {
                quizzes: {
                    some: {
                        id: quizId
                    }
                },
                members: {
                    some: {
                        id: userId
                    }
                }
            }
        });

        if (!group){
            throw new NotFoundException('Quiz not found');
        }

        const quiz = await this.prisma.quiz.findUnique({
            where: {
                groupId: group?.id,
                id: quizId
            },
            include: {
                questions: {
                    orderBy: {
                        order: 'asc'
                    },
                    include: {
                        options: {
                            orderBy: {
                                order: 'asc'
                            }
                        }
                    }
                }
            }
        });

        if (!quiz){
            throw new NotFoundException('Quiz not found')
        }

        return quiz;
    }

    async updateQuiz(userId: number, quizId: number, dto: UpdateQuizDto){
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
                creatorId: userId
            }
        });
        if (!quiz){
            throw new NotFoundException('Not Found')
        }
        return this.prisma.quiz.update({
            where: {
                id: quiz.id
            },
            data: dto
        });
    }

    async deleteQuiz(userId: number, quizId: number){
        const quiz = await this.prisma.quiz.findUnique({
            where: {
                id: quizId,
                creatorId: userId
            }
        });
        if (!quiz){
            throw new NotFoundException('Not Found')
        }
        return this.prisma.quiz.delete({
            where: {
                id: quiz.id
            }
        });
    }

    async attemptQuiz(userId: number, quizId: number){
        const group = await this.prisma.studyGroup.findFirst({
            where: {
                quizzes: {
                    some: {
                        id: quizId
                    }
                },
                members: {
                    some: {
                        userId: userId
                    }
                }
            }
        });

        if (!group){
            throw new NotFoundException('Quiz not found')
        }
        const quiz = await this.prisma.quiz.findFirst({
            where: {
                id: quizId,
                groupId: group.id
            },
            include: {
                questions: true,
            }
        });
        if (!quiz){
            throw new NotFoundException('Quiz not found')
        }

        const existingAttempt = await this.prisma.quizAttempt.findUnique({
            where: {
                quizId_userId: {
                    quizId,
                    userId
                },
            },
        });

        if (!existingAttempt){
            throw new ConflictException('You have already attempted this quiz')
        }

        const attempt= await this.prisma.$transaction(async (tx) => {
            const quizAttempt = await tx.quizAttempt.create({
                data: {
                    quizId,
                    userId,
                }
            });

            await tx.quizAnswer.createMany({
                data: quiz.questions.map((question) => ({
                    questionId: question.id,
                    attemptId: quizAttempt.id
                }))
            });

            return tx.quizAttempt.findUnique({
                where: {
                    id: quizAttempt.id
                },
                include: {
                    answers: {
                        include: {
                            question: {
                                include: {
                                    options: {
                                        orderBy: {
                                            order: 'asc'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            })
        });

        return attempt;

    }

    async getAttempt(
        userId: number,
        quizId: number,
        attemptId: number,
    ) {
        const attempt = await this.prisma.quizAttempt.findFirst({
            where: {
                id: attemptId,
                quizId,
                userId,
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        course: true,
                        timeLimit: true,
                    },
                },
                answers: {
                    include: {
                        question: {
                            include: {
                                options: {
                                    orderBy: {
                                        order: 'asc',
                                    },
                                },
                            },
                        },
                        selectedOption: true,
                    },
                },
            },
        });

        if (!attempt) {
            throw new NotFoundException('Attempt not found');
        }

        return attempt;
    }

    async updateAnswer(
        userId: number,
        attemptId: number,
        questionId: number,
        dto: UpdateQuizAnswerDto,
    ) {
        const attempt = await this.prisma.quizAttempt.findFirst({
            where: {
                id: attemptId,
                userId,
            },
            include: {
                quiz: true,
            },
        });

        if (!attempt) {
            throw new NotFoundException('Attempt not found');
        }

        if (attempt.completedAt) {
            throw new BadRequestException(
                'You cannot change an answer after submitting the quiz',
            );
        }

        const question = await this.prisma.question.findFirst({
            where: {
                id: questionId,
                quizId: attempt.quizId,
            },
        });

        if (!question) {
            throw new NotFoundException(
                'Question not found in this quiz',
            );
        }

        const answer = await this.prisma.quizAnswer.findUnique({
            where: {
                questionId_attemptId: {
                    questionId,
                    attemptId,
                },
            },
        });

        if (!answer) {
            throw new NotFoundException(
                'Answer record not found for this question',
            );
        }

        if (
            question.type === QuestionType.MULTIPLE_CHOICE &&
            dto.selectedOptionId === undefined
        ) {
            throw new BadRequestException(
                'You must provide a selected option',
            );
        }

        if (
            question.type === QuestionType.TRUE_FALSE &&
            dto.answerText === undefined
        ) {
            throw new BadRequestException(
                'You must provide a true or false answer',
            );
        }

        if (
            question.type === QuestionType.MULTIPLE_CHOICE &&
            dto.selectedOptionId !== undefined
        ) {
            const option = await this.prisma.quizOption.findFirst({
                where: {
                    id: dto.selectedOptionId,
                    questionId,
                },
            });

            if (!option) {
                throw new BadRequestException(
                    'Selected option does not belong to this question',
                );
            }
        }

        return this.prisma.quizAnswer.update({
            where: {
                id: answer.id,
            },
            data: {
                selectedOptionId:
                    question.type === QuestionType.MULTIPLE_CHOICE
                        ? dto.selectedOptionId
                        : null,

                answerText:
                    question.type === QuestionType.TRUE_FALSE
                        ? dto.answerText
                        : null,
            },
        });
    }

    async submitQuiz(userId: number, attemptId: number) {
        const attempt = await this.prisma.quizAttempt.findFirst({
            where: {
                id: attemptId,
                userId,
            },
            include: {
                quiz: {
                    include: {
                        questions: {
                            include: {
                                options: true,
                            },
                        },
                    },
                },
                answers: true,
            },
        });

        if (!attempt) {
            throw new NotFoundException('Attempt not found');
        }

        if (attempt.completedAt) {
            throw new ConflictException(
                'This quiz has already been submitted',
            );
        }

        if (attempt.quiz.questions.length === 0) {
            throw new BadRequestException(
                'This quiz has no questions',
            );
        }

        const result = await this.prisma.$transaction(async (tx) => {
            let correctAnswers = 0;

            for (const question of attempt.quiz.questions) {
                const answer = attempt.answers.find(
                    (item) => item.questionId === question.id,
                );

                if (!answer) {
                    continue;
                }

                let isCorrect = false;

                if (question.type === QuestionType.MULTIPLE_CHOICE) {
                    if (answer.selectedOptionId) {
                        const selectedOption = question.options.find(
                            (option) =>
                                option.id === answer.selectedOptionId,
                        );

                        isCorrect = selectedOption?.isCorrect ?? false;
                    }
                }

                if (question.type === QuestionType.TRUE_FALSE) {
                    if (answer.answerText && question.correctAnswer) {
                        isCorrect =
                            answer.answerText.toLowerCase().trim() ===
                            question.correctAnswer.toLowerCase().trim();
                    }
                }

                if (isCorrect) {
                    correctAnswers++;
                }

                await tx.quizAnswer.update({
                    where: {
                        id: answer.id,
                    },
                    data: {
                        isCorrect,
                    },
                });
            }

            const totalQuestions = attempt.quiz.questions.length;

            const score =
                (correctAnswers / totalQuestions) * 100;

            const completedAt = new Date();

            return tx.quizAttempt.update({
                where: {
                    id: attempt.id,
                },
                data: {
                    score,
                    completedAt,
                },
                include: {
                    quiz: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    answers: {
                        include: {
                            question: true,
                            selectedOption: true,
                        },
                    },
                },
            });
        });

        return result;
    }
    
    async getResult(userId: number, quizId: number) {
        const attempt = await this.prisma.quizAttempt.findUnique({
            where: {
                quizId_userId: {
                    quizId,
                    userId,
                },
            },
            include: {
                quiz: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                    },
                },
                answers: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                text: true,
                                type: true,
                                correctAnswer: true,
                            },
                        },
                        selectedOption: true,
                    },
                },
            },
        });

        if (!attempt) {
            throw new NotFoundException(
                'You have not attempted this quiz',
            );
        }

        if (!attempt.completedAt) {
            throw new BadRequestException(
                'You have not submitted this quiz yet',
            );
        }

        const totalQuestions = attempt.answers.length;

        const correctAnswers = attempt.answers.filter(
            (answer) => answer.isCorrect === true,
        ).length;

        const wrongAnswers = attempt.answers.filter(
            (answer) => answer.isCorrect === false,
        ).length;

        const unanswered = attempt.answers.filter(
            (answer) =>
                answer.selectedOptionId === null &&
                answer.answerText === null,
        ).length;

        return {
            attemptId: attempt.id,
            quiz: attempt.quiz,
            score: attempt.score,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            unanswered,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            answers: attempt.answers,
        };
    }

    async getAttempts(userId: number, quizId: number){
        const quiz = await this.prisma.quiz.findFirst({
            where: {
                id: quizId,
                creatorId: userId
            }
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        };

        return this.prisma.quizAttempt.findMany({
            where: {
                quizId: quiz.id,
            },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            orderBy: {
                startedAt: 'desc'
            }
        })
    }
}
