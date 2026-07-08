Things to fix:
1. socket issues in production; all users sees same notification which isn't suppose to be so.
2. explore i18n to see how it can be put to use (or any other service that can be used to implement multi-language support). but it won't be bad if we have out own language handling in our platform instead of depending on other platforms. (this is a feature to come and not priority)

3. Structure payments accordingly :
We have huge figure that I feel would cause issues in the future if the system is audited;
admin & superadmin dashboard need to contain a detailed breakdown on all transactions and earnings.
    a. we have transactions that was migrated from the old webiste (db) and inside those transactions are some that were not actual payments (meaning some transactions are in pending status / incomplete ) 
    we need to filter all that out ( completed / successful transactions, pending / incomplete transactions, failed transactions, refunded transactions , and of possible we filter out transactions that was done through the test key)
    this is actually critical because we have situations of where transaction was performed on the live db using the paystack test keys just to confirm payment works on well on prod and this has made the system to have a huge figure which isn't accurate .


    b. We need to make sure our payment tracking is accurate in the sense that there should be a way to track transactions and the status should be updated in real-time 
    and as soon as payment is confirmed, the user should be able to access the course immediately.
    This is already working to an extent only that I think the system still records non completed transactions. ( I need you to confirm ) 

    c. lastly when we've sorted out the payment then we need to update the admin and superadmin dashboard to reflect all the changes and breakdown. the revenue counting need to be updated to show the correct amount and number of transactions (completed only)
     
    (treated as highest priority)

4. the notification system has a lot of issue:
- even when we spicified  for a user to be sent a notification, all users including admins and superadmins receive the notification (that's a major issue).
-  need to confirm the logic perhaps we need to try using pusher or any other service to confirm it works as expected. because I don't like how the notification system is disorganized. (I need you to confirm the logic and fix it). (treated as priority)
