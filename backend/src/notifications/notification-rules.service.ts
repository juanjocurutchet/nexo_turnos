import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationTrigger } from '@prisma/client';

const DEFAULT_RULES = [
  {
    trigger: NotificationTrigger.BOOKING_CREATED,
    offsetMinutes: null,
    isEnabled: true,
    message:
      'Hola {{clientName}}, recibimos tu solicitud de turno en {{businessName}} para {{serviceName}} el {{date}} a las {{time}}. Te confirmamos a la brevedad 😊',
  },
  {
    trigger: NotificationTrigger.BOOKING_CONFIRMED,
    offsetMinutes: null,
    isEnabled: true,
    message:
      '¡Tu turno está confirmado! ✅ {{businessName}} te espera el {{date}} a las {{time}} para {{serviceName}}.',
  },
  {
    trigger: NotificationTrigger.BOOKING_CANCELLED,
    offsetMinutes: null,
    isEnabled: true,
    message:
      'Hola {{clientName}}, tu turno en {{businessName}} del {{date}} a las {{time}} fue cancelado. Podés reservar un nuevo turno cuando quieras.',
  },
  {
    trigger: NotificationTrigger.REMINDER,
    offsetMinutes: -1440,
    isEnabled: true,
    message:
      'Recordatorio 📅: tenés turno mañana en {{businessName}} a las {{time}} para {{serviceName}}. ¡Te esperamos!',
  },
  {
    trigger: NotificationTrigger.REMINDER,
    offsetMinutes: -120,
    isEnabled: false,
    message:
      'Recordatorio ⏰: en 2 horas tenés turno en {{businessName}} para {{serviceName}}. ¡Hasta pronto!',
  },
];

@Injectable()
export class NotificationRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(tenantId: string) {
    const existing = await this.prisma.notificationRule.findMany({
      where: { tenantId },
      orderBy: [{ trigger: 'asc' }, { offsetMinutes: 'asc' }],
    });

    if (existing.length > 0) return existing;

    // First access: seed defaults
    await this.prisma.notificationRule.createMany({
      data: DEFAULT_RULES.map((r) => ({ ...r, tenantId })),
      skipDuplicates: true,
    });

    return this.prisma.notificationRule.findMany({
      where: { tenantId },
      orderBy: [{ trigger: 'asc' }, { offsetMinutes: 'asc' }],
    });
  }

  async updateRules(
    tenantId: string,
    rules: {
      id?: string;
      trigger: NotificationTrigger;
      isEnabled: boolean;
      offsetMinutes?: number | null;
      message: string;
    }[],
  ) {
    await Promise.all(
      rules.map((rule) => {
        if (rule.id) {
          return this.prisma.notificationRule.update({
            where: { id: rule.id },
            data: { isEnabled: rule.isEnabled, message: rule.message, offsetMinutes: rule.offsetMinutes ?? null },
          });
        }
        const offsetMinutes = rule.offsetMinutes ?? null;
        return this.prisma.notificationRule.upsert({
          where: { tenantId_trigger_offsetMinutes: { tenantId, trigger: rule.trigger, offsetMinutes: offsetMinutes as number } },
          update: { isEnabled: rule.isEnabled, message: rule.message },
          create: { tenantId, trigger: rule.trigger, isEnabled: rule.isEnabled, offsetMinutes: rule.offsetMinutes ?? null, message: rule.message },
        });
      }),
    );

    return this.getRules(tenantId);
  }

  async getActiveRule(tenantId: string, trigger: NotificationTrigger, offsetMinutes?: number | null) {
    return this.prisma.notificationRule.findFirst({
      where: {
        tenantId,
        trigger,
        offsetMinutes: offsetMinutes ?? null,
        isEnabled: true,
      },
    });
  }
}
