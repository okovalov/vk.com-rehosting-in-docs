/*global chrome, alert */

function thereIsAnError(textToShow, errorToShow) {
    "use strict";

    alert(textToShow + '\n' + errorToShow);
}

function getUrlParam(url, sname) {
    "use strict";

    var params = url.substr(url.indexOf("#") + 1),
        sval   = "",
        i,
        temp;

    params = params.split("&");

    for (i = 0; i < params.length; i += 1) {
        temp = params[i].split("=");

        if (temp[0] === sname) {
            sval = temp[1];
        }
    }

    return sval;
}

function getClickHandler() {
    "use strict";

    return function (info, tab) {

        var authenticationTabId  = null,
            imageSourceUrl       = info.srcUrl,
            imageUploadHelperUrl = 'upload.html#',
            vkCLientId           = '3315996',
            vkRequestedScopes    = 'docs,offline',
            vkAuthenticationUrl  = 'https://oauth.vk.com/authorize?client_id=' + vkCLientId + '&scope=' + vkRequestedScopes + '&redirect_uri=http%3A%2F%2Foauth.vk.com%2Fblank.html&display=page&response_type=token',
            vkAccessToken,
            vkAccessTokenExpiredFlag;

        chrome.storage.local.get({'vkaccess_token': {}}, function (items) {

            if (items.vkaccess_token.length > 0) {
                imageUploadHelperUrl += imageSourceUrl + '&' + items.vkaccess_token;

                chrome.tabs.create({url: imageUploadHelperUrl, selected: true});

            } else {
                chrome.tabs.create({url: vkAuthenticationUrl, selected: true}, function (tab) {
                    authenticationTabId = tab.id;

                    chrome.tabs.onUpdated.addListener(function tabUpdateListener(tabId, changeInfo) {

                        if (tabId === authenticationTabId && changeInfo.url !== undefined && changeInfo.status === "loading") {

                            if (changeInfo.url.indexOf('oauth.vk.com/blank.html') > -1) {
                                authenticationTabId = null;
                                chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                                vkAccessToken = getUrlParam(changeInfo.url, 'access_token');

                                if (vkAccessToken !== undefined && vkAccessToken.length > 0) {

                                    vkAccessTokenExpiredFlag = Number(getUrlParam(changeInfo.url, 'expires_in'));

                                    if (vkAccessTokenExpiredFlag === 0) {
                                        chrome.storage.local.set({'vkaccess_token': vkAccessToken}, function () {
                                            chrome.tabs.update(
                                                tabId,
                                                {
                                                    'url'   : 'upload.html#' + imageSourceUrl + '&' + vkAccessToken,
                                                    'active': true
                                                },
                                                function (tab) {}
                                            );
                                        });
                                    } else {
                                        thereIsAnError('vk auth response problem', 'vkAccessTokenExpiredFlag != 0' + vkAccessToken);
                                    }
                                } else {
                                    thereIsAnError('vk auth response problem', 'access_token length = 0 or vkAccessToken == undefined');
                                }
                            }
                        }
                    });
                });
            }
        });
    };
}

chrome.contextMenus.create({
    "title": "Rehost on vk.com",
    "type": "normal",
    "contexts": ["image"],
    "onclick": getClickHandler()
});

