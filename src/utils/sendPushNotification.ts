import config from 'config';
import * as admin from 'firebase-admin';


export async function sendPushNotificationToDevice() {
    admin.messaging().sendToDevice(config.get<string>('push_notification_device_token'), {
        notification: { body: 'Evet ben de oyle dusunuyorum', title: 'Emre' },
        data: { path: '/chatPage' },
      });
    }
    