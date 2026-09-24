import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchMessageDto {
    @IsString()
    @IsNotEmpty()
    keyword: string;
}

export class GetMessagesDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;
}

export class SendMessageDto{
    content: string;
}

export class UpdateMessageDto{
    content: string;
}

export class ReplyMessageDto {
    @IsString()
    @IsNotEmpty()
    content: string;
}