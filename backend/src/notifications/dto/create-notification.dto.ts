import { NotificationType } from '../../entities/notification.entity.js';

export class CreateNotificationDto {
  userId: number;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}
