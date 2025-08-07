-- Add offsite notifications setting to notification_settings table
ALTER TABLE notification_settings 
ADD COLUMN "offsiteNotifications" BOOLEAN NOT NULL DEFAULT true;
