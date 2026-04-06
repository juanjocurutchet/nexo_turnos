import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WhatsappCredentials {
  token: string;
  phoneId: string;
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

  async sendBookingReceived(
    params: NotificationParams,
    credentials?: WhatsappCredentials,
  ) {
    return this.sendTemplate(params.clientPhone, 'nexo_booking_received', [
      params.clientName,
      params.businessName,
      params.serviceName,
      params.date,
      params.time,
    ], credentials);
  }

  async sendBookingConfirmed(
    params: NotificationParams,
    credentials?: WhatsappCredentials,
  ) {
    return this.sendTemplate(params.clientPhone, 'nexo_booking_confirmed', [
      params.clientName,
      params.businessName,
      params.serviceName,
      params.date,
      params.time,
    ], credentials);
  }

  async sendBookingCancelled(
    params: NotificationParams,
    credentials?: WhatsappCredentials,
  ) {
    return this.sendTemplate(params.clientPhone, 'nexo_booking_cancelled', [
      params.clientName,
      params.businessName,
      params.serviceName,
      params.date,
      params.time,
    ], credentials);
  }

  private async sendTemplate(
    to: string,
    templateName: string,
    bodyParams: string[],
    credentials?: WhatsappCredentials,
  ) {
    const token = credentials?.token ?? this.globalToken;
    const phoneId = credentials?.phoneId ?? this.globalPhoneId;

    if (!token || !phoneId) {
      this.logger.warn(`WhatsApp no configurado — omitiendo "${templateName}" a ${to}`);
      return;
    }

    const phone = to.replace(/[^\d]/g, '');

    const body = {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es_AR' },
        components: [
          {
            type: 'body',
            parameters: bodyParams.map((text) => ({ type: 'text', text })),
          },
        ],
      },
    };

    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
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
}

interface NotificationParams {
  clientPhone: string;
  clientName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
}
