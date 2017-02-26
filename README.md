**Requirements:** 

Applications:
- chrome browser
- selenium-server 
- gpg 

Npm packages:
- selenium-webdriver
- q
- gpg

**Description:**
That tool automatically delete history for you and for your contacts. 

**Motivation:**
Skype do not provide feature that fully clear history by one click. "Delete history" on web.skype.com will remove history only for you but your contacts will have all messages that you deleted.

**How to run:**
* Download, install and run selenium-server http://www.seleniumhq.org/download/
* npm install (from project folder) 
* Create two files with encrypted password and username:
```
echo 'YOUR_SKYPE_LOGIN' | gpg -e -o username
echo 'YOUR_SKYPE_PASSWORD' | gpg -e -o password
```
* node cleaner.js
