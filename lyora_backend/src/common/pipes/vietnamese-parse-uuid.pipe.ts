import { BadRequestException, Injectable, ParseUUIDPipe } from '@nestjs/common';

@Injectable()
export class VietnameseParseUUIDPipe extends ParseUUIDPipe {
  constructor() {
    super({
      exceptionFactory: () =>
        new BadRequestException('Định dạng mã định danh không hợp lệ'),
    });
  }
}
