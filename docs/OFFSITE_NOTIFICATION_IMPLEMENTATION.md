# Offsite Requisition Notification System Implementation

## Overview
I have successfully implemented a comprehensive notification system for offsite requisitions that triggers contextual notifications based on user roles and requisition lifecycle events.

## Features Implemented

### 1. Notification Triggers
The system now sends notifications for the following events:

#### A. **Requisition Created**
- **Who gets notified**: All admin and manager users
- **When**: Immediately when an employee creates a new offsite requisition
- **Message**: "New off-site requisition created for '{destination}' with {itemCount} item(s). Requires approval."
- **Type**: `offsite_requisition_created`

#### B. **Requisition Approved**
- **Who gets notified**: 
  - The original requester (always)
  - If approved by admin: all managers (except the approver)
- **When**: When an admin/manager approves a requisition
- **Message**: 
  - To requester: "Your off-site requisition for '{destination}' has been approved by {approver_name}."
  - To managers: "Off-site requisition for '{destination}' by {requester_name} has been approved."
- **Type**: `offsite_requisition_approved`

#### C. **Requisition Rejected**
- **Who gets notified**: The original requester
- **When**: When an admin/manager rejects a requisition
- **Message**: "Your off-site requisition for '{destination}' has been rejected by {approver_name}."
- **Type**: `offsite_requisition_rejected`

#### D. **Items Returned**
- **Who gets notified**: 
  - All admin and manager users
  - The original requester (if not already included)
- **When**: When items are returned from an offsite location
- **Message**: "Items have been returned from off-site location '{destination}' ({returnedItemCount} item(s) returned)."
- **Type**: `offsite_requisition_returned`

### 2. Role-Based Logic
The notification system respects the existing role hierarchy:

- **Employees**: Can create requisitions, receive notifications about their own requisitions
- **Managers**: Can approve/reject requisitions, receive notifications about all requisition activities
- **Admins**: Can approve/reject requisitions, receive notifications about all requisition activities

**Key Rule**: If an admin user creates a requisition or returns items, another admin user would need to approve the requisition/returns, ensuring proper separation of duties.

### 3. User Preference Respect
- The system checks user notification settings before sending notifications
- Currently uses the `systemUpdates` setting as a proxy for offsite notifications
- Users can disable these notifications through their notification preferences
- Defaults to enabled if no preferences are set

## Technical Implementation

### Files Modified

1. **`backend/src/lib/notifications.ts`**
   - Added 4 new notification trigger functions
   - Implemented role-based filtering
   - Added user preference checking

2. **`backend/src/routes/offsite.ts`**
   - Added notification trigger imports
   - Integrated notification calls into requisition lifecycle events:
     - After requisition creation
     - After requisition approval
     - After requisition rejection
     - After return processing

### Code Structure

```typescript
// New notification functions added:
- triggerRequisitionCreated()
- triggerRequisitionApproved()
- triggerRequisitionRejected()
- triggerRequisitionReturned()
```

### Error Handling
- All notification triggers are wrapped in try-catch blocks
- Notification failures do not affect the main requisition operations
- Errors are logged but don't interrupt the user workflow

## Integration Points

### Database Integration
- Uses existing `Notification` model
- Leverages existing `NotificationSettings` model
- No schema changes required (using existing `systemUpdates` field)

### Frontend Integration
- Works with existing notification system
- New notification types will appear in user notification feeds
- Existing notification UI components will display these notifications

### API Compatibility
- No breaking changes to existing API endpoints
- All existing offsite requisition functionality preserved
- Notifications happen transparently in the background

## Benefits

1. **Improved Communication**: Users are immediately informed of requisition status changes
2. **Role-Based Awareness**: Admins and managers stay informed of pending approvals
3. **Audit Trail**: Notification history provides a timeline of requisition activities
4. **User Control**: Users can disable offsite notifications if desired
5. **Scalable**: System works regardless of organization size

## Future Enhancements

1. **Dedicated Offsite Notification Setting**: Add a specific `offsiteNotifications` field to user preferences
2. **Email Notifications**: Extend to send email notifications for critical events
3. **Mobile Push Notifications**: Add mobile app notification support
4. **Escalation Rules**: Add time-based escalation for pending approvals
5. **Notification Grouping**: Group related notifications to reduce noise

## Usage Notes

- All changes preserve existing functionality in `RequisitionForm.tsx`
- The notification system is opt-in by default (respects existing user preferences)
- System maintains separation of duties (creators cannot approve their own requisitions)
- Notifications provide contextual information about the specific requisition and items involved
