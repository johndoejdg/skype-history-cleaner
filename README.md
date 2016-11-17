**Requirements:** 
selenium-webdriver
q

**Description:**
That tool automatically delete history for you and for your contacts. 

**Motivation:**
Skype do not provide feature that fully clear history by one click. "Delete history" on web.skype.com will remove history only for you but your contacts will have all messages that you deleted.

**How to run:**

1. npm install -g selenium-webdriver
2. npm install 
3. In cleaner.js provide your credentials:
```
var username = 'YOUR_LOGIN_HERE';
var password = 'YOUR_PASSWORD_HERE';
```
4. node selenium.js
