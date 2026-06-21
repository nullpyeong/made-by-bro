import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

// PrismaModule은 @Global이라 별도 import 불필요.
@Module({
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
