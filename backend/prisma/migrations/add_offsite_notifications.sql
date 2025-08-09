-- Add offsite notifications setting to notification_settings table
ALTER TABLE notification_settings 
ADD "offsiteNotifications" BIT NOT NULL DEFAULT 1;
