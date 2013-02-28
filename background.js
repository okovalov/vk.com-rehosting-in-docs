/*global chrome, alert */

/**
 * Display an alert with an error message, description
 *
 * @param  {string} textToShow  Error message text
 * @param  {string} errorToShow Error to show
 */
function displayeAnError(textToShow, errorToShow) {
    "use strict";

    alert(textToShow + '\n' + errorToShow);
}

/**
 * Retrieve a value of a parameter from the given URL string
 *
 * @param  {string} url           Url string
 * @param  {string} parameterName Name of the parameter
 *
 * @return {string}               Value of the parameter
 */
function getUrlParameterValue(url, parameterName) {
    "use strict";

    var urlParameters  = url.substr(url.indexOf("#") + 1),
        parameterValue = "",
        index,
        temp;

    urlParameters = urlParameters.split("&");

    for (index = 0; index < urlParameters.length; index += 1) {
        temp = urlParameters[index].split("=");

        if (temp[0] === parameterName) {
            return temp[1];
        }
    }

    return parameterValue;
}

/**
 * Handle main functionality of 'onlick' chrome context menu item method
 */
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

                                vkAccessToken = getUrlParameterValue(changeInfo.url, 'access_token');

                                if (vkAccessToken !== undefined && vkAccessToken.length > 0) {

                                    vkAccessTokenExpiredFlag = Number(getUrlParameterValue(changeInfo.url, 'expires_in'));

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
                                        displayeAnError('vk auth response problem', 'vkAccessTokenExpiredFlag != 0' + vkAccessToken);
                                    }
                                } else {
                                    displayeAnError('vk auth response problem', 'access_token length = 0 or vkAccessToken == undefined');
                                }
                            }
                        }
                    });
                });
            }
        });
    };
}

/**
 * Handler of chrome context menu creation process -creates a new item in the context menu
 */
chrome.contextMenus.create({
    "title": "Rehost on vk.com",
    "type": "normal",
    "contexts": ["image"],
    "onclick": getClickHandler()
});

