var authTabId = null;

function getClickHandler()
{
  return function(info, tab)
  {
    imgSrc = info.srcUrl;
    chrome.storage.local.get({'vkaccess_token': {}}, function(items)
    {
      if(items['vkaccess_token'].length > 0)
      {
        var imgUrl = 'upload.html#' + imgSrc + '&' + items['vkaccess_token'];
        chrome.tabs.create({url: imgUrl,selected: true});
      }
      else
      {
        var authUrl = 'https://oauth.vk.com/authorize?client_id=3315996&scope=docs,offline&redirect_uri=http%3A%2F%2Foauth.vk.com%2Fblank.html&display=page&response_type=token';
        chrome.tabs.create({url: authUrl,selected: true}, function(tab)
        {
          authTabId = tab.id;
          chrome.tabs.onUpdated.addListener(function tabUpdateListener(tabId, changeInfo)
          {
            if(tabId == authTabId && changeInfo.url != undefined && changeInfo.status == "loading")
            {
              if ( changeInfo.url.indexOf('oauth.vk.com/blank.html') > -1 )
              {
                authTabId = null;
                chrome.tabs.onUpdated.removeListener(tabUpdateListener);
                var accToken = getUrlParam(changeInfo.url, 'access_token');
                if( accToken != undefined && accToken.length > 0)
                {
                  if(Number(getUrlParam(changeInfo.url, 'expires_in') == 0))
                  {
                    chrome.storage.local.set({'vkaccess_token': accToken}, function()
                    {
                      chrome.tabs.update(tabId,{'url': 'upload.html#' + imgSrc + '&' + accToken,'active': true}, function(tab){});
                    });
                  }
                  else
                  {
                    thereIsAnError('vk auth response problem', 'expiresIn != 0');
                  }
                }
                else
                {
                  thereIsAnError('vk auth response problem', 'access_token length = 0 or accToken == undefined');
                }
              }
            }
          });
        });
      }
    });
  };
};

function getUrlParam(url, sname)
{
  var params = url.substr(url.indexOf("#") + 1);
  var sval = "";
  params = params.split("&");
  for(var i = 0; i < params.length; i++)
  {
    temp = params[i].split("=");
    if([temp[0]] == sname)
    {
      sval = temp[1];
    }
  }
  return sval;
}

chrome.contextMenus.create(
{
  "title": "Rehost on vk.com",
  "type": "normal",
  "contexts": ["image"],
  "onclick": getClickHandler()
});

function thereIsAnError(textToShow, errorToShow)
{
  alert(textToShow + '\n' + errorToShow);
}