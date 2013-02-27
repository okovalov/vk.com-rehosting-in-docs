var imageUrl = null;

function upload(imageUrl, fileName, accToken)
{
  var x = new XMLHttpRequest();
  x.onload = function()
  {
    var docGetUploadServer = new XMLHttpRequest();
    docGetUploadServer.open('GET', 'https://api.vk.com/method/docs.getUploadServer?access_token=' + accToken);
    docGetUploadServer.onload = function()
    {
      var answer = JSON.parse(docGetUploadServer.response);
      if(answer.response.upload_url != undefined)
      {
        var fd = new FormData();
        fd.append("file", x.response, fileName);
        var docsUpload = new XMLHttpRequest();
        docsUpload.open('POST', answer.response.upload_url, true);
        docsUpload.onload = function()
        {
          var answer = JSON.parse(docsUpload.response);
          if(answer.file != undefined)
          {
            var docsSave = new XMLHttpRequest();
            docsSave.open('GET', 'https://api.vk.com/method/docs.save?file=' + answer.file + '&access_token=' + accToken);
            docsSave.onload = function()
            {
              var answer = JSON.parse(docsSave.response);
              if(answer.response[0].url != undefined)
              {
                document.location.href = answer.response[0].url;
              }
              else
              {
                thereIsAnError('docsSave - no file in response', answer);
              }
            };
            docsSave.send();
          }
          else
          {
            thereIsAnError('Upload blob problem response problem', answer);
          }
        };
        docsUpload.send(fd);
      }
      else
      {
        thereIsAnError('docGetUploadServer response problem', answer);
      }
    };
    docGetUploadServer.send();
  };
  x.responseType = 'blob';
  x.open('GET', imageUrl);
  x.send();
}
document.addEventListener("DOMContentLoaded", function()
{
  var params = window.location.hash.substring(1).split('&');
  if(params && params.length == 2)
  {
    var filename = params[0].split('/');
    if(filename.length > 0)
    {
      imageUrl = params[0];
      var imageName = filename[filename.length - 1];
      if ( imageName.indexOf('?') > -1 )
      {
        imageName = imageName.slice( 0, imageName.indexOf('?'));
      }
      if ( imageName.indexOf('#') > -1 )
      {
        imageName = imageName.slice( 0, imageName.indexOf('#'));
      }    
      if ( imageName.indexOf('&') > -1 )
      {
        imageName = imageName.slice( 0, imageName.indexOf('&'));
      }
      upload(imageUrl, imageName, params[1]);
    }
    else
    {
      thereIsAnError('Getting image filename', 'filename.length <= 0');
    }
  }
  else
  {
    thereIsAnError('Parsing image url', 'params || params.length != 2');
  }
});

function thereIsAnError(textToShow, errorToShow)
{
  document.getElementById('wrap').innerHTML = '<p></p><br/><br/><center><h1>Wow! Some error arrived!</h1></center><br/><br/><p>' + textToShow + '</p><br/><br/><p>' + errorToShow + '</p><p>' + imageUrl + '</p>';
}