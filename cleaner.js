let webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    Button = webdriver.Button,
    promise = webdriver.promise,
    until = webdriver.until,
    fs = require('fs'),
    gpg = require('gpg'),
    username = '',
    password = ''
;

function getCredentials() {
    let deferred = promise.defer();

    let deferredDecryptUsername = promise.defer();
    let promiseDecryptUsername = deferredDecryptUsername.promise;
    let deferredDecryptPassword = promise.defer();
    let promiseDecryptPassword = deferredDecryptPassword.promise;

    gpg.decryptFile(__dirname + '/username', function (err, contents) {
        username = contents.toString('utf8');
        deferredDecryptUsername.fulfill();
    });

    gpg.decryptFile(__dirname + '/password', function (err, contents) {
        password = contents.toString('utf8');
        deferredDecryptPassword.fulfill();
    });

    promiseDecryptUsername.then(function () {
        promiseDecryptPassword.then(function () {
            deferred.fulfill();
        })
    });

    return deferred.promise;
}


let driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();

driver.manage().window().maximize();

class SkypeManager {
    login() {
        let deferred = promise.defer();

        driver.get('https://web.skype.com/en/');
        driver.findElement(By.css('form[id=loginForm] input#username')).sendKeys(username).then(function () {
            let innerDeferred = promise.defer();
            setTimeout(function () {
                innerDeferred.fulfill();
            }, 3000);
            innerDeferred.promise.then(function () {
                driver.findElement(By.css('input[name="passwd"]')).sendKeys(password).then(function () {
                    let loaded = false;

                    let checkLoaded = function () {
                        driver.executeScript(function () {
                            return document.querySelectorAll('.shellSplashScreen').length === 0;
                        }, 0).then(function (result) {
                            loaded = result;
                            if (!loaded) {
                                setTimeout(function () {
                                    checkLoaded();
                                }, 1000);
                            } else {
                                deferred.fulfill(result);
                            }
                        });
                    };

                    checkLoaded();
                });
            });
        });

        return deferred.promise;
    };

    checkPersonIndex(i) {
        let deferred = promise.defer();

        driver.executeScript(function () {
            let selector = ".history .list-selectable:nth-of-type(" + arguments[0] + ")";

            return document.querySelectorAll(selector).length;
        }, i).then(function (result) {
            deferred.fulfill(result);
        });

        return deferred.promise;
    };

    selectPerson(i) {
        let deferred = promise.defer();

        let selector = ".history .list-selectable:nth-of-type(" + i + ")";
        driver.findElement(By.css(selector)).click();

        setTimeout(function () {
            deferred.fulfill();
        }, 3000);

        return deferred.promise;
    };

    showAllMessages() {
        let deferred = promise.defer();
        let scrollHeight;
        let scrollHeightNew;

        driver.executeScript(function () {
            let scrollHeight = document.querySelector('swx-chat-log .conversation').scrollHeight;

            return scrollHeight;
        }).then(function (result) {
            scrollHeight = result;
            console.log('scrollHeight: ' + scrollHeight);

            driver.executeScript(function () {
                document.querySelector('swx-chat-log .conversation').scrollTop = 0;
                return 0;
            }).then(function () {
                for (let i = 0; i < 100; i++) {
                    driver.executeScript(function () {
                        document.querySelector('swx-chat-log .conversation').scrollTop = 0;
                        return 0;
                    });
                }
                setTimeout(function () {
                    driver.executeScript(function () {
                        let scrollHeight = document.querySelector('swx-chat-log .conversation').scrollHeight;

                        return scrollHeight;
                    }).then(function (result) {
                        scrollHeightNew = result;
                        console.log('scrollHeightNew: ' + scrollHeightNew);
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
                }, 3000);
            });
        });

        return deferred.promise;
    };


    removeMessage(index) {
        let deferred = promise.defer();
        driver.executeScript(function () {
            let dataId;
            let messageElement = document.querySelectorAll('.messageHistory .message.me')[arguments[0]];
            if (messageElement) {
                dataId = messageElement.getAttribute("data-id");
            }
            return dataId;
        }, index).then(function (dataId) {
            if (!dataId) {
                deferred.fulfill();
            }
            let selector = '.messageHistory swx-message[data-id="' + dataId + '"]';
            console.log('Selector: ' + selector);

            let messageElement = driver.findElement(By.css(selector));
            driver.actions().mouseMove(messageElement).click(messageElement, Button.RIGHT).perform();

            console.log('Mouse right click');

            setTimeout(function () {
                driver.executeScript(function () {
                    return document.evaluate('/html/body/ul/li/span[contains(text(),"Remove")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue !== null;
                }).then(function (isCanBeRemoved) {
                    if (isCanBeRemoved) {
                        let removeButton = driver.findElement(By.xpath('/html/body/ul/li/span[contains(text(),"Remove")]'));
                        driver.actions().mouseMove(removeButton).click(removeButton).perform().then(function () {
                            deferred.fulfill();
                        });
                    } else {
                        deferred.fulfill();
                    }
                });
            }, 600);
        });

        console.log('After removing');

        return deferred.promise;
    };

    recursiveRemoveMessages(fromIndex, toIndex) {
        let deferred = promise.defer();

        let that = this;

        if (fromIndex < toIndex) {
            console.log('Start index: ' + fromIndex);

            let removedPromise = this.removeMessage(fromIndex);

            console.log('After promise');

            removedPromise.then(function () {
                fromIndex++;

                console.log('Index++: ' + fromIndex);

                that.recursiveRemoveMessages(fromIndex, toIndex).then(function () {
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

    removeAllMessages() {
        let deferred = promise.defer();

        let that = this;

        driver.executeScript(function () {
            return document.querySelectorAll('.messageHistory .message.me').length;
        }).then(function (messagesCount) {
            if (messagesCount !== 0) {
                let index = 0;
                that.recursiveRemoveMessages(index, messagesCount).then(function () {
                    deferred.fulfill();

                    console.log('Removing all resolved');
                });
            }
        });

        return deferred.promise;
    };

    removeMessagesForPersonIndex(personIndex) {
        let deferred = promise.defer();

        let that = this;

        this.checkPersonIndex(personIndex).then(function (isExist) {
            if (isExist) {
                that.selectPerson(personIndex).then(function () {
                    that.showAllMessages().then(function () {
                        that.removeAllMessages().then(function () {
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

    recursiveRemoveMessagesForPersonIndex(personIndex) {
        let deferred = promise.defer();

        let that = this;

        this.removeMessagesForPersonIndex(personIndex).then(function () {
            personIndex++;
            that.recursiveRemoveMessagesForPersonIndex(personIndex);
        });

        return deferred.promise;
    };

}

let skypeManager = new SkypeManager();

getCredentials().then(function () {
    skypeManager.login().then(function () {
        let personIndex = 1;
        skypeManager.recursiveRemoveMessagesForPersonIndex(personIndex);
    });
});

// driver.wait(function () {
// }, 9999999);
//
// driver.quit();