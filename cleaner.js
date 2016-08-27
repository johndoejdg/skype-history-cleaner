var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    Button = webdriver.Button,
    promise = webdriver.promise,
    until = webdriver.until;

var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

var username = 'YOUR_LOGIN_HERE';
var password = 'YOUR_PASSWORD_HERE!';

var SkypeManager = function () {};

SkypeManager.prototype.login = function () {
    var deferred = promise.defer();

    driver.get('https://web.skype.com/en/');
    driver.findElement(By.css('form[id=loginForm] input#username')).sendKeys(username);
    driver.findElement(By.css('form[id=loginForm]')).submit().then(function () {
        var innerDeferred = promise.defer();
        setTimeout(function () {
            innerDeferred.fulfill();
        }, 1000);
        innerDeferred.promise.then(function () {
            driver.findElement(By.css('input[name="passwd"]')).sendKeys(password);
            driver.findElement(By.css('input[type="submit"]')).submit().then(function () {
                setTimeout(function () {
                    deferred.fulfill();
                }, 12000);
            });
        });
    });

    return deferred.promise;
};

SkypeManager.prototype.checkPersonIndex = function (i) {
    var deferred = promise.defer();

    driver.executeScript(function() {
        var selector = ".history .list-selectable:nth-of-type("+arguments[0]+")";

        return document.querySelectorAll(selector).length;
    }, i).then(function (result) {
        deferred.fulfill(result);
    });

    return deferred.promise;
};

SkypeManager.prototype.selectPerson = function (i) {
    var deferred = promise.defer();

    var selector = ".history .list-selectable:nth-of-type("+i+")";
    driver.findElement(By.css(selector)).click();

    setTimeout(function () {
        deferred.fulfill();
    }, 5000);

    return deferred.promise;
};

SkypeManager.prototype.showAllMessages = function () {
    var deferred = promise.defer();
    var scrollHeight;
    var scrollHeightNew;

    driver.executeScript(function () {
        var scrollHeight = document.querySelector('swx-chat-log .conversation').scrollHeight;

        return scrollHeight;
    }).then(function (result) {
        scrollHeight = result;
        console.log('scrollHeight: '+scrollHeight);

        driver.executeScript(function () {
            return document.querySelector('swx-chat-log .conversation').scrollTop = 0;
        }).then(function () {
            setTimeout(function () {
                driver.executeScript(function () {
                    var scrollHeight = document.querySelector('swx-chat-log .conversation').scrollHeight;

                    return scrollHeight;
                }).then(function (result) {
                    scrollHeightNew = result;
                    console.log('scrollHeightNew: '+scrollHeightNew);
                    // console.log('scrollHeightNew ' + scrollHeightNew);
                    // console.log('scrollHeight ' + scrollHeight);
                    if (scrollHeightNew !== scrollHeight || scrollHeight === 0) {
                        SkypeManager.prototype.showAllMessages().then(function () {
                            deferred.fulfill();
                            console.log('On the top 1');
                        });
                    } else {
                        deferred.fulfill();
                        console.log('On the top 2');
                    }
                });
            }, 6000);
        });
    });

    return deferred.promise;
};



SkypeManager.prototype.removeMessage = function (index) {
    var deferred = promise.defer();
    driver.executeScript(function () {
        var dataId;
        var messageElement = document.querySelectorAll('.messageHistory .message.me')[arguments[0]];
        if (messageElement) {
            dataId = messageElement.getAttribute("data-id");
        }
        return dataId;
    }, index).then(function (dataId) {
        if (!dataId) {
            deferred.fulfill();
        }
        var selector = '.messageHistory swx-message[data-id="'+dataId+'"]';
        console.log('Selector: '+selector);

        var messageElement = driver.findElement(By.css(selector));
        driver.actions().mouseMove(messageElement).click(messageElement, Button.RIGHT).perform();

        console.log('Mouse right click');

        setTimeout(function () {
            driver.executeScript(function () {
                return document.querySelectorAll('.swxContextMenu li:nth-child(5)').length;
            }).then(function (isCanBeRemoved) {
                if (isCanBeRemoved) {
                    var removeButton = driver.findElement(By.css('.swxContextMenu li:nth-child(5)'));
                    driver.actions().mouseMove(removeButton).click(removeButton).perform().then(function () {
                        deferred.fulfill();
                    });
                } else {
                    deferred.fulfill();
                }
            });
        }, 500);
    });

    console.log('After removing');

    return deferred.promise;
};

SkypeManager.prototype.recursiveRemoveMessages = function (fromIndex, toIndex) {
    var deferred = promise.defer();

    if (fromIndex < toIndex) {
        console.log('Start index: '+fromIndex);

        var removedPromise = SkypeManager.prototype.removeMessage(fromIndex);

        console.log('After promise');

        removedPromise.then(function () {
            fromIndex++;

            console.log('Index++: '+fromIndex);

            SkypeManager.prototype.recursiveRemoveMessages(fromIndex, toIndex).then(function () {
                deferred.fulfill();

                console.log('Removing 1 resolved');
            });
        });
    } else {
        deferred.fulfill();

        console.log('Removing 2 resolved');
    }

    return deferred.promise;
};

SkypeManager.prototype.removeAllMessages = function () {
    var deferred = promise.defer();

    driver.executeScript(function () {
        return document.querySelectorAll('.messageHistory .message.me').length;
    }).then(function (messagesCount) {
        if (messagesCount !== 0) {
            var index = 1;
            SkypeManager.prototype.recursiveRemoveMessages(index, messagesCount).then(function () {
                deferred.fulfill();

                console.log('Removing all resolved');
            });
        }
    });

    return deferred.promise;
};

SkypeManager.prototype.removeMessagesForPersonIndex = function (personIndex) {
    var deferred = promise.defer();

    SkypeManager.prototype.checkPersonIndex(personIndex).then(function (isExist) {
        if (isExist) {
            SkypeManager.prototype.selectPerson(personIndex).then(function () {
                SkypeManager.prototype.showAllMessages().then(function () {
                    SkypeManager.prototype.removeAllMessages().then(function () {
                        deferred.fulfill();
                    });
                });
            });
        } else {
            console.log('All done');
            driver.quit();
        }
    });

    return deferred.promise;
};

SkypeManager.prototype.recursiveRemoveMessagesForPersonIndex = function (personIndex) {
    var deferred = promise.defer();

    SkypeManager.prototype.removeMessagesForPersonIndex(personIndex).then(function () {
        personIndex++;
        SkypeManager.prototype.recursiveRemoveMessagesForPersonIndex(personIndex);
    });

    return deferred.promise;
};

var skypeManager = new SkypeManager();

skypeManager.login().then(function () {
    var personIndex = 1;
    SkypeManager.prototype.recursiveRemoveMessagesForPersonIndex(personIndex);
});



driver.wait(function() {}, 9999999);

driver.quit();