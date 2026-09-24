import { QuestionType } from '@prisma/client';

 export class CreateQuizOptionDto {
  text: string;
  isCorrect?: boolean;
  order?: number;
}

export class CreateQuestionDto {
  text: string;
  type: QuestionType;
  correctAnswer?: string;
  explanation?: string;
  order?: number;
  options?: CreateQuizOptionDto[];
}

export class CreateQuizDto {
  title: string;
  description?: string;
  course?: string;
  groupId: number;
  timeLimit?: number;
  questions: CreateQuestionDto[];
}

export class UpdateQuizDto {
  title?: string;
  description?: string;
  course?: string;
  timeLimit?: number;
}

export class SubmitAnswerDto {
  questionId: number;
  selectedOptionId?: number;
  answerText?: string;
}

export class SubmitQuizDto {
  answers: SubmitAnswerDto[];
}

export class UpdateQuizAnswerDto {
    selectedOptionId?: number;
    answerText?: string;
}

