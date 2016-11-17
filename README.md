**Requirements:** 
selenium-server 
selenium-webdriver
q

**Description:**
That tool automatically delete history for you and for your contacts. 

**Motivation:**
Skype do not provide feature that fully clear history by one click. "Delete history" on web.skype.com will remove history only for you but your contacts will have all messages that you deleted.

**How to run:**
* Download, install and run selenium-server http://www.seleniumhq.org/download/
* npm install (from project folder) 
* In cleaner.js provide your credentials:
```
var username = 'YOUR_LOGIN_HERE';
var password = 'YOUR_PASSWORD_HERE';
```
* node selenium.js
