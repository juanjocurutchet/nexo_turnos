import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsappCredentials {
  token: string;
  phoneId: string;
}

export interface MessageVars {
  clientName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly globalToken: string | undefined;
  private readonly globalPhoneId: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.globalToken = config.get<string>('WHATSAPP_TOKEN');
    this.globalPhoneId = config.get<string>('WHATSAPP_PHONE_ID');
  }

  async sendMessage(
    to: string,
    messageTemplate: string,
    vars: MessageVars,
    credentials?: WhatsappCredentials,
  ) {
    const token = credentials?.token ?? this.globalToken;
    const phoneId = credentials?.phoneId ?? this.globalPhoneId;

    if (!token || !phoneId) {
      this.logger.warn(`WhatsApp no configurado — omitiendo mensaje a ${to}`);
      return;
    }

    const text = this.interpolate(messageTemplate, vars);
    const phone = to.replace(/[^\d]/g, '');

    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: text },
          }),
        },
      );

      if (!res.ok) {
        const err = await res.json();
        this.logger.error(`WhatsApp API error (${res.status}): ${JSON.stringify(err)}`);
      }
    } catch (err) {
      this.logger.error(`WhatsApp fetch error: ${err}`);
    }
  }

  private interpolate(template: string, vars: MessageVars): string {
    return template
      .replace(/\{\{clientName\}\}/g, vars.clientName)
      .replace(/\{\{businessName\}\}/g, vars.businessName)
      .replace(/\{\{serviceName\}\}/g, vars.serviceName)
      .replace(/\{\{date\}\}/g, vars.date)
      .replace(/\{\{time\}\}/g, vars.time);
  }
}
