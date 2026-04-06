import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { NotificationRulesService } from './notification-rules.service';

@Module({
  providers: [WhatsappService, NotificationRulesService],
  exports: [WhatsappService, NotificationRulesService],
})
export class NotificationsModule {}
