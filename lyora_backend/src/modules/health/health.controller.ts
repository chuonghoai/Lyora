import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ResponseMessage('Hệ thống hoạt động bình thường')
  checkHealth() {
    return {
      status: 'ok',
      service: 'lyora_backend',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
