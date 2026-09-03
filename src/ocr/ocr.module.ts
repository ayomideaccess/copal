import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service.js';

@Module({
  providers: [OcrService]
})
export class OcrModule {}
